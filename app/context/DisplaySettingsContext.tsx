"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type CardViewMode = "overview" | "cards" | "analysis" | "edit";

type CardViewState = {
  mode: CardViewMode;
  setMode: (m: CardViewMode) => void;
};

const CardViewContext = createContext<CardViewState | null>(null);

export function CardViewProvider({
  CardId,
  children,
  defaultMode = "overview",
}: {
  CardId: string;
  children: React.ReactNode;
  defaultMode?: CardViewMode;
}) {
  const key = `Card:view:${CardId}`;

  const [mode, setMode] = useState<CardViewMode>(defaultMode);

  // Load on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = raw as CardViewMode;
      if (["overview", "cards", "analysis", "edit"].includes(parsed)) {
        setMode(parsed);
      }
    } catch {}
  }, [key]);

  // Save on change
  useEffect(() => {
    try {
      localStorage.setItem(key, mode);
    } catch {}
  }, [key, mode]);

  const value = useMemo(() => ({ mode, setMode }), [mode]);

  return (
    <CardViewContext.Provider value={value}>
      {children}
    </CardViewContext.Provider>
  );
}

export function useCardView() {
  const ctx = useContext(CardViewContext);
  if (!ctx) throw new Error("useCardView must be used inside CardViewProvider");
  return ctx;
}
