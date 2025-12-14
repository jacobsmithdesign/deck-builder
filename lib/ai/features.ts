import { z } from "zod";

// ───────────────────────────────────────────────────────────────────────────────
// Minimal row shapes
// ───────────────────────────────────────────────────────────────────────────────
export type CardLite = {
  name: string | null;
  mana_value: number | null;
  mana_cost: string | null;
  type: string | null;
  text: string | null;
  // Optional extras if your fetch includes them (safe to be absent):
  color_identity?: string[] | null;
};

export type DeckLite = {
  id: string;
  commander: CardLite | null;
  deck_cards: { count: number; board_section: string; card: CardLite }[];
};

// ───────────────────────────────────────────────────────────────────────────────
// Feature schema (backward compatible + new sections)
// ───────────────────────────────────────────────────────────────────────────────
export const DeckFeatureVectorSchema = z.object({
  meta: z.object({
    deck_id: z.string(),
    commander: z.object({
      name: z.string().nullable(),
      color_identity: z.array(z.string()).default([]).optional(),
      text: z.string().nullable(),
    }),
    avg_mv: z.number(),
    mainboard_count: z.number(),
  }),

  // previous fields (kept)
  counts: z.record(z.string(), z.number()),
  curve: z.record(z.string(), z.number()),
  type_counts: z.record(z.string(), z.number()),
  keyword_histogram: z.record(z.string(), z.number()),
  interaction_density: z.number(),
  stack_complexity_markers: z.array(z.string()),
  signals: z.array(
    z.object({
      name: z.string(),
      mv: z.number().nullable(),
      type: z.string().nullable(),
      tags: z.array(z.string()),
    })
  ),
  mana_pool: z.object({
    W: z.number(),
    U: z.number(),
    B: z.number(),
    R: z.number(),
    G: z.number(),
  }),
  coloured_mana_curve: z.object({
    W: z.number(),
    U: z.number(),
    B: z.number(),
    R: z.number(),
    G: z.number(),
  }),

  // ── new sections ────────────────────────────────────────────────────────────
  interaction: z.object({
    instant: z.number(), // counters/instant-speed interaction (and flash ETB that functions as instant)
    mass: z.number(), // wipes & mass-bounce/-shrink
    spot: z.number(), // one-for-one removal/bounce
  }),

  upkeep_load: z.object({
    recurring_triggers: z.number(), // "At the beginning of ..." / "Whenever you ... (each turn)"
    mandatory_costs: z.number(), // sacrifice/discard upkeep, etc.
    repeatable_activations: z.number(), // # of cards with >=2 distinct activations or clear repeatability
  }),

  c_pips: z.object({
    demand: z.number(), // number of explicit {C} costs across mana_cost + activated costs
    supply: z.number(), // number of reliable {C} sources (lands/rocks); coarse estimate
  }),

  effective_curve: z.record(z.string(), z.number()), // curve after alt-cost/discount heuristics

  token_profile: z.object({
    rate: z.number(), // recurring token generation weight
    bursts: z.number(), // one-shot token creation count
  }),

  tutor_breadth: z.object({
    broad: z.number(), // "search ... card/permanent" (wide)
    narrow: z.number(), // type/tribal specific
  }),

  color_tension_index: z.object({
    W: z.number(),
    U: z.number(),
    B: z.number(),
    R: z.number(),
    G: z.number(),
  }),
});

export type DeckFeatureVector = z.infer<typeof DeckFeatureVectorSchema>;

// ───────────────────────────────────────────────────────────────────────────────
// Symbol-aware helpers
// ───────────────────────────────────────────────────────────────────────────────
const ADD_MANA = /\{T\}:\s*Add\s*\{[WUBRGC]\}(?:\{[WUBRGC]\})*/i;
const ANY_COLOR = /\{T\}:\s*Add (?:one )?mana of any color/i;
const PRODUCES_C = /\{T\}:\s*Add\s*\{C\}/i;
const MANA_SYMBOL = /\{[^\}]+\}/g;

const START_STEP = /at the beginning of (your|each) (upkeep|end step)/i;
const ATTACK_STEP = /whenever you attack/i;
const REPEATABLE_ACTIVATIONS = /\{[^\}]+\}[^:\n]*:/i; // cost ":" pattern

