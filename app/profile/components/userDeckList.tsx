"use client";

import { useUser } from "@/app/context/userContext";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardContainer,
} from "@/app/components/ui/card";
import Link from "next/link";
import { Router } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";

export default function UserDeckList() {
  const { profile, loading } = useUser();
  const [userDecks, setUserDecks] = useState<any[]>([]);
  const [deletingDeckId, setDeletingDeckId] = useState<string | null>(null);
  const router = useRouter();

  const fetchUserDecks = async () => {
    const { data, error } = await supabase
      .from("user_decks")
      .select("id, deck_name, description, is_public")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user decks:", error);
      return;
    }

    setUserDecks(data);
  };

  useEffect(() => {
    if (!profile) return;

    fetchUserDecks();
  }, [profile]);

  const handleDelete = async (deckId: string) => {
    setDeletingDeckId(deckId);
    const { error } = await supabase
      .from("user_decks")
      .delete()
      .eq("id", deckId);

    if (error) {
      console.error("Error deleting deck:", error);
    } else {
      await fetchUserDecks();
    }
    setDeletingDeckId(null);
  };

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Loading your decks...</p>
    );
  }

  if (!profile) {
    return <p className="p-4">You must be logged in to view this page.</p>;
  }

  return (
    <CardContainer className="w-full md:rounded-xl rounded-xl flex flex-col text-dark relative overflow-clip mt-2 bg-darksecondary/15">
      <CardHeader className="p-3 md:px-6">
        <CardTitle>Your Deck Collection</CardTitle>
      </CardHeader>
      <CardContent className="px-6 overflow-y-auto max-h-96 flex">
        {userDecks.length > 0 ? (
          <ul className="space-y-3">
            {userDecks.map((deck) => (
              <li key={deck.id}>
                <Link href={`/deck/${deck.id}`}>
                  <Card className="flex flex-col gap-1">
                    <CardTitle>{deck.deck_name}</CardTitle>
                    <div className="bg-dark/10 p-2 rounded-md flex items-center justify-center">
                      <p>{deck.is_public ? "Public" : "Private"}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {deck.description || "No description provided"}
                    </p>
                  </Card>
                </Link>
                <Button
                  variant="delete"
                  size="sm"
                  disabled={deletingDeckId === deck.id}
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this deck?")) {
                      handleDelete(deck.id);
                    }
                  }}
                >
                  {deletingDeckId === deck.id ? "Deleting..." : "Delete"}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            You haven't saved any decks yet.
          </p>
        )}
      </CardContent>
    </CardContainer>
  );
}
