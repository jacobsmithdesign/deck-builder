import { v4 as uuidv4 } from "uuid";
import { createServerSupabase } from "@/lib/supabase/server";

type SaveDeckArgs = {
  deckId: string;
  name: string;
  description: string;
  isPublic: boolean;
  cards: Array<{
    card_uuid: string;
    count: number;
    board_section: string; // "mainboard" | "sideboard" etc
  }>;
};

export async function saveDeckOnServer({
  deckId,
  name,
  description,
  isPublic,
  cards,
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
  const { data: deckData, error: deckError } = await supabase
    .from("decks")
    .select("*")
    .eq("id", deckId)
    .single();

  if (deckError || !deckData) {
    throw new Error(deckError?.message ?? "Deck not found");
  }

  if (deckData.user_id !== user.id) {
    throw new Error("Forbidden: you do not own this deck");
  }

  // Step 2: Insert the new user deck
  const { error: upsertDeckError } = await supabase.from("decks").upsert({
    name,
    commander_uuid: deckData.commander_uuid,
    display_card_uuid: deckData.display_card_uuid,
    is_public: isPublic,
    description,
  });

  if (upsertDeckError) {
    throw new Error(upsertDeckError.message);
  }

  // Step 3: Delete existing cards from deck.
  const { error: deleteError } = await supabase
    .from("deck_cards")
    .delete()
    .eq("deck_id", deckId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  // Step 4: Insert new cards into deck
  if (cards.length > 0) {
    const payload = cards.map((c) => ({
      deck_id: deckId,
      card_uuid: c.card_uuid,
      count: c.count,
      board_section: c.board_section ?? "mainboard",
    }));

    const { error: insertCardsError } = await supabase
      .from("deck_cards")
      .insert(payload);

    if (insertCardsError) {
      // if you want to be fancy you can attempt rollback here
      throw new Error(insertCardsError.message);
    }
  }
  return { deckId };
}
