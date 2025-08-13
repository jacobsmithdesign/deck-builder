"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { CardRecord } from "@/lib/schemas";
import type { DeckFeatureVector } from "@/lib/ai/features";

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

// AI overview payload we store in context
export type AiOverview = {
  tagline?: string | null;
  ai_rank?: string[] | null;
  ai_tags?: string[] | null;
  ai_strengths?: string[] | null;
  ai_weaknesses?: string[] | null;
  ai_generated_at: string | null;
  ai_confidence?: number | null;
  ai_spec_version?: string | null;
  ai_power_level?: number | null; // 1–10
  ai_complexity?: string | null; // "Low" | "Medium" | "High"
  ai_pilot_skill?: string | null; // "Beginner" | "Intermediate" | "Advanced"
  ai_interaction?: string | null; // "Low" | "Medium" | "High"
};

interface CardListContextType {
  // cards
  cards: CardRecord[];
  setInitialCards: (cards: CardRecord[]) => void;
  setCards: (cards: CardRecord[]) => void;
  resetCards: () => void;
  addCard: (card: CardRecord) => void;
  removeCard: (cardUuid: string) => void;
  updateCard: (card: CardRecord) => void;

  // deck metadata
  deck: DeckMetadata | null;
  setDeck: (deck: DeckMetadata) => void;

  // features
  deckFeatures: DeckFeatureVector | null;
  setDeckFeatures: (features: DeckFeatureVector | null) => void;
  resetDeckFeatures: () => void;

  // AI overview
  aiOverview: AiOverview | null;
  setAiOverview: (overview: AiOverview | null) => void;
  resetAiOverview: () => void;
}

const CardListContext = createContext<CardListContextType | undefined>(
  undefined
);

export const CardListProvider = ({ children }: { children: ReactNode }) => {
  // cards
  const [cards, setCardsState] = useState<CardRecord[]>([]);
  const [originalCards, setOriginalCards] = useState<CardRecord[]>([]);

  // deck
  const [deck, setDeck] = useState<DeckMetadata | null>(null);

  // features
  const [deckFeatures, setDeckFeatures] = useState<DeckFeatureVector | null>(
    null
  );

  // AI overview
  const [aiOverview, setAiOverviewState] = useState<AiOverview | null>(null);

  // card helpers
  const setInitialCards = (initial: CardRecord[]) => setOriginalCards(initial);
  const setCards = (newCards: CardRecord[]) => setCardsState(newCards);
  const addCard = (card: CardRecord) =>
    setCardsState((prev) => [...prev, card]);
  const removeCard = (cardUuid: string) =>
    setCardsState((prev) => prev.filter((c) => c.uuid !== cardUuid));
  const resetCards = () => setCardsState(originalCards);
  const updateCard = (updated: CardRecord) =>
    setCardsState((prev) =>
      prev.map((c) => (c.uuid === updated.uuid ? updated : c))
    );

  // features helpers
  const resetDeckFeatures = () => setDeckFeatures(null);

  // AI overview helpers
  const setAiOverview = (overview: AiOverview | null) =>
    setAiOverviewState(overview);
  const resetAiOverview = () => setAiOverviewState(null);

  return (
    <CardListContext.Provider
      value={{
        // cards
        cards,
        setInitialCards,
        setCards,
        resetCards,
        addCard,
        removeCard,
        updateCard,
        // deck
        deck,
        setDeck,
        // features
        deckFeatures,
        setDeckFeatures,
        resetDeckFeatures,
        // AI
        aiOverview,
        setAiOverview,
        resetAiOverview,
      }}
    >
      {children}
    </CardListContext.Provider>
  );
};

export const useCardList = () => {
  const ctx = useContext(CardListContext);
  if (!ctx) throw new Error("useCardList must be used within CardListProvider");
  return ctx;
};
