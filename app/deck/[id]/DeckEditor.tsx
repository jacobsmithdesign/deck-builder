"use client";
import { useCommander } from "@/app/context/CommanderContext";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Deck } from "@/lib/schemas";
import Image from "next/image";
import {
  Board,
  BoardContent,
  BoardHeader,
  BoardTitle,
  Group,
  GroupHeader,
  GroupItems,
  GroupTitle,
} from "../components/Board";
import PerspectiveCard from "../components/perspectiveCard";
import { ChevronDown, Plus, Minus } from "lucide-react";
const groupByCardType = (cards: any[]) => {
  const typeCategories = [
    "Creature",
    "Land",
    "Enchantment",
    "Artifact",
    "Instant",
    "Sorcery",
    "Planeswalker",
  ];
  const grouped: Record<string, any[]> = {};

  for (const card of cards) {
    const baseType =
      typeCategories.find((type) =>
        card.type?.toLowerCase().includes(type.toLowerCase())
      ) || "Other";

    if (!grouped[baseType]) {
      grouped[baseType] = [];
    }
    grouped[baseType].push(card);
  }

  // Convert to array of { type, cards } for display
  return Object.entries(grouped).map(([type, cards]) => ({ type, cards }));
};

export const DeckEditor = ({ deck }: { deck: Deck }) => {
  const [visibleGroups, setVisibleGroups] = useState<Set<string>>(new Set());
  const groupedCardsArray = groupByCardType(deck.cards);

  // Function to toggle visibility of a group
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

  // Populate visibleGroups with all types initially
  useEffect(() => {
    const allTypes = groupByCardType(deck.cards).map((group) => group.type);
    setVisibleGroups(new Set(allTypes));
  }, [deck.cards]);
  return (
    <Board className="">
      <BoardHeader>
        <BoardTitle className="text-2xl font-bold">{deck.name}</BoardTitle>
        <div className="flex gap-1"></div>
      </BoardHeader>
      <BoardContent className="overflow-y-auto">
        {groupedCardsArray.map((group, index) => (
          <Group key={index}>
            <GroupHeader
              className={`${index !== 0 ? "" : "border-t-0"} `}
              onClick={() => console.log(`Clicked on group: ${group.type}`)}
            >
              <GroupTitle>{group.type}</GroupTitle>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // prevent header click from firing too
                  toggleGroupVisibility(group.type);
                }}
                className="text-dark/40 hover:text-dark/60 bg-darksecondary/10 hover:bg-light/60 rounded-md w-7 h-7  transition-all duration-100 cursor-pointer items-center justify-center flex"
              >
                {visibleGroups.has(group.type) ? <Minus /> : <ChevronDown />}
              </button>
            </GroupHeader>
            {visibleGroups.has(group.type) && (
              <GroupItems>
                {group.cards.map((card) => (
                  <PerspectiveCard key={card.id}>
                    <Card className="p-1">
                      {card.imageUrl && (
                        <Image
                          src={card.imageUrl}
                          width={200}
                          height={200}
                          alt={`Image of ${card.name} card`}
                          className="w-50 rounded-lg shadow"
                        />
                      )}
                    </Card>
                  </PerspectiveCard>
                ))}
              </GroupItems>
            )}
          </Group>
        ))}
      </BoardContent>
    </Board>
  );
};
