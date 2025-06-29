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
    // Step 1: find all deck IDs that contain the commander
    const { data: deckCards, error: cardError } = await supabase
      .from("deck_cards")
      .select("deck_id")
      .eq("name", commanderName)
      .eq("board_section", "commander"); // optional: limit to commander slot

    if (cardError) {
      console.error("Failed to find matching deck_ids:", cardError);
      return;
    }

    const deckIds = deckCards.map((c) => c.deck_id);

    // Step 2: fetch decks with their cards included
    const { data: fetchedDecks, error: deckError } = await supabase
      .from("decks")
      .select("*, deck_cards(*)") // this embeds the deck_cards
      .in("id", deckIds);

    if (deckError) {
      console.error("Failed to fetch decks:", deckError);
      return;
    }

    // Step 3: map the results into your expected schema
    const formattedDecks = fetchedDecks.map((deck) => ({
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
        imageUrl: null, // you can add Scryfall image support later
        count: c.count || 1, // default to 1 if count is not provided
        scryfallId: c.identifiers.scryfallId || null, // optional Scryfall ID
      })),
    }));

    setDecks(formattedDecks);

    console.log("Fetching decks for commander:", decks);
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
