"use client";

import { useState } from "react";
import { Commander, commanderSchema, commanderSlugSchema } from "@/lib/schemas";
import SearchBox from "./components/ui/searchBox";
import CommanderOverview from "./components/ui/commanderOverview";
import { CommanderProvider } from "./context/CommanderContext";
import { CardSuggestions } from "./components/ui/CardSuggestions";
import CommanderDeckList from "./components/Decks/CommanderDeckList";

export type commanderData = {
  image: string | null;
};
async function getTopCards(commanderName: string) {
  const res = await fetch(`api/edhrec/${commanderName}.json`);
  const data = await res.json();
  return data;
}

export default function DeckBuilder() {
  const [deckDetails, setDeckDetails] = useState<Commander | null>(null);
  const [commanderCard, setCommanderCard] = useState<commanderData | null>(
    null
  );
  const [commanderName, setCommanderName] = useState<string | null>(null);

  return (
    <CommanderProvider>
      <div className="flex flex-col items-center min-h-screen px-4 bg-light text-dark pt-13">
        <SearchBox />
        {/* <CommanderOverview /> */}
        <CommanderDeckList />
      </div>
    </CommanderProvider>
  );
}
