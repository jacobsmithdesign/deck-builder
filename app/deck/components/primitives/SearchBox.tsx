import { useEffect, useRef, useState } from "react";
import { AiOutlineLoading } from "react-icons/ai";
import { RxMagnifyingGlass } from "react-icons/rx";
import { AnimatePresence, motion } from "framer-motion";

import CustomScrollArea from "@/app/components/ui/CustomScrollArea";
import { useCardList } from "@/app/context/CardListContext";
import { useEditMode } from "@/app/context/editModeContext";
import {
  CardResult,
  searchCardForDeck,
  selectCardDataFromId,
} from "@/lib/db/searchCardForDeck";

/**
 * A search box component that takes a search function and returns its results in an array.
 * Function must return an array of objects containing at least a uuid and card name
 * @param searchFunction A custom asynchronous function that should take a string input and return an array of card results
 * @param selectFunction A custom asynchronous function that returns on item selection.
 */
export default function SearchBox({
  searchFunction,
  selectFunction,
  placeholder,
}: {
  searchFunction: (searchTerm?: string) => Promise<CardResult[]>;
  selectFunction: (uuid?: string) => Promise<void>;
  placeholder: string;
}) {
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<CardResult[]>();
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState<boolean>(true);

  const modalRef = useRef<HTMLDivElement>(null);

  const searchBarRef = useRef<HTMLInputElement>(null);

  // Function for searching and handling isSearching and showResults states
  const handleSearch = () => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    (async () => {
      try {
        setIsSearching(true);
        const results = await searchFunction(searchTerm);
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

  // auto search when input receives value
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleSearch();
    }, 400);

    return () => clearTimeout(delayDebounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Close the results window when focus is lost
  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;

      const clickedInSearch = searchBarRef.current?.contains(target) ?? false;

      const clickedInResults = modalRef.current?.contains(target) ?? false;

      if (clickedInSearch || clickedInResults) {
        setShowResults(true);
      } else {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  // Function for closing the search box

  const handleSelect = (uuid: string) => {
    selectFunction(uuid);
    setSearchTerm("");
    setSearchResults(null);
    setShowResults(false);
  };

  return (
    <div className="pointer-events-none relative z-10 w-64">
      <motion.div
        ref={modalRef}
        className="pointer-events-auto rounded-xl top-0.5 p-0.5"
      >
        {/* Header / input row */}
        <div className="flex items-center w-64">
          <span className="absolute left-1.5 flex items-center justify-center">
            {isSearching ? (
              <AiOutlineLoading className="w-4 h-4 animate-spin text-dark/60" />
            ) : (
              <RxMagnifyingGlass className="w-4 h-4 text-dark/60" />
            )}
          </span>
          <input
            ref={searchBarRef}
            placeholder={placeholder}
            value={searchTerm ?? ""}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              // if we already have results, just show them
              if (searchResults) setShowResults(true);
              // if we don't, but we have a term, re-run the search
              if ((searchTerm?.length ?? 0) >= 2 && !searchResults)
                handleSearch();
            }}
            className="pl-7 pr-2 py-1.5 rounded-lg w-full bg-dark/5 shadow-inner resize-none h-6.5 text-base text-dark placeholder:text-dark/40 outline-none "
          />
        </div>

        {/* Results list */}
        <AnimatePresence>
          {searchResults && showResults && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, height: 0, marginTop: 0 }}
              animate={{
                opacity: 1,
                scale: 1,
                height: "auto",
                marginTop: 6,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                height: 0,
                marginTop: 0,
                transition: { type: "linear", duration: 0.2 },
              }}
              transition={{ type: "linear", duration: 0.2 }}
              className="rounded-lg overflow-hidden bg-gradient-to-t from-light/20 to-light/40 backdrop-blur-sm border border-light/30 shadow-inner shadow-light/60 absolute w-full"
            >
              <CustomScrollArea
                className={`${
                  searchResults.length < 11 ? "h-fit" : "h-72 pr-1"
                } flex flex-col px-1`}
                trackClassName={`${
                  searchResults.length < 11
                    ? "mr-0 my-0"
                    : "bg-dark/20 rounded-xs outline outline-dark/20 w-2 mr-1 my-1 rounded-r-sm"
                }`}
                thumbClassName="bg-light/60 rounded-xs "
                hideCustomScrollbar={searchResults.length < 11}
                autoHide={false}
              >
                <div className="flex flex-col py-1">
                  <AnimatePresence>
                    {[...searchResults].map((card, index) => (
                      <motion.button
                        key={card.uuid}
                        type="button"
                        initial={{
                          opacity: 0,
                          scale: 0.8,
                          height: 0,
                          marginBottom: 0,
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          height: 28,
                          transition: { delay: index * 0.03 },
                        }}
                        exit={{
                          opacity: 0,
                          scale: 0.85,
                          height: 0,
                          marginBottom: 0,
                          transition: {
                            type: "linear",
                            delay: 0,
                            duration: 0.2,
                          },
                        }}
                        transition={{
                          type: "linear",
                          delay: 0,
                          duration: 0.2,
                        }}
                        className={`${index === 0 && "rounded-t-md"} ${
                          index === searchResults.length - 1 && "rounded-b-md"
                        } relative group  text-base w-full h-6 items-center flex text-dark md:hover:text-light border gap-2 px-2 transition-colors duration-150 bg-light/70 border-dark/20 md:hover:bg-green-600/80 shadow-inner md:hover:shadow-light/0 shadow-light/30 cursor-pointer overflow-clip`}
                        onClick={() => handleSelect(card.uuid)}
                      >
                        <p className="md:group-hover:opacity-100 opacity-0 transition-all duration-250 ease-out md:group-hover:translate-x-0 -translate-x-2 text-sm absolute ">
                          Add
                        </p>
                        <span className="md:group-hover:ml-8 transition-all duration-250 ease-out text-ellipsis whitespace-nowrap overflow-hidden block mr-2 text-sm">
                          {card.name}
                        </span>
                      </motion.button>
                    ))}
                    {searchResults.length === 0 && (
                      <p className="text-left pl-1">No results found</p>
                    )}
                  </AnimatePresence>
                </div>
              </CustomScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
