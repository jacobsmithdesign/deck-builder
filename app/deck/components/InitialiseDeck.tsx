"use client";

import { useEffect } from "react";
import { useCardList } from "@/app/context/CardListContext";
import { Deck, UserDeck } from "@/lib/schemas";

// This component initialises the card list and deck details upon first visiting a deck page.
// It validates the card data and sets it in the context.
export default function InitialiseDeck({ deck }: { deck: Deck | UserDeck }) {
  const { setCards, setDeck } = useCardList();

  useEffect(() => {
    const validatedCards = deck?.cards.map((c) => ({
      id: c.id ?? crypto.randomUUID(), // fallback if somehow missing
      name: c.name ?? "Unknown",
      type: c.type ?? "Unknown",
      manaCost: c.manaCost ?? null,
      colorIdentity: c.colorIdentity ?? [],
      cmc: c.cmc ?? 0,
      oracleText: c.oracleText ?? "",
      flavourText: c.flavourText ?? null,
      imageUrl: c.imageUrl ?? null,
      count: c.count ?? 1,
    }));

    setCards(validatedCards);

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
