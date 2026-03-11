"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RxMagnifyingGlass } from "react-icons/rx";
import { cn } from "@/lib/utils";
import CustomScrollArea from "@/app/components/ui/CustomScrollArea";
import { Button } from "@/app/deck/components/primitives/button";
import { useCardList } from "@/app/context/CardListContext";
import type { DeckMetadata } from "@/app/context/CardListContext";
import { fetchDeckForComparison } from "@/lib/api/decks/fetchDeckForComparison";
import { parseAndResolveDeckList } from "@/app/hooks/parseDeckText";
import type { CardRecord } from "@/lib/schemas";
import { AnimatePresence, motion } from "framer-motion";

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

type DeckSearchHit = {
  id: string;
  name: string;
  type: string | null;
  release_date: string | null;
};

type CompareMode = "search" | "paste";

function DeckSearchForm({
  onSearch,
  disabled,
}: {
  onSearch: (value: string, includeUserDecks: boolean) => void;
  disabled?: boolean;
}) {
  const [input, setInput] = useState("");
  const [includeUserDecks, setIncludeUserDecks] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <div className="relative flex items-center gap-2">
        <span className="absolute left-3 pointer-events-none text-dark/60">
          <RxMagnifyingGlass className="w-4 h-4" />
        </span>
        <input
          type="search"
          placeholder="Search deck, set, or commander..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" &&
            (e.preventDefault(), onSearch(input.trim(), includeUserDecks))
          }
          disabled={disabled}
          className={cn(
            "pl-9 pr-3 py-1.5 rounded-full flex-1 min-w-0 bg-light/65 focus:bg-light",
            "shadow-inner text-base text-dark placeholder:text-dark/60 outline-none",
            "outline outline-dark/20 focus:outline-dark/40",
            disabled && "opacity-60",
          )}
          aria-label="Search deck, set, or commander"
        />
        <Button
          type="button"
          variant="frosted"
          onClick={() => onSearch(input.trim(), includeUserDecks)}
          disabled={disabled}
          className="rounded-full outline outline-dark/20 shrink-0"
        >
          Search
        </Button>
      </div>
      <label className="flex items-center gap-2 cursor-pointer select-none text-dark/90 text-sm">
        <input
          type="checkbox"
          checked={includeUserDecks}
          onChange={(e) => setIncludeUserDecks(e.target.checked)}
          disabled={disabled}
          className="rounded border-dark/30 text-green-600 focus:ring-green-500/50"
          aria-label="Include user-created decks in search"
        />
        <span>Include user-created decks</span>
      </label>
    </div>
  );
}

/** Single row: deck name, type tag, release date — same style as DeckOverviewSection */
function DeckSearchRow({
  deck,
  onSelect,
  disabled,
}: {
  deck: DeckSearchHit;
  onSelect: () => void;
  disabled?: boolean;
}) {
  const type = deck.type ?? "";
  const releaseDate = formatDate(deck.release_date);
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "w-full text-left flex flex-wrap items-center gap-2 py-2 px-3 rounded-lg",
        "bg-light/20 hover:bg-light/40 border border-transparent hover:border-dark/10",
        "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
      )}
    >
      <span className="font-bold text-dark/90 truncate">{deck.name}</span>
      {type && (
        <span className="font-normal bg-light/20 px-2 rounded-md whitespace-nowrap text-sm">
          {type}
        </span>
      )}
      {releaseDate && (
        <span className="text-sm text-dark/60">{releaseDate}</span>
      )}
    </button>
  );
}

const VIRTUAL_IMPORT_DECK: DeckMetadata = {
  id: "compare-import",
  name: "Imported list",
  isUserDeck: false,
};

