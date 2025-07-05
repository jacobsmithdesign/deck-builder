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
import { Board } from "./Board";
import { Panel } from "./Panel";
import { Button } from "./button";

// Temporary array of buttons for the Commander panel
const buttons = [
  { title: "Creatures" },
  { title: "Artifacts" },
  { title: "Enchantments" },
  { title: "Planeswalkers" },
  { title: "Instants" },
  { title: "Sorceries" },
  { title: "Lands" },
  { title: "Sideboard" },
  { title: "Tokens" },
];

export const CommanderPanel = () => {
  const { deckDetails } = useCommander();
  return (
    <Panel className="">
      <div className="grid rounded-xl overflow-clip border border-dark/10 bg-light/50">
        {buttons.map((button, index) => (
          <div key={index}>
            <Button
              variant={"cardGroup"}
              size={"cardGroup"}
              title={button.title}
              className="rounded-none"
            />
            {index !== buttons.length - 1 && (
              <div className="w-full border-b border-dark/10 m-auto" />
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
};
