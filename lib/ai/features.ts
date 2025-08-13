import { z } from "zod";

// Mirror your joined row shape minimally
export type CardLite = {
  name: string | null;
  mana_value: number | null;
  mana_cost: string | null;
  type: string | null;
  text: string | null;
};
export type DeckLite = {
  id: string;
  commander: CardLite | null;
  deck_cards: { count: number; board_section: string; card: CardLite }[];
};

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
  counts: z.record(z.number()),
  curve: z.record(z.number()),
  type_counts: z.record(z.number()),
  keyword_histogram: z.record(z.number()),
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
});

export type DeckFeatureVector = z.infer<typeof DeckFeatureVectorSchema>;

// Simple detectors (expand as you like)
const RX = {
  ramp: /(add [\dX ]*mana|search your library for a land|untap.*land)/i,
  rocks: /(artifact).*(add.*mana)/i,
  dorks: /(creature).*(add.*mana)/i,
  draw: /(draw (a|\d+) card|investigate|connive|impulse)/i,
  tutors: /(search your library.*(card|permanent|creature|instant|sorcery))/i,
  wipes:
    /(destroy all|exile all|each creature gets -|wrath|damnation|cyclonic rift)/i,
  spot: /(destroy target|exile target|fight|bounce target)/i,
  counters: /counter target/i,
  recursion: /(return.*from your graveyard|reanimate|persist|escape|unearth)/i,
  gy_hate: /(exile.*graveyard|cards? from graveyards)/i,
  protection: /(hexproof|indestructible|protection from|phase out|ward)/i,
  stax: /(players can'?t|spells cost|skip.*untap|no more than one spell)/i,
  extra_turns: /(take an extra turn)/i,
  extra_combat: /(additional combat phase|extra combat)/i,
  token: /(create .* token)/i,
  blink: /(exile.*return.*(battlefield|under))/i,
  copy: /(copy target (spell|permanent)|double (spell|token))/i,
  // complexity markers
  cascade: /cascade/i,
  storm: /storm/i,
  cast_trigger: /when you cast/i,
  replacement: /if .* would (die|be dealt)/i,
  choose_modes: /(choose one|choose two)/i,
};

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

export function buildFeatures(deck: DeckLite): DeckFeatureVector {
  const main = deck.deck_cards.filter((dc) => dc.board_section === "mainboard");
  const nonlands = main.filter(
    (dc) => !upperType(dc.card.type).includes("Land")
  );
  const lands = main.filter((dc) => upperType(dc.card.type).includes("Land"));

  // curve
  const curve: Record<string, number> = {
    "0-1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0,
    "6+": 0,
  };
  let totalMv = 0,
    totalNonLand = 0;

  const type_counts: Record<string, number> = {};
  const counts: Record<string, number> = {};
  const keyword_histogram: Record<string, number> = {};
  const markers: string[] = [];

  for (const { card, count } of nonlands) {
    const mv = card.mana_value ?? 0;
    totalMv += mv * count;
    totalNonLand += count;

    const bucket =
      mv <= 1
        ? "0-1"
        : mv === 2
        ? "2"
        : mv === 3
        ? "3"
        : mv === 4
        ? "4"
        : mv === 5
        ? "5"
        : "6+";
    curve[bucket] += count;

    const top = upperType(card.type);
    type_counts[top] = (type_counts[top] || 0) + count;

    const text = (card.text || "").toLowerCase();

    // tallies
    for (const [k, re] of Object.entries(RX)) {
      if (re.test(text)) counts[k] = (counts[k] || 0) + count;
    }

    // keywords histogram (cheap): split on punctuation, count rare-ish words you care about
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
    ]) {
      if (text.includes(kw))
        keyword_histogram[kw] = (keyword_histogram[kw] || 0) + count;
    }

    // stack complexity markers
    for (const [mk, re] of Object.entries({
      cascade: RX.cascade,
      storm: RX.storm,
      cast_trigger: RX.cast_trigger,
      replacement: RX.replacement,
      choose_modes: RX.choose_modes,
    })) {
      if (re.test(text)) markers.push(mk);
    }
  }

  // Build mana pool
  const mana_pool = emptyColorCounts();
  const commanderColors = (deck as any)?.commander?.color_identity ?? []; // pass through if you fetch it
  for (const { card, count } of lands) {
    const perLand = landSourcesFromText(card.text, commanderColors);
    for (const c of COLORS) mana_pool[c] += perLand[c] * count;
  }
  // Build coloured mana curve for nonland cards
  const coloured_mana_curve = emptyColorCounts();
  for (const { card, count } of nonlands) {
    const pips = countColoredPips(card.mana_cost);
    for (const c of COLORS) coloured_mana_curve[c] += pips[c] * count;
  }
  // Build interaction counts
  const interactionCount =
    (counts.counters || 0) + (counts.wipes || 0) + (counts.spot || 0);
  const interaction_density = totalNonLand
    ? interactionCount / totalNonLand
    : 0;
  const avg_mv = totalNonLand ? totalMv / totalNonLand : 0;

  // simple “signal cards”: top by (keywords + mv bias)
  const signals = nonlands
    .map(({ card, count }) => {
      const text = card.text || "";
      const sigTags = Object.entries(RX)
        .filter(([_, re]) => re.test(text))
        .map(([k]) => k)
        .slice(0, 4);
      const score =
        sigTags.length * 3 +
        Math.min(3, Math.max(0, (card.mana_value ?? 0) - 2));
      return {
        name: card.name || "Card",
        mv: card.mana_value ?? null,
        type: card.type ?? null,
        tags: sigTags,
        score,
        count,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(({ score, count, ...rest }) => rest);

  const features: DeckFeatureVector = {
    meta: {
      deck_id: deck.id,
      commander: {
        name: deck.commander?.name ?? null,
        color_identity: [], // you can pass this in if you fetch it
        text: (deck.commander?.text || "").slice(0, 800),
      },
      avg_mv: Number(avg_mv.toFixed(3)),
      mainboard_count: nonlands.reduce((n, dc) => n + dc.count, 0),
    },
    counts,
    curve,
    type_counts,
    keyword_histogram,
    interaction_density: Number(interaction_density.toFixed(3)),
    stack_complexity_markers: Array.from(new Set(markers)),
    signals,
    mana_pool,
    coloured_mana_curve,
  };

  return DeckFeatureVectorSchema.parse(features);
}

// Function to build a colour curve from deck
const COLORS = ["W", "U", "B", "R", "G"] as const;
type Color = (typeof COLORS)[number];
type ColorCounts = Record<Color, number>;

function emptyColorCounts(): ColorCounts {
  return { W: 0, U: 0, B: 0, R: 0, G: 0 };
}

// Parse a Scryfall/MTGJSON mana_cost like "{2}{G}{U}{U}" or "{G/U}" or "{2/R}" or "{G/P}"
// Returns colored pip counts. Heuristics:
// - Pure colored {W}{U}{B}{R}{G} => +1 to that color
// - Hybrid like {G/U} => +0.5 to G and +0.5 to U (splits evenly)
// - Two-brid {2/R} => counts as 1 colored pip for R (optional: make this 0.5 if you prefer)
// - Phyrexian {G/P} => counts as 1 colored pip to G
// - {C}, numbers, {X} ignored
function countColoredPips(manaCost: string | null | undefined): ColorCounts {
  const out = emptyColorCounts();
  if (!manaCost) return out;

  const tokens = manaCost.match(/\{([^}]+)\}/g) ?? [];
  for (const raw of tokens) {
    const tok = raw.slice(1, -1); // inside braces

    // Direct single color
    if ((COLORS as readonly string[]).includes(tok)) {
      out[tok as Color] += 1;
      continue;
    }

    // Phyrexian (e.g. G/P)
    if (/^[WUBRG]\/P$/i.test(tok)) {
      const c = tok[0].toUpperCase() as Color;
      out[c] += 1;
      continue;
    }

    // Two-brid (2/R) — treat as 1 colored pip for that color
    if (/^2\/[WUBRG]$/i.test(tok)) {
      const c = tok.split("/")[1].toUpperCase() as Color;
      out[c] += 1; // change to 0.5 if you prefer a softer model
      continue;
    }

    // Hybrid (G/U etc). Split 1 pip evenly across colors present.
    if (/^[WUBRG]\/[WUBRG]$/i.test(tok)) {
      const parts = tok.split("/").map((s) => s.toUpperCase()) as Color[];
      const share = 1 / parts.length;
      for (const p of parts) out[p] += share;
      continue;
    }

    // Everything else: ignore (numbers, X, C, etc.)
  }
  return out;
}

// Extract land color sources from oracle text.
// Counts each color a land can produce as a "source" for that color.
// If a land says "any color", we credit all commander colors (if provided),
// otherwise all 5 colors.
function landSourcesFromText(
  text: string | null | undefined,
  commanderColors?: string[] | null
): ColorCounts {
  const out = emptyColorCounts();
  if (!text) return out;
  const t = text.toLowerCase();

  // Any color (common phrasing)
  if (/(any color|any one color)/i.test(t)) {
    const targets: Color[] = (
      commanderColors?.length ? commanderColors : COLORS
    ) as Color[];
    for (const c of targets) out[c] += 1;
  }

  // Direct pips present in text, e.g., "{T}: Add {U} or {G}."
  const matches = text.match(/\{[WUBRG]\}/g) ?? [];
  for (const m of matches) {
    const c = m.slice(1, -1) as Color;
    out[c] += 1;
  }

  return out;
}
