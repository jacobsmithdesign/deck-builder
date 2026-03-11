"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CardContent,
  CardHeader,
  CardTitle,
  CardContainer,
} from "@/app/components/ui/card";
import DeckPreview from "./DeckPreview";
import CustomScrollArea from "../ui/CustomScrollArea";
import DeckPreviewXL from "./DeckPreviewXL";
import { Button } from "@/app/deck/components/primitives/button";
import { CommanderDeckRecord } from "@/lib/schemas";
import { RxMagnifyingGlass } from "react-icons/rx";
import { cn } from "@/lib/utils";

type deckViewType = {
  size: "small" | "medium" | "large";
};

/** Search form with local input state so typing doesn't re-render the whole deck list. */
function DeckSearchForm({
  onSearch,
}: {
  onSearch: (value: string) => void;
}) {
  const [input, setInput] = useState("");
  return (
    <div className="relative flex items-center gap-2">
      <span className="absolute left-3 pointer-events-none text-dark/60">
        <RxMagnifyingGlass className="w-4 h-4" />
      </span>
      <input
        type="search"
        placeholder="Search deck, set, or commander..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onSearch(input.trim()))}
        className={cn(
          "pl-9 pr-3 py-1.5 rounded-full w-56 min-w-0 bg-light/65 focus:bg-light",
          "shadow-inner text-base text-dark placeholder:text-dark/60 outline-none",
          "outline outline-dark/20 focus:outline-dark/40",
        )}
        aria-label="Search deck, set, or commander"
      />
      <Button
        type="button"
        variant="frosted"
        onClick={() => onSearch(input.trim())}
        className="rounded-full outline outline-dark/20 shrink-0"
      >
        Search
      </Button>
    </div>
  );
}

export default function CommanderDeckList() {
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [decks, setDecks] = useState<CommanderDeckRecord[]>([]);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [deckView, setDeckView] = useState<deckViewType>({ size: "large" });
  const [searchQuery, setSearchQuery] = useState("");
  const [includeUserDecks, setIncludeUserDecks] = useState(false);

  const runSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(0);
  }, []);

  // When filters change, reset to first page
  useEffect(() => {
    setPage(0);
  }, [searchQuery, includeUserDecks]);

  const fetchAllCommanderDecks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (searchQuery) params.set("search", searchQuery);
      if (includeUserDecks) params.set("includeUserDecks", "true");
      const res = await fetch(
        `/api/supabase/decks/fetch-commander-decks?${params.toString()}`,
      );
      const json = await res.json();

      if (!res.ok) {
        console.error("Error loading decks:", json.error);
        setLoading(false);
        return;
      }

      setDecks((prev) => {
        if (page === 0) return json.data ?? [];
        const byId = new Map(prev.map((d) => [d.id, d]));
        for (const row of json.data ?? []) byId.set(row.id, row);
        return Array.from(byId.values());
      });

      setHasMore(json.hasMore);
    } catch (err) {
      console.error("Network error loading decks:", err);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, includeUserDecks]);

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
      { threshold: 1 },
    );
    const currentRef = loadMoreRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [hasMore, loading]);

  return (
    <CardContainer className="w-full h-full flex flex-col text-dark/90 relative overflow-clip">
      <CardHeader className="p-1 md:px-4 bg-light/50 m-1 rounded-lg flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Commander Decks</CardTitle>
          <div className="flex gap-2 bg-dark/10 w-fit p-1 rounded-full outline outline-dark/20 ">
            <p className="pl-2">View</p>
            <Button
              variant="frosted"
              onClick={() => setDeckView({ size: "medium" })}
              className="rounded-full outline-dark/20 outline"
            >
              Medium
            </Button>
            <Button
              variant="frosted"
              onClick={() => setDeckView({ size: "large" })}
              className="rounded-full outline-dark/20 outline"
            >
              Large
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DeckSearchForm onSearch={runSearch} />
          <label className="flex items-center gap-2 cursor-pointer select-none text-dark/90">
            <input
              type="checkbox"
              checked={includeUserDecks}
              onChange={(e) => setIncludeUserDecks(e.target.checked)}
              className="rounded border-dark/30 text-green-600 focus:ring-green-500/50"
              aria-label="Include user-created decks in search"
            />
            <span className="text-sm">Include user-created decks</span>
          </label>
        </div>
      </CardHeader>

      <CustomScrollArea
        className="h-full w-full"
        trackClassName="bg-dark/40 rounded-xs outline outline-dark/20 w-2 mr-1"
        thumbClassName="bg-light/60 rounded-xs"
        autoHide={false}
      >
        <CardContent
          className={`${
            deckView.size === "medium" &&
            "grid-cols-[repeat(auto-fit,minmax(22rem,1fr))]"
          } ${
            deckView.size === "large" && "max-h-12"
          } grid gap-1 text-center hide-scrollbar mb-10`}
        >
          {decks.map((deck) => {
            return (
              <div key={deck.id} className="relative">
                {deckView.size === "medium" ? (
                  <DeckPreview deck={deck} />
                ) : (
                  <DeckPreviewXL deck={deck} />
                )}
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