interface CompareDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CompareDeckModal({
  isOpen,
  onClose,
}: CompareDeckModalProps) {
  const {
    setComparisonDeck,
    setComparisonCards,
    deck: currentDeck,
  } = useCardList();

  const [mode, setMode] = useState<CompareMode>("search");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [decks, setDecks] = useState<DeckSearchHit[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [includeUserDecks, setIncludeUserDecks] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Paste list state
  const [pasteText, setPasteText] = useState("");
  const [pasteLoading, setPasteLoading] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);

  const runSearch = useCallback((value: string, includeUser: boolean) => {
    setSearchQuery(value);
    setIncludeUserDecks(includeUser);
    setPage(0);
    setHasSearched(true);
  }, []);

  const fetchDecks = useCallback(async () => {
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
      const list = (json.data ?? []).map(
        (d: {
          id: string;
          name: string;
          type?: string | null;
          release_date?: string | null;
        }) => ({
          id: d.id,
          name: d.name,
          type: d.type ?? null,
          release_date: d.release_date ?? null,
        }),
      );
      setDecks((prev) => (page === 0 ? list : [...prev, ...list]));
      setHasMore(json.hasMore ?? false);
    } catch (err) {
      console.error("Network error loading decks:", err);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, includeUserDecks]);

  // Only fetch when user has run a search (hasSearched)
  useEffect(() => {
    if (isOpen && hasSearched && mode === "search") fetchDecks();
  }, [isOpen, hasSearched, mode, fetchDecks]);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setDecks([]);
      setPage(0);
      setHasSearched(false);
      setHasMore(false);
      setPasteError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 1 },
    );
    const ref = loadMoreRef.current;
    if (ref) observer.observe(ref);
    return () => {
      if (ref) observer.unobserve(ref);
    };
  }, [hasMore, loading]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, includeUserDecks]);

  const handleSelectDeck = useCallback(
    async (deckId: string) => {
      if (deckId === currentDeck?.id) return;
      setSelectingId(deckId);
      try {
        const { deck, cards } = await fetchDeckForComparison(deckId);
        setComparisonDeck(deck);
        setComparisonCards(cards);
        onClose();
      } catch (err) {
        console.error("Failed to load deck for comparison:", err);
      } finally {
        setSelectingId(null);
      }
    },
    [currentDeck?.id, setComparisonDeck, setComparisonCards, onClose],
  );

  const handlePasteImport = useCallback(async () => {
    const trimmed = pasteText.trim();
    if (!trimmed) {
      setPasteError("Paste a deck list first.");
      return;
    }
    setPasteLoading(true);
    setPasteError(null);
    try {
      const resolved = await parseAndResolveDeckList(trimmed);
      if (!resolved) {
        setPasteError(
          "No valid cards found. Use format: 1x Card Name or 2 Card Name",
        );
        setPasteLoading(false);
        return;
      }
      const { lines, recordsByUuid } = resolved;
      const cards: CardRecord[] = lines.map((line) => {
        const record = recordsByUuid.get(line.uuid)!;
        return { ...record, count: line.count } as CardRecord;
      });
      setComparisonDeck(VIRTUAL_IMPORT_DECK);
      setComparisonCards(cards);
      onClose();
    } catch (e) {
      console.error(e);
      setPasteError("Something went wrong parsing the list.");
    } finally {
      setPasteLoading(false);
    }
  }, [pasteText, setComparisonDeck, setComparisonCards, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/40"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-light rounded-2xl shadow-xl border border-dark/10 flex flex-col max-h-[85vh] w-full max-w-lg overflow-hidden"
        >
          <div className="p-4 border-b border-dark/10">
            <h2 className="text-lg font-bold text-dark/90 mb-3">
              Compare with another deck
            </h2>

            {/* Tabs: Search decks | Paste list */}
            <div className="flex gap-1 p-1 rounded-lg bg-dark/10 mb-3">
              <button
                type="button"
                onClick={() => setMode("search")}
                className={cn(
                  "flex-1 py-1.5 rounded-md text-sm font-medium transition-colors",
                  mode === "search"
                    ? "bg-light shadow-sm text-dark/90"
                    : "text-dark/70 hover:text-dark/90",
                )}
              >
                Search decks
              </button>
              <button
                type="button"
                onClick={() => setMode("paste")}
                className={cn(
                  "flex-1 py-1.5 rounded-md text-sm font-medium transition-colors",
                  mode === "paste"
                    ? "bg-light shadow-sm text-dark/90"
                    : "text-dark/70 hover:text-dark/90",
                )}
              >
                Paste list
              </button>
            </div>

            {mode === "search" && (
              <DeckSearchForm onSearch={runSearch} />
            )}

            {mode === "paste" && (
              <div className="flex flex-col gap-2">
                <textarea
                  placeholder="Paste deck list (e.g. 1 Sol Ring\n2 Command Tower)"
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  className={cn(
                    "w-full min-h-28 rounded-lg px-3 py-2 text-sm resize-y",
                    "bg-light/80 border border-dark/20 outline-none focus:border-dark/40",
                    "placeholder:text-dark/50 text-dark/90",
                  )}
                  aria-label="Paste deck list"
                />
                {pasteError && (
                  <p className="text-sm text-red-600">{pasteError}</p>
                )}
                <Button
                  type="button"
                  variant="frosted"
                  onClick={handlePasteImport}
                  disabled={pasteLoading}
                  className="rounded-full w-full"
                >
                  {pasteLoading ? "Parsing…" : "Parse & compare"}
                </Button>
              </div>
            )}
          </div>

          {mode === "search" && (
            <CustomScrollArea
              className="flex-1 min-h-0"
              trackClassName="bg-dark/20 rounded-xs w-2"
              thumbClassName="bg-light/60 rounded-xs"
              autoHide={false}
            >
              <div className="p-2 flex flex-col gap-1">
                {!hasSearched && (
                  <p className="py-4 text-center text-sm text-dark/60">
                    Search for a deck to compare with.
                  </p>
                )}
                {hasSearched && decks.length === 0 && !loading && (
                  <p className="py-4 text-center text-sm text-dark/60">
                    No decks found. Try a different search.
                  </p>
                )}
                {decks.map((d) => (
                  <DeckSearchRow
                    key={d.id}
                    deck={d}
                    onSelect={() => handleSelectDeck(d.id)}
                    disabled={
                      d.id === currentDeck?.id || selectingId !== null
                    }
                  />
                ))}
                {loading && (
                  <p className="py-2 text-sm text-dark/60">Loading...</p>
                )}
                <div ref={loadMoreRef} className="h-2" />
              </div>
            </CustomScrollArea>
          )}

          <div className="p-3 border-t border-dark/10">
            <Button
              variant="frosted"
              onClick={onClose}
              className="w-full rounded-full"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
