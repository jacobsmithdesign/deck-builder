"use client";
import { useCommander } from "@/app/context/CommanderContext";
import { useEffect } from "react";
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
  GroupItem,
  GroupTitle,
} from "../components/Board";

export const DeckEditor = ({ deck }: { deck: Deck }) => {
  // cards: {
  //       id: string;
  //       count: number;
  //       type: string;
  //       name: string;
  //       manaCost: string | null;
  //       ... 4 more ...;
  //       imageUrl: string | null;
  //   }[];

  // Organise the deck cards into groups based on their type
  const groupedCardsMap = deck.cards.reduce((acc, card) => {
    const type = card.type || "Unknown";
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(card);
    return acc;
  }, {} as Record<string, typeof deck.cards>);

  const groupedCardsArray = Object.entries(groupedCardsMap).map(
    ([type, cards]) => ({
      type,
      cards,
    })
  );

  console.log("Grouped Cards:", groupedCardsArray);

  return (
    <Board className="">
      <BoardHeader>
        <BoardTitle className="text-2xl font-bold">{deck.name}</BoardTitle>
        <div className="flex gap-1"></div>
      </BoardHeader>
      <BoardContent className="overflow-y-auto">
        {groupedCardsArray.map((group, index) => (
          <Group key={index}>
            <GroupHeader>
              <GroupTitle>{group.type}</GroupTitle>
            </GroupHeader>
            <div className="flex flex-wrap gap-4">
              {group.cards.map((card) => (
                <GroupItem key={card.id}>
                  <Card className=" bg-lightsecondary/30 p-2">
                    {card.imageUrl && (
                      <Image
                        src={card.imageUrl}
                        width={200}
                        height={200}
                        alt={`Image of ${card.name} card`}
                        className="w-40 rounded shadow"
                      />
                    )}
                  </Card>
                </GroupItem>
              ))}
            </div>
          </Group>
        ))}
      </BoardContent>
    </Board>
  );
};
