import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import { CommanderProvider } from "@/app/context/CommanderContext";
import { Deck } from "@/lib/schemas";
import { DeckEditor } from "./DeckEditor";
import { CommanderPanel } from "./CommanderPanel";

export default async function DeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  // Try fetching user deck first
  const { data: userDeck, error: userError } = await supabase
    .from("user_decks")
    .select("*, user_deck_cards(*)")
    .eq("id", resolvedParams.id)
    .single();

  if (userDeck && !userError) {
    const transformedDeck: Deck = {
      id: userDeck.id,
      name: userDeck.deck_name,
      code: null,
      release_date: null,
      type: "User Deck",
      sealed_product: null,
      cards: userDeck.user_deck_cards.map((c: any) => ({
        id: c.card_uuid,
        name: c.name,
        type: c.type,
        manaCost: c.mana_cost,
        colorIdentity: c.color_identity,
        cmc: c.mana_value,
        oracleText: c.text,
        flavourText: null,
        imageUrl: c.image_url ?? null,
        count: c.count || 1,
      })),
    };

    return (
      <CommanderProvider>
        <div className="w-screen h-lvh flex gap-2 items-center p-2 bg-light text-dark pt-14">
          <CommanderPanel />
          <DeckEditor deck={transformedDeck} />
        </div>
      </CommanderProvider>
    );
  }

  // Fallback to precon deck
  const { data: deck, error } = await supabase
    .from("decks")
    .select("*, deck_cards(*)")
    .eq("id", resolvedParams.id)
    .single();

  if (!deck || error) {
    notFound();
  }

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
      flavourText: null,
      imageUrl: c.image_url ?? null,
      count: c.count || 1,
    })),
  };

  return (
    <CommanderProvider>
      <div className="w-screen h-lvh flex gap-2 items-center p-2 bg-light text-dark pt-14">
        <CommanderPanel />
        <DeckEditor deck={transformedDeck} />
      </div>
    </CommanderProvider>
  );
}
