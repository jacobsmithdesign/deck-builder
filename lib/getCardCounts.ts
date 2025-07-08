// This file is a list of calculations for the deck overview such as card type counts, keyword counts,

import { CardRecord } from "./schemas";

// ---------- Count of each type (eg creature, land, etc.) in entire cardlist ---------- //
export type CardTypeCount = {
  type: string;
  count: number;
};

export function getCardTypeCounts(cards: CardRecord[]): CardTypeCount[] {
  const typeCounts: Record<string, number> = {};
  console.log("cards: ", cards);

  for (const card of cards) {
    const typeKey = getBaseType(card.type); // Extract e.g. "Creature" from "Creature — Elf Druid"
    typeCounts[typeKey] = (typeCounts[typeKey] || 0) + (card.count || 1);
  }

  return Object.entries(typeCounts).map(([type, count]) => ({ type, count }));
}

function getBaseType(typeLine: string): string {
  const knownTypes = [
    "Land",
    "Creature",
    "Enchantment",
    "Artifact",
    "Instant",
    "Sorcery",
    "Planeswalker",
  ];
  return (
    knownTypes.find((t) => typeLine.toLowerCase().includes(t.toLowerCase())) ||
    "Other"
  );
}

// ---------- Count of each keyword in entire cardlist ---------- //

export type KeywordCount = {
  keyword: string;
  count: number;
};

export function getKeywordCounts(cards: CardRecord[]): KeywordCount[] {
  const keywordMap: Record<string, number> = {};

  for (const card of cards) {
    const quantity = card.count ?? 1;
    if (!card.keywords) continue;

    for (const keyword of card.keywords) {
      keywordMap[keyword] = (keywordMap[keyword] || 0) + quantity;
    }
  }

  return Object.entries(keywordMap).map(([keyword, count]) => ({
    keyword,
    count,
  }));
}
