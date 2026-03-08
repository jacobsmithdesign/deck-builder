"use client";

import React from "react";
import { CardContent } from "@/app/components/ui/card";
import {
  Spell,
  SpellCount,
  SpellType,
} from "@/app/components/ui/overviewButtons";
import { DeckMetricsMini } from "./deckMetricsMini";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { RaindropContainer } from "../primitives/RaindropContainer";
import { useCompactView } from "@/app/context/compactViewContext";
interface SpellTypeCountsProps {
  spellCounts: { type: string; count: number }[];
  compactView: boolean;
}

const ALL_SPELL_TYPES = [
  "Land",
  "Creature",
  "Enchantment",
  "Artifact",
  "Instant",
  "Sorcery",
  "Planeswalker",
  "Sideboard",
];

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
}

export function SpellTypeCounts({
  spellCounts,
  compactView,
}: SpellTypeCountsProps) {
  // Build full list ensuring every type exists
  const displayCounts = ALL_SPELL_TYPES.map((spellType) => {
    const found = spellCounts.find((t) => t.type === spellType);
    return { type: spellType, count: found ? found.count : 0 };
  });
  const { bgColor } = useCompactView();

  return (
    <RaindropContainer
      innerClassName="rounded-2xl top-0 left-0 pointer-events-none border-light/30"
      childClassName="grid grid-cols-2 gap-1"
      bgColor={bgColor}
      className={` text-dark transition-all duration-250 rounded-3xl p-2`}
    >
      {displayCounts.map((type, index) => (
        <button onClick={() => scrollToSection(type.type)}>
          <RaindropContainer
            bgColor={bgColor}
            className={cn(
              "transition-all duration-250 w-full rounded-lg flex overflow-hidden group from-light/60",

              index === 0 && "rounded-tl-2xl",
              index === 1 && "rounded-tr-2xl",
              index === displayCounts.length - 2 && "rounded-bl-2xl",
              index === displayCounts.length - 1 && "rounded-br-2xl",
            )}
            innerClassName={cn(
              "transition-all duration-250 w-full flex opacity-20 md:group-hover:opacity-0",
            )}
            childClassName="flex w-full justify-between px-2 py-1"
            key={index}
          >
            <SpellType
              className={`${
                compactView ? "text-sm font-normal" : "font-normal"
              } transition-all duration-250 ${
                type.count === 0 ? "text-dark/30" : "text-dark/80"
              }`}
            >
              {type.type}
            </SpellType>
            <SpellCount
              className={`${
                compactView ? "text-sm" : ""
              } transition-all duration-250 ${
                type.count === 0 ? "text-dark/30" : "text-dark/80"
              }`}
            >
              {type.count}
            </SpellCount>
          </RaindropContainer>
        </button>
      ))}
    </RaindropContainer>
  );
}
