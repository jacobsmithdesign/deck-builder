// utils/hydrateDeckIntoContext.ts
import type { CardRecord } from "@/lib/schemas";
import type { DeckFeatureVector } from "@/lib/ai/features";
import type {
  ArchetypeOverview,
  StrengthsAndWeaknesses,
  Pillars,
  Difficulty,
  DeckMetadata,
  AiOverview,
} from "@/app/context/CardListContext";

type DeckRow = {
  id: string;
  name: string;
  user_id: string | null;
  type: string | null;
  code?: string | null;
  release_date?: string | null;
  sealed_product?: string | null;
  commander_uuid?: string | null;
  display_card_uuid?: string | null;

  deck_cards: {
    count: number;
    board_section: string;
    card: {
      uuid: string;
      name: string | null;
      mana_cost?: string | null;
      mana_value?: number | null;
      type?: string | null;
      text?: string | null;
      identifiers?: any;
      color_identity?: string[] | null;
    };
  }[];

  deck_archetype_overview?: {
    axes: Record<string, number>;
    explanation_md: Record<string, string>;
    description?: string | null;
    updated_at?: string | null;
  } | null;

  deck_ai_strengths_weaknesses?: {
    strengths?: Record<string, string> | null;
    weaknesses?: Record<string, string> | null;
    created_at?: string | null;
  } | null;

  deck_ai_pillars?: {
    pillars?: Record<string, string> | null;
  } | null;

  deck_ai_difficulty?: {
    bracket: number;
    bracket_explanation: string;
    complexity: string;
    complexity_explanation: string;
    pilot_skill: string;
    pilot_skill_explanation: string;
    interaction_intensity: string;
    interaction_explanation: string;
    updated_at?: string | null;
  } | null;
};

