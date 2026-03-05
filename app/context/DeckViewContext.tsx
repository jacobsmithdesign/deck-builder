"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

export type DeckViewType = "cards" | "list" | "stacked-list";

export type DeckSortOption =
  | "deck"
  | "name-asc"
  | "name-desc"
  | "mana-asc"
  | "mana-desc";

interface DeckViewContextType {
  view: DeckViewType;
  setView: (view: DeckViewType) => void;
  sortOption: DeckSortOption;
  setSortOption: (option: DeckSortOption) => void;
}

const DeckViewContext = createContext<DeckViewContextType | undefined>(
  undefined,
);

export const DeckViewProvider = ({ children }: { children: ReactNode }) => {
  const [view, setView] = useState<DeckViewType>("cards");
  const [sortOption, setSortOption] = useState<DeckSortOption>("deck");

  return (
    <DeckViewContext.Provider value={{ view, setView, sortOption, setSortOption }}>
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
