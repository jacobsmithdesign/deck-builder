"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CardContent,
  CardHeader,
  CardTitle,
  CardContainer,
} from "@/app/components/ui/card";
import { CommanderDeckRecord } from "@/lib/schemas";
import DeckPreview from "@/app/components/decks/DeckPreview";
import CustomScrollArea from "@/app/components/ui/CustomScrollArea";

export default function UserCommanderDeckList() {
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [decks, setDecks] = useState<CommanderDeckRecord[]>([]);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [hoveredDeckId, setHoveredDeckId] = useState<string | null>(null); // Set the hovered deck id to control details display

  // queries the supabase database for decks that use the commander
  const fetchAllCommanderDecks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/supabase/decks/fetch-commander-decks?page=${page}`
      );
      const json = await res.json();

      if (!res.ok) {
        console.error("Error loading decks:", json.error);
        setLoading(false);
        return;
      }

      setDecks((prev) => {
        const byId = new Map(prev.map((d) => [d.id, d]));
        for (const row of json.data ?? []) byId.set(row.id, row); // upsert
        return Array.from(byId.values());
      });

      setHasMore(json.hasMore);
    } catch (err) {
      console.error("Network error loading decks:", err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchAllCommanderDecks();
  }, [fetchAllCommanderDecks]);

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
  }, [hasMore, loading]);

  return (
    <CardContainer className="w-full h-full flex flex-col text-dark/90 relative overflow-clip">
      <CardHeader className="p-1 md:px-4 bg-light/50 m-1 rounded-lg">
        <CardTitle>Commander Decks</CardTitle>
      </CardHeader>
      <CustomScrollArea
        className="h-full w-full"
        trackClassName="bg-dark/40 rounded-xs outline outline-dark/20 w-2 mr-1"
        thumbClassName="bg-light/60 rounded-xs"
        autoHide={false}
      >
        <CardContent className="grid grid-cols-[repeat(auto-fit,minmax(22rem,1fr))] gap-1 text-center hide-scrollbar mb-10">
          {decks.map((deck) => {
            return (
              <div key={deck.id} className="relative">
                <DeckPreview deck={deck} />
              </div>
            );
          })}

          {loading && <p>Loading more decks...</p>}
          <div ref={loadMoreRef} className="h-1" />
        </CardContent>
      </CustomScrollArea>
    </CardContainer>
  );
}
