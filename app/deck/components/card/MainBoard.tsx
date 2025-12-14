"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BoardContent,
  Group,
  GroupHeader,
  GroupItems,
  GroupTitle,
} from "./Board";
import PerspectiveCard from "./perspectiveCardUI/PerspectiveCard";
import { motion, AnimatePresence } from "framer-motion";
import { useCardList } from "@/app/context/CardListContext";
import { useCompactView } from "@/app/context/compactViewContext";
import NewCardModal from "./NewCardModal";
import CustomScrollArea from "@/app/components/ui/CustomScrollArea";
import { useEditMode } from "@/app/context/editModeContext";
import UnsavedChanges from "./UnsavedChanges";

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
        card.type?.toLowerCase().includes(type.toLowerCase())
      ) || "Other";

    if (!grouped[baseType]) grouped[baseType] = [];
    grouped[baseType].push(card);
  }

  return typeOrder
    .map((type) => ({ type, cards: grouped[type] }))
    .filter((group) => group.cards && group.cards.length > 0);
};

export const MainBoard = () => {
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
    [groupedCardsArray]
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
    if (showBoard) {
      showAllGroups(allTypes);
    } else {
      hideAllGroups(); // <-- actually call the function
    }
  }, [showBoard, allTypes]);

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
    <AnimatePresence>
      <BoardContent
        style={{ background: bgColor }}
        className="hide-scrollbar transition-all duration-700 justify-center items-center relative rounded-t-none outline outline-dark/20 h-full "
      >
        {/* New card modal */}
        <div className="z-50 w-full h-full pointer-events-none">
          <NewCardModal
            closeModal={toggleNewCardModal}
            showModal={openNewCardModal}
            cardType={newCardType}
          />
        </div>

        {/* Unsaved changes */}
        <div className="absolute right-5 top-2 z-10 pointer-events-none">
          <UnsavedChanges />
        </div>

        {/* Scrollable grouped cards */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="w-full h-full overflow-y-scroll hide-scrollbar absolute bg-light/50"
        >
          <CustomScrollArea
            className="h-full w-full"
            trackClassName="bg-dark/20 rounded-xs outline outline-dark/20 w-2 mr-1 my-1 rounded-br-sm"
            thumbClassName="bg-light/60 rounded-xs"
            autoHide={false}
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
                    <motion.div
                      key={`group-${group.type}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-clip flex px-2"
                    >
                      <GroupItems className="mt-2">
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
                            <PerspectiveCard
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </Group>
            ))}
          </CustomScrollArea>
        </motion.div>
      </BoardContent>
    </AnimatePresence>
  );
};
