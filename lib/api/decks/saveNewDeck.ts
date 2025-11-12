import { v4 as uuidv4 } from "uuid";
import { createServerSupabase } from "@/lib/supabase/server";

type SaveDeckArgs = {
  name: string;
  type: string;
  commander_uuid?: string;
  display_card_uuid?: string;
  description: string;
  isPublic: boolean;
  cards: Array<{
    card_uuid: string;
    count: number;
    board_section: string; // "mainboard" | "sideboard" etc
  }>;
};

export async function saveNewDeckOnServer({
  name,
  type,
  commander_uuid,
  display_card_uuid,
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

  const newDeckId = uuidv4();

  // Step 2: Insert the new user deck
  const { error: insertDeckError } = await supabase.from("decks").insert({
    id: newDeckId,
    name: name,
    type: type,
    commander_uuid: commander_uuid,
    display_card_uuid: display_card_uuid,
    user_id: user.id,
    is_public: isPublic,
    description,
  });

  if (insertDeckError) {
    throw new Error(insertDeckError.message);
  }

  // Step 3: Add the commander if applicable

  // Step 4: Insert new cards into deck
  if (cards.length > 0) {
    const payload = cards.map((c) => ({
      deck_id: newDeckId,
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
  return { newDeckId };
}
