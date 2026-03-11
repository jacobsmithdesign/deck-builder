"use client";

import { useMemo } from "react";
import type { CardRecord } from "@/lib/schemas";

/**
 * Returns a Set of card UUIDs in the current list whose **name** does not
 * appear in the other list (case-insensitive). Used for compare-view highlighting.
 * Optimized: one pass to build other names Set, one pass to collect differing UUIDs.
 */
export function useDifferingCardUuids(
  cards: CardRecord[],
  otherCards: CardRecord[] | undefined,
): Set<string> {
  return useMemo(() => {
    if (!otherCards?.length) return new Set<string>();
    // Set of lowercase names that appear in the other list (any count)
    const otherNames = new Set<string>();
    for (let i = 0; i < otherCards.length; i++) {
      const name = otherCards[i].name;
      if (name != null && name !== "") otherNames.add(name.toLowerCase());
    }
    const differing = new Set<string>();
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      const name = c.name;
      if (name == null || name === "") continue;
      if (!otherNames.has(name.toLowerCase())) differing.add(c.uuid);
    }
    return differing;
  }, [cards, otherCards]);
}
