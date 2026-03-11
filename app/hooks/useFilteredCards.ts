"use client";

import { useMemo } from "react";
import { useDeckView } from "@/app/context/DeckViewContext";
import type { CardRecord } from "@/lib/schemas";

const COLOUR_ORDER = ["W", "U", "B", "R", "G"];

function parseNumeric(value: string): number | null {
  const n = value.trim() === "" ? null : Number(value.trim());
  if (n === null) return null;
  return Number.isFinite(n) ? n : null;
}

/** Parse power/toughness string (e.g. "3", "*", "1+*") to number for comparison, or null if not comparable. */
function parsePowerToughness(s: string | null | undefined): number | null {
  if (s == null || s === "") return null;
  const n = Number(s);
  if (Number.isFinite(n)) return n;
  return null;
}

function applyDeckFilters(
  cards: CardRecord[],
  filters: import("@/app/context/DeckViewContext").DeckFiltersState,
): CardRecord[] {
  let result = cards;

  const nameQ = filters.cardName.trim().toLowerCase();
  if (nameQ) {
    result = result.filter((c) =>
      (c.name ?? "").toLowerCase().includes(nameQ),
    );
  }

  const textQ = filters.cardText.trim().toLowerCase();
  if (textQ) {
    result = result.filter((c) =>
      (c.text ?? "").toLowerCase().includes(textQ),
    );
  }

  const colourValues = filters.colours.values;
  if (colourValues.length > 0) {
    const mode = filters.colours.mode;
    result = result.filter((c) => {
      const id = (c.color_identity ?? []).filter(Boolean);
      if (mode === "exactly") {
        if (id.length !== colourValues.length) return false;
        const setA = new Set(id);
        const setB = new Set(colourValues);
        if (setA.size !== setB.size) return false;
        for (const x of setA) if (!setB.has(x)) return false;
        return true;
      }
      if (mode === "including") {
        return colourValues.every((col) => id.includes(col));
      }
      // atMost: card's identity must be a subset of selected colours
      return id.every((col) => colourValues.includes(col));
    });
  }

  const mvMin = parseNumeric(filters.manaValue.min);
  const mvMax = parseNumeric(filters.manaValue.max);
  if (mvMin !== null || mvMax !== null) {
    result = result.filter((c) => {
      const mv =
        typeof c.mana_value === "number" ? c.mana_value : Number.POSITIVE_INFINITY;
      if (mvMin !== null && mv < mvMin) return false;
      if (mvMax !== null && mv > mvMax) return false;
      return true;
    });
  }

  const powerMin = parseNumeric(filters.power.min);
  const powerMax = parseNumeric(filters.power.max);
  if (powerMin !== null || powerMax !== null) {
    result = result.filter((c) => {
      const p = parsePowerToughness(c.power);
      if (p === null) return false; // exclude non-numeric (e.g. *)
      if (powerMin !== null && p < powerMin) return false;
      if (powerMax !== null && p > powerMax) return false;
      return true;
    });
  }

  const toughMin = parseNumeric(filters.toughness.min);
  const toughMax = parseNumeric(filters.toughness.max);
  if (toughMin !== null || toughMax !== null) {
    result = result.filter((c) => {
      const t = parsePowerToughness(c.toughness);
      if (t === null) return false;
      if (toughMin !== null && t < toughMin) return false;
      if (toughMax !== null && t > toughMax) return false;
      return true;
    });
  }

  const selectedTags = filters.tags;
  if (selectedTags.length > 0) {
    result = result.filter((c) => {
      const keywords = (c.keywords ?? []).map((k) => k.toLowerCase());
      return selectedTags.some((tag) =>
        keywords.includes(tag.toLowerCase()),
      );
    });
  }

  return result;
}

/** Returns unique keywords from all deck cards (for Tags filter options). */
export function getDeckTagOptions(cards: CardRecord[]): string[] {
  const set = new Set<string>();
  for (const c of cards) {
    for (const k of c.keywords ?? []) {
      if (k.trim()) set.add(k.trim());
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function useFilteredCards(cards: CardRecord[]): CardRecord[] {
  const { filters } = useDeckView();
  return useMemo(
    () => applyDeckFilters(cards, filters),
    [cards, filters],
  );
}
