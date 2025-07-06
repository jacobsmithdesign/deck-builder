"use client";

import { useEffect } from "react";
import { useCardList } from "@/app/context/CardListContext";
import { DeckRecord, CardRecord } from "@/lib/schemas";

type DeckWithCards = DeckRecord & {
  cards: (CardRecord & { count: number; board_section: string })[];
};

// This component initialises the card list and deck details upon first visiting a deck page.
// It validates the card data and sets it in the context.
export default function InitialiseDeck({ deck }: { deck: DeckWithCards }) {
  const { setCards, setDeck } = useCardList();

  console.log(
    "Cards initialised: ",
    deck.cards.map((c) => ({
      name: c.name,
      id: c.uuid,
      scryfallId: c.identifiers?.scryfallId,
    }))
  );
  useEffect(() => {
    const validatedCards = deck.cards.map((c) => {
      const scryfallId = c.identifiers.scryfallId;
      const scryfallBackId = c.identifiers?.scryfallCardBackId ?? null;

      return {
        id: c.uuid ?? crypto.randomUUID(),
        name: c.name ?? "Unknown",
        type: c.type ?? "Unknown",
        manaCost: c.mana_cost ?? null,
        colorIdentity: c.color_identity ?? [],
        cmc: c.converted_mana_cost ?? 0,
        oracleText: c.text ?? "",
        flavourText: c.flavor_text ?? null,
        board_section: c.board_section ?? "mainboard",
        imageFrontUrl: scryfallId
          ? `https://cards.scryfall.io/normal/front/${scryfallId[0]}/${scryfallId[1]}/${scryfallId}.jpg`
          : null,
        imageBackUrl: scryfallBackId
          ? `https://cards.scryfall.io/normal/back/${scryfallBackId[0]}/${scryfallBackId[1]}/${scryfallBackId}.jpg`
          : null,
        isDoubleFaced: !!scryfallBackId,
        identifiers: c.identifiers ?? {},
        count: c.count ?? 1,
      };
    });

    setCards(validatedCards);
    console.log("Initialised deck with cards:", validatedCards);
    setDeck({
      id: deck.id,
      name: deck.name,
      userId: "user_id" in deck ? deck.user_id : null,
      type: deck.type,
      isUserDeck: "user_id" in deck,
    });
  }, []);

  return null;
}
