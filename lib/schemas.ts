import { count } from "console";
import { release } from "os";
import { z } from "zod";

// /////////////////////////////////////////////////////////////////////////
// commander Overview Schema
// /////////////////////////////////////////////////////////////////////////
export const commanderSchema = z.object({
  name: z
    .string()
    .describe("The name of the commander (e.g. Ellivere of the Wild Court)."),
  type: z
    .string()
    .describe(
      "The type of commander (e.g. Legendary Creature - Human Knight).",
    ),
  mana_cost: z
    .object({ mana: z.string() })
    .describe(
      "The mana cost of the commander (e.g. {2}{G}{W} = 2GW. {U}{U}{U}{R}{R}{R} = UUURRR).",
    ),
  colorIdentity: z
    .array(z.string())
    .describe("The color identity of the commander (e.g. G, W, U, B, R)."),
  artifact: z.number().describe("The number of artifacts in the deck."),
  enchantment: z.number().describe("The number of enchantments in the deck."),
  creature: z.number().describe("The number of creatures in the deck."),
  planeswalker: z.number().describe("The number of planeswalkers in the deck."),
  land: z.number().describe("The number of lands in the deck."),
  sorcery: z.number().describe("The number of sorceries in the deck."),
  instant: z.number().describe("The number of instants in the deck."),
  strengths: z
    .array(z.string())
    .describe("A list of strengths of the commander (e.g. Strong late game)."),
  weaknesses: z
    .array(z.string())
    .describe("A list of weaknesses of the commander (e.g. Weak early game)."),
  archetype: z
    .string()
    .describe("The archetype of the commander (e.g. Aggro, Control)."),
  playstyleDescription: z
    .string()
    .describe("A short playstyle description of the commander."),
  manaCurve: z.object({
    0: z.number(),
    1: z.number(),
    2: z.number(),
    3: z.number(),
    4: z.number(),
    5: z.number(),
    6: z.number(),
    7: z.number(),
    8: z.number(),
    9: z.number(),
  }),
});

export type Commander = z.infer<typeof commanderSchema>;

export const commanderSlugSchema = z.object({
  commanderName: z.string(),
  slug: z.string(),
  reason: z.string().optional(),
});

export type CommanderSlug = z.infer<typeof commanderSlugSchema>;

// /////////////////////////////////////////////////////////////////////////
// Card Suggestions Schema
// /////////////////////////////////////////////////////////////////////////

export const suggestedUpgradesSchema = z.object({
  name: z.string(),
  type: z.string(),
  mana_cost: z.string(),
  colorIdentity: z.array(z.string()),
  cmc: z.number(),
  text: z.string(),
  imageUrl: z.string(),
  cardId: z.string(),
});

export const CardSchema = z.object({
  uuid: z.string(),
  name: z.string().nullable(),
  mana_cost: z.string().nullable(),
  mana_value: z.number().nullable(),
  converted_mana_cost: z.number().nullable(),
  power: z.string().nullable(),
  toughness: z.string().nullable(),
  loyalty: z.string().nullable(),
  life: z.string().nullable(),
  defense: z.string().nullable(),
  layout: z.string().nullable(),
  rarity: z.string().nullable(),
  color_identity: z.array(z.string()).nullable(),
  types: z.array(z.string()).nullable(),
  frame_version: z.string().nullable(),
  finishes: z.array(z.string()).nullable(),
  flavor_text: z.string().nullable(),
  flavor_name: z.string().nullable(),
  is_reprint: z.boolean().nullable(),
  is_online_only: z.boolean().nullable(),
  keywords: z.array(z.string()).nullable(),
  original_printings: z.array(z.string()).nullable(),
  other_face_ids: z.array(z.string()).nullable(),
  variations: z.array(z.string()).nullable(),
  side: z.string().nullable(),
  artist: z.string().nullable(),
  artist_ids: z.array(z.string()).nullable(),
  edhrec_rank: z.number().int().nullable(),
  edhrec_saltiness: z.number().nullable(),
  identifiers: z.record(z.string(), z.string()).nullable(), // jsonb
  purchase_urls: z.object().nullable(), // jsonb
  type: z.string().nullable(),
  text: z.string(),
  count: z.number().default(1),
});

