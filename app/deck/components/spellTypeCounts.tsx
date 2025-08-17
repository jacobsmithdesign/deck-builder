"use client";

import React from "react";
import { CardContent } from "@/app/components/ui/card";
import {
  Spell,
  SpellCount,
  SpellType,
} from "@/app/components/ui/overviewButtons";
import { DeckMetricsMini } from "./deckMetricsMini";
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
      className={`grid text-dark p-0 overflow-clip outline outline-dark/20 transition-all duration-250 bg-light/60  ${
        compactView
          ? "grid-cols-2 rounded h-16"
          : "grid-cols-2 rounded-md h-full"
      }`}
    >
      {displayCounts.map((type, index) => (
        <Spell
          key={index}
          className={`${
            compactView ? "h-4" : "h-6"
          } transition-all duration-250`}
        >
          <SpellType
            className={`${
              compactView ? "text-sm font-normal" : "font-normal"
            } transition-all duration-250 ${
              type.count === 0 ? "text-dark/40" : ""
            }`}
          >
            {type.type}
          </SpellType>
          <SpellCount
            className={`${
              compactView ? "text-sm" : ""
            } transition-all duration-250 ${
              type.count === 0 ? "text-dark/40" : ""
            }`}
          >
            {type.count}
          </SpellCount>
        </Spell>
      ))}
    </CardContent>
  );
}
