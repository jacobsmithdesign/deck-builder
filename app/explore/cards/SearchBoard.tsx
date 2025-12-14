"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { embedQuery } from "@/lib/client/embedQuery";

import {
  BoardContent,
  Group,
  GroupHeader,
  GroupItems,
  GroupTitle,
} from "@/app/deck/components/card/Board"; // adjust path if needed

import PerspectiveCard from "@/app/deck/components/card/perspectiveCardUI/PerspectiveCard";
import CustomScrollArea from "@/app/components/ui/CustomScrollArea";

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
        card.type?.toLowerCase().includes(type.toLowerCase())
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
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibleGroups, setVisibleGroups] = useState<Set<string>>(new Set());

  // Derived grouping
  const grouped = useMemo(() => groupByCardType(results), [results]);
  const allTypes = grouped.map((g) => g.type);

  // Toggle visibility of a group
  const toggleGroupVisibility = (type: string) => {
    setVisibleGroups((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  // Initialise group visibility when search results change
  useMemo(() => {
    setVisibleGroups(new Set(allTypes));
  }, [allTypes.join(",")]);

  // Search Handler
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchText.trim()) return;

    const vector = await embedQuery(searchText);

    setLoading(true);

    const params = new URLSearchParams();
    params.append("vector", vector);
    params.append("threshold", "0.1");
    params.append("limit", "100");

    // Make a request to the /classify route on the server.
    const result = await fetch(`/api/supabase/search?${params.toString()}`);

    const json = await result.json();
    setResults(json.data);
    console.log("Results returned from embed search: ", result);
    setLoading(false);
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
          className="flex-1 p-3 rounded-md border border-dark/40 bg-black/40 text-light placeholder-light/50"
        />

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50"
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

            {/* Results */}
            {grouped.map((group, index) => (
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
                              image={card.imageFrontUrl}
                              label={card.name}
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
