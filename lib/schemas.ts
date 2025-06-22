import { count } from "console";
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
      "The type of commander (e.g. Legendary Creature - Human Knight)."
    ),
  manaCost: z
    .object({ mana: z.string() })
    .describe(
      "The mana cost of the commander (e.g. {2}{G}{W} = 2GW. {U}{U}{U}{R}{R}{R} = UUURRR)."
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
  manaCost: z.string(),
  colorIdentity: z.array(z.string()),
  cmc: z.number(),
  oracleText: z.string(),
  imageUrl: z.string(),
  cardId: z.string(),
});

const Card = z.object({
  id: z.string(), // Unique identifier for the card
  name: z.string(), // Name of the card
  type: z.string(), // Type of the card (e.g., Creature, Instant)
  manaCost: z.string().nullable(), // Mana cost of the card, nullable if not applicable
  colorIdentity: z.array(z.string()), // Color identity of the card
  cmc: z.number(), // Converted mana cost of the card
  oracleText: z.string().nullable(), // Oracle text of the card, nullable if not applicable
  flavourText: z.string().nullable(), // Flavour text of the card, nullable if not applicable
  imageUrl: z.string().nullable(), // URL to the card image, nullable if not available
  count: z.number().default(1), // Count of the card in the deck, default to 1
});

export type CardType = z.infer<typeof Card>;

const deckSchema = z.object({
  id: z.string().uuid(), // UUID of the deck
  code: z.string(), // Set or deck code
  name: z.string(), // Name of the deck
  release_date: z.string().nullable(), // ISO date string, nullable
  type: z.string(), // Type of deck (e.g., Commander Deck)
  sealed_product: z.string().nullable(), // Optional sealed product reference
  cards: z.array(Card), // Array of cards in the deck
});

export type Deck = z.infer<typeof deckSchema>;
