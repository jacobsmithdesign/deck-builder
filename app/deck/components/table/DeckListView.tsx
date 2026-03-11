"use client";

import { useCardList } from "@/app/context/CardListContext";
import { useCompactView } from "@/app/context/compactViewContext";
import { useEditMode } from "@/app/context/editModeContext";
import {
  useDeckView,
  type DeckSortOption,
} from "@/app/context/DeckViewContext";
import { useFilteredCards } from "@/app/hooks/useFilteredCards";
import { useDifferingCardUuids } from "@/app/hooks/useDifferingCardUuids";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import NewCardModal from "../card/NewCardModal";
import { cn } from "@/lib/utils";
import { ManaCost } from "@/app/components/ui/manaCost";
import {
  BoardContent,
  Group,
  GroupHeader,
  GroupItems,
  GroupTitle,
} from "../primitives/Board";
import { CardRecord } from "@/lib/schemas";
import type { DeckMetadata } from "@/app/context/CardListContext";

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

const groupByCardType = (cards: CardRecord[] = []) => {
  const grouped: Record<string, CardRecord[]> = {};

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

const sortGroupCards = (
  cards: CardRecord[] = [],
  sortOption: DeckSortOption,
) => {
  if (sortOption === "deck") return cards;

  const sorted = [...cards];

  sorted.sort((a, b) => {
    const nameA = a.name ?? "";
    const nameB = b.name ?? "";
    const manaA =
      typeof a.mana_value === "number"
        ? a.mana_value
        : Number.POSITIVE_INFINITY;
    const manaB =
      typeof b.mana_value === "number"
        ? b.mana_value
        : Number.POSITIVE_INFINITY;

    switch (sortOption) {
      case "name-asc":
        return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
      case "name-desc":
        return nameB.localeCompare(nameA, undefined, { sensitivity: "base" });
      case "mana-asc":
        if (manaA === manaB) {
          return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
        }
        return manaA - manaB;
      case "mana-desc":
        if (manaA === manaB) {
          return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
        }
        return manaB - manaA;
      default:
        return 0;
    }
  });

  return sorted;
};

type GroupedType = ReturnType<typeof groupByCardType>[number];

type Column = {
  id: string;
  groups: GroupedType[];
};

/**
 * Partition groups (in type order) into K columns with balanced card counts.
 * numColumns is the desired column count (2–8 from viewport). Uses binary
 * search + greedy assignment so two large stacks aren't put together.
 */
const buildColumns = (groups: GroupedType[], numColumns: number): Column[] => {
  if (groups.length === 0) return [];
  const n = groups.length;
  const K = Math.min(Math.max(1, numColumns), n);
  const M = Math.ceil(n / K);
  const sizes = groups.map((g) => g.cards.length);
  const total = sizes.reduce((a, b) => a + b, 0);
  const maxSize = Math.max(...sizes, 1);

  const canPartition = (maxSum: number): boolean => {
    let i = 0;
    for (let col = 0; col < K && i < n; col++) {
      let count = 0;
      let sum = 0;
      while (i < n && count < M && sum + sizes[i] <= maxSum) {
        sum += sizes[i];
        count++;
        i++;
      }
      if (count === 0) return false;
    }
    return i === n;
  };

  let lo = Math.max(maxSize, Math.ceil(total / K));
  let hi = total;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (canPartition(mid)) hi = mid;
    else lo = mid + 1;
  }

  const columns: Column[] = [];
  let i = 0;
  for (let col = 0; col < K && i < n; col++) {
    let count = 0;
    let sum = 0;
    const start = i;
    const isLastCol = col === K - 1;
    while (i < n && count < M) {
      if (count > 0 && sum + sizes[i] > lo && !isLastCol) break;
      sum += sizes[i];
      count++;
      i++;
    }
    if (count === 0 && i < n) {
      count = 1;
      i++;
    }
    const chunk = groups.slice(start, start + count);
    columns.push({
      id: chunk.map((g) => g.type).join("-"),
      groups: chunk,
    });
  }
  return columns;
};

type CardWithImage = CardRecord & { imageFrontUrl?: string | null };

export type DeckListViewSlotProps = {
  slotCards?: CardRecord[];
  slotDeck?: DeckMetadata | null;
  isComparisonSlot?: boolean;
  otherSlotCards?: CardRecord[];
};

