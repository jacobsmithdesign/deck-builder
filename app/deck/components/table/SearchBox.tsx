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

export default function SearchBox() {
  const { setEditMode } = useEditMode();
  const { addCard } = useCardList();

  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<CardResult[]>();
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState<boolean>(true);

  const modalRef = useRef<HTMLDivElement>(null);

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
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Function for closing the search box
  const closeSearchResults = () => {
    setSearchResults(null);
    setShowResults(false);
  };

  // Function for selecting a search result and adding it to the deck
  const handleSelectResult = async (uuid: string) => {
    setSearchTerm("");
    setEditMode(true);
    const card = await selectCardDataFromId(uuid);
    addCard(card);
    closeSearchResults();
  };

  return (
    <div className="pointer-events-none z-50">
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.9, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -4 }}
        transition={{ type: "spring", stiffness: 250, damping: 30 }}
        className="pointer-events-auto w-72 rounded-xl absolute -translate-x-36 top-0.5 p-0.5"
      >
        {/* Header / input row */}
        <div className="relative flex items-center ">
          <span className="absolute left-1.5 flex items-center justify-center">
            {isSearching ? (
              <AiOutlineLoading className="w-4 h-4 animate-spin text-dark/60" />
            ) : (
              <RxMagnifyingGlass className="w-4 h-4 text-dark/60" />
            )}
          </span>
          <input
            placeholder="Search for new cards"
            value={searchTerm ?? ""}
            onChange={(e) => setSearchTerm(e.target.value)}
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
              className="rounded-lg overflow-hidden bg-gradient-to-t from-light/20 to-light/40 backdrop-blur-sm border border-light/30 shadow-inner shadow-light/60 "
            >
              <CustomScrollArea
                className={`${
                  searchResults.length < 11 ? "h-fit" : "h-72 pr-3"
                } flex flex-col px-1`}
                trackClassName={`${
                  searchResults.length < 11
                    ? "mr-0 my-0"
                    : "bg-dark/20 rounded-xs outline outline-dark/20 w-2 mr-2 my-2 rounded-br-sm"
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
                        onClick={() => handleSelectResult(card.uuid)}
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