export type CardRecord = z.infer<typeof CardSchema>;

export const DeckSchema = z.object({
  id: z.string(), // primary key
  code: z.string().nullable(),
  name: z.string(),
  type: z.string(),
  board_section: z.string(),
  user_id: z.string().nullable(),
  release_date: z.string().nullable(),
  sealed_product: z.string().nullable(),
  is_public: z.boolean().nullable().default(false),
  description: z.string().nullable(),
  original_deck_id: z.string().nullable(),
  commander_uuid: z.string().nullable(),
  display_card_uuid: z.string().nullable(),
  tags: z.array(z.string()).optional().default([]),
  sets: z
    .object({
      code: z.string().nullable(),
      name: z.string().nullable(),
      type: z.string().nullable(),
      release_date: z.string().nullable(),
    })
    .nullable(),

  deck_ai_strengths_weaknesses: z.object({
    strengths: z.object({ name: z.string(), explanation: z.string() }),
    weaknesses: z.object({ name: z.string(), explanation: z.string() }),
  }),

  // --- New difficulty axes ---
  // Note: DB stores power as TEXT; accept both to be resilient.
  deck_ai_difficulty: z.object({
    bracket: z.number().nullable(),
    bracket_explanation: z.string().nullable(),
    complexity: z.enum(["Low", "Medium", "High"]).nullable(),
    complexity_explanation: z.string().nullable(),
    pilot_skill: z.enum(["Beginner", "Intermediate", "Advanced"]).nullable(),
    pilot_skill_explanation: z.string().nullable(),
    interaction_intensity: z.enum(["Low", "Medium", "High"]).nullable(),
    interaction_explanation: z.string().nullable(),
  }),

  deck_archetype_overview: z.object({
    axes: z.record(z.string(), z.number()),
    description: z.string(),
  }),
});

export type DeckRecord = z.infer<typeof DeckSchema>;

export const DeckWithCommanderSchema = DeckSchema.extend({
  commander: z
    .object({
      name: z.string(),
      color_identity: z.array(z.string()).nullable(),
      identifiers: z.record(z.string(), z.string()).nullable(),
    })
    .nullable(),
});

export type CommanderDeckRecord = z.infer<typeof DeckWithCommanderSchema>;

// ---------- AI OUTPUT SCHEMA ----------
const AiJsonSchema = z.object({
  tagline: z.string().min(8).max(70), // keep 70 to avoid strict failures
  power_level: z.number().min(1).max(10),
  power_level_explanation: z.string().min(10).max(170),

  complexity: z.enum(["Low", "Medium", "High"]),
  complexity_explanation: z.string().min(10).max(170),

  pilot_skill: z.enum(["Beginner", "Intermediate", "Advanced"]),
  pilot_skill_explanation: z.string().min(10).max(170),

  interaction_intensity: z.enum(["Low", "Medium", "High"]),
  interaction_explanation: z.string().min(10).max(170),

  tags: z.array(z.string()).min(3).max(6),
  strengths: z.array(z.string()).min(2).max(4),
  weaknesses: z.array(z.string()).min(2).max(4),
  confidence: z.number().min(0).max(1).optional(),
});
export type AiOutput = z.infer<typeof AiJsonSchema>;

// ---------- Full deck analysis output (for structured AI output) ----------
// Helpers: coerce/relax so model output rarely fails validation
const lowMediumHigh = z.union([z.string(), z.number()]).transform((v) => {
  const s = String(v ?? "")
    .trim()
    .toLowerCase();
  if (s === "low") return "Low";
  if (s === "medium") return "Medium";
  if (s === "high") return "High";
  return "Medium";
});
const pilotSkill = z.union([z.string(), z.number()]).transform((v) => {
  const s = String(v ?? "")
    .trim()
    .toLowerCase();
  if (s === "beginner") return "Beginner";
  if (s === "intermediate") return "Intermediate";
  if (s === "advanced") return "Advanced";
  return "Intermediate";
});
const num0To100 = z
  .union([z.number(), z.string()])
  .transform((n) => Math.min(100, Math.max(0, Number(n))));
const num1To10 = z
  .union([z.number(), z.string()])
  .transform((n) => Math.min(10, Math.max(1, Math.round(Number(n)))));
