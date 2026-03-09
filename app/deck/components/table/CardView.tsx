"use client";

import CustomScrollArea from "@/app/components/ui/CustomScrollArea";
import { useCardList } from "@/app/context/CardListContext";
import { useCompactView } from "@/app/context/compactViewContext";
import { useEditMode } from "@/app/context/editModeContext";
import {
  useDeckView,
  type DeckSortOption,
} from "@/app/context/DeckViewContext";
import { useFilteredCards } from "@/app/hooks/useFilteredCards";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import NewCardModal from "../card/NewCardModal";
import UnsavedChanges from "../overlays/UnsavedChanges";
import DeckPerspectiveCard from "../card/perspectiveCardUI/DeckPerspectiveCard";
import {
  BoardContent,
  Group,
  GroupHeader,
  GroupItems,
  GroupTitle,
} from "../primitives/Board";

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

const groupByCardType = (cards: any[] = []) => {
  const grouped: Record<string, any[]> = {};

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

const sortGroupCards = (cards: any[] = [], sortOption: DeckSortOption) => {
  if (sortOption === "deck") return cards;

  const sorted = [...cards];

  sorted.sort((a, b) => {
    const nameA = (a?.name as string | undefined) ?? "";
    const nameB = (b?.name as string | undefined) ?? "";
    const manaA =
      typeof a?.mana_value === "number"
        ? (a.mana_value as number)
        : Number.POSITIVE_INFINITY;
    const manaB =
      typeof b?.mana_value === "number"
        ? (b.mana_value as number)
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

export const CardView = () => {
  const { editMode } = useEditMode();
  const { cards, newlyAddedCardUuids } = useCardList();
  const { sortOption, filters } = useDeckView();
  const filteredCards = useFilteredCards(cards);
  const [visibleGroups, setVisibleGroups] = useState<Set<string>>(new Set());
  const prevTypesKeyRef = useRef<string>("");
  const [openNewCardModal, setOpenNewCardModal] = useState(false);
  const [newCardType, setNewCardType] = useState<string>("");
  const [openCardInfoModal, setOpenCardInfoModal] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const { bgColor, showBoard } = useCompactView();

  // Group cards by type, memoised so we don’t rebuild it needlessly
  const groupedCardsArray = useMemo(() => {
    const groups = groupByCardType(filteredCards);
    return groups.map((group) => ({
      ...group,
      cards: sortGroupCards(group.cards, sortOption),
    }));
  }, [filteredCards, sortOption]);

  // All group types, derived from the grouped cards (stable so we only re-run open animation when types change, not on every add/remove)
  const allTypes = useMemo(
    () => groupedCardsArray.map((g) => g.type),
    [groupedCardsArray],
  );
  const typesKey = useMemo(() => allTypes.join(","), [allTypes]);

  // Initialise / update visible groups only when the set of group types changes (not when card count changes).
  // This prevents the open animation from retriggering on every card add/remove.
  // prevTypesKeyRef is set only after the stagger finishes so Strict Mode's double effect run still opens groups.
  const msPerCard = 17;
  useEffect(() => {
    if (groupedCardsArray.length === 0) {
      setVisibleGroups(new Set());
      prevTypesKeyRef.current = "";
      return;
    }
    if (prevTypesKeyRef.current === typesKey) return;
    setVisibleGroups(new Set());
    let previousCardCount = 0;
    const timeouts = groupedCardsArray.map((group, index) => {
      const delayMs = previousCardCount * msPerCard;
      previousCardCount += group.cards.length;
      const isLast = index === groupedCardsArray.length - 1;
      return setTimeout(() => {
        setVisibleGroups((prev) => {
          const next = new Set(prev);
          next.add(group.type);
          return next;
        });
        if (isLast) prevTypesKeyRef.current = typesKey;
      }, delayMs);
    });
    return () => timeouts.forEach(clearTimeout);
  }, [typesKey, groupedCardsArray]);

  // Toggle visibility for a single group
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

  const hideAllGroups = () => {
    setVisibleGroups(new Set());
  };

  const showAllGroups = (types: string[]) => {
    setVisibleGroups(new Set(types));
  };

  // Card info modal handlers
  const handleInspectCard = (id: string) => {
    setSelectedCardId(id);
    setOpenCardInfoModal(true);
  };

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
    <section id={"card-view"}>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BoardContent
            style={{ background: bgColor }}
            className="hide-scrollbar transition-all duration-700 justify-center items-center relative rounded-t-none  rounded-xl"
          >
            {/* New card modal */}
            <div className="z-50 h-full w-full pointer-events-none">
              <NewCardModal
                closeModal={toggleNewCardModal}
                showModal={openNewCardModal}
                cardType={newCardType}
              />
            </div>

            {/* Scrollable grouped cards */}
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full bg-light/50 rounded-xl"
            >
              {groupedCardsArray.map((group, index) => (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "100%" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Group key={group.type}>
                    <GroupHeader
                      className={`${index !== 0 ? "" : "border-t-0"} py-2`}
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
                          initial={{ height: 0 }}
                          animate={{
                            height: "auto",
                            transition: {
                              duration: 0.2 + group.cards.length * 0.015,
                              ease: "easeOut",
                            },
                          }}
                          exit={{ height: 0 }}
                          transition={{
                            height: {
                              duration: 0.4,
                              ease: "easeInOut",
                            },
                          }}
                          className="overflow-y-hidden flex px-2 scroll-mt-26"
                        >
                          <GroupItems key="group-items" className="mt-2 mb-6">
                            {group.cards.map((card, index) => (
                              <motion.div
                                key={card.id} // <-- stable key per card
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{
                                  opacity: 0,
                                  scale: 0.95,
                                  transition: {
                                    delay: 0,
                                    duration: 0.25,
                                    ease: "easeOut",
                                  },
                                }}
                                transition={{
                                  type: "spring",
                                  stiffness: 250,
                                  damping: 12,
                                  bounce: 0.1,
                                  delay: 0.015 * index,
                                  duration: 0.2,
                                }}
                                className="hover:z-1"
                              >
                                <DeckPerspectiveCard
                                  key={card.id}
                                  id={card.id}
                                  image={card.imageFrontUrl}
                                  label={card.name}
                                  isEditMode={editMode}
                                  card={card}
                                  isNewCard={newlyAddedCardUuids.has(card.uuid)}
                                />
                              </motion.div>
                            ))}
                          </GroupItems>
                        </motion.section>
                      )}
                    </AnimatePresence>
                  </Group>
                </motion.div>
              ))}
            </motion.div>
          </BoardContent>
        </motion.div>
      </AnimatePresence>
    </section>
  );
};
