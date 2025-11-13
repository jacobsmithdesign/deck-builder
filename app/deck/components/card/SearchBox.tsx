import { Button } from "@/app/components/ui/button";
import { CommanderCard } from "@/app/context/CommanderContext";
import { CardResult, searchCardForDeck } from "@/lib/db/searchCardForDeck";
import { useEffect, useRef, useState } from "react";
import { AiOutlineLoading } from "react-icons/ai";
import { RxMagnifyingGlass } from "react-icons/rx";

export default function SearchBox() {
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<CardResult[]>();
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState<boolean>(true);
  const modalRef = useRef<HTMLDivElement>(null);

  const closeSearchResults = () => {
    setSearchResults(null);
    setShowResults(false);
  };

  const handleSearch = () => {
    if (searchTerm.length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }
    (async () => {
      try {
        setIsSearching(true);
        const results = await searchCardForDeck(searchTerm);
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.error(error);
        setShowResults(false);
      } finally {
        setIsSearching(false);
      }
    })();
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleSearch();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If the click happened *outside* the component, close it.
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setShowResults(false); // <-- hide the whole search bar
      }
    };

    // Register the listener once, clean it up on unmount.
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []); // ← empty deps → runs only on mount/unmount
  return (
    <div>
      <div
        ref={modalRef}
        className="h-full flex md:flex-row flex-col items-center"
      >
        <div className="relative w-72">
          {/* User input field for searching commanders */}
          <div className="relative flex items-center">
            <input
              placeholder="Search for new cards"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-2 rounded-md w-full bg-dark/5 shadow-inner resize-none h-7"
            />
            {!isSearching ? (
              <button
                onClick={handleSearch}
                className="cursor-pointer absolute right-0 border-l rounded-r-md px-2 border-dark/10 md:hover:bg-light w-9 h-7"
              >
                <RxMagnifyingGlass className=" w-5 h-5 text-dark/60" />
              </button>
            ) : (
              <AiOutlineLoading className="absolute w-7 h-5 pl-1 right-1 text-dark/60 border-l " />
            )}
          </div>

          {/* Dropdown of filtered commander results from Scryfall */}
          {searchResults && showResults && (
            <ul className="absolute z-50 w-full flex flex-col gap-1 p-1 bg-light/40 border border-t-0 border-light/30 backdrop-blur-md rounded-b-lg overflow-clip mt-1">
              {searchResults.map((card) => (
                <li
                  key={`${card.uuid}`}
                  className="px-2 py-1 hover:bg-light cursor-pointer rounded-md bg-light/60"
                  onClick={() => {
                    setSearchResults([]);
                  }}
                >
                  <div className="flex flex-col text-left">
                    <span className="font-medium">{card.name}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Displays while a fetch is in progress */}
      </div>
    </div>
  );
}
