"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Commander } from "@/lib/schemas";
import { DeckRecord, CardRecord } from "@/lib/schemas";

export type CommanderCard = {
  id: string;
  name: string;
  type: string;
  mana_cost: string | null;
  colorIdentity: string[];
  cmc: number;
  text: string;
  flavourText?: string | null;
  imageFrontUrl: string | null;
  imageBackUrl?: string | null;
  artwork: string | null;
  isDoubleFaced?: boolean;
  identifiers?: Record<string, any>;
};

export type CommanderDeckDetails = {
  id: string;
  name: string;
  userId?: string | null;
  type: string;
  isUserDeck: boolean;
  cards: CommanderCard[];
};

type CommanderContextProps = {
  deckDetails: CommanderDeckDetails | null;
  setDeckDetails: (deck: CommanderDeckDetails | null) => void;
  commanderCard: CommanderCard | null;
  setCommanderCard: (card: CommanderCard | null) => void;
  // other fields...
};
const CommanderContext = createContext<CommanderContextProps | undefined>(
  undefined
);

export function CommanderProvider({ children }: { children: ReactNode }) {
  const [deckDetails, setDeckDetails] = useState<CommanderDeckDetails | null>(
    null
  );
  const [commanderCard, setCommanderCard] = useState<CommanderCard | null>(
    null
  );

  return (
    <CommanderContext.Provider
      value={{
        setDeckDetails,
        deckDetails,
        setCommanderCard,
        commanderCard,
      }}
    >
      {children}
    </CommanderContext.Provider>
  );
}

export function useCommander() {
  const context = useContext(CommanderContext);
  if (!context) {
    throw new Error("useCommander must be used within a CommanderProvider");
  }
  return context;
}
