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

export const CardDisplay = ({ deck }: { deck: Deck }) => {
  return (
    <Card>
      <div className="max-w-4xl mx-auto py-10">
        <CardTitle className="">Cards</CardTitle>
        <div className="flex flex-wrap gap-4 justify-center">
          {deck.cards.map((card: any) => (
            <Card
              key={card.card_uuid}
              className="w-40 bg-lightsecondary/30 p-2 "
            >
              <CardTitle>{card.name}</CardTitle>
              <Image
                src={card.imageUrl}
                width={200}
                height={200}
                alt={`Image of ${card.name} card`}
                className="w-20 rounded shadow"
              />

              <CardHeader></CardHeader>
              <CardContent></CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Card>
  );
};
