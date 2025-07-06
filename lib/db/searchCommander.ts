import { supabase } from "@/lib/supabaseClient";

/**
 * Searches for commander-eligible cards from the database by name.
 * @param searchTerm User input for commander name
 * @returns Array of commander card objects (uuid, name)
 */
export const searchCommander = async (searchTerm: string) => {
  const { data, error } = await supabase
    .from("cards")
    .select("uuid, name")
    .ilike("name", `%${searchTerm}%`)
    .ilike("type", "%Legendary%Creature%");

  if (error) {
    console.error("Supabase error:", error.message);
    return [];
  }

  if (!data || data.length === 0) {
    console.warn("No cards found for:", searchTerm);
    return [];
  }

  const uniqueNames = new Map();
  for (const card of data) {
    if (!uniqueNames.has(card.name)) {
      uniqueNames.set(card.name, card);
    }
  }
  return [...uniqueNames.values()];
};

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
