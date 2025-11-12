import { supabase } from "@/lib/supabase/client";
import { CardRecord } from "@/lib/schemas";

// All known filters and their Supabase column mappings
type FilterKey = "type" | "colorIdentity" | "rarity" | "manaCost" | "keywords";

export interface CardSearchFilters {
  type?: string;
  name?: string;
  colorIdentity?: string[];
  rarity?: string;
  manaCost?: number;
  keywords?: string[];
  page?: number;
  pageSize?: number;
  [key: string]: any; // allow future dynamic filters
}

export async function searchCardsWithFilters({
  page = 0,
  pageSize = 30,
  debug = false,
  commanderColors = [],
  ...filters
}: CardSearchFilters & { debug?: boolean }): Promise<CardRecord[]> {
  let query = supabase.from("distinct_cards_by_name").select("*");
  filters.commanderColors = commanderColors;
  // Apply filters dynamically
  for (const key in filters) {
    const value = filters[key];

    if (value === undefined || value === null) continue;

    switch (key) {
      case "type":
        query = query.ilike("type", `%${value}%`);
        break;
      case "colorIdentity":
        if (Array.isArray(value)) {
          const sortedValue = [...value].sort(); // fix the order because db color_identity is stored in alphabetical order
          console.log(value);
          if (sortedValue.length > 0) {
            const arrayLiteral = `{${sortedValue.join(",")}}`; // ← convert to Postgres array format
            query = query.filter("color_identity", "eq", arrayLiteral);
          }
        }
        break;

      case "commanderColors":
        if (
          (!filters.colorIdentity || filters.colorIdentity.length === 0) &&
          Array.isArray(commanderColors) &&
          value.length > 0
        ) {
          const sortedCommanderColors = [...commanderColors].sort();
          const arrayLiteral = `{${sortedCommanderColors.join(",")}}`;
          console.log("arrayLiteral:", arrayLiteral);
          query = query.filter("color_identity", "cd", arrayLiteral);
          console.log("No colours selected — fallback to commanderColors");
        }
        break;
      case "rarity":
        query = query.eq("rarity", value);
        break;
      case "manaCost":
        query = query.eq("mana_value", value);
        break;
      case "keywords":
        if (Array.isArray(value) && value.length) {
          query = query.overlaps("keywords", value);
        }
        break;
      default:
        console.warn(`Unhandled filter key: ${key}`);
        break;
    }
  }
  query = query.order("edhrec_rank", { ascending: true });
  query = query.range(page * pageSize, page * pageSize + pageSize - 1);
  console.log("Search filters:", {
    ...filters,
  });

  const { data, error } = await query;

  console.log("Filtered card data: ", data);
  if (error) {
    console.error("Card search error:", error);
    return [];
  }

  // Now safe to map over result
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
