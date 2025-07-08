"use client";

import { useCommander } from "@/app/context/CommanderContext";
import { supabase } from "@/lib/supabaseClient";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { DeckRecord } from "@/lib/schemas";
import Image from "next/image";
import Tilt from "react-parallax-tilt";

const PAGE_SIZE = 30;

export default function CommanderDeckList() {
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [decks, setDecks] = useState<DeckRecord[]>([]);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  // queries the supabase database for decks that use the commander
  const fetchAllCommanderDecks = useCallback(async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("decks")
      .select("*")
      .is("user_id", null)
      .eq("type", "Commander Deck")
      .order("release_date", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error loading decks:", error);
      setLoading(false);
      return;
    }
    setDecks((prev) => [...prev, ...(data ?? [])]);
    setHasMore((data ?? []).length === PAGE_SIZE);
    setLoading(false);
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
    <CardContainer className="w-full h-full flex flex-col text-dark/90 relative overflow-clip bg-darksecondary/10">
      <CardHeader className="py-3 md:px-4 bg-dark/5 m-2 rounded-md">
        <CardTitle>Commander Decks</CardTitle>
      </CardHeader>
      <CardContent className="px-2 overflow-y-scroll hide-scrollbar flex flex-col gap-2 ">
        {decks.map((deck, index) => (
          <Link
            href={`/deck/${deck.id}`}
            key={`${deck.id}-${index}`}
            className="p-2 px-4 transition-all md:hover:bg-light cursor-pointer rounded-sm flex flex-col text-left "
          >
            <h3 className="font-bold">{deck.name}</h3>
            <p className="text-sm text-muted-foreground">{deck.release_date}</p>
          </Link>
        ))}

        {loading && <p>Loading more decks...</p>}
        <div ref={loadMoreRef} className="h-1" />
      </CardContent>
    </CardContainer>
  );
}
