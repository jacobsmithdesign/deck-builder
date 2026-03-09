"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";

export type DeckViewType = "cards" | "list" | "stacked-list";

export type DeckSortOption =
  | "deck"
  | "name-asc"
  | "name-desc"
  | "mana-asc"
  | "mana-desc";

export type ColourFilterMode = "exactly" | "including" | "atMost";

export interface DeckFiltersState {
  cardName: string;
  colours: {
    mode: ColourFilterMode;
    values: string[];
  };
  manaValue: { min: string; max: string };
  power: { min: string; max: string };
  toughness: { min: string; max: string };
  tags: string[];
}

export const DEFAULT_DECK_FILTERS: DeckFiltersState = {
  cardName: "",
  colours: { mode: "including", values: [] },
  manaValue: { min: "", max: "" },
  power: { min: "", max: "" },
  toughness: { min: "", max: "" },
  tags: [],
};

interface DeckViewContextType {
  view: DeckViewType;
  setView: (view: DeckViewType) => void;
  sortOption: DeckSortOption;
  setSortOption: (option: DeckSortOption) => void;
  filters: DeckFiltersState;
  setFilters: (
    f: DeckFiltersState | ((prev: DeckFiltersState) => DeckFiltersState),
  ) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

const DeckViewContext = createContext<DeckViewContextType | undefined>(
  undefined,
);

export const DeckViewProvider = ({ children }: { children: ReactNode }) => {
  const [view, setView] = useState<DeckViewType>("stacked-list");
  const [sortOption, setSortOption] = useState<DeckSortOption>("deck");
  const [filters, setFiltersState] =
    useState<DeckFiltersState>(DEFAULT_DECK_FILTERS);

  const setFilters = useCallback(
    (f: DeckFiltersState | ((prev: DeckFiltersState) => DeckFiltersState)) => {
      setFiltersState((prev) => (typeof f === "function" ? f(prev) : f));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_DECK_FILTERS);
  }, []);

  const hasActiveFilters =
    filters.cardName.trim() !== "" ||
    filters.colours.values.length > 0 ||
    filters.manaValue.min !== "" ||
    filters.manaValue.max !== "" ||
    filters.power.min !== "" ||
    filters.power.max !== "" ||
    filters.toughness.min !== "" ||
    filters.toughness.max !== "" ||
    filters.tags.length > 0;

  return (
    <DeckViewContext.Provider
      value={{
        view,
        setView,
        sortOption,
        setSortOption,
        filters,
        setFilters,
        resetFilters,
        hasActiveFilters,
      }}
    >
      {children}
    </DeckViewContext.Provider>
  );
};

export const useDeckView = (): DeckViewContextType => {
  const context = useContext(DeckViewContext);
  if (context === undefined) {
    throw new Error("useDeckView must be used within a DeckViewProvider");
  }
  return context;
};
