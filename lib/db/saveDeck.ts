// lib/db/saveDeck.ts
import { supabase } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";

export async function handleSave({
  profileId,
  preconDeckId,
  name,
  description,
  isPublic,
}: {
  profileId: string | undefined;
  preconDeckId: string;
  name: string;
  description: string;
  isPublic: boolean;
}) {
  if (!profileId) {
    return { success: false, error: "Missing profile ID" };
  }

  // Step 1: Get the precon deck and its cards
  const { data: preconDeck, error: deckError } = await supabase
    .from("decks")
    .select("*, deck_cards(*)")
    .eq("id", preconDeckId)
    .single();

  if (deckError || !preconDeck) {
    return {
      success: false,
      error: deckError?.message ?? "Precon deck not found",
    };
  }

  const newDeckId = uuidv4();

  // Step 2: Insert the new user deck
  const { error: insertDeckError } = await supabase.from("decks").insert({
    id: newDeckId,
    name,
    type: preconDeck.type,
    code: preconDeck.code,
    release_date: preconDeck.release_date,
    sealed_product: preconDeck.sealed_product,
    commander_uuid: preconDeck.commander_uuid,
    display_card_uuid: preconDeck.display_card_uuid,
    user_id: profileId,
    is_public: isPublic,
    description,
    original_deck_id: preconDeckId,
  });

  if (insertDeckError) {
    return { success: false, error: insertDeckError.message };
  }

  // Step 3: Copy over the deck_cards entries
  const newDeckCards = preconDeck.deck_cards.map((card: any) => ({
    deck_id: newDeckId,
    card_uuid: card.card_uuid,
    count: card.count,
    board_section: card.board_section ?? "mainboard",
  }));

  const { error: cardInsertError } = await supabase
    .from("deck_cards")
    .insert(newDeckCards);

  if (cardInsertError) {
    return { success: false, error: cardInsertError.message };
  }

  return { success: true, newDeckId };
}
