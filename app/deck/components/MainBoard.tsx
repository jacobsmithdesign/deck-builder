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
import { RxCross2, RxInfoCircled, RxPlus } from "react-icons/rx";
import { motion, AnimatePresence } from "framer-motion";
import { useCompactView } from "@/app/context/compactViewContext";
import Tilt from "react-parallax-tilt";
import { Card } from "@/app/components/ui/card";
import NewCardModal from "./NewCardModal";

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
  const [openNewCardModal, setOpenNewCardModal] = useState<boolean>(false);
  const [newCardType, setNewCardType] = useState<string>("");
  const [openCardInfoModal, setOpenCardInfoModal] = useState<boolean>(false);
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
    setOpenCardInfoModal(true);
  };
  const toggleNewCardModal = (type?: string) => {
    setNewCardType(type);
    setOpenNewCardModal((prev) => (prev = !prev));
  };

  useEffect(() => {
    if (!isEditMode) {
      setOpenNewCardModal(false);
    }
  }, [isEditMode]);
  return (
    <AnimatePresence>
      <BoardContent
        style={{ background: bgColor }}
        className="hide-scrollbar transition-all duration-700 justify-center items-center relative"
      >
        {/* This is the modal for choosing new cards */}
        <div className="z-50 w-full h-full pointer-events-none">
          <NewCardModal
            closeModal={toggleNewCardModal}
            showModal={openNewCardModal}
            cardType={newCardType}
          />
        </div>
        <div className="w-full h-full overflow-y-scroll hide-scrollbar absolute bg-light/60">
          {groupedCardsArray.map((group, index) => {
            if (!group.type) {
              console.warn("Missing UUID at index", index, group);
            }
            return (
              <Group key={group.type} className="">
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
                      animate={{ height: "auto", opacity: 100 }}
                      exit={{ height: 0 }}
                      className="overflow-clip flex px-2"
                    >
                      <GroupItems key={group.type} className="mt-2">
                        {group.cards.map((card, index) => {
                          return (
                            <motion.div
                              key={card + index}
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
                                isEditMode={isEditMode}
                                inspectCard={handleInspectCard}
                              />
                            </motion.div>
                          );
                        })}

                        {/* This is the new card that appears at the end of every card group, onlly visible in edit mode */}
                        {isEditMode && (
                          <motion.div
                            key="new-card"
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{
                              type: "spring",
                              stiffness: 250,
                              damping: 12,
                              bounce: 0.1,
                              duration: 0.005,
                            }}
                          >
                            <button
                              className="relative w-46 h-64 transition-transform duration-300 ease-out [transform-style:preserve-3d] md:hover:[transform:rotateX(var(--y-rotation))_rotateY(var(--x-rotation))] justify-center items-center flex p-1 md:hover:scale-105 cursor-pointer group"
                              onClick={() => toggleNewCardModal(group.type)}
                            >
                              <div className="bg-light/20 shadow-inner shadow-light/30 border border-light/60 w-full h-full rounded-lg flex items-center justify-center">
                                <div className="font-bold text-sm items-center flex flex-col w-8 h-8 md:group-hover:h-12 md:group-hover:w-34 overflow-x-clip text-nowrap text-center bg-light rounded-md relative p-2 transition-all duration-200">
                                  <RxPlus className="w-4 h-4 absolute" />
                                  <p className="w-40 md:group-hover:mt-4 md:group-hover:opacity-100 opacity-0 transition-all duration-200">
                                    Add {group.type}
                                  </p>
                                </div>
                              </div>
                            </button>
                          </motion.div>
                        )}
                      </GroupItems>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Group>
            );
          })}
        </div>
      </BoardContent>
    </AnimatePresence>
  );
};
