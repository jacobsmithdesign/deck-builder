"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { CardRecord } from "@/lib/schemas";
import type { DeckFeatureVector } from "@/lib/ai/features";
import { useUser } from "./userContext";
import { useEditMode } from "./editModeContext";

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
type ChangesMade = {
  card: CardRecord;
  countChange: number;
};

interface CardListContextType {
  // cards
  cards: CardRecord[];
  changesMadeState?: ChangesMade[];
  setChangesMadeState: (changes: ChangesMade[]) => void;
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
  const [changesMadeState, setChangesMadeState] = useState<ChangesMade[]>([]);
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
  const setCards = (newCards: CardRecord[]) => {
    setCardsState(newCards);
    setOriginalCards(newCards);
  };

  // Helper to compute updated cards
  function buildUpdatedCards(
    originalCards: CardRecord[],
    changesMadeState: ChangesMade[]
  ): CardRecord[] {
    // Always copy so we don't mutate originalCards
    let updatedCards = [...originalCards];

    changesMadeState.forEach(({ card, countChange }) => {
      const idx = updatedCards.findIndex((c) => c.uuid === card.uuid);

      if (idx !== -1) {
        const newCount = updatedCards[idx].count + countChange;

        if (newCount <= 0) {
          // Remove the card
          updatedCards = updatedCards.filter((c) => c.uuid !== card.uuid);
        } else {
          // Update the count
          updatedCards[idx] = { ...updatedCards[idx], count: newCount };
        }
      } else if (countChange > 0) {
        // Card not present yet, add it
        updatedCards = [...updatedCards, { ...card, count: countChange }];
      }
    });

    return updatedCards;
  }

  // Run this whenever changesMadeState or originalCards changes
  useEffect(() => {
    setCardsState(buildUpdatedCards(originalCards, changesMadeState));
  }, [originalCards, changesMadeState]);

  useEffect(() => {
    if (changesMadeState.length === 0) {
      setCardsState(originalCards);
    }
  }, [changesMadeState]);

  // The addCard and removeCard functions update the changesMadeState, then the useEffect runs every time
  // changesMadeState is updated to recalculate the cardsState.
  const addCard = (card: CardRecord) => {
    setChangesMadeState((prev) => {
      const idx = prev.findIndex((c) => c.card.uuid === card.uuid);

      if (idx !== -1) {
        let updated = [...prev];
        console.log("updated cards", updated);
        updated = updated.map((c) =>
          c.card.uuid === card.uuid
            ? { ...c, countChange: c.countChange + 1 }
            : c
        );
        if (updated[idx].countChange === 0) {
          // If countChange is zero, remove the entry
          updated.splice(idx, 1);
        }
        return updated;
      }

      return [...prev, { card, countChange: 1 }];
    });
  };
  const removeCard = (card: CardRecord) => {
    setChangesMadeState((prev) => {
      // Find the index of the card in the changes made list
      const idx = prev.findIndex((c) => c.card.uuid === card.uuid);
      console.log("Removing card, found at index: ", idx);
      // If the card is already in the changes made list, decrement its countChange
      if (idx !== -1) {
        let updated = [...prev];
        updated = updated.map((c) =>
          c.card.uuid === card.uuid
            ? { ...c, countChange: c.countChange - 1 }
            : c
        );
        if (updated[idx].countChange === 0) {
          // If countChange is zero, remove the entry
          updated.splice(idx, 1);
        }
        return updated;
      }
      // If the card is not in the changes made list, set it with a countChange of -1
      return [...prev, { card, countChange: -1 }];
    });
  };
  const resetCards = () => {
    setCardsState(originalCards);
    setChangesMadeState([]);
  };
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
        changesMadeState,
        setChangesMadeState,
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