export function hydrateDeckIntoContext(
  row: DeckRow,
  opts: {
    setDeck: (d: DeckMetadata) => void;
    setCards: (cards: CardRecord[]) => void;
    // if you keep a pristine snapshot for reset:
    setOriginalCards?: (cards: CardRecord[]) => void;
    setArchetypeOverview: (v: ArchetypeOverview) => void;
    setStrengthsAndWeaknesses: (v: StrengthsAndWeaknesses) => void;
    setPillars: (v: Pillars) => void;
    setDifficulty: (v: Difficulty) => void;
    // optional feature hooks you already have:
    setDeckFeatures?: (f: DeckFeatureVector | null) => void;
    setLandFeatures?: (f: any) => void;
    setAiOverview?: (v: AiOverview | null) => void;
  },
) {
  // 1) Deck metadata
  const deckMeta: DeckMetadata = {
    id: row.id,
    name: row.name,
    userId: row.user_id,
    type: row.type ?? undefined,
    isUserDeck: !!row.user_id, // true if owned; adjust if needed
    code: row.code ?? null,
    release_date: row.release_date ?? null,
    sealed_product: row.sealed_product ?? null,
    commander_uuid: row.commander_uuid ?? null,
    display_card_uuid: row.display_card_uuid ?? null,
  };
  opts.setDeck(deckMeta);

  // 2) Cards → CardRecord[]
  const cards: CardRecord[] = (row.deck_cards ?? [])
    .filter((dc) => (dc?.board_section || "").toLowerCase() === "mainboard")
    .map((dc) => {
      const c = dc.card;
      const scryfallId = c.identifiers.scryfallId;
      const scryfallBackId = c.identifiers?.scryfallCardBackId ?? null;
      return {
        uuid: c.uuid,
        name: c.name ?? "",
        type: c.type ?? "",
        text: c.text ?? "",
        mana_cost: c.mana_cost ?? undefined,
        mana_value: c.mana_value ?? undefined,
        color_identity: c.color_identity ?? undefined,
        imageFrontUrl: scryfallId
          ? `https://cards.scryfall.io/normal/front/${scryfallId[0]}/${scryfallId[1]}/${scryfallId}.jpg`
          : null,
        identifiers: c.identifiers ?? undefined,
        // include your UI fields if your CardRecord has them:
        count: Number(dc.count ?? 1),
        board_section: dc.board_section,
      } as CardRecord;
    });

  opts.setCards(cards);
  opts.setOriginalCards?.(cards);

  // 3) Archetype overview
  if (row.deck_archetype_overview) {
    opts.setArchetypeOverview({
      deckId: row.id,
      axes: row.deck_archetype_overview.axes,
      explanation_md: row.deck_archetype_overview.explanation_md,
      description: row.deck_archetype_overview.description || "",
      updated_at: row.deck_archetype_overview.updated_at ?? null,
    });
  } else {
    opts.setArchetypeOverview(null);
  }

  // 4) Strengths & Weaknesses
  if (row.deck_ai_strengths_weaknesses) {
    opts.setStrengthsAndWeaknesses({
      deckId: row.id,
      strengths: row.deck_ai_strengths_weaknesses.strengths ?? {},
      weaknesses: row.deck_ai_strengths_weaknesses.weaknesses ?? {},
      updated_at: row.deck_ai_strengths_weaknesses.created_at ?? null,
    });
  } else {
    opts.setStrengthsAndWeaknesses(null as any);
  }

  // 5) Pillars
  if (row.deck_ai_pillars) {
    opts.setPillars({
      deckId: row.id,
      pillars: row.deck_ai_pillars.pillars ?? {},
      updated_at: null,
    });
  } else {
    opts.setPillars(null as any);
  }

  // 6) Difficulty
  if (row.deck_ai_difficulty) {
    opts.setDifficulty({
      deckId: row.id,
      bracket: row.deck_ai_difficulty.bracket,
      bracket_explanation: row.deck_ai_difficulty.bracket_explanation,
      complexity: row.deck_ai_difficulty.complexity,
      complexity_explanation: row.deck_ai_difficulty.complexity_explanation,
      pilot_skill: row.deck_ai_difficulty.pilot_skill,
      pilot_skill_explanation: row.deck_ai_difficulty.pilot_skill_explanation,
      interaction_intensity: row.deck_ai_difficulty.interaction_intensity,
      interaction_intensity_explanation:
        row.deck_ai_difficulty.interaction_explanation,
      updatedAt: row.deck_ai_difficulty.updated_at ?? null,
    });
  } else {
    opts.setDifficulty(null as any);
  }
  // 7) Legacy AI Overview bridge (for components still reading ai_* flat fields)
  if (opts.setAiOverview) {
    const diff = row.deck_ai_difficulty ?? null;
    const sw = row.deck_ai_strengths_weaknesses ?? null;

    // Choose a sensible "generated at" from available timestamps
    const timestamps = [
      row.deck_archetype_overview?.updated_at ?? null,
      sw?.created_at ?? null,
      diff?.updated_at ?? null,
    ].filter(Boolean) as string[];
    const ai_generated_at = timestamps.length
      ? timestamps.sort().slice(-1)[0] // latest available
      : null;

    const hasExistingAI =
      !!diff || !!sw || !!row.deck_ai_pillars || !!row.deck_archetype_overview;

    const legacy: AiOverview | null = hasExistingAI
      ? {
          // Not represented in new schema → keep null (or wire up if/when added)
          tagline: null,
          ai_rank: null,
          ai_tags: null,
          ai_confidence: null,
          ai_spec_version: null,

          // Strengths & weaknesses
          ai_strengths: sw?.strengths ?? null,
          ai_weaknesses: sw?.weaknesses ?? null,
          ai_generated_at,

          // Difficulty
          ai_bracket: diff?.bracket ?? null,
          ai_complexity: diff?.complexity ?? null,
          ai_pilot_skill: diff?.pilot_skill ?? null,
          ai_interaction: diff?.interaction_intensity ?? null,
          ai_upkeep: null, // no source in new schema

          ai_bracket_explanation: diff?.bracket_explanation ?? null,
          ai_complexity_explanation: diff?.complexity_explanation ?? null,
          ai_pilot_skill_explanation: diff?.pilot_skill_explanation ?? null,
          ai_interaction_explanation: diff?.interaction_explanation ?? null,
          ai_upkeep_explanation: null, // no source
        }
      : null;

    opts.setAiOverview(legacy);
  }
}
