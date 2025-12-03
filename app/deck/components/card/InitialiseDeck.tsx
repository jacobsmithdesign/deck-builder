"use client";

import { useEffect, useState } from "react";
import { useCardList } from "@/app/context/CardListContext";
import { DeckRecord, CardRecord } from "@/lib/schemas";
import { CommanderCard } from "@/app/context/CommanderContext";
import {
  CommanderDeckDetails,
  useCommander,
} from "@/app/context/CommanderContext";
import { getAverageColorFromImage } from "@/lib/getAverageColour";
import { supabase } from "@/lib/supabase/client";
import { buildFeatures } from "@/lib/ai/features";
import { compressLands } from "@/lib/ai/landCompression";
import { ArchetypeOverviewRow } from "@/lib/db/archetypeOverview";
import { hydrateDeckIntoContext } from "@/lib/utils/hydrateDeckIntoContext";

type DeckWithCards = DeckRecord & {
  cards: (CardRecord & { count: number; board_section: string })[];
} & { commander: CommanderCard };
type CardRow = {
  uuid: string;
  name: string | null;
  mana_value: number | null;
  mana_cost: string | null;
  type: string | null;
  text: string | null;
};

export type DeckRow = {
  id: string;
  name: string;
  commander: CardRow | null;
  deck_cards: { count: number; board_section: string; card: CardRow }[];

  // overview fields
  tagline?: string;
  ai_rank?: string[];
  ai_tags?: string[];
  ai_strengths?: string[];
  ai_weaknesses?: string[];
  ai_generated_at: string | null;
  ai_confidence?: number | null;
  ai_spec_version?: string | null;

  // difficulty axes (note: ai_power_level may be TEXT in DB; coerce later)
  ai_power_level?: string | null;
  ai_complexity?: "Low" | "Medium" | "High" | null;
  ai_pilot_skill?: "Beginner" | "Intermediate" | "Advanced" | null;
  ai_interaction?: "Low" | "Medium" | "High" | null;
  ai_upkeep?: "Low" | "Medium" | "High" | null;

  // explanations
  ai_power_level_explanation?: string | null;
  ai_complexity_explanation?: string | null;
  ai_pilot_skill_explanation?: string | null;
  ai_interaction_explanation?: string | null;
  ai_upkeep_explanation?: string | null;
};

