/**
 * Canonical role taxonomy for cards. Slugs use snake_case; use
 * roleSlugToNaturalLanguage() for display and embedding text.
 */
export const ROLE_TAXONOMY = [
  "ramp",
  "mana_dork",
  "mana_rock",
  "ritual",
  "cost_reducer",

  "card_draw",
  "card_selection",
  "wheel",
  "tutor",

  "spot_removal",
  "board_wipe",
  "conditional_board_wipe",
  "damage_sweeper",
  "counterspell",
  "protection",

  "token_maker",
  "anthem",
  "finisher",
  "threat",
  "evasive_threat",

  "sac_outlet",
  "sac_payoff",
  "death_trigger",
  "aristocrats_piece",

  "recursion",
  "reanimation",
  "graveyard_enabler",
  "graveyard_payoff",

  "blink_target",
  "blink_payoff",
  "etb_payoff",

  "engine_piece",
  "value_piece",
  "stax_piece",
  "pillow_fort",
  "combat_trick",
  "lifegain_source",
  "lifegain_payoff",

  "spell_payoff",
  "artifact_payoff",
  "enchantment_payoff",
  "tribal_payoff",
] as const;

export type RoleSlug = (typeof ROLE_TAXONOMY)[number];

/** Abbreviations and acronyms to expand in role slugs (lowercase). */
const ABBREVIATIONS: Record<string, string> = {
  sac: "sacrifice",
  etb: "enters the battlefield",
  gy: "graveyard",
  rm: "removal",
  pt: "power and toughness",
  mv: "mana value",
  cmc: "converted mana cost",
};

/**
 * Converts a role slug to natural language: underscores to spaces and
 * abbreviations/acronyms expanded. Safe for unknown slugs (pass-through).
 */
export function roleSlugToNaturalLanguage(slug: string): string {
  const withSpaces = slug.replace(/_/g, " ");
  const words = withSpaces.split(/\s+/);
  const expanded = words.map((word) => {
    const lower = word.toLowerCase();
    return ABBREVIATIONS[lower] ?? word;
  });
  return expanded.join(" ");
}

/**
 * Converts an array of role slugs to a single natural-language string
 * (e.g. for embedding or display). Unknown slugs are still normalized
 * (underscores removed, known abbreviations expanded).
 */
export function rolesToNaturalLanguage(roles: string[]): string {
  if (!roles?.length) return "";
  return roles.map(roleSlugToNaturalLanguage).join(". ");
}
