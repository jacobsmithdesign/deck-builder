"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface Card {
  id: string;
  name: string;
  type: string;
  manaCost: string | null;
  colorIdentity: string[];
  cmc: number;
  oracleText: string;
  flavourText: string | null;
  imageUrl: string | null;
  count: number;
}

export interface DeckMetadata {
  id: string;
  name: string;
  userId?: string | null;
  type?: string;
  isUserDeck: boolean;
}

interface CardListContextType {
  cards: Card[];
  setCards: (cards: Card[]) => void;
  addCard: (card: Card) => void;
  removeCard: (cardId: string) => void;
  updateCard: (card: Card) => void;

  deck: DeckMetadata | null;
  setDeck: (deck: DeckMetadata) => void;
}

const CardListContext = createContext<CardListContextType | undefined>(
  undefined
);

export const CardListProvider = ({ children }: { children: ReactNode }) => {
  const [cards, setCardsState] = useState<Card[]>([]);
  const [deck, setDeck] = useState<DeckMetadata | null>(null);

  const setCards = (newCards: Card[]) => setCardsState(newCards);

  const addCard = (card: Card) => {
    setCardsState((prev) => [...prev, card]);
  };

  const removeCard = (cardId: string) => {
    setCardsState((prev) => prev.filter((c) => c.id !== cardId));
  };

  const updateCard = (updated: Card) => {
    setCardsState((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  };

  return (
    <CardListContext.Provider
      value={{
        cards,
        setCards,
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
