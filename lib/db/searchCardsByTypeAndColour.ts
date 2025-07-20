import { supabase } from "@/lib/supabaseClient";
import { CardRecord } from "@/lib/schemas";

// Input filters for card search
interface CardSearchFilters {
  type: string;
  colorIdentity: string[];
  page?: number;
  pageSize?: number;
}

// Fetch cards from the stored procedure, already deduplicated server-side
export async function searchCardsByTypeAndColor({
  type,
  colorIdentity,
  page = 0,
  pageSize = 30,
}: CardSearchFilters): Promise<CardRecord[]> {
  if (!type || !colorIdentity?.length) {
    throw new Error("Missing required filters: type and colorIdentity");
  }
  console.log("searching with params: ", type, colorIdentity);
  const { data, error } = await supabase.rpc(
    "get_unique_cards_by_type_and_color",
    {
      card_type: type,
      colors: colorIdentity,
      limit_count: pageSize,
      offset_count: page * pageSize,
    }
  );
  console.log("uuhnmm");
  if (error) {
    console.error("Error fetching cards:", error.message);
    return [];
  }
  console.log("new card search data: ", data);
  // Map returned cards into CardRecord format
  return (data ?? []).map((card) => {
    const identifiers = card.identifiers ?? {};
    const scryfallId = identifiers.scryfallId ?? null;
    const scryfallBackId = identifiers.scryfallCardBackId ?? null;

    return {
      uuid: card.uuid,
      name: card.name,
      type: card.type,
      mana_cost: card.mana_cost,
      colorIdentity: card.color_identity ?? [],
      cmc: card.mana_value ?? 0,
      text: card.text ?? "",
      flavourText: card.flavor_text,
      rarity: card.rarity,
      count: 1,
      board_section: "mainboard",
      imageFrontUrl: scryfallId
        ? `https://cards.scryfall.io/normal/front/${scryfallId[0]}/${scryfallId[1]}/${scryfallId}.jpg`
        : null,
      imageBackUrl: scryfallBackId
        ? `https://cards.scryfall.io/normal/front/${scryfallBackId.slice(
            0,
            2
          )}/${scryfallBackId}.jpg`
        : null,
      isDoubleFaced: !!scryfallBackId,
      identifiers,
    };
  });
}
