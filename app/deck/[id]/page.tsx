import { notFound } from "next/navigation";
import { DeckOverview } from "../DeckOverview";
import { CardListProvider } from "@/app/context/CardListContext";
import { fetchDeckById } from "@/lib/db/fetchDeck";
import InitialiseDeck from "../components/InitialiseDeck";
import CommanderOverview from "@/app/components/ui/commanderOverview";
import {
  CommanderProvider,
  useCommander,
} from "@/app/context/CommanderContext";
import { CompactViewProvider } from "@/app/context/compactViewContext";
import { useEffect, useState } from "react";
import { getAverageColorFromImage } from "@/lib/getAverageColour";

export default async function DeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  // Try fetch the deck by ID
  let deck = null;
  try {
    deck = await fetchDeckById(resolvedParams.id);
  } catch (error) {
    console.error("Error fetching deck:", error);
    notFound();
  }
  if (!deck) {
    return <div className="text-center text-lg">Deck not found</div>;
  } else
    return (
      <CardListProvider>
        <CommanderProvider>
          <InitialiseDeck deck={deck.deck} />
          <div className="bg-light relative">
            <div
              className={`w-screen h-lvh items-center text-dark pt-12 overflow-y-scroll hide-scrollbar flex flex-col`}
            >
              <CompactViewProvider>
                <CommanderOverview />
                <DeckOverview />
              </CompactViewProvider>
            </div>
          </div>
        </CommanderProvider>
      </CardListProvider>
    );
}
