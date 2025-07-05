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

  const groupedCardsArray = groupByCardType(cards);

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

  useEffect(() => {
    const allTypes = groupByCardType(cards).map((group) => group.type);
    setVisibleGroups(new Set(allTypes));
  }, [cards]);

  return (
    <BoardContent className="overflow-y-auto relative">
      {groupedCardsArray.map((group, index) => (
        <Group key={index}>
          <GroupHeader
            className={`${index !== 0 ? "" : "border-t-0"}`}
            onClick={() => console.log(`Clicked on group: ${group.type}`)}
          >
            <GroupTitle>{group.type}</GroupTitle>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleGroupVisibility(group.type);
              }}
              className="text-dark/40 hover:text-dark/60 bg-darksecondary/10 hover:bg-light/60 rounded-md w-7 h-7 transition-all duration-100 cursor-pointer items-center justify-center flex active:scale-90 hover:shadow-sm"
            >
              {visibleGroups.has(group.type) ? <Minus /> : <ChevronDown />}
            </button>
          </GroupHeader>
          {visibleGroups.has(group.type) && (
            <GroupItems>
              {group.cards.map((card) => (
                <div key={card.id} className="relative">
                  <PerspectiveCard
                    id={card.id}
                    image={card.imageUrl}
                    label={card.name}
                    isEditMode={isEditMode}
                  />
                </div>
              ))}
            </GroupItems>
          )}
        </Group>
      ))}
    </BoardContent>
  );
};
