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
  identifiers: z
    .object({ scryfallId: z.string(), scryfallCardBackId: z.string() })
    .nullable(), // jsonb
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
