import { z } from "zod";

// Mirror your joined row shape minimally
export type CardLite = {
  name: string | null;
  mana_value: number | null;
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
      color_identity: z.array(z.string()).default([]).optional(), // not strictly needed if absent here
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
  };

  return DeckFeatureVectorSchema.parse(features);
}
