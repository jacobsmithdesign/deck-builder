import { notFound } from "next/navigation";
import { DeckOverview } from "../DeckOverview";
import { CardListProvider } from "@/app/context/CardListContext";
import InitialiseDeck from "../components/card/InitialiseDeck";
import CommanderOverview from "@/app/components/ui/commanderOverview";
import { CommanderProvider } from "@/app/context/CommanderContext";
import { CompactViewProvider } from "@/app/context/compactViewContext";
import { getDeckById } from "@/lib/api/decks/getDeckById";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import AnimatedDeckView from "../components/card/AnimatedDeckView";

export default async function DeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let deck = null;
  try {
    deck = await getDeckById(id);
  } catch (error) {
    console.error("Error fetching deck:", error);
    notFound();
  }

  if (!deck) {
    return <div className="text-center text-lg">Deck not found</div>;
  }

  return (
    <CardListProvider>
      <CommanderProvider>
        <InitialiseDeck deck={deck.deck} />
        <CompactViewProvider>
          <AnimatedDeckView />
        </CompactViewProvider>
      </CommanderProvider>
    </CardListProvider>
  );
}
