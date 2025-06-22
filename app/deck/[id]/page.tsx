import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import {
  CommanderProvider,
  useCommander,
} from "@/app/context/CommanderContext";
import { CardType, Deck } from "@/lib/schemas";
import { DeckEditor } from "./DeckEditor";
import { CommanderPanel } from "./CommanderPanel";

// asynchronous wrapper function to fetch the deck by ID as "use client" is not supported
export default async function DeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Resolve the params promise to get the deck ID
  const resolvedParams = await params;
  // Fetch the deck from the database using Supabase
  const { data: deck, error } = await supabase
    .from("decks")
    .select("*, deck_cards(*)")
    .eq("id", resolvedParams.id)
    .single();

  if (!deck || error) {
    notFound();
  }

  // Transform the deck data to match the expected structure
  const transformedDeck: Deck = {
    id: deck.id,
    code: deck.code,
    name: deck.name,
    release_date: deck.release_date,
    type: deck.type,
    sealed_product: deck.sealed_product,
    cards: deck.deck_cards.map((c: any) => ({
      id: c.card_uuid,
      name: c.name,
      type: c.type,
      manaCost: c.mana_cost,
      colorIdentity: c.color_identity,
      cmc: c.mana_value,
      oracleText: c.text,
      flavourText: null, // Not in DB
      imageUrl: c.image_url ? c.image_url : null,
      count: c.count || 1, // Default to 1 if count is not provided
    })),
  };

  return (
    <CommanderProvider>
      <div className="w-screen h-lvh flex gap-2 items-center p-2 bg-light text-dark">
        <CommanderPanel />
        <DeckEditor deck={transformedDeck} />
      </div>
    </CommanderProvider>
  );
}
