import { CommanderCard } from "@/app/context/CommanderContext";
import { supabase } from "@/lib/supabase/client";

/**
 * Searches for commander-eligible cards from the database by name.
 * @param searchTerm User input for commander name
 * @returns Array of commander card objects (uuid, name)
 */
export async function searchCommander(
  searchTerm: string
): Promise<CommanderCard[]> {
  const q = searchTerm.trim();
  if (!q) return [];

  const { data, error } = await supabase.rpc("search_commanders", {
    q,
    lim: 24, // tweak as you like
  });

  if (error) {
    console.error("search_commanders error:", error.message);
    return [];
  }
  if (!data) return [];

  return data.map((card: any) => ({
    id: card.uuid,
    name: card.name,
    type: card.type,
    mana_cost: card.mana_cost,
    colorIdentity: card.color_identity,
    cmc: card.converted_mana_cost ?? card.mana_value ?? null,
    text: card.text,
    identifiers: card.identifiers,
    imageFrontUrl: `https://cards.scryfall.io/normal/front/${card.identifiers.scryfallId[0]}/${card.identifiers.scryfallId[1]}/${card.identifiers.scryfallId}.jpg`,
    artwork: `https://cards.scryfall.io/art_crop/front/${card.identifiers.scryfallId[0]}/${card.identifiers.scryfallId[1]}/${card.identifiers.scryfallId}.jpg`,
    isDoubleFaced: !!card.identifiers?.scryfallCardBackId,
  }));
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
