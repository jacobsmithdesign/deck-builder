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
import {
  BoardContent,
  Group,
  GroupHeader,
  GroupItems,
  GroupTitle,
} from "../primitives/Board";
import { CardRecord } from "@/lib/schemas";
import { cn } from "@/lib/utils";
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

const PREVIEW_DELAY_MS = 1000;

/** Wraps a stacked-list card row and delays hover preview until after entrance animation. */
function StackedListCardRow({
  card,
  cardId,
  isExpanded,
  isLastColumn,
  previewWidth,
  previewHeight,
  cardIndex,
  isNewCard,
  isDiffCard,
}: {
  card: CardWithImage;
  cardId: string;
  isExpanded: boolean;
  isLastColumn: boolean;
  previewWidth: number;
  previewHeight: number;
  cardIndex: number;
  isNewCard?: boolean;
  isDiffCard?: boolean;
}) {
  const [previewAllowed, setPreviewAllowed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPreviewAllowed(true), PREVIEW_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const highlightCard = isDiffCard || isNewCard;
  const diffStyle =
    isDiffCard && "outline-4 outline-yellow-500 bg-yellow-500/50";
  const newStyle =
    !isDiffCard && isNewCard && "outline-4 outline-green-500 bg-green-500";

  return (
    <motion.div
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
        delay: 0.025 * cardIndex,
      }}
      className={cn(
        "group/card flex items-center rounded-xl transition-colors duration-150 border-b border-dark/5 last:border-b-0 relative justify-center w-full max-w-72",
      )}
      style={{
        ["--preview-w" as string]: `${previewWidth + 8}px`,
      }}
    >
      <div
        className={cn(
          "relative shrink-0 rounded-xl max-w-60",
          isExpanded ? "h-full " : "h-8",
          diffStyle,
          newStyle,
        )}
      >
        {isNewCard && !isDiffCard && (
          <div className="px-2 rounded-full absolute top-2 left-24 z-20 text-light bg-green-500 font-bold backdrop-blur-xs [transform:translateZ(20px)] shadow-lg">
            New
          </div>
        )}
        {card.imageFrontUrl ? (
          <Image
            src={card.imageFrontUrl}
            width={488}
            height={680}
            alt=""
            className={cn(
              "object-cover w-fit object-top rounded-xl h-fit",
              highlightCard && "opacity-90",
            )}
            style={{
              objectPosition: "0 0",
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs" />
        )}
      </div>
      {/* Hover preview: hidden for PREVIEW_DELAY_MS after render to avoid layout shift during entrance animation */}
      {card.imageFrontUrl && (
        <div
          className={cn(
            "pointer-events-none absolute top-0 z-10 rounded-2xl transition-opacity duration-150 overflow-visible drop-shadow-xl",
            previewAllowed
              ? "opacity-0 group-hover/card:opacity-100"
              : "hidden",
          )}
          style={{
            width: `${previewWidth}px`,
            height: `${previewHeight}px`,
            ...(isLastColumn
              ? { right: "100%", marginRight: "0.5rem" }
              : { left: "100%", marginLeft: "0.5rem" }),
          }}
        >
          <Image
            src={card.imageFrontUrl}
            width={488}
            height={680}
            alt=""
            className="object-cover w-full h-full rounded-2xl "
          />
        </div>
      )}
    </motion.div>
  );
}

export type DeckStackedListViewSlotProps = {
  slotCards?: CardRecord[];
  slotDeck?: DeckMetadata | null;
  isComparisonSlot?: boolean;
  otherSlotCards?: CardRecord[];
};

export const DeckStackedListView = (
  props: DeckStackedListViewSlotProps = {},
) => {
  const { slotCards, isComparisonSlot, otherSlotCards } = props;
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
  }, [groupedCardsArray, viewportWidth, hasComparison]);

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
    <section id="deck-stacked-list-view">
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
              className="grid items-start pb-2"
              style={{
                gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
              }}
            >
              {columns.map((column, columnIndex) => (
                <div key={column.id} className="px-2">
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
                                  duration: 0.2 + group.cards.length * 0.015,
                                  ease: "easeInOut",
                                },
                              }}
                              className="flex flex-col w-full min-w-0"
                            >
                              <GroupItems
                                key="group-items"
                                className="mt-2 flex flex-col gap-1 rounded-xl w-full shrink-0 items-center"
                              >
                                {group.cards.map((card, cardIndex) => {
                                  const c = card as CardWithImage;
                                  const cardId =
                                    (c as CardWithImage & { id?: string }).id ??
                                    c.uuid;
                                  const isExpanded =
                                    cardIndex === group.cards.length - 1;
                                  const previewHeight = 336;
                                  const previewWidth =
                                    (previewHeight * 488) / 680;
                                  const isLastColumn =
                                    columnIndex === columns.length - 1;
                                  return (
                                    <StackedListCardRow
                                      key={cardId}
                                      card={c}
                                      cardId={cardId}
                                      isExpanded={isExpanded}
                                      isLastColumn={isLastColumn}
                                      previewWidth={previewWidth}
                                      previewHeight={previewHeight}
                                      cardIndex={cardIndex}
                                      isNewCard={
                                        !differingCardUuids.has(c.uuid) &&
                                        newlyAddedCardUuids.has(c.uuid)
                                      }
                                      isDiffCard={differingCardUuids.has(
                                        c.uuid,
                                      )}
                                    />
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
