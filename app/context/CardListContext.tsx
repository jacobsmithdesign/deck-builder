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

// Smaller land feature object for AI models
export type LandFeatures = {
  mana_pool: {
    W: number;
    U: number;
    B: number;
    R: number;
    G: number;
  };
  signal_lands: Array<{
    name: string;
    count: number;
    tags: string[];
    why: string;
  }>;
};

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

  // difficulty axes
  ai_power_level?: string | null; // 1–10
  ai_complexity?: "Low" | "Medium" | "High" | null;
  ai_pilot_skill?: "Beginner" | "Intermediate" | "Advanced" | null;
  ai_interaction?: "Low" | "Medium" | "High" | null;
  ai_upkeep?: "Low" | "Medium" | "High" | null;

  // short explanations (≤160 chars each)
  ai_power_level_explanation?: string | null;
  ai_complexity_explanation?: string | null;
  ai_pilot_skill_explanation?: string | null;
  ai_interaction_explanation?: string | null;
  ai_upkeep_explanation?: string | null;
};

// AI Archetype Overview
export type ArchetypeOverview = {
  deckId: string;
  archetypes: string[];
  axes: Record<string, number>;
  explanation_md: string;
  updated_at?: string | null;
} | null;

// rest of file unchanged

interface CardListContextType {
  // cards
  cards: CardRecord[];
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

  // land features
  landFeatures: LandFeatures | null;
  setLandFeatures: (features: LandFeatures | null) => void;
  resetLandFeatures: () => void;

  // AI overview
  aiOverview: AiOverview | null;
  setAiOverview: (overview: AiOverview | null) => void;
  resetAiOverview: () => void;
  archetypeOverview: ArchetypeOverview;
  setArchetypeOverview: (v: ArchetypeOverview) => void;
  resetArchetypeOverview: () => void;
}

const CardListContext = createContext<CardListContextType | undefined>(
  undefined
);

export const CardListProvider = ({ children }: { children: ReactNode }) => {
  const [cards, setCardsState] = useState<CardRecord[]>([]);
  const [originalCards, setOriginalCards] = useState<CardRecord[]>([]);
  const [deck, setDeck] = useState<DeckMetadata | null>(null);
  const [deckFeatures, setDeckFeatures] = useState<DeckFeatureVector | null>(
    null
  );
  const [aiOverview, setAiOverviewState] = useState<AiOverview | null>(null);
  const [landFeatures, setLandFeatures] = useState<LandFeatures | null>(null);
  const [archetypeOverview, setArchetypeOverview] =
    useState<ArchetypeOverview>(null);

  // card helpers
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

  const resetLandFeatures = () => setLandFeatures(null);
  // features helpers
  const resetDeckFeatures = () => setDeckFeatures(null);

  // AI overview helpers
  const setAiOverview = (overview: AiOverview | null) =>
    setAiOverviewState(overview);
  const resetAiOverview = () => setAiOverviewState(null);
  // AI Archetype Overview
  const resetArchetypeOverview = () => setArchetypeOverview(null);
  return (
    <CardListContext.Provider
      value={{
        // cards
        cards,
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
        archetypeOverview,
        setArchetypeOverview,
        resetArchetypeOverview,
        // land features
        landFeatures,
        setLandFeatures,
        resetLandFeatures,
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
