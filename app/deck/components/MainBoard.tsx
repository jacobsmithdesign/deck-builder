"use client";

import { useEffect, useState } from "react";
import {
  Board,
  BoardContent,
  Group,
  GroupHeader,
  GroupItems,
  GroupTitle,
} from "./Board";
import PerspectiveCard from "./perspectiveCard";
import { ChevronDown, Minus } from "lucide-react";
import { useCardList } from "@/app/context/CardListContext";
import { RxCross2 } from "react-icons/rx";
import { motion, AnimatePresence } from "framer-motion";
import { useCompactView } from "@/app/context/compactViewContext";

interface MainBoardProps {
  isEditMode: boolean;
}

const groupByCardType = (cards: any[] = []) => {
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
  const grouped: Record<string, any[]> = {};

  for (const card of cards) {
    const baseType =
      typeOrder.find((type) =>
        card.type?.toLowerCase().includes(type.toLowerCase())
      ) || "Other";

    if (!grouped[baseType]) {
      grouped[baseType] = [];
    }
    grouped[baseType].push(card);
  }

  return typeOrder
    .map((type) => ({ type, cards: grouped[type] }))
    .filter((group) => group.cards && group.cards.length > 0);
};

export const MainBoard = ({ isEditMode }: MainBoardProps) => {
  const { cards, removeCard } = useCardList();
  const [visibleGroups, setVisibleGroups] = useState<Set<string>>(new Set());
  const [openCardModal, setOpenCardModal] = useState<boolean>(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const { bgColor } = useCompactView();
  const groupedCardsArray = groupByCardType(cards);

  // Hide / show card groups
  const toggleGroupVisibility = (type: string) => {
    setVisibleGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };
  // Group cards by similar types
  useEffect(() => {
    const allTypes = groupByCardType(cards).map((group) => group.type);
    setVisibleGroups(new Set(allTypes));
  }, [cards]);

  // function for handling the opening of the modal with card info
  const handleInspectCard = (id: string) => {
    setSelectedCardId(id);
    setOpenCardModal(true);
  };
  return (
    <AnimatePresence>
      <BoardContent
        style={{ background: bgColor }}
        className="hide-scrollbar relative border border-light/60 transition-all duration-700"
      >
        {groupedCardsArray.map((group, index) => (
          <Group key={index} className="bg-light/70">
            <GroupHeader
              className={`${index !== 0 ? "" : "border-t-0"} w-`}
              onClick={() => console.log(`Clicked on group: ${group.type}`)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleGroupVisibility(group.type);
                }}
                className="flex w-full items-center justify-between cursor-pointer transition-colors duration-150 md:hover:bg-dark/15 bg-dark/5 mx-3 py-1 px-2 rounded-md group"
              >
                <GroupTitle>{group.type}</GroupTitle>
                <div className="md:group-hover:text-dark/80 text-dark/40 transition-colors duration-150 w-7 h-7 items-center justify-center flex">
                  {visibleGroups.has(group.type) ? <Minus /> : <ChevronDown />}
                </div>
              </button>
            </GroupHeader>
            <AnimatePresence>
              {visibleGroups.has(group.type) && (
                <motion.div
                  key={`group-${group.type}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 100 }}
                  exit={{ height: 0 }}
                  className="overflow-clip flex"
                >
                  <GroupItems key={group.type} className="mt-2">
                    {group.cards.map((card, index) => (
                      <motion.div
                        key={card + index}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
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
                          isEditMode={isEditMode}
                          inspectCard={handleInspectCard}
                        />
                      </motion.div>
                    ))}
                  </GroupItems>
                </motion.div>
              )}
            </AnimatePresence>
          </Group>
        ))}
        <div className="w-full h-full bg-light/70" />
      </BoardContent>
    </AnimatePresence>
  );
};