// Removal & wipes (broadened)
const WIPES =
  /(destroy|exile|deal[s]? [0-9xX]+ damage to|gets -\d+\/-\d+).{0,24}(each|all)\s+(creatures?|permanents?)/i;
const MASS_BOUNCE =
  /(return).{0,20}(each|all).{0,12}(creatures?|nonland|non(?:[A-Za-z]+))/i;

// One-for-one removal, bounce, fight, exile target ... (spot)
const SPOT =
  /(destroy|exile|bounce|return|fight)\s+target\s+(creature|permanent|artifact|enchantment|planeswalker)/i;

// Counters (explicit + "Nullifier"-style)
const COUNTERS = /counter target spell/i;

// Copy/stack decision complexity
const COPYING = /copy (?:all )?(?:spells?|abilities?|permanents?)/i;
const MULTI_MODES = /choose (?:one|two|any number)/i;
const MULTI_TARGET = /(up to )?\d+\s+target/i;

// Protection/hexproof/ward etc.
const PROTECTION =
  /(hexproof|indestructible|protection from|phase out|ward(?: [—-]?\d+)*)/i;

// Tutors
const BROAD_TUTOR = /search your library.*\b(card|permanent)\b/i;
const NARROW_TUTOR =
  /search your library.*\b(creature|instant|sorcery|artifact|enchantment|land|planeswalker|tribe|goblin|zombie|eldrazi)\b/i;

// Alt-cost / discounts
const HAS_DELVE = /\bdelve\b/i;
const HAS_CONVOKE = /\bconvoke\b/i;
const HAS_IMPROVISE = /\bimprovise\b/i;
const HAS_AFFINITY = /\baffinity\b/i;
const HAS_EMERGE = /\bemerge\b/i;
const COSTS_LESS = /costs?\s*(\d+)\s*less to cast/i;

// Token creation
const CREATE_TOKEN = /create [^\.]* token/i;

// {C} cost detection vs production
const C_IN_COST = /\{[^}]*C[^}]*\}[^:\n]*:/i; // costs that include {C} before ":" (activation or cast alt-cost)
const C_IN_TEXT = /\{C\}/g;

// ───────────────────────────────────────────────────────────────────────────────
// Utilities
// ───────────────────────────────────────────────────────────────────────────────
function upperType(t?: string | null) {
  const s = t || "";
  if (s.includes("Creature")) return "Creature";
  if (s.includes("Enchantment")) return "Enchantment";
  if (s.includes("Artifact")) return "Artifact";
  if (s.includes("Planeswalker")) return "Planeswalker";
  if (s.includes("Instant")) return "Instant";
  if (s.includes("Sorcery")) return "Sorcery";
  if (s.includes("Land")) return "Land";
  return "Other";
}

function bucketForMV(mv: number): keyof CurveBuckets {
  if (mv <= 1) return "0-1";
  if (mv === 2) return "2";
  if (mv === 3) return "3";
  if (mv === 4) return "4";
  if (mv === 5) return "5";
  return "6+";
}

type CurveBuckets = {
  "0-1": number;
  "2": number;
  "3": number;
  "4": number;
  "5": number;
  "6+": number;
};

const COLORS = ["W", "U", "B", "R", "G"] as const;
type Color = (typeof COLORS)[number];
type ColorCounts = Record<Color, number>;

function emptyColorCounts(): ColorCounts {
  return { W: 0, U: 0, B: 0, R: 0, G: 0 };
}

// Count colored pips in mana_cost (hybrids/phyrexian supported); ignore {C}, {X}, numbers.
function countColoredPips(manaCost: string | null | undefined): ColorCounts {
  const out = emptyColorCounts();
  if (!manaCost) return out;

  const tokens = manaCost.match(MANA_SYMBOL) ?? [];
  for (const raw of tokens) {
    const tok = raw.slice(1, -1); // inside braces

    if ((COLORS as readonly string[]).includes(tok)) {
      out[tok as Color] += 1;
      continue;
    }
    if (/^[WUBRG]\/P$/i.test(tok)) {
      out[tok[0].toUpperCase() as Color] += 1;
      continue;
    }
    if (/^2\/[WUBRG]$/i.test(tok)) {
      out[tok.split("/")[1].toUpperCase() as Color] += 1;
      continue;
    }
    if (/^[WUBRG]\/[WUBRG]$/i.test(tok)) {
      const parts = tok.split("/").map((s) => s.toUpperCase()) as Color[];
      const share = 1 / parts.length;
      for (const p of parts) out[p] += share;
      continue;
    }
    // ignore everything else (C, X, numbers, snow, etc.)
  }
  return out;
}

