import { supabase } from "@/lib/supabaseClient";

export async function fetchDeckById(deckId: string) {
  if (!deckId) throw new Error("Missing deck ID");

  const { data: deckData, error } = await supabase
    .from("decks")
    .select("*, deck_cards(*, cards(*))")
    .eq("id", deckId)
    .single();

  if (deckData && !error) {
    const isUserDeck = !!deckData.user_id;

    return {
      source: isUserDeck ? "user" : "official",
      deck: {
        id: deckData.id,
        user_id: deckData.user_id ?? null,
        name: deckData.name,
        code: deckData.code ?? null,
        type: deckData.type,
        release_date: deckData.release_date ?? null,
        sealed_product: deckData.sealed_product ?? null,
        isUserDeck,
        display_card_uuid: deckData.display_card_uuid ?? null,
        commander_uuid: deckData.commander_uuid ?? null,
        cards: deckData.deck_cards.map((c: any) => {
          const card = c.cards;
          const identifiers = card.identifiers ?? {};
          const scryfallId = identifiers.scryfallId ?? null;
          const scryfallBackId = identifiers.scryfallCardBackId ?? null;

          return {
            id: card.uuid,
            name: card.name,
            type: card.type,
            manaCost: card.mana_cost,
            colorIdentity: card.color_identity ?? [],
            cmc: card.mana_value ?? 0,
            oracleText: card.oracle_text ?? "",
            flavourText: card.flavor_text,
            setCode: card.set_code,
            rarity: card.rarity,
            count: c.count || 1,
            board_section: c.board_section || "mainboard",
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
        }),
      },
    };
  }

  throw new Error("Deck not found");
}
