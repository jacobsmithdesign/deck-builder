"use client";

import { createContext, useContext, useState, ReactNode } from "react";

import { CardRecord } from "@/lib/schemas";
export interface Card {
  id: string;
  name: string;
  type: string;
  mana_cost: string | null;
  colorIdentity: string[];
  cmc: number;
  text: string;
  flavourText: string | null;
  board_section: string;
  imageFrontUrl: string | null;
  imageBackUrl: string | null;
  isDoubleFaced: boolean;
  identifiers: Record<string, any>;
  count: number;
}

export interface DeckMetadata {
  id: string;
  name: string;
  userId?: string | null;
  type?: string;
  isUserDeck: boolean;
  code?: string | null;
  release_date?: string | null;
  sealed_product?: string | null;
  commander_uuid?: string | null;
  display_card_uuid?: string | null;
}

interface CardListContextType {
  cards: CardRecord[];
  setInitialCards: (cards: CardRecord[]) => void;
  setCards: (cards: CardRecord[]) => void;
  resetCards: () => void;
  addCard: (card: CardRecord) => void;
  removeCard: (cardId: string) => void;
  updateCard: (card: CardRecord) => void;

  deck: DeckMetadata | null;
  setDeck: (deck: DeckMetadata) => void;
}

const CardListContext = createContext<CardListContextType | undefined>(
  undefined
);

export const CardListProvider = ({ children }: { children: ReactNode }) => {
  const [cards, setCardsState] = useState<CardRecord[]>([]);
  const [deck, setDeck] = useState<DeckMetadata | null>(null);
  const [originalCards, setOriginalCards] = useState<CardRecord[]>([]); // optional

  const setInitialCards = (cards: CardRecord[]) => {
    setOriginalCards(cards); // save a snapshot for cancelling
  };
  const setCards = (newCards: CardRecord[]) => setCardsState(newCards);

  const addCard = (card: CardRecord) => {
    setCardsState((prev) => [...prev, card]);
  };

  const removeCard = (cardId: string) => {
    setCardsState((prev) => prev.filter((c) => c.uuid !== cardId));
  };
  const resetCards = () => {
    setCards(originalCards);
  };
  const updateCard = (updated: Card) => {
    setCardsState((prev) =>
      prev.map((c) => (c.uuid === updated.id ? updated : c))
    );
  };

  return (
    <CardListContext.Provider
      value={{
        cards,
        setInitialCards,
        setCards,
        resetCards,
        addCard,
        removeCard,
        updateCard,
        deck,
        setDeck,
      }}
    >
      {children}
    </CardListContext.Provider>
  );
};

export const useCardList = () => {
  const context = useContext(CardListContext);
  if (!context)
    throw new Error("useCardList must be used within CardListProvider");
  return context;
};
