"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { CardRecord } from "@/lib/schemas";
import type { DeckFeatureVector } from "@/lib/ai/features";
import { useUser } from "./userContext";

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
  tagline: string | null;
  ai_rank: number | null;
  ai_tags: string[] | null;
  ai_strengths: Record<string, string> | null;
  ai_weaknesses: Record<string, string> | null;
  ai_generated_at: string | null;
  ai_confidence: number | null;
  ai_spec_version: string | null;

  ai_power_level: number | null;
  ai_complexity: string | null;
  ai_pilot_skill: string | null;
  ai_interaction: string | null; // maps from interaction_intensity
  ai_upkeep: string | null; // (no source in new schema → null)

  ai_power_level_explanation: string | null;
  ai_complexity_explanation: string | null;
  ai_pilot_skill_explanation: string | null;
  ai_interaction_explanation: string | null;
  ai_upkeep_explanation: string | null;
};

// AI Archetype Overview
export type ArchetypeOverview = {
  deckId: string;
  axes: Record<string, number>;
  explanation_md: Record<string, string>;
  description: string;
  updated_at?: string | null;
} | null;

export type StrengthsAndWeaknesses = {
  deckId: string;
  strengths: Record<string, string>;
  weaknesses: Record<string, string>;
  updated_at?: string | null;
};

export type Pillars = {
  deckId: string;
  pillars: Record<string, string>;
  updated_at?: string | null;
};

export type Difficulty = {
  deckId: string;
  power_level: number;
  power_level_explanation: string;
  complexity: string;
  complexity_explanation: string;
  pilot_skill: string;
  pilot_skill_explanation: string;
  interaction_intensity: string;
  interaction_intensity_explanation: string;
  updatedAt?: string | null;
};

// rest of file unchanged

interface CardListContextType {
  // cards
  cards: CardRecord[];
  setCards: (cards: CardRecord[]) => void;
  resetCards: () => void;
  addCard: (card: CardRecord) => void;
  removeCard: (card: CardRecord) => void;
  updateCard: (card: CardRecord) => void;

  // deck metadata
  deck: DeckMetadata | null;
  setDeck: (deck: DeckMetadata) => void;
  userOwnsDeck: boolean;

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
  strengthsAndWeaknesses: StrengthsAndWeaknesses;
  setStrengthsAndWeaknesses: (v: StrengthsAndWeaknesses) => void;
  pillars: Pillars;
  setPillars: (v: Pillars) => void;
  difficulty: Difficulty;
  setDifficulty: (v: Difficulty) => void;
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
  const { profile } = useUser();
  // States for AI overviews
  const [archetypeOverview, setArchetypeOverview] =
    useState<ArchetypeOverview>(null);
  const [strengthsAndWeaknesses, setStrengthsAndWeaknesses] =
    useState<StrengthsAndWeaknesses>(null);
  const [pillars, setPillars] = useState<Pillars>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(null);

  // derive ownership from user profile and deck userId
  const userId = (profile as any)?.id || null;
  const userOwnsDeck = !!deck && !!userId && deck.userId === userId;

  // card helpers
  const setCards = (newCards: CardRecord[]) => setCardsState(newCards);
  const addCard = (card: CardRecord) =>
    setCardsState((prev) => [...prev, card]);
  const removeCard = (card: CardRecord) => {
    setCardsState((prev) => prev.filter((c) => c !== card));
  };
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
        userOwnsDeck,
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
        strengthsAndWeaknesses,
        setStrengthsAndWeaknesses,
        pillars,
        setPillars,
        difficulty,
        setDifficulty,
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
