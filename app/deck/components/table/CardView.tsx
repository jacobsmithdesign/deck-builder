"use client";

import CustomScrollArea from "@/app/components/ui/CustomScrollArea";
import { useCardList } from "@/app/context/CardListContext";
import { useCompactView } from "@/app/context/compactViewContext";
import { useEditMode } from "@/app/context/editModeContext";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
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

export const CardView = () => {
  const { editMode } = useEditMode();
  const { cards, changesMadeState } = useCardList();
  const [visibleGroups, setVisibleGroups] = useState<Set<string>>(new Set());
  const [openNewCardModal, setOpenNewCardModal] = useState(false);
  const [newCardType, setNewCardType] = useState<string>("");
  const [openCardInfoModal, setOpenCardInfoModal] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const { bgColor, showBoard } = useCompactView();

  // Group cards by type, memoised so we don’t rebuild it needlessly
  const groupedCardsArray = useMemo(() => groupByCardType(cards), [cards]);

  // All group types, derived from the grouped cards
  const allTypes = useMemo(
    () => groupedCardsArray.map((g) => g.type),
    [groupedCardsArray],
  );

  // Initialise / update visible groups whenever the set of types changes
  useEffect(() => {
    setVisibleGroups(new Set(allTypes));
  }, [allTypes, changesMadeState]);

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

  // Respond to compact view's showBoard
  useEffect(() => {
    showAllGroups(allTypes);
  }, [allTypes]);

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
        <BoardContent
          style={{ background: bgColor }}
          className="hide-scrollbar transition-all duration-700 justify-center items-center relative rounded-t-none outline outline-dark/20"
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
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full bg-light/50"
          >
            {groupedCardsArray.map((group, index) => (
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
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-clip flex px-2"
                    >
                      <GroupItems key="group-items" className="mt-2">
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
                                duration: 0.15,
                                ease: "easeOut",
                              },
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 250,
                              damping: 12,
                              bounce: 0.1,
                              delay: 0.03 * index,
                              duration: 0.2,
                            }}
                          >
                            <DeckPerspectiveCard
                              key={card.id}
                              id={card.id}
                              image={card.imageFrontUrl}
                              label={card.name}
                              isEditMode={editMode}
                              card={card}
                            />
                          </motion.div>
                        ))}
                      </GroupItems>
                    </motion.section>
                  )}
                </AnimatePresence>
              </Group>
            ))}
          </motion.div>
        </BoardContent>
      </AnimatePresence>
    </section>
  );
};