// Estimate land color sources from oracle text (and any-color behavior).
function landSourcesFromText(
  text: string | null | undefined,
  commanderColors?: string[] | null
): ColorCounts {
  const out = emptyColorCounts();
  if (!text) return out;

  if (ANY_COLOR.test(text)) {
    const targets: Color[] = (
      commanderColors?.length ? commanderColors : COLORS
    ) as Color[];
    for (const c of targets) out[c] += 1;
  }

  const matches = text.match(/\{[WUBRG]\}/g) ?? [];
  for (const m of matches) {
    const c = m.slice(1, -1) as Color;
    out[c] += 1;
  }

  return out;
}

// Count colored sources on nonlands (rocks/dorks) from text.
function nonLandColoredSourcesFromText(
  text: string | null | undefined,
  commanderColors?: string[] | null
): ColorCounts {
  const out = emptyColorCounts();
  if (!text) return out;

  if (ANY_COLOR.test(text)) {
    const targets: Color[] = (
      commanderColors?.length ? commanderColors : COLORS
    ) as Color[];
    for (const c of targets) out[c] += 1;
  }

  const matches = text.match(/\{[WUBRG]\}/g) ?? [];
  for (const m of matches) {
    const c = m.slice(1, -1) as Color;
    out[c] += 1;
  }
  return out;
}

// Coarse count of explicit {C} *costs* (mana_cost + activated costs that include {C} before ":")
function countColorlessDemand(
  manaCost: string | null | undefined,
  text: string | null | undefined
): number {
  let demand = 0;
  if (manaCost) {
    demand += (manaCost.match(/\{C\}/g) ?? []).length;
  }
  if (text) {
    // Count activated abilities with {C} in cost (avoid counting "Add {C}")
    const lines = text.split(/\n|\. /);
    for (const ln of lines) {
      if (/\{C\}/.test(ln) && /:/.test(ln) && !/Add\s*\{C\}/i.test(ln)) {
        demand += (ln.match(C_IN_TEXT) ?? []).length;
      }
    }
  }
  return demand;
}

// Coarse count of {C} *sources* (lands & rocks with "{T}: Add {C}")
function countColorlessSupplyForCard(
  cardType: string | null | undefined,
  text: string | null | undefined
): number {
  if (!text) return 0;
  const isLand = (cardType || "").includes("Land");
  const isRockOrDork = /Artifact|Creature/.test(cardType || "");
  if (PRODUCES_C.test(text) && (isLand || isRockOrDork)) {
    return 1;
  }
  return 0;
}

// Effective MV heuristic: reduce for common alt-cost/discount mechanics; floor at 0.
function effectiveMV(mv: number, text: string): number {
  let eff = mv;
  if (HAS_DELVE.test(text)) eff -= 2;
  if (HAS_AFFINITY.test(text)) eff -= 2;
  if (HAS_EMERGE.test(text)) eff -= 2;
  if (HAS_CONVOKE.test(text)) eff -= 1.5;
  if (HAS_IMPROVISE.test(text)) eff -= 1.5;
  const m = text.match(COSTS_LESS);
  if (m) {
    const n = Number(m[1] || 0);
    if (!Number.isNaN(n)) eff -= Math.min(n, Math.max(0, eff - 1));
  }
  return Math.max(0, Number(eff.toFixed(2)));
}