const DIFF_CARD_CLASS =
  "bg-yellow-500/50 md:hover:bg-yellow-300/50 outline outline-yellow-500/50 opacity-90";

export const DeckListView = (props: DeckListViewSlotProps = {}) => {
  const { slotCards, slotDeck, isComparisonSlot, otherSlotCards } = props;
  const { editMode } = useEditMode();
  const { cards, changesMadeState, newlyAddedCardUuids } = useCardList();
  const cardsToUse = slotCards ?? cards;
  const filteredCards = useFilteredCards(cardsToUse);
  const differingCardUuids = useDifferingCardUuids(cardsToUse, otherSlotCards);
  const showEditControls = editMode && !isComparisonSlot;
  const { sortOption } = useDeckView();
  const [visibleGroups, setVisibleGroups] = useState<Set<string>>(new Set());
  const [openNewCardModal, setOpenNewCardModal] = useState(false);
  const [newCardType, setNewCardType] = useState<string>("");
  const { bgColor } = useCompactView();
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const { comparisonDeck, comparisonCards } = useCardList();
  const hasComparison = !!comparisonDeck && comparisonCards.length >= 0;

  const groupedCardsArray = useMemo(() => {
    const groups = groupByCardType(filteredCards);
    return groups.map((group) => ({
      ...group,
      cards: sortGroupCards(group.cards, sortOption),
    }));
  }, [filteredCards, sortOption]);

  const allTypes = useMemo(
    () => groupedCardsArray.map((g) => g.type),
    [groupedCardsArray],
  );

  useEffect(() => {
    setVisibleGroups(new Set(allTypes));
  }, [allTypes, changesMadeState]);

  const toggleGroupVisibility = (type: string) => {
    setVisibleGroups((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const showAllGroups = (types: string[]) => {
    setVisibleGroups(new Set(types));
  };

  useEffect(() => {
    showAllGroups(allTypes);
  }, [allTypes]);

  const columns = useMemo(() => {
    if (viewportWidth === null) {
      return buildColumns(groupedCardsArray, 4);
    }
    let numColumns: number;
    if (hasComparison) {
      if (viewportWidth < 1200) numColumns = 1;
      else if (viewportWidth < 2000) numColumns = 2;
      else if (viewportWidth < 2600) numColumns = 3;
      else if (viewportWidth < 2950) numColumns = 4;
      else if (viewportWidth < 3350) numColumns = 5;
      else if (viewportWidth < 3600) numColumns = 6;
      else if (viewportWidth < 3800) numColumns = 7;
      else numColumns = 8;
      return buildColumns(groupedCardsArray, numColumns);
    } else {
      if (viewportWidth < 890) numColumns = 1;
      else if (viewportWidth < 1150) numColumns = 2;
      else if (viewportWidth < 1400) numColumns = 3;
      else if (viewportWidth < 1650) numColumns = 4;
      else if (viewportWidth < 1850) numColumns = 5;
      else if (viewportWidth < 2100) numColumns = 6;
      else if (viewportWidth < 2300) numColumns = 7;
      else numColumns = 8;
      return buildColumns(groupedCardsArray, numColumns);
    }
  }, [groupedCardsArray, viewportWidth]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setViewportWidth(window.innerWidth);
    setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleNewCardModal = (type?: string) => {
    if (type) setNewCardType(type);
    setOpenNewCardModal((prev) => !prev);
  };

  useEffect(() => {
    if (!showEditControls) {
      setOpenNewCardModal(false);
    }
  }, [showEditControls]);

  return (
    <section id="deck-list-view">
      <AnimatePresence>
        <BoardContent
          style={{ background: bgColor }}
          className="hide-scrollbar transition-all duration-700 justify-center items-center relative rounded-t-none rounded-xl"
        >
          {showEditControls && (
            <div className="z-50 h-full w-full pointer-events-none">
              <NewCardModal
                closeModal={toggleNewCardModal}
                showModal={openNewCardModal}
                cardType={newCardType}
              />
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full bg-light/50 rounded-xl"
          >
            <div
              className="grid items-start px-2 pb-2 gap-3"
              style={{
                gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
              }}
            >
              {columns.map((column, columnIndex) => (
                <div key={column.id} className="min-w-0 overflow-visible">
                  {[...column.groups]
                    .sort((a, b) => a.cards.length - b.cards.length)
                    .map((group, groupIndex) => (
                      <Group
                        key={`${group.type}-${columnIndex}-${groupIndex}`}
                        className="mb-2"
                      >
                        <GroupHeader
                          className={`${
                            columnIndex === 0 && groupIndex === 0
                              ? "border-t-0"
                              : ""
                          } py-2`}
                        >
                          <GroupTitle
                            type={group.type}
                            count={group.cards.length}
                            visibleGroups={visibleGroups}
                            toggleGroupVisibility={toggleGroupVisibility}
                          />
                        </GroupHeader>

                        <AnimatePresence>
                          {visibleGroups.has(group.type) && (
                            <motion.section
                              id={group.type}
                              key={`group-${group.type}`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{
                                height: {
                                  duration: 0.2 + 0.015 * group.cards.length,
                                  ease: "easeInOut",
                                },
                              }}
                              className="flex flex-col w-full min-w-0  px-1"
                            >
                              <GroupItems
                                key="group-items"
                                className="mt-2 flex flex-col gap-1 w-full min-w-0 shrink-0"
                              >
                                {group.cards.map((card, cardIndex) => {
                                  const c = card as CardWithImage;
                                  const cardId =
                                    (c as CardWithImage & { id?: string }).id ??
                                    c.uuid;
                                  const previewHeight = 380;
                                  const previewWidth =
                                    (previewHeight * 488) / 680;
                                  const isLastColumn =
                                    columnIndex === columns.length - 1;
                                  return (
                                    <motion.div
                                      key={cardId}
                                      initial={{ opacity: 0, x: -8 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{
                                        opacity: 0,
                                        x: -8,
                                        transition: { duration: 0.15 },
                                      }}
                                      transition={{
                                        type: "spring",
                                        stiffness: 250,
                                        damping: 12,
                                        delay: 0.1 + 0.025 * cardIndex,
                                      }}
                                      className={cn(
                                        "group/card flex justify-between w-full py-1 px-2 rounded-lg md:hover:bg-light/15 transition-colors duration-150 relative cursor-pointer",
                                        differingCardUuids.has(c.uuid) &&
                                          DIFF_CARD_CLASS,
                                        !differingCardUuids.has(c.uuid) &&
                                          newlyAddedCardUuids.has(c.uuid) &&
                                          "bg-green-500/50 md:hover:bg-green-300/50 outline outline-green-500/50 dark:bg-green-900/30",
                                      )}
                                      style={{
                                        ["--preview-w" as string]: `${previewWidth + 8}px`,
                                      }}
                                    >
                                      <div className="flex items-center gap-2 min-w-0 ">
                                        <span className="font-medium text-dark truncate md:text-base text-sm">
                                          {card.name ?? "Unknown"}
                                        </span>
                                        {card.count > 1 && (
                                          <span className="shrink-0 text-muted-foreground font-semibold text-xs bg-dark/10 px-1.5 py-0.5 rounded">
                                            ×{card.count}
                                          </span>
                                        )}
                                      </div>
                                      <div className="shrink-0 flex items-center justify-end w-10">
                                        <ManaCost
                                          manaCost={card.mana_cost}
                                          colorIdentity={card.color_identity}
                                          size="md"
                                        />
                                      </div>
                                      {c.imageFrontUrl && (
                                        <div
                                          className={cn(
                                            "pointer-events-none absolute  z-1 rounded-2xl shadow-xl opacity-0 transition-opacity duration-150 group-hover/card:opacity-100",
                                            isLastColumn
                                              ? "right-full mr-2"
                                              : "left-full ml-2",
                                          )}
                                          style={{
                                            width: `${previewWidth}px`,
                                            height: `${previewHeight}px`,
                                          }}
                                        >
                                          <Image
                                            src={c.imageFrontUrl}
                                            width={488}
                                            height={680}
                                            alt=""
                                            className="object-cover w-full h-full rounded-lg"
                                          />
                                        </div>
                                      )}
                                    </motion.div>
                                  );
                                })}
                              </GroupItems>
                            </motion.section>
                          )}
                        </AnimatePresence>
                      </Group>
                    ))}
                </div>
              ))}
            </div>
          </motion.div>
        </BoardContent>
      </AnimatePresence>
    </section>
  );
};
