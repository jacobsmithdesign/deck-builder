import { CommanderCard } from "@/app/context/CommanderContext";
import { supabase } from "@/lib/supabase/client";

function toCommanderCard(card: any): CommanderCard {
  return {
    id: card.uuid,
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
  };
}

/**
 * Searches for commander-eligible cards from the database by name.
 * @param searchTerm User input for commander name
 * @param id id for commander
 * @returns Array of commander card objects (uuid, name)
 */
export async function searchCommander(
  searchTerm?: string,
  id?: string
): Promise<CommanderCard[]> {
  const q = (searchTerm ?? "").trim();

  // 1) Direct UUID lookup if explicit id provided
  if (id?.trim()) {
    const { data, error } = await supabase
      .from("cards")
      .select(
        "uuid, name, type, mana_cost, mana_value, converted_mana_cost, text, identifiers, color_identity"
      )
      .eq("uuid", id.trim())
      .maybeSingle();

    if (error) {
      console.error("cards by uuid error:", error.message);
      return [];
    }
    return data ? [toCommanderCard(data)] : [];
  }

  // 2) Fallback: name search via RPC
  if (!q) return [];
  const { data, error } = await supabase.rpc("search_commanders", {
    q,
    lim: 20,
  });

  if (error) {
    console.error("search_commanders error:", error.message);
    return [];
  }

  return (data ?? []).map(toCommanderCard);
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
