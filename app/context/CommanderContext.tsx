"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Commander } from "@/lib/schemas";
import { Deck } from "@/lib/schemas";
interface CommanderContextProps {
  deckDetails: Commander | null;
  setDeckDetails: (deck: Commander | null) => void;
  oracleText: string | null;
  setOracleText: (text: string | null) => void;
  flavorText: string | null;
  setFlavorText: (text: string | null) => void;
  commanderCardImage: string | null;
  setCommanderCardImage: (url: string) => void;
  artwork: string | null;
  setArtwork: (colour: string | null) => void;
  artworkColor: string | null;
  setArtworkColor: (colour: string | null) => void;
  error: boolean;
  setError: (error: boolean) => void;

  // Commander deck list
  decks: Deck[];
  setDecks: (decks: Deck[]) => void;
}

const CommanderContext = createContext<CommanderContextProps | undefined>(
  undefined
);

export function CommanderProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<boolean>(false);
  const [artworkColor, setArtworkColor] = useState<string | null>(null);
  const [artwork, setArtwork] = useState<string | null>(null);
  const [deckDetails, setDeckDetails] = useState<Commander | null>(null);
  const [oracleText, setOracleText] = useState<string | null>(null);
  const [flavorText, setFlavorText] = useState<string | null>(null);
  const [commanderCardImage, setCommanderCardImage] = useState<string | null>(
    null
  );
  const [decks, setDecks] = useState<Deck[]>([]);

  return (
    <CommanderContext.Provider
      value={{
        deckDetails,
        setDeckDetails,
        oracleText,
        setOracleText,
        flavorText,
        setFlavorText,
        commanderCardImage,
        setCommanderCardImage,
        artwork,
        setArtwork,
        artworkColor,
        setArtworkColor,
        error,
        setError,
        decks,
        setDecks,
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
