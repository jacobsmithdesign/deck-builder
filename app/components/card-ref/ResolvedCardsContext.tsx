"use client";

import React, { createContext, useContext } from "react";
import type { CardPreview } from "@/lib/card-ref";

const ResolvedCardsContext = createContext<Record<string, CardPreview> | null>(null);

export function ResolvedCardsProvider({
  resolvedCards,
  children,
}: {
  resolvedCards: Record<string, CardPreview> | null;
  children: React.ReactNode;
}) {
  return (
    <ResolvedCardsContext.Provider value={resolvedCards}>
      {children}
    </ResolvedCardsContext.Provider>
  );
}

export function useResolvedCardsFromContext(): Record<string, CardPreview> | null {
  return useContext(ResolvedCardsContext);
}
