"use client";

import React, { useMemo, useState } from "react";
import { useCardList } from "@/app/context/CardListContext";
import { CardTitle } from "@/app/components/ui/card";
import {
  getCardTypeCounts,
  getCreatureSubtypeCounts,
  getKeywordCounts,
  probAtLeastOne,
} from "@/lib/getCardCounts";
import { CardRecord } from "@/lib/schemas";
import { motion } from "framer-motion";

const ORDERED_TYPES = [
  "Creature",
  "Land",
  "Instant",
  "Sorcery",
  "Enchantment",
  "Artifact",
  "Planeswalker",
  "Other",
];

export type GroupByMode = "cardType" | "creatureSubtype" | "keyword";

const GROUP_OPTIONS: { value: GroupByMode; label: string }[] = [
  { value: "cardType", label: "Card types" },
  { value: "creatureSubtype", label: "Creature types" },
  { value: "keyword", label: "Keywords" },
];

type DeckCard = CardRecord & { count?: number; board_section?: string };

function mainboardCards(cards: DeckCard[]): DeckCard[] {
  return cards.filter(
    (c) => (c.board_section || "mainboard").toLowerCase() !== "sideboard"
  );
}

type TableRow = { label: string; count: number; probability: number };

export function SubtypeDrawProbabilityPanel() {
  const { cards } = useCardList();
  const [drawCount, setDrawCount] = useState(1);
  const [groupBy, setGroupBy] = useState<GroupByMode>("cardType");

  const { deckSize, rows, columnLabel, emptyMessage } = useMemo(() => {
    const main = mainboardCards(cards as DeckCard[]);
    const deckSize = main.reduce((s, c) => s + (c.count ?? 1), 0);
    const clampedDraw = Math.min(
      Math.max(1, drawCount),
      Math.max(1, deckSize)
    );

    const prob = (count: number) =>
      deckSize > 0 && clampedDraw > 0
        ? probAtLeastOne(deckSize, count, clampedDraw)
        : 0;

    if (groupBy === "cardType") {
      const typeCounts = getCardTypeCounts(main);
      const byType = new Map(typeCounts.map((t) => [t.type, t.count]));
      const rows: TableRow[] = ORDERED_TYPES.map((type) => ({
        label: type,
        count: byType.get(type) ?? 0,
        probability: prob(byType.get(type) ?? 0),
      })).filter((r) => r.count > 0);
      return {
        deckSize,
        rows,
        columnLabel: "Type",
        emptyMessage: "No card type counts.",
      };
    }

    if (groupBy === "creatureSubtype") {
      const subtypeCounts = getCreatureSubtypeCounts(main);
      const rows: TableRow[] = subtypeCounts.map(({ subtype, count }) => ({
        label: subtype,
        count,
        probability: prob(count),
      }));
      return {
        deckSize,
        rows,
        columnLabel: "Creature type",
        emptyMessage: "No creatures with subtypes in the deck.",
      };
    }

    // keyword
    const keywordCounts = getKeywordCounts(main);
    const rows: TableRow[] = keywordCounts
      .sort((a, b) => b.count - a.count)
      .map(({ keyword, count }) => ({
        label: keyword,
        count,
        probability: prob(count),
      }));
    return {
      deckSize,
      rows,
      columnLabel: "Keyword",
      emptyMessage: "No keywords found in the deck.",
    };
  }, [cards, drawCount, groupBy]);

  if (cards.length === 0) return null;

  const maxDraw = Math.max(1, deckSize);
  const clampedDraw = Math.min(Math.max(1, drawCount), maxDraw);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 250,
        damping: 12,
        bounce: 0.1,
        delay: 0.15,
      }}
      className="mt-8"
    >
      <div className="rounded-xl border border-sky-600/10 bg-sky-500/10 p-4 backdrop-blur">
        <header className="mb-4 flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sky-700">
              Draw probability by group
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-sky-800/80">Cards drawn:</span>
              <div className="flex items-center rounded-lg border border-sky-600/20 bg-light/20">
                <button
                  type="button"
                  onClick={() => setDrawCount((n) => Math.max(1, n - 1))}
                  disabled={clampedDraw <= 1}
                  className="flex h-9 w-9 items-center justify-center rounded-l-lg text-sky-700 transition-colors hover:bg-sky-500/20 disabled:opacity-40 disabled:pointer-events-none"
                  aria-label="Decrease cards drawn"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={maxDraw}
                  value={clampedDraw}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!Number.isNaN(v)) setDrawCount(v);
                  }}
                  className="h-9 w-12 border-0 bg-transparent text-center text-sm font-medium text-sky-900 [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  aria-label="Number of cards drawn"
                />
                <button
                  type="button"
                  onClick={() =>
                    setDrawCount((n) => Math.min(maxDraw, n + 1))
                  }
                  disabled={clampedDraw >= maxDraw}
                  className="flex h-9 w-9 items-center justify-center rounded-r-lg text-sky-700 transition-colors hover:bg-sky-500/20 disabled:opacity-40 disabled:pointer-events-none"
                  aria-label="Increase cards drawn"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {GROUP_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGroupBy(opt.value)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  groupBy === opt.value
                    ? "border-sky-600/40 bg-sky-500/30 text-sky-900"
                    : "border-sky-600/20 bg-light/20 text-sky-800 hover:bg-sky-500/15"
                }`}
                aria-pressed={groupBy === opt.value}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </header>

        <p className="mb-3 text-sm text-sky-800/70">
          Probability of drawing at least one card with each{" "}
          {groupBy === "cardType"
            ? "type"
            : groupBy === "creatureSubtype"
              ? "creature type"
              : "keyword"}{" "}
          when drawing <strong>{clampedDraw}</strong> card
          {clampedDraw !== 1 ? "s" : ""} from a deck of{" "}
          <strong>{deckSize}</strong>.
        </p>

        <div className="overflow-x-auto rounded-lg border border-sky-600/15 bg-light/10">
          <table className="w-full min-w-[280px] text-left text-sm">
            <thead>
              <tr className="border-b border-sky-600/20 bg-sky-500/10">
                <th className="px-3 py-2.5 font-semibold text-sky-800">
                  {columnLabel}
                </th>
                <th className="px-3 py-2.5 font-semibold text-sky-800 text-right">
                  Count
                </th>
                <th className="px-3 py-2.5 font-semibold text-sky-800 text-right">
                  P(≥1 in {clampedDraw} draw{clampedDraw !== 1 ? "s" : ""})
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-4 text-center text-sky-700/80"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-sky-600/10 last:border-0 hover:bg-sky-500/5"
                  >
                    <td className="px-3 py-2 text-sky-900">{row.label}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-sky-800">
                      {row.count}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium text-sky-800">
                      {row.probability < 0.0001
                        ? "—"
                        : `${(row.probability * 100).toFixed(1)}%`}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.section>
  );
}
