"use client";

import { useEffect } from "react";
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

type DeckWithCards = DeckRecord & {
  cards: (CardRecord & { count: number; board_section: string })[];
};
type CardRow = {
  uuid: string;
  name: string | null;
  mana_value: number | null;
  mana_cost: string | null;
  type: string | null;
  text: string | null;
};

type DeckRow = {
  id: string;
  name: string;
  commander: CardRow | null;
  deck_cards: { count: number; board_section: string; card: CardRow }[];
  tagline?: string;
  ai_rank?: string[];
  ai_tags?: string[];
  ai_strengths?: string[];
  ai_weaknesses?: string[];
  ai_generated_at: string | null;
  ai_power_level?: number;
  ai_complexity?: string;
  ai_pilot_skill?: string;
  ai_interaction?: string;
  ai_spec_version?: string;
  ai_confidence?: number;
};

// This component initialises the card list and deck details upon first visiting a deck page.
// It validates the card data and sets it in the useCardList context.
// It also sets the data for the commander overview section above the card table.
export default function InitialiseDeck({ deck }: { deck: DeckWithCards }) {
  const { setCards, setDeck, setInitialCards, setDeckFeatures, setAiOverview } =
    useCardList();
  const { setDeckDetails, setCommanderCard } = useCommander();

  // Same async function from backfill-ai.ts to get a compressed version of the deck
  async function fetchDeckPage(offset = 0): Promise<DeckRow[]> {
    let query = supabase
      .from("decks")
      .select(
        `
      id,
      name,
      tagline,
        ai_rank,
        ai_tags,
        ai_strengths,
        ai_weaknesses,
        ai_generated_at,
        ai_confidence,
        ai_spec_version,
        ai_power_level,
        ai_complexity,
        ai_pilot_skill,
        ai_interaction,
      commander:cards!decks_commander_uuid_fkey(
        uuid,
        name,
        mana_value,
        mana_cost,
        type,
        text
        
      ),
      deck_cards(
        count,
        board_section,
        card:cards!deck_cards_card_uuid_fkey(
          uuid,
          name,
          mana_value,
          mana_cost,
          type,
          text
        )
      )
    `
      )
      .eq("id", deck.id)
      .eq("deck_cards.board_section", "mainboard")
      .order("release_date", { ascending: false });

    const { data, error } = await query;
    console.log("Compressed deck data fetched: ", data);
    if (error) throw error;
    return data as unknown as DeckRow[];
  }

  // Fetch the compressed deck data
  async function buildDeckFeatures() {
    try {
      const compressedDeck = await fetchDeckPage();
      await Promise.allSettled(
        compressedDeck.map((deck) => {
          const features = buildFeatures(deck as any);
          setDeckFeatures(features);
          setAiOverview({
            tagline: deck.tagline,
            ai_rank: deck.ai_rank,
            ai_tags: deck.ai_tags,
            ai_strengths: deck.ai_strengths,
            ai_weaknesses: deck.ai_weaknesses,
            ai_generated_at: deck.ai_generated_at,
            ai_confidence: deck.ai_confidence ?? null,
            ai_spec_version: deck.ai_spec_version ?? null,
            ai_power_level: deck.ai_power_level ?? null,
            ai_complexity: deck.ai_complexity ?? null,
            ai_pilot_skill: deck.ai_pilot_skill ?? null,
            ai_interaction: deck.ai_interaction ?? null,
          });
          console.log("Deck features built: ", features);
        })
      );
    } catch (error) {
      console.error("Error fetching compressed deck data: ", error);
    }
  }

  // console.log(
  //   "Cards initialised: ",
  //   deck.cards.map((c) => ({
  //     name: c.name,
  //     id: c.uuid,
  //     scryfallId: c.identifiers?.scryfallId,
  //   }))
  // );
  useEffect(() => {
    // Get compressed deck data then build the features for the overview section
    const features = buildDeckFeatures();
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
    const commanderCardRecord = deck.cards.find(
      (card) => card.uuid === deck.commander_uuid
    );
    const commanderCard: CommanderCard = {
      id: commanderCardRecord.uuid ?? crypto.randomUUID(),
      name: commanderCardRecord.name,
      type: commanderCardRecord.type,
      mana_cost: commanderCardRecord.mana_cost,
      colorIdentity: commanderCardRecord.color_identity,
      cmc: commanderCardRecord.converted_mana_cost,
      text: commanderCardRecord.text,
      imageFrontUrl: `https://cards.scryfall.io/normal/front/${commanderCardRecord.identifiers.scryfallId[0]}/${commanderCardRecord.identifiers.scryfallId[1]}/${commanderCardRecord.identifiers.scryfallId}.jpg`,

      imageBackUrl: `https://cards.scryfall.io/normal/front/${commanderCardRecord.identifiers.scryfallCardBackId[0]}/${commanderCardRecord.identifiers.scryfallCardBackId[1]}/${commanderCardRecord.identifiers.scryfallCardBackId}.jpg`,
      artwork: `https://cards.scryfall.io/art_crop/front/${commanderCardRecord.identifiers.scryfallId[0]}/${commanderCardRecord.identifiers.scryfallId[1]}/${commanderCardRecord.identifiers.scryfallId}.jpg`,
      isDoubleFaced: !!commanderCardRecord.identifiers?.scryfallCardBackId,
      identifiers: commanderCardRecord.identifiers,
    };
    setCommanderCard(commanderCard);
    // Initialise the cards to be displayed in the deck table
    const validatedCards = deck.cards.map((c) => {
      const scryfallId = c.identifiers.scryfallId;
      const scryfallBackId = c.identifiers?.scryfallCardBackId ?? null;

      return {
        id: c.uuid,
        name: c.name,
        type: c.type,
        mana_cost: c.mana_cost,
        colorIdentity: c.color_identity,
        power: c.power,
        toughness: c.toughness,
        loyalty: c.loyalty,
        keywords: c.keywords,
        variations: c.variations,
        edhrec_rank: c.edhrec_rank,
        edhrec_saltiness: c.edhrec_saltiness,
        purchase_urls: c.purchase_urls,
        cmc: c.converted_mana_cost,
        text: c.text,
        flavourText: c.flavor_text,
        board_section: c.board_section,
        imageFrontUrl: scryfallId
          ? `https://cards.scryfall.io/normal/front/${scryfallId[0]}/${scryfallId[1]}/${scryfallId}.jpg`
          : null,
        imageBackUrl: scryfallBackId
          ? `https://cards.scryfall.io/normal/back/${scryfallBackId[0]}/${scryfallBackId[1]}/${scryfallBackId}.jpg`
          : null,
        isDoubleFaced: !!scryfallBackId,
        identifiers: c.identifiers ?? {},
        count: c.count ?? 1,
      };
    });
    setInitialCards(validatedCards);
    setCards(validatedCards);
    setDeck({
      id: deck.id,
      name: deck.name,
      userId: "user_id" in deck ? deck.user_id : null,
      type: deck.type,
      isUserDeck: "user_id" in deck,
    });
  }, []);

  return null;
}
