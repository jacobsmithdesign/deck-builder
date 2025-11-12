import { v4 as uuidv4 } from "uuid";
import { createServerSupabase } from "@/lib/supabase/server";

type SaveDeckArgs = {
  existingDeckId: string;
  name: string;
  description: string;
  isPublic: boolean;
};

export async function addToCollectionOnServer({
  existingDeckId,
  name,
  description,
  isPublic,
}: SaveDeckArgs) {
  const supabase = await createServerSupabase();

  // Get the authed user (server-side, via cookies)
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    throw new Error("Unauthenticated");
  }

  // Step 1: Get the precon deck and its cards
  const { data: preconDeck, error: deckError } = await supabase
    .from("decks")
    .select("*, deck_cards(*)")
    .eq("id", existingDeckId)
    .single();

  if (deckError || !preconDeck) {
    throw new Error(deckError?.message ?? "Precon deck not found");
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
    user_id: user.id,
    is_public: isPublic,
    description,
    original_deck_id: existingDeckId,
  });

  if (insertDeckError) {
    throw new Error(insertDeckError.message);
  }

  // Step 3: Copy over the deck_cards entries
  const newDeckCards = (preconDeck.deck_cards ?? []).map((card: any) => ({
    deck_id: newDeckId,
    card_uuid: card.card_uuid,
    count: card.count,
    board_section: card.board_section ?? "mainboard",
  }));

  if (newDeckCards.length > 0) {
    const { error: cardInsertError } = await supabase
      .from("deck_cards")
      .insert(newDeckCards);

    if (cardInsertError) {
      // (Optional) attempt to roll back deck insert here if you want to be neat
      throw new Error(cardInsertError.message);
    }
  }

  return { newDeckId };
}