// ───────────────────────────────────────────────────────────────────────────────
// Primary feature builder
// ───────────────────────────────────────────────────────────────────────────────
export function buildFeatures(deck: DeckLite): DeckFeatureVector {
  const main = deck.deck_cards.filter((dc) => dc.board_section === "mainboard");
  const nonlands = main.filter(
    (dc) => !upperType(dc.card.type).includes("Land")
  );
  const lands = main.filter((dc) => upperType(dc.card.type).includes("Land"));

  const curve: CurveBuckets = {
    "0-1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0,
    "6+": 0,
  };
  const effective_curve: CurveBuckets = {
    "0-1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0,
    "6+": 0,
  };

  let totalMv = 0;
  let totalNonLand = 0;

  const type_counts: Record<string, number> = {};
  const counts: Record<string, number> = {};

  const keyword_histogram: Record<string, number> = {};
  const markers: string[] = [];

  // New aggregates
  let instantInteraction = 0;
  let massInteraction = 0;
  let spotInteraction = 0;

  let recurringTriggers = 0;
  let mandatoryCosts = 0;
  let repeatableActivations = 0;

  let cDemand = 0;
  let cSupply = 0;

  let tokenRate = 0;
  let tokenBursts = 0;

  let broadTutors = 0;
  let narrowTutors = 0;

  // For color tension: colored pips at MV ≤ 3 vs sources
  const earlyPips: ColorCounts = emptyColorCounts();
  const commanderColors: string[] =
    (deck.commander?.color_identity as string[] | undefined) ??
    (deck as any).commander?.color_identity ??
    [];

  // Pass 1: nonlands (spells & permanents)
  for (const { card, count } of nonlands) {
    const mv = card.mana_value ?? 0;
    const text = (card.text || "").toLowerCase();
    const top = upperType(card.type);

    totalMv += mv * count;
    totalNonLand += count;

    curve[bucketForMV(mv)] += count;

    // Effective curve (alt-cost aware)
    const eff = effectiveMV(mv, text);
    effective_curve[bucketForMV(eff)] += count;

    type_counts[top] = (type_counts[top] || 0) + count;

    // Symbol-aware tallies for ramp/rocks/dorks
    // (keep your legacy regex categories too; additive)
    if (
      /Artifact/i.test(card.type || "") &&
      (ADD_MANA.test(text) || ANY_COLOR.test(text) || PRODUCES_C.test(text))
    ) {
      counts.rocks = (counts.rocks || 0) + count;
    }
    if (
      /Creature/i.test(card.type || "") &&
      (ADD_MANA.test(text) || ANY_COLOR.test(text) || PRODUCES_C.test(text))
    ) {
      counts.dorks = (counts.dorks || 0) + count;
    }
    if (/\bsearch your library\b.*\bland\b/i.test(text)) {
      counts.ramp = (counts.ramp || 0) + count;
    }
    // Your legacy detectors (augmented):
    const RX = {
      draw: /(draw (a|\d+|x) card|investigate|connive|impulse)/i,
      tutors:
        /(search your library.*(card|permanent|creature|instant|sorcery))/i,
      wipes: WIPES,
      mass_bounce: MASS_BOUNCE,
      spot: SPOT,
      counters: COUNTERS,
      recursion:
        /(return.*from your graveyard|reanimate|persist|escape|unearth)/i,
      gy_hate: /(exile.*graveyard|cards? from graveyards)/i,
      protection: PROTECTION,
      stax: /(players can'?t|spells cost|skip.*untap|no more than one spell)/i,
      extra_turns: /(take an extra turn)/i,
      extra_combat: /(additional combat phase|extra combat)/i,
      token: /(create .* token)/i,
      blink: /(exile.*return.*(battlefield|under))/i,
      copy: /(copy target (spell|permanent)|double (spell|token)|copy all spells|copy abilities)/i,
      // complexity markers
      cascade: /cascade/i,
      storm: /storm/i,
      cast_trigger: /when you cast/i,
      replacement: /if .* would (die|be dealt)/i,
      choose_modes: MULTI_MODES,
      copying: COPYING,
      multi_target: MULTI_TARGET,
      flash: /\bflash\b/i,
    };

    for (const [k, re] of Object.entries(RX)) {
      if (re.test(text)) counts[k] = (counts[k] || 0) + count;
    }

    // Token profile
    if (CREATE_TOKEN.test(text)) {
      const recurring =
        START_STEP.test(text) ||
        ATTACK_STEP.test(text) ||
        /\bwhenever you cast\b/i.test(text) ||
        /\bwhenever .* enters\b/i.test(text);
      if (recurring) tokenRate += count;
      else tokenBursts += count;
    }

    // Interaction split
    if (RX.counters.test(text)) {
      // treat as instant interaction
      instantInteraction += count;
    }
    if (WIPES.test(text) || MASS_BOUNCE.test(text)) {
      massInteraction += count;
    }
    if (SPOT.test(text)) {
      // weigh instants higher: many spots are instants already by type
      if (top === "Instant" || RX.flash.test(text)) instantInteraction += count;
      else spotInteraction += count;
    }

    // Upkeep/decision load
    if (START_STEP.test(text)) recurringTriggers += count;
    if (
      /at the beginning of your upkeep.*sacrifice|sacrifice a creature.*each upkeep/i.test(
        text
      )
    )
      mandatoryCosts += count;

    // "Repeatable" if has an activation cost pattern; bump if appears to have multiple abilities
    if (REPEATABLE_ACTIVATIONS.test(text)) {
      const activations = (text.match(/:/g) || []).length;
      repeatableActivations += activations >= 2 ? count * 2 : count;
    }

    // {C} demand from mana_cost + activated costs that include {C} before ':'
    cDemand += count * countColorlessDemand(card.mana_cost, text);

    // Early pips (MV <= 3)
    if (mv <= 3) {
      const pips = countColoredPips(card.mana_cost);
      for (const c of COLORS) earlyPips[c] += pips[c] * count;
    }

    // Keyword histogram (extended a hair)
    for (const kw of [
      "annihilator",
      "proliferate",
      "landfall",
      "energy",
      "devoid",
      "emerge",
      "delirium",
      "venture",
      "storm",
      "cascade",
      "affinity",
      "convoke",
      "improvise",
      "modular",
    ]) {
      if (text.includes(kw))
        keyword_histogram[kw] = (keyword_histogram[kw] || 0) + count;
    }

    // Stack/decision markers
    for (const [mk, re] of Object.entries({
      cascade: /cascade/i,
      storm: /storm/i,
      cast_trigger: /when you cast/i,
      replacement: /if .* would (die|be dealt)/i,
      choose_modes: MULTI_MODES,
      copying: COPYING,
      multi_target: MULTI_TARGET,
    })) {
      if (re.test(text)) markers.push(mk);
    }

    // Tutors breadth
    if (BROAD_TUTOR.test(text)) broadTutors += count;
    else if (NARROW_TUTOR.test(text)) narrowTutors += count;
  }

  // Lands pass: mana pool (colored sources) + {C} supply
  const mana_pool = emptyColorCounts();
  for (const { card, count } of lands) {
    const perLand = landSourcesFromText(card.text, commanderColors);
    for (const c of COLORS) mana_pool[c] += perLand[c] * count;

    cSupply += count * countColorlessSupplyForCard(card.type, card.text);
  }

  // Add nonland colored sources (rocks/dorks) for color tension
  const nonLandColoredSources = emptyColorCounts();
  for (const { card, count } of nonlands) {
    const per = nonLandColoredSourcesFromText(card.text, commanderColors);
    for (const c of COLORS) nonLandColoredSources[c] += per[c] * count;

    // nonland {C} supply (e.g., rocks producing {C})
    cSupply += count * countColorlessSupplyForCard(card.type, card.text);
  }

  // Coloured mana curve (pips across spells)
  const coloured_mana_curve = emptyColorCounts();
  for (const { card, count } of nonlands) {
    const pips = countColoredPips(card.mana_cost);
    for (const c of COLORS) coloured_mana_curve[c] += pips[c] * count;
  }

  // Interaction density (keep legacy scalar for compatibility)
  const interactionCount =
    instantInteraction + massInteraction + spotInteraction;
  const interaction_density = totalNonLand
    ? interactionCount / totalNonLand
    : 0;
  const avg_mv = totalNonLand ? totalMv / totalNonLand : 0;

  // Color tension index: early pips vs colored sources (lands + nonlands)
  const coloredSourcesTotal: ColorCounts = {
    W: mana_pool.W + nonLandColoredSources.W,
    U: mana_pool.U + nonLandColoredSources.U,
    B: mana_pool.B + nonLandColoredSources.B,
    R: mana_pool.R + nonLandColoredSources.R,
    G: mana_pool.G + nonLandColoredSources.G,
  };
  const color_tension_index: ColorCounts = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  for (const c of COLORS) {
    const sources = Math.max(1, coloredSourcesTotal[c]); // avoid div-by-zero
    color_tension_index[c] = Number((earlyPips[c] / sources).toFixed(3));
  }

  // simple “signal cards”: improved scoring
  // - base on tags + MV bias + commander synergy + engine participation
  const commanderText = (deck.commander?.text || "").toLowerCase();
  const planHints = [
    "token",
    "sacrifice",
    "copy",
    "cast",
    "annihilator",
    "landfall",
    "proliferate",
    "equipment",
    "blink",
  ].filter((k) => commanderText.includes(k));

  const signals = nonlands
    .map(({ card, count }) => {
      const text = (card.text || "").toLowerCase();

      const tags = [
        ...(SPOT.test(text) ? ["spot"] : []),
        ...(COUNTERS.test(text) ? ["counters"] : []),
        ...(WIPES.test(text) || MASS_BOUNCE.test(text) ? ["wipes"] : []),
        ...(CREATE_TOKEN.test(text) ? ["token"] : []),
        ...(COPYING.test(text) ? ["copying"] : []),
        ...(/when you cast/i.test(text) ? ["cast_trigger"] : []),
        ...(MULTI_MODES.test(text) ? ["choose_modes"] : []),
        ...(PROTECTION.test(text) ? ["protection"] : []),
        ...(/\bblink\b|exile.*return.*battlefield/i.test(text)
          ? ["blink"]
          : []),
      ];

      // Commander synergy bonus if any tag/hint overlaps commander text
      const synergy =
        tags.some((t) => planHints.includes(t)) ||
        planHints.some((h) => text.includes(h))
          ? 1
          : 0;

      // Engine heuristic: recurring token makers and sac/activation heavy pieces
      const engine =
        (CREATE_TOKEN.test(text) &&
          (START_STEP.test(text) || ATTACK_STEP.test(text))) ||
        REPEATABLE_ACTIVATIONS.test(text)
          ? 1
          : 0;

      const score =
        tags.length * 2.5 +
        Math.min(3, Math.max(0, (card.mana_value ?? 0) - 2)) +
        synergy * 2 +
        engine * 1.5 +
        Math.log1p(count); // +~0..+1.6 for 1..4 copies

      return {
        name: card.name || "Card",
        mv: card.mana_value ?? null,
        type: card.type ?? null,
        tags: tags.slice(0, 6),
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(({ score, ...rest }) => rest);

  const features: DeckFeatureVector = {
    meta: {
      deck_id: deck.id,
      commander: {
        name: deck.commander?.name ?? null,
        color_identity: commanderColors ?? [],
        text: (deck.commander?.text || "").slice(0, 800),
      },
      avg_mv: Number(avg_mv.toFixed(3)),
      mainboard_count: nonlands.reduce((n, dc) => n + dc.count, 0),
    },

    // legacy outputs (kept)
    counts,
    curve,
    type_counts,
    keyword_histogram,
    interaction_density: Number(interaction_density.toFixed(3)),
    stack_complexity_markers: Array.from(new Set(markers)),
    signals,
    mana_pool,
    coloured_mana_curve,

    // new outputs
    interaction: {
      instant: instantInteraction,
      mass: massInteraction,
      spot: spotInteraction,
    },
    upkeep_load: {
      recurring_triggers: recurringTriggers,
      mandatory_costs: mandatoryCosts,
      repeatable_activations: repeatableActivations,
    },
    c_pips: {
      demand: cDemand,
      supply: cSupply,
    },
    effective_curve,
    token_profile: {
      rate: tokenRate,
      bursts: tokenBursts,
    },
    tutor_breadth: {
      broad: broadTutors,
      narrow: narrowTutors,
    },
    color_tension_index,
  };

  return DeckFeatureVectorSchema.parse(features);
}
