"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useUser } from "@/app/context/userContext";
import { useCommander } from "@/app/context/CommanderContext";
import { searchCardsWithFilters } from "@/lib/db/searchCardsWithFilters";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { AnimatedButton } from "../AnimatedButton";
import { Group, GroupHeader, GroupItems } from "./Board";
import { GroupTitle } from "./Board";
import { FilterPanel } from "./FilterPanel";
import { filterConfigByCardType } from "@/lib/utils";
import { useCardList } from "@/app/context/CardListContext";
import { CardRecord } from "@/lib/schemas";
import {
  RxCheck,
  RxCross1,
  RxCross2,
  RxOpenInNewWindow,
  RxPlus,
  RxSize,
  RxSquare,
} from "react-icons/rx";

export default function NewCardModal({
  closeModal,
  showModal,
  cardType,
}: {
  closeModal: () => void;
  showModal: boolean;
  cardType: string;
}) {
  const { commanderCard } = useCommander();
  const { addCard } = useCardList();
  const [cards, setCards] = useState<any[]>([]);
  const [cardNameSearch, setcardNameSearch] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [selectedCards, setSelectedCards] = useState<any[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  const [maximise, setMaximise] = useState<boolean>(false);
  const [changingSize, setChangingSize] = useState<boolean>(false);
  const PAGE_SIZE = 90;

  const dynamicFilterConfig = useMemo(() => {
    return filterConfigByCardType[cardType] || {};
  }, [cardType]);

  const toggleSelectedCards = (card: CardRecord) => {
    setSelectedCards((prev) => {
      const exists = prev.some((c) => c.uuid === card.uuid);
      return exists
        ? prev.filter((c) => c.uuid !== card.uuid)
        : [...prev, card];
    });
  };

  const handleSearch = async (requestedPage = 0) => {
    if (!commanderCard?.colorIdentity?.length || !cardType) return;
    setLoading(true);
    try {
      // These constants activate the filters when selected to stop empty data going to the query
      const activeColorIdentity =
        filters.colorIdentity?.length > 0 ? filters.colorIdentity : undefined;
      const activateRarity = filters.rarity?.[0];
      const suggestions = await searchCardsWithFilters({
        type: cardType,
        page: requestedPage,
        name: cardNameSearch,
        commanderColors: commanderCard.colorIdentity,
        pageSize: PAGE_SIZE,
        ...filters,
        colorIdentity: activeColorIdentity,
        rarity: activateRarity,
        debug: true,
      });
      setCards((prev) =>
        requestedPage === 0 ? suggestions : [...prev, ...suggestions]
      );
      setHasMore(suggestions.length > 0);
    } catch (e) {
      console.error("Search failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showModal && commanderCard?.colorIdentity?.length) {
      setCards([]);
      setPage(0);
      handleSearch(0);
    }
  }, [showModal, commanderCard, filters]);

  useEffect(() => {
    if (page === 0 || !showModal) return;
    handleSearch(page);
  }, [page]);

  useEffect(() => {
    const current = loadMoreRef.current;
    if (!current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1 }
    );

    observer.observe(current);
    return () => {
      if (current) observer.unobserve(current);
    };
  }, [loadMoreRef.current, hasMore, loading, cards.length]);

  const handleSaveClick = async () => {
    setSaving(true);
    selectedCards.forEach((card) => addCard(card));
    setSelectedCards([]);
    closeModal();
    setSaving(false);
  };

  const toggleMaximise = () => {
    setChangingSize(true);
    setTimeout(() => {
      setMaximise((prev) => !prev);
    }, 80);

    setTimeout(() => {
      setChangingSize(false);
    }, 450);
  };
  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          key="newCardModal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            backdropFilter: "blur(0px)",
            transition: { duration: 0.1 },
          }}
          transition={{ duration: 0.2 }}
          className="z-20 h-full w-full flex pointer-events-auto bg-dark/40"
        >
          <button
            className="shadow-none w-full h-full absolute z-0"
            onClick={closeModal}
          />

          <motion.div
            initial={{ width: 0, backdropFilter: "blur(0px)" }}
            animate={{
              width: maximise ? "50%" : "100%",
              backdropFilter: "blur(7px)",
            }}
            exit={{ width: 0, backdropFilter: "blur(7px)" }}
            transition={{ type: "spring", stiffness: 250, damping: 25 }}
            className="z-50 bg-light/60 flex flex-col p-2  drop-shadow-xl h-full"
          >
            <div className="">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Search ${cardType}s`}
                  value={cardNameSearch}
                  onChange={(e) => setcardNameSearch(e.target.value)}
                  className="w-full px-3 py-1 bg-light/80 rounded-md mb-2"
                />
                <button
                  className="transition-all duration-100 rounded-md cursor-pointer md:hover:bg-light  bg-light/40 w-8 h-8 flex justify-center items-center"
                  onClick={toggleMaximise}
                >
                  <RxSize />
                </button>
                <button
                  className="transition-all duration-100 rounded-md cursor-pointer md:hover:bg-red-600/60 md:hover:text-light bg-light/40 w-8 h-8 flex justify-center items-center"
                  onClick={closeModal}
                >
                  <RxCross2 />
                </button>
              </div>
              <div className="flex">
                {Object.entries(dynamicFilterConfig).map(([key, config]) => (
                  <FilterPanel
                    key={key}
                    label={config.label}
                    options={config.options}
                    selected={filters[key] || []}
                    isSingle={config.isSingle}
                    onChange={(updated) =>
                      setFilters((prev) => ({ ...prev, [key]: updated }))
                    }
                  />
                ))}
              </div>
            </div>
            <div className="overflow-y-scroll hide-scrollbar rounded-md h-fit">
              <Group>
                <AnimatePresence>
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{
                      height: 0,
                      opacity: 0,
                      transition: { duration: 0.15, delay: 0 },
                    }}
                  >
                    <GroupItems
                      className={`grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2 text-center hide-scrollbar ${
                        changingSize ? "opacity-0" : "opacity-100"
                      }  transition-all duration-100`}
                    >
                      {loading && cards.length === 0 ? (
                        <p>Loading cards...</p>
                      ) : (
                        <>
                          {cards
                            .filter((card) =>
                              card.name
                                ?.toLowerCase()
                                .includes(cardNameSearch.toLowerCase())
                            )
                            .map((card, index) => (
                              <motion.div
                                key={card.uuid}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{
                                  opacity: 0,
                                  scale: 0.95,
                                  transition: { delay: 0, duration: 0.1 },
                                }}
                                transition={{
                                  duration: 0.25,
                                  delay: index * 0.02,
                                }}
                                className={`relative rounded-xl cursor-pointer overflow-clip `}
                                onClick={() => toggleSelectedCards(card)}
                              >
                                <div
                                  className={`transition-all absolute w-full h-full flex z-10 bg-green-500/30 justify-end pr-1 pt-1 ${
                                    selectedCards.some(
                                      (c) => c.uuid === card.uuid
                                    )
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                >
                                  <div className="w-6 h-6 rounded-lg bg-green-400 flex justify-center items-center">
                                    <RxCheck className="text-light" />
                                  </div>
                                </div>
                                <Image
                                  height={150}
                                  width={225}
                                  alt={card.name || "Card image"}
                                  src={card.imageFrontUrl}
                                  className="rounded-md min-w-20 drop-shadow-xl z-0"
                                />
                              </motion.div>
                            ))}

                          <div ref={loadMoreRef} className="h-1 bottom-0 " />
                        </>
                      )}
                    </GroupItems>
                  </motion.div>
                </AnimatePresence>
              </Group>
            </div>

            {/* This is the bottom section where the selected cards are displayed along with the Add cards button */}

            <AnimatePresence>
              <motion.div
                key="selected-card-bar"
                initial={{ height: 0, opacity: 0 }}
                animate={
                  selectedCards.length > 0
                    ? { height: "auto", opacity: 1 }
                    : { height: 0, opacity: 0 }
                }
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="flex flex-col gap-2  z-10"
              >
                {selectedCards.length > 0 && (
                  <div className="flex justify-between gap-2 mt-2">
                    {/* Card miniview */}
                    <div className="flex gap-1 flex-wrap">
                      {selectedCards.map((card, index) => (
                        <motion.div
                          key={card.uuid}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{
                            opacity: 0,
                            scale: 0,
                            transition: { delay: 0, duration: 0.15 },
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 650,
                            damping: 20,
                            delay: 0.03 * index,
                          }}
                          className="bg-darksecondary/20 rounded-md px-2 pr-0 cursor-default flex gap-2"
                        >
                          <p>{card.name}</p>
                          <button
                            className="cursor-pointer rounded-md rounded-l-none md:hover:bg-light/60"
                            onClick={() => toggleSelectedCards(card)}
                          >
                            <RxCross2 className="w-6" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                    <div className="flex gap-2 items-end">
                      <AnimatedButton
                        className="shadow-none px-2 h-6"
                        onClick={() => setSelectedCards([])}
                        title="Cancel"
                      />
                      <button
                        disabled={loading}
                        className="text-sm rounded-md h-6 w-26 cursor-pointer bg-green-500 md:hover:bg-light md:hover:text-green-600 transition-all duration-100 text-light flex justify-center items-center gap-2"
                        onClick={handleSaveClick}
                      >
                        <RxPlus />
                        <p>Add cards</p>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