const shortString = z
  .string()
  .optional()
  .default("")
  .transform((s) => String(s ?? "").slice(0, 170));
// Required string for OpenAI (required array must list every property). No .optional/.default.
const shortStringRequired = z
  .string()
  .transform((s) => String(s ?? "").slice(0, 170));

// Model returns arrays; we transform to records so DB and app keep Record<string, T>.
// Arrays with .min() produce JSON Schema minItems, which forces the model to fill them.
const axesItem = z.object({
  slug: z
    .string()
    .describe("Archetype slug, e.g. spellslinger, token swarm, combo"),
  score: num0To100,
});
const explanationItem = z.object({
  slug: z.string().describe("Same archetype slug as in axes"),
  markdown: z
    .string()
    .describe("2-4 sentences in markdown explaining this archetype's score"),
});
const strengthWeaknessItem = z.object({
  name: z.string().describe("1-2 word label"),
  explanation: z.string().describe("3-6 sentences in markdown"),
});
const pillarItem = z.object({
  slug: z
    .string()
    .describe("Pillar slug, e.g. ramp, card_draw, interaction, wincon"),
  markdown: z.string().describe("2-4 sentences in markdown"),
});

export const fullAnalysisOutputSchema = z.object({
  archetype: z.object({
    axes: z
      .array(axesItem)
      .min(4, "Provide at least 4 archetypes")
      .max(8)
      .describe(
        "4-8 archetypes with slug and score 0-100. Use slugs like spellslinger, token swarm, combo, graveyard, reanimator, stax, voltron, blink, +1/+1 counters, lifegain, control, landfall, artifacts, enchantress, burn, treasure, aristocrats, mill, extra turns, dragons, elves.",
      )
      .transform((arr) =>
        Object.fromEntries(arr.map((a) => [a.slug, a.score] as const)),
      ),
    explanation_md: z
      .array(explanationItem)
      .min(4, "Provide at least 4 explanations")
      .max(8)
      .describe("Same slugs as axes; each with a markdown explanation.")
      .transform((arr) =>
        Object.fromEntries(arr.map((a) => [a.slug, a.markdown] as const)),
      ),
    description: z
      .string()
      .describe("2-4 sentences overall deck summary")
      .transform((s) => String(s ?? "")),
  }),
  sw: z.object({
    strengths: z
      .array(strengthWeaknessItem)
      .min(1, "Provide at least 1 strength")
      .max(4)
      .describe(
        "1-4 strengths: name (1-2 words) and explanation (3-6 sentences markdown).",
      )
      .transform((arr) =>
        Object.fromEntries(arr.map((a) => [a.name, a.explanation] as const)),
      ),
    weaknesses: z
      .array(strengthWeaknessItem)
      .min(1, "Provide at least 1 weakness")
      .max(4)
      .describe(
        "1-4 weaknesses: name (1-2 words) and explanation (3-6 sentences markdown).",
      )
      .transform((arr) =>
        Object.fromEntries(arr.map((a) => [a.name, a.explanation] as const)),
      ),
  }),
  difficulty: z.object({
    complexity: lowMediumHigh,
    complexity_explanation: shortStringRequired.describe(
      "Explanation for complexity, max 170 chars",
    ),
    pilot_skill: pilotSkill,
    pilot_skill_explanation: shortStringRequired.describe(
      "Explanation for pilot skill, max 170 chars",
    ),
    interaction_intensity: lowMediumHigh,
    interaction_intensity_explanation: shortStringRequired.describe(
      "Explanation for interaction intensity, max 170 chars",
    ),
    power_level: num1To10,
    power_level_explanation: shortStringRequired.describe(
      "Explanation for power level, max 170 chars",
    ),
  }),
  pillars: z
    .array(pillarItem)
    .min(1, "Provide at least 1 pillar")
    .describe(
      "At least 1 pillar: slug (e.g. ramp, card_draw, interaction, wincon) and markdown (2-4 sentences).",
    )
    .transform((arr) =>
      Object.fromEntries(arr.map((a) => [a.slug, a.markdown] as const)),
    ),
});
export type FullAnalysisOutput = z.infer<typeof fullAnalysisOutputSchema>;
