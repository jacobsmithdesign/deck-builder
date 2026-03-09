"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCardList } from "@/app/context/CardListContext";
import { useCompactView } from "@/app/context/compactViewContext";
import { RaindropContainer } from "../primitives/RaindropContainer";
import { Button } from "../primitives/button";
import { cn } from "@/lib/utils";
import { RxCross2 } from "react-icons/rx";

/** Card-like shape for export: name, count, optional board_section and identifiers. */
type ExportCard = {
  name: string | null;
  count: number;
  board_section?: string;
  identifiers?: Record<string, string> | null;
};

export type ExportFormat = "plain" | "mtgo" | "arena";

/**
 * Plain text format matching our import: "4x Card Name" per line.
 * Sections: mainboard first, then "Sideboard" header + sideboard cards.
 */
function formatPlain(cards: ExportCard[]): string {
  const main = cards.filter(
    (c) => (c.board_section || "mainboard").toLowerCase() === "mainboard",
  );
  const side = cards.filter(
    (c) => (c.board_section || "").toLowerCase() === "sideboard",
  );
  const lines: string[] = [];
  for (const c of main) {
    const name = (c.name ?? "Unknown").trim();
    if (name) lines.push(`${c.count}x ${name}`);
  }
  if (side.length > 0) {
    lines.push("", "Sideboard");
    for (const c of side) {
      const name = (c.name ?? "Unknown").trim();
      if (name) lines.push(`${c.count}x ${name}`);
    }
  }
  return lines.join("\n");
}

/**
 * MTGO format: "4 Card Name" per line (no "x").
 * Sections: "Deck" then mainboard lines; blank line; "Sideboard" then sideboard lines.
 * https://decklist.gg/docs/deck-import
 */
function formatMTGO(cards: ExportCard[]): string {
  const main = cards.filter(
    (c) => (c.board_section || "mainboard").toLowerCase() === "mainboard",
  );
  const side = cards.filter(
    (c) => (c.board_section || "").toLowerCase() === "sideboard",
  );
  const lines: string[] = ["Deck"];
  for (const c of main) {
    const name = (c.name ?? "Unknown").trim();
    if (name) lines.push(`${c.count} ${name}`);
  }
  if (side.length > 0) {
    lines.push("", "Sideboard");
    for (const c of side) {
      const name = (c.name ?? "Unknown").trim();
      if (name) lines.push(`${c.count} ${name}`);
    }
  }
  return lines.join("\n");
}

/**
 * MTG Arena format: "4 Card Name (SET) 123" when set + collector_number exist.
 * Otherwise "4 Card Name". One card per line.
 * https://mtgarena-support.wizards.com/hc/en-us/articles/360049857771-Importing-a-Deck
 */
function formatArena(cards: ExportCard[]): string {
  const main = cards.filter(
    (c) => (c.board_section || "mainboard").toLowerCase() === "mainboard",
  );
  const side = cards.filter(
    (c) => (c.board_section || "").toLowerCase() === "sideboard",
  );
  const line = (c: ExportCard) => {
    const name = (c.name ?? "Unknown").trim();
    if (!name) return "";
    const id = c.identifiers ?? {};
    const set = id.set || id.setCode || "";
    const num = id.collector_number ?? id.collectorNumber ?? "";
    if (set && num) return `${c.count} ${name} (${set}) ${num}`;
    return `${c.count} ${name}`;
  };
  const lines: string[] = [];
  for (const c of main) {
    const s = line(c);
    if (s) lines.push(s);
  }
  if (side.length > 0) {
    lines.push("", "Sideboard");
    for (const c of side) {
      const s = line(c);
      if (s) lines.push(s);
    }
  }
  return lines.join("\n");
}

function formatDeck(cards: ExportCard[], format: ExportFormat): string {
  switch (format) {
    case "plain":
      return formatPlain(cards);
    case "mtgo":
      return formatMTGO(cards);
    case "arena":
      return formatArena(cards);
    default:
      return formatPlain(cards);
  }
}

const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: "plain", label: "Plain text (import format)" },
  { value: "mtgo", label: "MTGO" },
  { value: "arena", label: "MTG Arena" },
];

interface ExportCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportCardsModal({ isOpen, onClose }: ExportCardsModalProps) {
  const { bgColor } = useCompactView();
  const { cards } = useCardList();
  const [format, setFormat] = useState<ExportFormat>("plain");
  const [copied, setCopied] = useState(false);

  const exportCards: ExportCard[] = cards.map((c) => ({
    name: c.name ?? null,
    count: c.count ?? 1,
    board_section: (c as { board_section?: string }).board_section,
    identifiers: (c as { identifiers?: Record<string, string> | null }).identifiers ?? null,
  }));

  const text = formatDeck(exportCards, format);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }, [text]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="absolute inset-0 z-40 flex items-start justify-center pt-24 pb-8 px-4"
        style={{ pointerEvents: "auto" }}
      >
        <button
          type="button"
          aria-label="Close"
          className="absolute inset-0 bg-dark/30 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -4 }}
          transition={{
            type: "spring",
            stiffness: 350,
            damping: 28,
            bounce: 0.4,
          }}
          className="relative z-50 w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl overflow-hidden shadow-xl"
        >
          <RaindropContainer
            bgColor={bgColor}
            innerClassName="opacity-30"
            childClassName="p-0 h-full"
            className="rounded-2xl from-light/80 backdrop-blur-sm h-full flex flex-col"
          >
            <div className="flex items-center justify-between pl-5 pr-2 py-2 border-b border-dark/10 bg-light/30">
              <h2 className="text-lg font-bold text-dark/90">Export deck</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-dark/60 hover:text-dark hover:bg-dark/10 transition-colors"
                aria-label="Close"
              >
                <RxCross2 className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 p-3 overflow-y-auto flex-1 min-h-0">
              <div className="flex flex-col gap-2 w-full">
                <label className="text-sm font-semibold text-dark/80">
                  Format
                </label>
                <div className="flex flex-wrap gap-2">
                  {FORMAT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormat(opt.value)}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium border transition-colors",
                        format === opt.value
                          ? "bg-dark/20 border-dark/40 text-dark"
                          : "border-dark/20 text-dark/70 hover:border-dark/30 hover:text-dark/80",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1 w-full">
                <label className="text-sm font-semibold text-dark/80">
                  Deck list
                </label>
                <RaindropContainer className="rounded-xl p-1 w-full">
                  <textarea
                    readOnly
                    value={text}
                    rows={14}
                    className={cn(
                      "w-full rounded-lg border border-dark/20 bg-light/90 px-3 py-2 text-sm text-dark resize-y font-mono",
                    )}
                  />
                </RaindropContainer>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <Button
                  variant="raindrop"
                  size="default"
                  className="rounded-full font-bold"
                  onClick={copyToClipboard}
                  disabled={!text.trim()}
                >
                  {copied ? "Copied!" : "Copy to clipboard"}
                </Button>
                <Button
                  variant="cancel"
                  size="default"
                  className="rounded-full"
                  onClick={onClose}
                >
                  Close
                </Button>
              </div>
            </div>
          </RaindropContainer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
