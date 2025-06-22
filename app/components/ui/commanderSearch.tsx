"use client";

import { useEffect, useState } from "react";
import { CardContent } from "@/app/components/ui/card";
import { supabase } from "@/lib/supabaseClient";

/**
 * CommanderSearch allows users to search for a commander (legendary creature)
 * using the Scryfall API. Once a commander is selected, their name is passed
 * to the parent component via the `onSelect` callback.
 */
export default function CommanderSearch({
  onSelect,
}: {
  onSelect: (commanderName: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  /**
   * This effect triggers whenever `searchTerm` changes.
   * It waits 400ms after the user stops typing (debounce),
   * then queries the Scryfall API for legendary creatures.
   */
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);

      fetch(
        `https://api.scryfall.com/cards/search?q=${encodeURIComponent(
          `type:legendary type:creature ${searchTerm}`
        )}`
      )
        .then((res) => res.json())
        .then((data) => {
          const commanders = data.data?.filter(
            (card: any) =>
              card.type_line?.toLowerCase().includes("legendary") &&
              card.type_line?.toLowerCase().includes("creature")
          );

          setSearchResults(commanders);
        })
        .catch(console.error)
        .finally(() => setIsSearching(false));
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  return (
    <CardContent>
      <div className="h-full flex md:flex-row flex-col items-center">
        <div className="relative w-full">
          {/* User input field for searching commanders */}
          <input
            placeholder="Enter a commander name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 rounded-md w-full bg-light/60 shadow-inner resize-none md:mr-4 mb-2 md:mb-0"
          />

          {/* Dropdown of filtered commander results from Scryfall */}
          {searchResults.length > 0 && (
            <ul className="absolute z-50 w-full bg-light shadow border rounded-xl overflow-clip">
              {searchResults.map((card) => (
                <li
                  key={card.id}
                  className="p-2 hover:bg-lightsecondary/20 cursor-pointer"
                  onClick={() => {
                    onSelect(card.name);
                    setSearchTerm(card.name);
                    setSearchResults([]);
                  }}
                >
                  {card.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Displays while a fetch is in progress */}
        {isSearching && (
          <p className="text-sm text-gray-400 mt-1">Searching...</p>
        )}
      </div>
    </CardContent>
  );
}
