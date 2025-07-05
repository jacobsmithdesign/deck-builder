import { supabase } from "@/lib/supabaseClient";

export async function fetchDeckById(deckId: string) {
  if (!deckId) throw new Error("Missing deck ID");

  // Try user_decks first
  const { data: userDeck, error: userError } = await supabase
    .from("user_decks")
    .select("*, user_deck_cards(*)")
    .eq("id", deckId)
    .single();

  if (userDeck && !userError) {
    return {
      source: "user",
      deck: {
        id: userDeck.id,
        user_id: userDeck.user_id,
        name: userDeck.deck_name,
        type: userDeck.type,
        isUserDeck: true,
        cards: userDeck.user_deck_cards.map((c: any) => ({
          id: c.card_uuid,
          name: c.name,
          type: c.type,
          manaCost: c.mana_cost,
          colorIdentity: c.color_identity,
          cmc: c.mana_value,
          oracleText: c.text,
          imageUrl: c.image_url ?? null,
          count: c.count || 1,
        })),
      },
    };
  }

  // Try official decks
  const { data: preconDeck, error: preconError } = await supabase
    .from("decks")
    .select("*, deck_cards(*)")
    .eq("id", deckId)
    .single();

  if (preconDeck && !preconError) {
    return {
      source: "official",
      deck: {
        id: preconDeck.id,
        name: preconDeck.name,
        type: preconDeck.type,
        isUserDeck: false,
        cards: preconDeck.deck_cards.map((c: any) => ({
          id: c.card_uuid,
          name: c.name,
          type: c.type,
          manaCost: c.mana_cost,
          colorIdentity: c.color_identity,
          cmc: c.mana_value,
          oracleText: c.text,
          imageUrl: c.image_url ?? null,
          count: c.count || 1,
        })),
      },
    };
  }

  throw new Error("Deck not found");
}
