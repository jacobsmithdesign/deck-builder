import { useCardList } from "@/app/context/CardListContext";
import { CommanderCard } from "@/app/context/CommanderContext";
import { supabase } from "@/lib/supabase/client";
import { CardRecord } from "../schemas";

function toCommanderCard(card: any): CommanderCard {
  return {
    uuid: card.uuid,
    name: card.name,
    type: card.type,
    mana_cost: card.mana_cost,
    colorIdentity: card.color_identity,
    cmc: card.converted_mana_cost ?? card.mana_value ?? null,
    text: card.text,
    identifiers: card.identifiers,
    imageFrontUrl: card?.identifiers?.scryfallId
      ? `https://cards.scryfall.io/normal/front/${card.identifiers.scryfallId[0]}/${card.identifiers.scryfallId[1]}/${card.identifiers.scryfallId}.jpg`
      : null,
    artwork: card?.identifiers?.scryfallId
      ? `https://cards.scryfall.io/art_crop/front/${card.identifiers.scryfallId[0]}/${card.identifiers.scryfallId[1]}/${card.identifiers.scryfallId}.jpg`
      : null,
    isDoubleFaced: !!card.identifiers?.scryfallCardBackId,
    count: 1,
  };
}
export type CardResult = {
  uuid: string;
  name: string;
};
function toCardResult(card: any, deckId: string): CardResult {
  return {
    uuid: card.uuid,
    name: card.name,
  };
}

/**
 * Searches for cards from the database by name.
 * @param searchTerm User input for card name
 * @returns Array of cards
 */
export async function searchCardForDeck(
  searchTerm: string,
): Promise<CardResult[]> {
  const q = (searchTerm ?? "").trim();
  if (!q) return [];

  const { data, error } = await supabase.rpc("search_card_idx", {
    _q: q,
  });

  if (error) {
    console.error("search_single_card error:", error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    uuid: row.uuid,
    name: row.name,
  }));
}

const CARDS_SELECT =
  "uuid, name, mana_cost, mana_value, type, text, flavor_text, rarity, identifiers, color_identity, types";

function rowToCardRecord(row: {
  uuid: string;
  name: string;
  type: string | null;
  mana_cost: string | null;
  mana_value: number | null;
  text: string | null;
  flavor_text: string | null;
  rarity: string | null;
  identifiers: Record<string, string> | null;
  color_identity: string[] | null;
  types: string[] | null;
}): CardRecord {
  const identifiers = row.identifiers ?? {};
  const scryfallId = identifiers.scryfallId ?? null;
  const scryfallBackId = identifiers.scryfallCardBackId ?? null;
  return {
    uuid: row.uuid,
    name: row.name,
    type: row.type,
    mana_cost: row.mana_cost,
    colorIdentity: row.color_identity ?? [],
    cmc: row.mana_value ?? 0,
    text: row.text ?? "",
    flavourText: row.flavor_text,
    rarity: row.rarity,
    count: 1,
    board_section: "mainboard",
    imageFrontUrl: scryfallId
      ? `https://cards.scryfall.io/normal/front/${scryfallId[0]}/${scryfallId[1]}/${scryfallId}.jpg`
      : null,
    imageBackUrl: scryfallBackId
      ? `https://cards.scryfall.io/normal/front/${scryfallBackId.slice(
          0,
          2,
        )}/${scryfallBackId}.jpg`
      : null,
    isDoubleFaced: !!scryfallBackId,
    identifiers,
  } as CardRecord;
}

export async function selectCardDataFromId(id: string): Promise<CardRecord> {
  const { data, error } = await supabase
    .from("cards")
    .select(CARDS_SELECT)
    .eq("uuid", id)
    .single();

  if (error) throw error;
  return rowToCardRecord(data);
}

/** Max UUIDs per request to avoid URL/query size limits. */
const BATCH_SIZE = 150;

/**
 * Fetch full card data for many UUIDs in one or few requests.
 * Returns a Map from uuid to CardRecord; missing/failed UUIDs are omitted.
 */
export async function selectCardsDataFromIds(
  ids: string[],
): Promise<Map<string, CardRecord>> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return new Map();

  const map = new Map<string, CardRecord>();
  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const chunk = unique.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from("cards")
      .select(CARDS_SELECT)
      .in("uuid", chunk);

    if (error) {
      console.error("selectCardsDataFromIds chunk error:", error);
      continue;
    }
    for (const row of data ?? []) {
      map.set(row.uuid, rowToCardRecord(row));
    }
  }
  return map;
}

/**
 * Fetches all public decks that use the given commander UUID.
 * @param commanderUuid UUID of the selected commander card
 * @returns Array of decks associated with the commander
 */
export const getCommanderDecks = async (commanderUuid: string) => {
  const { data, error } = await supabase
    .from("decks")
    .select("*")
    .eq("commander_uuid", commanderUuid)
    .eq("is_public", true);

  if (error) {
    console.error("Error fetching decks for commander:", error.message);
    return [];
  }

  return data ?? [];
};
