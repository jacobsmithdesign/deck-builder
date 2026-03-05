"use client";

import { useCardList } from "@/app/context/CardListContext";
import { useCompactView } from "@/app/context/compactViewContext";
import { useEditMode } from "@/app/context/editModeContext";
import {
  useDeckView,
  type DeckSortOption,
} from "@/app/context/DeckViewContext";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import NewCardModal from "../card/NewCardModal";
import {
  BoardContent,
  Group,
  GroupHeader,
  GroupItems,
  GroupTitle,
} from "../primitives/Board";
import { CardRecord } from "@/lib/schemas";
import { cn } from "@/lib/utils";

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

export const DeckStackedListView = () => {
  const { editMode } = useEditMode();
  const { cards, changesMadeState } = useCardList();
  const { sortOption } = useDeckView();
  const [visibleGroups, setVisibleGroups] = useState<Set<string>>(new Set());
  const [openNewCardModal, setOpenNewCardModal] = useState(false);
  const [newCardType, setNewCardType] = useState<string>("");
  const { bgColor } = useCompactView();
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);

  const groupedCardsArray = useMemo(() => {
    const groups = groupByCardType(cards);
    return groups.map((group) => ({
      ...group,
      cards: sortGroupCards(group.cards, sortOption),
    }));
  }, [cards, sortOption]);

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
    if (viewportWidth < 890) numColumns = 1;
    else if (viewportWidth < 1150) numColumns = 2;
    else if (viewportWidth < 1400) numColumns = 3;
    else if (viewportWidth < 1650) numColumns = 4;
    else if (viewportWidth < 1600) numColumns = 5;
    else if (viewportWidth < 2000) numColumns = 6;
    else if (viewportWidth < 2300) numColumns = 7;
    else numColumns = 8;
    return buildColumns(groupedCardsArray, numColumns);
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
    if (!editMode) {
      setOpenNewCardModal(false);
    }
  }, [editMode]);

  return (
    <section id="deck-stacked-list-view">
      <AnimatePresence>
        <BoardContent
          style={{ background: bgColor }}
          className="hide-scrollbar transition-all duration-700 justify-center items-center relative rounded-t-none rounded-xl"
        >
          <div className="z-50 h-full w-full pointer-events-none">
            <NewCardModal
              closeModal={toggleNewCardModal}
              showModal={openNewCardModal}
              cardType={newCardType}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full bg-light/50 rounded-xl"
          >
            <div
              className="grid items-start pb-2"
              style={{
                gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
              }}
            >
              {columns.map((column, columnIndex) => (
                <div
                  key={column.id}
                  className="w-full max-w-72 px-2 overflow-visible"
                >
                  {column.groups.map((group, groupIndex) => (
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
                            className="overflow-visible flex justify-center"
                          >
                            <GroupItems
                              key="group-items"
                              className="mt-2 flex flex-col gap-0  rounded-xl overflow-visible"
                            >
                              {group.cards.map((card, cardIndex) => {
                                const c = card as CardWithImage;
                                const cardId =
                                  (c as CardWithImage & { id?: string }).id ??
                                  c.uuid;
                                const isExpanded =
                                  cardIndex === group.cards.length - 1;
                                const previewHeight = 320;
                                const previewWidth =
                                  (previewHeight * 488) / 680;
                                const isLastColumn =
                                  columnIndex === columns.length - 1;
                                return (
                                  <motion.div
                                    key={cardId}
                                    initial={{ opacity: 0, scale: 0.7 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{
                                      opacity: 0,
                                      transition: { duration: 0.15 },
                                    }}
                                    transition={{
                                      type: "spring",
                                      stiffness: 250,
                                      damping: 12,
                                      delay: 0.01 * cardIndex,
                                    }}
                                    className={cn(
                                      "group/card flex items-center rounded-xl transition-colors duration-150 border-b border-dark/5 last:border-b-0 relative",
                                    )}
                                    style={{
                                      ["--preview-w" as string]: `${previewWidth + 8}px`,
                                    }}
                                  >
                                    <div
                                      className={cn(
                                        "relative shrink-0 rounded-xl max-w-60",
                                        isExpanded ? "h-full" : "h-9",
                                      )}
                                    >
                                      {c.imageFrontUrl ? (
                                        <Image
                                          src={c.imageFrontUrl}
                                          width={488}
                                          height={680}
                                          alt=""
                                          className={cn(
                                            "object-cover w-fit object-top rounded-xl h-fit",
                                          )}
                                          style={{
                                            objectPosition: "0 0",
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs" />
                                      )}
                                    </div>
                                    {/* Hover preview: same-size card duplicate, higher z-index, right or left by column */}
                                    {c.imageFrontUrl && (
                                      <div
                                        className={cn(
                                          "pointer-events-none absolute top-0 z-[100] rounded-2xl shadow-xl opacity-0 transition-opacity duration-150 group-hover/card:opacity-100",
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
                                          className="object-cover w-full h-full rounded-2xl"
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
