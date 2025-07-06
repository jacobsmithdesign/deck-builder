"use client";

import { useCommander } from "@/app/context/CommanderContext";
import { supabase } from "@/lib/supabaseClient";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContainer,
} from "@/app/components/ui/card";
import test from "node:test";
import Link from "next/link";
import { count } from "console";

export default function CommanderDeckList() {
  const { deckDetails, decks, setDecks } = useCommander();

  // Run this to see if the database is set up correctly
  const testQuery = async () => {
    const { data, error } = await supabase
      .from("decks")
      .select("*, deck_cards(*)")
      .limit(1);

    console.log(data, error);
  };

  // queries the supabase database for decks that use the commander
  const fetchDecksForCommander = async (commanderName: string) => {
    // Step 1: Find all cards with this name and get their UUIDs
    const { data: matchingCards, error: cardFetchError } = await supabase
      .from("cards")
      .select("uuid")
      .ilike("name", commanderName); // Case-insensitive match

    if (cardFetchError || !matchingCards?.length) {
      console.error("❌ Could not find matching cards:", cardFetchError);
      return;
    }

    const commanderUUIDs = matchingCards.map((card) => card.uuid);

    // Step 2: Find decks where any of these UUIDs are the commander
    const { data: decksWithCommander, error: deckError } = await supabase
      .from("decks")
      .select("*, deck_cards(*, card:card_uuid(*))")
      .in("commander_uuid", commanderUUIDs);

    if (deckError || !decksWithCommander) {
      console.error("❌ Failed to fetch decks:", deckError);
      return;
    }

    // Step 3: Format the decks
    const formattedDecks = decksWithCommander.map((deck) => ({
      id: deck.id,
      code: deck.code,
      name: deck.name,
      release_date: deck.release_date,
      type: deck.type,
      sealed_product: deck.sealed_product,
      cards: (deck.deck_cards ?? []).map((deckCard: any) => {
        const card = deckCard.card ?? {};
        return {
          id: card.uuid,
          name: card.name,
          type: card.type,
          manaCost: card.mana_cost,
          colorIdentity: card.color_identity,
          cmc: card.mana_value,
          oracleText: card.text,
          flavourText: null,
          imageUrl: card.identifiers?.scryfallId
            ? `https://cards.scryfall.io/normal/front/${card.identifiers.scryfallId.slice(
                0,
                1
              )}/${card.identifiers.scryfallId}.jpg`
            : null,
          count: deckCard.count ?? 1,
          scryfallId: card.identifiers?.scryfallId ?? null,
        };
      }),
    }));

    setDecks(formattedDecks);
  };

  useEffect(() => {
    if (deckDetails?.name) {
      fetchDecksForCommander(deckDetails.name);
      // testQuery(); // Run this to see if the database is set up correctly
    }
  }, [deckDetails]);

  if (!deckDetails) return null;

  return (
    <CardContainer className="w-full h-64 md:max-h-96 max-w-7xl md:rounded-3xl rounded-xl flex flex-col text-dark/90 relative overflow-clip mt-2 bg-darksecondary/10">
      <CardHeader className="p-3 md:px-6">
        <CardTitle>
          Decks using <span className="text-primary">{deckDetails.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 overflow-y-auto">
        {decks && decks.length > 0 ? (
          <ul className="space-y-3">
            {decks.map((deck) => (
              <li key={deck.id}>
                <Link href={`/deck/${deck.id}`}>
                  <Card className="">
                    <CardTitle className="">{deck.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {deck.type} • {deck.code}{" "}
                      {deck.release_date && `• Released ${deck.release_date}`}
                    </p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No decks found for {deckDetails.name}
          </p>
        )}
      </CardContent>
    </CardContainer>
  );
}
