"use client";

import { useUser } from "@/app/context/userContext";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useRef, useState } from "react";
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
import CustomScrollArea from "@/app/components/ui/CustomScrollArea";
import DeckPreview from "@/app/components/decks/DeckPreview";

export default function UserDeckList() {
  const { profile, loading } = useUser();
  const [userDecks, setUserDecks] = useState<any[]>([]);
  const [deletingDeckId, setDeletingDeckId] = useState<string | null>(null);
  const router = useRouter();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchUserDecks = async () => {
    try {
      const res = await fetch(
        `/api/supabase/decks/fetch-user-commander-decks?page=${page}`
      );
      const json = await res.json();

      if (!res.ok) {
        console.error("Error loading user decks:", json.error);
        return;
      }

      setUserDecks((prev) => {
        const byId = new Map(prev.map((d) => [d.id, d]));
        for (const row of json.data ?? []) byId.set(row.id, row); // upsert
        return Array.from(byId.values());
      });

      setHasMore(json.hasMore);
    } catch (err) {
      console.error("Network error loading user decks:", err);
    }
  };

  const handleDelete = async (deckId: string) => {
    setDeletingDeckId(deckId);
    const { error } = await supabase.from("decks").delete().eq("id", deckId);

    if (error) {
      console.error("Error deleting deck:", error);
    } else {
      await fetchUserDecks();
    }
    setDeletingDeckId(null);
  };

  // Get the user's decks when the component mounts or the page changes
  useEffect(() => {
    if (!profile) return;
    fetchUserDecks();
  }, [page, profile]);
  // Reset decks and page when profile changes (e.g., user logs out)
  useEffect(() => {
    if (!profile) {
      setUserDecks([]);
      setPage(0);
    }
  }, [profile]);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [hasMore, loading, loadMoreRef]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Loading your decks...</p>
    );
  }

  if (!profile) {
    return <p className="p-4">You must be logged in to view this page.</p>;
  }

  return (
    <CardContainer className="w-full h-full flex flex-col text-dark/90 relative overflow-clip">
      <CardHeader className="p-3 md:px-6 mb-6">
        <CardTitle>Your Deck Collection</CardTitle>
      </CardHeader>
      {userDecks.length > 0 ? (
        <CardContent className="grid grid-cols-[repeat(auto-fit,minmax(22rem,1fr))] gap-1 text-center hide-scrollbar mb-10">
          {userDecks.map((deck) => {
            return (
              <div key={deck.id} className="relative">
                <DeckPreview deck={deck} />
              </div>
            );
          })}{" "}
          <div ref={loadMoreRef} className="h-4" />
        </CardContent>
      ) : (
        <p className="text-sm text-muted-foreground">
          You haven't saved any decks yet.
        </p>
      )}
    </CardContainer>
  );
}
