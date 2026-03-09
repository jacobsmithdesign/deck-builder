// This file is a list of calculations for the deck overview such as card type counts, keyword counts,

import { CardRecord } from "./schemas";

// function used for logging cards in a smaller format
function logCardsBrief(cards: CardRecord[]) {
  const brief = cards.map((c) => ({
    name: c.name,
    type: c.type,
    mana_value: c.mana_value,
    text: c.text,
  }));
}

// ---------- Count of each type (eg creature, land, etc.) in entire cardlist ---------- //
export type CardTypeCount = {
  type: string;
  count: number;
};

export function getCardTypeCounts(cards: CardRecord[]): CardTypeCount[] {
  const typeCounts: Record<string, number> = {};
  logCardsBrief(cards);

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

// ---------- Count of each creature subtype (e.g. Elf, Human, Wizard) ---------- //
/** Parse subtypes from type line (e.g. "Creature — Elf Druid" → ["Elf", "Druid"]). */
function parseSubtypes(typeLine: string | null | undefined): string[] {
  if (!typeLine?.trim()) return [];
  const parts = typeLine.split(/\s+[—\-]\s+/); // em dash or hyphen between type and subtypes
  const subtypePart = parts[1]?.trim();
  if (!subtypePart) return [];
  return subtypePart.split(/\s+/).filter(Boolean);
}

export type SubtypeCount = {
  subtype: string;
  count: number;
};

export function getCreatureSubtypeCounts(cards: CardRecord[]): SubtypeCount[] {
  const counts: Record<string, number> = {};
  for (const card of cards) {
    const typeLine = card.type ?? "";
    if (!typeLine.toLowerCase().includes("creature")) continue;
    const quantity = card.count ?? 1;
    const subtypes = parseSubtypes(typeLine);
    for (const sub of subtypes) {
      counts[sub] = (counts[sub] || 0) + quantity;
    }
  }
  return Object.entries(counts)
    .map(([subtype, count]) => ({ subtype, count }))
    .sort((a, b) => b.count - a.count);
}

// ---------- Draw probability (hypergeometric) ---------- //
/** C(n, k) = n choose k. Uses iterative computation to avoid factorial overflow. */
function combination(n: number, k: number): number {
  if (k > n || k < 0) return 0;
  k = Math.min(k, n - k);
  let r = 1;
  for (let i = 0; i < k; i++) {
    r = (r * (n - i)) / (i + 1);
  }
  return Math.round(r);
}

/**
 * Probability of drawing at least one card of a given type when drawing `drawCount` cards
 * from a deck of `deckSize` that contains `typeCount` cards of that type.
 * Uses hypergeometric: P(at least 1) = 1 - C(deckSize - typeCount, drawCount) / C(deckSize, drawCount).
 */
export function probAtLeastOne(
  deckSize: number,
  typeCount: number,
  drawCount: number
): number {
  if (drawCount <= 0 || deckSize <= 0) return 0;
  if (typeCount <= 0) return 0;
  if (typeCount > deckSize) return 1;
  const n = Math.min(drawCount, deckSize);
  if (n >= deckSize) return 1; // drawing whole deck => certain to get at least one of any existing type
  const waysZero = combination(deckSize - typeCount, n);
  const waysAny = combination(deckSize, n);
  if (waysAny === 0) return 0;
  return 1 - waysZero / waysAny;
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