// This component initialises the card list and deck details upon first visiting a deck page.
// It validates the card data and sets it in the useCardList context.
// It also sets the data for the commander overview section above the card table.
export default function InitialiseDeck({ deck }: { deck: DeckWithCards }) {
  const {
    setCards,
    setDeck,
    setDeckFeatures,
    setLandFeatures,
    setAiOverview,
    setArchetypeOverview,
    setStrengthsAndWeaknesses,
    setPillars,
    setDifficulty,
  } = useCardList();
  const { setDeckDetails, setCommanderCard } = useCommander();
  const [initialisedDeck, setInitialisedDeck] = useState<DeckWithCards>(deck);
  async function fetchDeckPage(): Promise<any[]> {
    const { data, error } = await supabase
      .from("decks")
      .select(
        `
        id, name, user_id, type, code, release_date, sealed_product,
      commander_uuid, display_card_uuid,

      deck_cards:deck_cards!inner (
        count, board_section,
        card:cards!deck_cards_card_uuid_fkey (
          uuid, name, mana_cost, mana_value, type, text, identifiers, color_identity
        )
      ),

      deck_ai_difficulty (
        power_level,
        power_level_explanation,
        complexity,
        complexity_explanation,
        pilot_skill,
        pilot_skill_explanation,
        interaction_intensity,
        interaction_explanation,
        updated_at
      ),

      deck_ai_strengths_weaknesses (
        strengths,
        weaknesses,
        created_at
      ),

      deck_ai_pillars (
        pillars
      ),

      deck_archetype_overview (
        axes,
        explanation_md,
        description,
        updated_at
      )
        `
      )
      .eq("id", deck.id)
      .eq("deck_cards.board_section", "mainboard")
      .order("release_date", { ascending: false });

    if (error) throw error;
    return (data ?? []) as unknown as DeckRow[];
  }

  // Fetch the compressed deck data
  async function buildDeckFeatures() {
    try {
      const deckRows = await fetchDeckPage();

      await Promise.allSettled(
        deckRows.map((row) => {
          hydrateDeckIntoContext(row, {
            setDeck,
            setCards,
            setArchetypeOverview,
            setStrengthsAndWeaknesses,
            setPillars,
            setDifficulty,
          });

          const features = buildFeatures(row as any);
          const landFeatures = compressLands(row as any);
          setDeckFeatures(features);
          setLandFeatures(landFeatures);

          // ---------- AI overview bridge ----------
          const diff = row.deck_ai_difficulty ?? null;
          const sw = row.deck_ai_strengths_weaknesses ?? null;

          const timestamps = [
            row.deck_archetype_overview?.updated_at ?? null,
            sw?.created_at ?? null,
            diff?.updated_at ?? null,
          ].filter(Boolean) as string[];

          const ai_generated_at =
            timestamps.length > 0
              ? timestamps.sort().slice(-1)[0] // latest
              : null;

          const hasExistingAI =
            !!diff ||
            !!sw ||
            !!row.deck_ai_pillars ||
            !!row.deck_archetype_overview;

          setAiOverview(
            hasExistingAI
              ? {
                  tagline: null,
                  ai_rank: null,
                  ai_tags: null,
                  ai_confidence: null,
                  ai_spec_version: null,

                  // ✅ keep as Record<string,string> (or null)
                  ai_strengths: sw?.strengths ?? null,
                  ai_weaknesses: sw?.weaknesses ?? null,
                  ai_generated_at, // make sure AiOverview expects string | null

                  ai_power_level: diff?.power_level ?? null,
                  ai_complexity: diff?.complexity ?? null,
                  ai_pilot_skill: diff?.pilot_skill ?? null,
                  ai_interaction: diff?.interaction_intensity ?? null,
                  ai_upkeep: null,

                  ai_power_level_explanation:
                    diff?.power_level_explanation ?? null,
                  ai_complexity_explanation:
                    diff?.complexity_explanation ?? null,
                  ai_pilot_skill_explanation:
                    diff?.pilot_skill_explanation ?? null,
                  ai_interaction_explanation:
                    diff?.interaction_explanation ?? null,
                  ai_upkeep_explanation: null,
                }
              : null
          );

          return null;
        })
      );
    } catch (error) {
      console.error("Error fetching compressed deck data: ", error);
    }
  }

  useEffect(() => {
    // Get compressed deck data then build the features for the overview section
    buildDeckFeatures();
    // Initialise the commander details overview. This gets sloppy around the image section but whatever.
    const commanderDeckDetails: CommanderDeckDetails = {
      id: deck.id,
      name: deck.name,
      userId: "user_id" in deck ? deck.user_id : null,
      type: deck.type,
      isUserDeck: "user_id" in deck,
      cards: deck.cards.map((c) => ({
        id: c.uuid,
        name: c.name,
        type: c.type,
        mana_cost: c.mana_cost,
        color_identity: c.color_identity,
        cmc: c.mana_value ?? 0,
        text: c.text ?? "",
        flavourText: c.flavor_text ?? null,
        board_section: c.board_section ?? "mainboard",
        count: c.count ?? 1,
        imageFrontUrl: c.identifiers.scryfallId
          ? `https://cards.scryfall.io/normal/front/${c.identifiers.scryfallId[0]}/${c.identifiers.scryfallId[1]}/${c.identifiers.scryfallId}.jpg`
          : null,
        imageBackUrl: c.identifiers.scryfallCardBackId
          ? `https://cards.scryfall.io/normal/back/${c.identifiers.scryfallCardBackId[0]}/${c.identifiers.scryfallCardBackId[1]}/${c.identifiers.scryfallCardBackId}.jpg`
          : null,
        artwork: c.identifiers.scryfallCardBackId
          ? `https://cards.scryfall.io/art_crop/front/${c.identifiers.scryfallId[0]}/${c.identifiers.scryfallId[1]}/${c.identifiers.scryfallId}.jpg`
          : null,
        identifiers: c.identifiers,
      })),
    };
    setDeckDetails(commanderDeckDetails);
    // Initialise the Commander card info
    const commanderCardRecord = deck.commander;
    const commanderCard: CommanderCard = {
      id: commanderCardRecord.id,
      name: commanderCardRecord.name,
      type: commanderCardRecord.type,
      mana_cost: commanderCardRecord.mana_cost,
      colorIdentity: commanderCardRecord.colorIdentity,
      cmc: commanderCardRecord.cmc,
      text: commanderCardRecord.text,
      imageFrontUrl: `https://cards.scryfall.io/normal/front/${commanderCardRecord.identifiers.scryfallId[0]}/${commanderCardRecord.identifiers.scryfallId[1]}/${commanderCardRecord.identifiers.scryfallId}.jpg`,

      //  imageBackUrl: `https://cards.scryfall.io/normal/back/${commanderCardRecord.identifiers.scryfallCardBackId[0]}/${commanderCardRecord.identifiers.scryfallCardBackId[1]}/${commanderCardRecord.identifiers.scryfallCardBackId}.jpg`,
      artwork: `https://cards.scryfall.io/art_crop/front/${commanderCardRecord.identifiers.scryfallId[0]}/${commanderCardRecord.identifiers.scryfallId[1]}/${commanderCardRecord.identifiers.scryfallId}.jpg`,
      isDoubleFaced: !!commanderCardRecord.identifiers?.scryfallCardBackId,
      identifiers: commanderCardRecord.identifiers,
    };
    setCommanderCard(commanderCard);
  }, [deck?.id, setArchetypeOverview]);

  return null;
}
