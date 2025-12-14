"use client";

import { useState } from "react";
import { embedQuery } from "@/lib/client/embedQuery";

type SearchResult = {
  uuid: string;
  name: string;
  type: string;
  text: string;
  similarity: number;
};

export default function EmbeddingSearch() {
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    if (!searchText.trim()) return;

    setLoading(true);

    try {
      // 1. Embed query locally in browser
      const vector = await embedQuery(searchText);

      // 2. Send vector to Supabase search route
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vector }),
      });

      const data = await res.json();
      setResults(data.data || []);
    } catch (err) {
      console.error("Search error:", err);
    }

    setLoading(false);
  }

  return (
    <div className="w-full max-w-2xl mx-auto mt-10">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchText}
          placeholder="Search MTG cards… (e.g. counter spell, draw cards, artifact hate)"
          onChange={(e) => setSearchText(e.target.value)}
          className="flex-1 p-3 rounded-md border border-gray-700 bg-gray-900 text-white"
        />

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {/* Results */}
      <div className="mt-6 space-y-4">
        {results.map((card) => (
          <div
            key={card.uuid}
            className="p-4 rounded-md bg-gray-800 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">{card.name}</h3>
              <span className="text-sm text-gray-400">
                {(card.similarity * 100).toFixed(0)}%
              </span>
            </div>

            <p className="text-gray-300 text-sm mt-1">{card.type}</p>

            {card.text && (
              <p className="text-gray-400 text-sm mt-2 whitespace-pre-line">
                {card.text}
              </p>
            )}
          </div>
        ))}

        {!loading && results.length === 0 && searchText && (
          <p className="text-gray-500 mt-4 text-center">No results found.</p>
        )}
      </div>
    </div>
  );
}
