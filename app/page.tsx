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
      <div className="flex flex-col h-lvh overflow-scroll hide-scrollbar items-center max-h-lvh px-2 pb-2 bg-light text-dark pt-15">
        <CommanderDeckList />
      </div>
    </CommanderProvider>
  );
}
