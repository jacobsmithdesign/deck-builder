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

export function SpellTypeCounts({
  spellCounts,
  compactView,
}: SpellTypeCountsProps) {
  // Build full list ensuring every type exists
  const displayCounts = ALL_SPELL_TYPES.map((spellType) => {
    const found = spellCounts.find((t) => t.type === spellType);
    return { type: spellType, count: found ? found.count : 0 };
  });

  return (
    <CardContent
      className={`grid text-dark p-1 overflow-clip transition-all duration-250 bg-darksecondary/15 gap-1 ${
        compactView
          ? "grid-cols-2 rounded h-16"
          : "grid-cols-2 rounded-2xl h-full"
      }`}
    >
      {displayCounts.map((type, index) => (
        <Link href={`#${type.type}`}>
          <Spell
            key={index}
            className={cn(
              "transition-all duration-250 w-full rounded-lg",
              compactView ? "h-4" : "h-7",
              index === 0 && "rounded-tl-xl",
              index === 1 && "rounded-tr-xl",
              index === displayCounts.length - 2 && "rounded-bl-xl",
              index === displayCounts.length - 1 && "rounded-br-xl",
            )}
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
          </Spell>
        </Link>
      ))}
    </CardContent>
  );
}
