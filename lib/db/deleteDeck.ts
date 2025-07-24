import { supabase } from "@/lib/supabase/client";

/**
 * Deletes a user deck and its associated cards from the database.
 * @param userDeckId UUID of the user_deck to delete.
 * @returns Promise<void>
 */
export const deleteUserDeck = async (userDeckId: string): Promise<void> => {
  const { error } = await supabase
    .from("user_decks")
    .delete()
    .eq("id", userDeckId);

  if (error) {
    throw new Error(`Failed to delete deck: ${error.message}`);
  }
};
