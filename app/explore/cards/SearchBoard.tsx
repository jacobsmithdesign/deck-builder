"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  BoardContent,
  Group,
  GroupHeader,
  GroupItems,
  GroupTitle,
} from "@/app/deck/components/primitives/Board";

import DeckPerspectiveCard from "@/app/deck/components/card/perspectiveCardUI/DeckPerspectiveCard";
import CustomScrollArea from "@/app/components/ui/CustomScrollArea";
import { normalizeSearchCard } from "@/lib/client/normalizeSearchCard";
import type { CardRecord } from "@/lib/schemas";
import PerspectiveCard from "@/app/deck/components/card/perspectiveCardUI/PerspectiveCard";

// --- Type Ordering ---
const typeOrder = [
  "Land",
  "Creature",
  "Enchantment",
  "Artifact",
  "Instant",
  "Sorcery",
  "Planeswalker",
  "Other",
];

// --- Grouping Helper ---
const groupByCardType = (cards: any[] = []) => {
  const grouped: Record<string, any[]> = {};

  for (const card of cards) {
    const baseType =
      typeOrder.find((type) =>
        card.type?.toLowerCase().includes(type.toLowerCase()),
      ) || "Other";

    if (!grouped[baseType]) grouped[baseType] = [];
    grouped[baseType].push(card);
  }

  return typeOrder
    .map((type) => ({ type, cards: grouped[type] }))
    .filter((group) => group.cards && group.cards.length > 0);
};

// ---------------------------------------------
//                SEARCH PAGE BOARD
// ---------------------------------------------
export default function SearchBoard() {
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<
    (CardRecord & { imageFrontUrl: string | null })[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [visibleGroups, setVisibleGroups] = useState<Set<string>>(new Set());

  // Derived grouping
  const grouped = useMemo(() => groupByCardType(results), [results]);
  const allTypes = grouped.map((g) => g.type);

  // Initialise group visibility when search results change
  useEffect(() => {
    setVisibleGroups(new Set(allTypes));
  }, [allTypes.join(",")]);

  // Toggle visibility of a group
  const toggleGroupVisibility = (type: string) => {
    setVisibleGroups((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  // Search handler: server rewrites natural language → embeds (HF) → vector search (Supabase).
  // Rewrite + embed live in /api/embed → lib/server/embedPipeline.ts (no client import).
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchText.trim()) return;

    setLoading(true);
    try {
      const embedRes = await fetch("/api/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: searchText.trim() }),
      });
      const embedJson = await embedRes.json();
      if (!embedRes.ok) {
        console.error("Embed failed", embedJson);
        setResults([]);
        return;
      }
      const vector = embedJson.vector as number[];
      if (!Array.isArray(vector) || vector.length === 0) {
        setResults([]);
        return;
      }

      const searchRes = await fetch("/api/supabase/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vector,
          threshold: 0.1,
          limit: 100,
        }),
      });
      const searchJson = await searchRes.json();
      if (!searchRes.ok) {
        setResults([]);
        return;
      }
      const raw = Array.isArray(searchJson.data) ? searchJson.data : [];
      setResults(raw.map(normalizeSearchCard));
    } catch (err) {
      console.error("Semantic card search failed", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* SEARCH BAR */}
      <form
        onSubmit={handleSearch}
        className="flex gap-2 p-4 bg-dark/30 backdrop-blur-sm"
      >
        <input
          type="text"
          value={searchText}
          placeholder="Search for cards…"
          onChange={(e) => setSearchText(e.target.value)}
          className="flex-1 p-3 rounded-md border border-dark/40 bg-black/40 text-dark placeholder-light/50"
        />

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary text-dark rounded-md disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      <BoardContent className="relative bg-light/30 flex-1 overflow-hidden">
        {/* RESULTS SCROLL AREA */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-0 overflow-y-scroll hide-scrollbar"
        >
          <CustomScrollArea
            className="h-full w-full"
            trackClassName="bg-dark/20 rounded-xs outline outline-dark/20 w-2 mr-1 my-1"
            thumbClassName="bg-light/60 rounded-xs"
            autoHide={false}
          >
            {/* No results */}
            {!loading && results.length === 0 && searchText && (
              <p className="text-center text-dark/70 py-10">
                No results found.
              </p>
            )}

            {/* Results in CardView style (grouped by type) */}
            {grouped.map((group) => (
              <Group key={group.type}>
                <GroupHeader className="py-2">
                  <GroupTitle
                    type={group.type}
                    visibleGroups={visibleGroups}
                    toggleGroupVisibility={toggleGroupVisibility}
                  />
                </GroupHeader>

                <AnimatePresence>
                  {visibleGroups.has(group.type) && (
                    <motion.div
                      key={`group-${group.type}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-clip flex px-2"
                    >
                      <GroupItems className="mt-2">
                        {group.cards.map((card, i) => (
                          <motion.div
                            key={card.uuid}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                              delay: 0.01 * i,
                              type: "spring",
                              damping: 14,
                              stiffness: 200,
                            }}
                          >
                            <PerspectiveCard
                              id={card.uuid}
                              image={card.imageFrontUrl ?? undefined}
                              label={card.name ?? undefined}
                              card={card}
                              isEditMode={false}
                            />
                          </motion.div>
                        ))}
                      </GroupItems>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Group>
            ))}
          </CustomScrollArea>
        </motion.div>
      </BoardContent>
    </div>
  );
}
