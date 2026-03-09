"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useCardList } from "@/app/context/CardListContext";
import { useCommander } from "@/app/context/CommanderContext";
import { useEditMode } from "@/app/context/editModeContext";
import { useCompactView } from "@/app/context/compactViewContext";
import { parseDeckText, type CardLine } from "@/app/hooks/parseDeckText";
import { selectCardsDataFromIds } from "@/lib/db/searchCardForDeck";
import { CardRecord } from "@/lib/schemas";
import { RaindropContainer } from "../primitives/RaindropContainer";
import { Button } from "../primitives/button";
import {
  Board,
  Group,
  GroupHeader,
  GroupItems,
  GroupTitle,
} from "../primitives/Board";
import { cn } from "@/lib/utils";
import { RxCross2 } from "react-icons/rx";
import CustomScrollArea from "@/app/components/ui/CustomScrollArea";

const TYPE_ORDER = [
  "Land",
  "Creature",
  "Enchantment",
  "Artifact",
  "Instant",
  "Sorcery",
  "Planeswalker",
  "Other",
];

type DisplayCard = CardRecord & {
  imageFrontUrl?: string | null;
  mana_value?: number | null;
};

function groupByCardType(
  cards: DisplayCard[],
): { type: string; cards: DisplayCard[] }[] {
  const grouped: Record<string, DisplayCard[]> = {};
  for (const card of cards) {
    const baseType =
      TYPE_ORDER.find((t) =>
        (card.type ?? "").toLowerCase().includes(t.toLowerCase()),
      ) ?? "Other";
    if (!grouped[baseType]) grouped[baseType] = [];
    grouped[baseType].push(card);
  }
  return TYPE_ORDER.map((type) => ({
    type,
    cards: grouped[type] ?? [],
  })).filter((g) => g.cards.length > 0);
}

type ResolvedLine = CardLine & { cardRecord?: CardRecord };

type ParsedState = {
  lines: ResolvedLine[];
  newLines: ResolvedLine[];
  duplicateLines: ResolvedLine[];
  cardRecordsByUuid: Map<string, CardRecord>;
  /** Count of new card lines rejected for commander color identity. */
  unsupportedCount: number;
};

/** Derive color identity from DB or from mana cost when DB is empty. */
function getCardColorIdentity(cardRecord: CardRecord): string[] {
  const fromDb =
    (cardRecord as { colorIdentity?: string[] }).colorIdentity ??
    (cardRecord as { color_identity?: string[] }).color_identity;
  if (fromDb && fromDb.length > 0) return fromDb;
  const manaCost = String(
    (cardRecord as { mana_cost?: string | null }).mana_cost ?? "",
  ).toUpperCase();
  const colors: string[] = [];
  const symbols = ["W", "U", "B", "R", "G"];
  for (const c of symbols) {
    if (manaCost.includes(c)) colors.push(c);
  }
  return colors;
}

/** True if card's color identity is within commander's (or card is colorless). */
function cardMatchesCommanderIdentity(
  cardRecord: CardRecord,
  commanderIdentity: string[],
): boolean {
  const cardIdentity = getCardColorIdentity(cardRecord);
  if (cardIdentity.length === 0) return true;
  const commanderSet = new Set(commanderIdentity);
  return cardIdentity.every((c) => commanderSet.has(c));
}

function linesToDisplayCards(lines: ResolvedLine[]): DisplayCard[] {
  return lines
    .filter((line) => line.cardRecord)
    .map((line) => {
      const r = line.cardRecord!;
      const count = line.count ?? 1;
      return {
        ...r,
        count,
        mana_value:
          (r as { mana_value?: number; cmc?: number }).mana_value ??
          (r as { cmc?: number }).cmc ??
          null,
        imageFrontUrl:
          (r as { imageFrontUrl?: string | null }).imageFrontUrl ?? null,
      } as DisplayCard;
    });
}

const PREVIEW_H = 320;
const PREVIEW_W = (PREVIEW_H * 488) / 680;

function ImportCardList({
  displayCards,
  visibleGroups,
  toggleGroupVisibility,
  sectionLabel,
  isDuplicateSection,
  imagePosition = "right",
}: {
  displayCards: DisplayCard[];
  visibleGroups: Set<string>;
  toggleGroupVisibility: (type: string) => void;
  sectionLabel: string;
  isDuplicateSection?: boolean;
  imagePosition?: "left" | "right";
}) {
  const groups = useMemo(() => groupByCardType(displayCards), [displayCards]);

  return (
    <Board className="flex flex-col gap-1.5 rounded-xl p-2 min-w-72 bg-light/80">
      <p className="text-sm font-semibold text-dark/80 px-1">{sectionLabel}</p>
      <CustomScrollArea
        className="flex flex-col gap-1 max-h-64 overflow-y-auto"
        trackClassName="bg-dark/20 rounded-xs outline outline-dark/20 w-2 mr-1 my-1 rounded-br-sm"
        thumbClassName="bg-light/60 rounded-xs"
        autoHide={false}
        thickness={10}
      >
        {displayCards.length === 0 ? (
          <p className="text-sm text-dark/50 px-2 py-2">No cards</p>
        ) : (
          groups.map((group, groupIndex) => (
            <Group key={group.type} className="mb-1">
              <GroupHeader
                className={cn("py-1.5", groupIndex === 0 && "border-t-0")}
              >
                <GroupTitle
                  type={group.type}
                  visibleGroups={visibleGroups}
                  toggleGroupVisibility={toggleGroupVisibility}
                />
              </GroupHeader>
              {visibleGroups.has(group.type) && (
                <GroupItems className="mt-1 flex flex-col gap-0 px-1">
                  {group.cards.map((card, cardIndex) => {
                    const previewW = PREVIEW_W;
                    const isLastColumn = imagePosition === "right";
                    return (
                      <motion.div
                        key={`${card.uuid}-${cardIndex}`}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.02 * cardIndex }}
                        className={cn(
                          "group/card flex justify-between w-full py-1.5 px-3 rounded-md hover:bg-dark/5 transition-colors duration-150 border-b border-dark/5 last:border-b-0 relative cursor-default",
                        )}
                        style={{
                          ["--preview-w" as string]: `${previewW + 8}px`,
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium text-dark truncate text-sm">
                            {card.name ?? "Unknown"}
                          </span>
                          {card.count > 1 && (
                            <span className="shrink-0 text-muted-foreground font-semibold text-xs bg-dark/10 px-1.5 py-0.5 rounded">
                              ×{card.count}
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 text-muted-foreground font-bold tabular-nums text-sm w-6 text-right">
                          {(card as DisplayCard).mana_value ?? "—"}
                        </span>
                        {card.imageFrontUrl && (
                          <div
                            className={cn(
                              "pointer-events-none absolute z-50 rounded-xl shadow-xl opacity-0 transition-opacity duration-150 group-hover/card:opacity-100",
                              isLastColumn
                                ? "right-full mr-2 top-0"
                                : "left-full ml-2 top-0",
                            )}
                            style={{
                              width: `${previewW}px`,
                              height: `${PREVIEW_H}px`,
                            }}
                          >
                            <Image
                              src={card.imageFrontUrl}
                              width={488}
                              height={680}
                              alt=""
                              className="object-cover w-full h-full rounded-lg"
                            />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </GroupItems>
              )}
            </Group>
          ))
        )}
      </CustomScrollArea>
    </Board>
  );
}

interface ImportCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportCardsModal({ isOpen, onClose }: ImportCardsModalProps) {
  const { bgColor } = useCompactView();
  const { cards: deckCards, addCard } = useCardList();
  const { commanderCard } = useCommander();
  const { setEditMode } = useEditMode();
  const commanderIdentity =
    commanderCard?.colorIdentity ??
    (commanderCard as { color_identity?: string[] } | undefined)
      ?.color_identity ??
    [];
  const [deckText, setDeckText] = useState("");
  const [loading, setLoading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedState | null>(null);
  const [includeDuplicates, setIncludeDuplicates] = useState(false);
  const [visibleGroupsNew, setVisibleGroupsNew] = useState<Set<string>>(
    new Set(TYPE_ORDER),
  );
  const [visibleGroupsDup, setVisibleGroupsDup] = useState<Set<string>>(
    new Set(TYPE_ORDER),
  );

  const deckUuidSet = useCallback(() => {
    const set = new Set<string>();
    for (const c of deckCards) set.add(c.uuid);
    return set;
  }, [deckCards])();

  const handleParse = useCallback(async () => {
    const trimmed = deckText.trim();
    if (!trimmed) {
      setParseError("Paste your card list first.");
      setParsed(null);
      return;
    }
    setLoading(true);
    setParseError(null);
    setParsed(null);
    try {
      const result = await parseDeckText(trimmed);
      if (!result || result.length === 0) {
        setParseError(
          "No valid cards found. Use format: 1x Card Name or 2 Card Name",
        );
        return;
      }
      const uniqueUuids = [
        ...new Set(result.map((r) => r.uuid).filter(Boolean)),
      ] as string[];
      const cardRecordsByUuid = await selectCardsDataFromIds(uniqueUuids);
      const linesWithRecords: ResolvedLine[] = result
        .filter((line) => line.uuid && cardRecordsByUuid.has(line.uuid))
        .map((line) => ({
          ...line,
          cardRecord: cardRecordsByUuid.get(line.uuid!),
        }));

      if (linesWithRecords.length === 0) {
        setParseError("Could not resolve any cards. Check card names.");
        return;
      }

      const newLinesRaw: ResolvedLine[] = [];
      const duplicateLines: ResolvedLine[] = [];
      for (const line of linesWithRecords) {
        if (deckUuidSet.has(line.uuid!)) duplicateLines.push(line);
        else newLinesRaw.push(line);
      }
      const newLines: ResolvedLine[] = [];
      let unsupportedCount = 0;
      for (const line of newLinesRaw) {
        const record = line.cardRecord;
        if (
          record &&
          commanderIdentity.length > 0 &&
          !cardMatchesCommanderIdentity(record, commanderIdentity)
        ) {
          unsupportedCount += 1;
          continue;
        }
        newLines.push(line);
      }
      setParsed({
        lines: linesWithRecords,
        newLines,
        duplicateLines,
        cardRecordsByUuid,
        unsupportedCount,
      });
      const allTypes = new Set(TYPE_ORDER);
      setVisibleGroupsNew(new Set(allTypes));
      setVisibleGroupsDup(new Set(allTypes));
    } catch (e) {
      console.error(e);
      setParseError("Something went wrong parsing the list.");
    } finally {
      setLoading(false);
    }
  }, [deckText, deckUuidSet]);

  const canImport =
    parsed &&
    (parsed.newLines.length > 0 ||
      (includeDuplicates && parsed.duplicateLines.length > 0));

  const handleImport = useCallback(() => {
    if (!parsed || !canImport) return;
    const toAdd = includeDuplicates
      ? [...parsed.newLines, ...parsed.duplicateLines]
      : parsed.newLines;
    for (const line of toAdd) {
      const record = line.cardRecord;
      if (!record) continue;
      const count = line.count ?? 1;
      for (let i = 0; i < count; i++) {
        addCard(record);
      }
    }
    setEditMode(true);
    onClose();
    setDeckText("");
    setParsed(null);
    setIncludeDuplicates(false);
  }, [parsed, includeDuplicates, addCard, setEditMode, onClose]);

  const toggleGroupVisibilityNew = useCallback((type: string) => {
    setVisibleGroupsNew((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);
  const toggleGroupVisibilityDup = useCallback((type: string) => {
    setVisibleGroupsDup((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    setParseError(null);
    setParsed(null);
    setDeckText("");
    setIncludeDuplicates(false);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="absolute inset-0 z-40 flex items-start justify-center pb-2 pr-8 pl-2"
        style={{ pointerEvents: "auto" }}
      >
        {/* Backdrop */}
        <button
          type="button"
          aria-label="Close"
          className="absolute inset-0 bg-dark/10"
          onClick={handleClose}
        />
        {/* Modal panel */}
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.65,
            y: -8,
            backdropFilter: "blur(2px)",
          }}
          animate={{ opacity: 1, scale: 1, y: 0, backdropFilter: "blur(8px)" }}
          exit={{ opacity: 0, scale: 0.98, y: -4, backdropFilter: "blur(2px)" }}
          transition={{
            type: "spring",
            stiffness: 350,
            damping: 25,
            bounce: 0.4,
          }}
          className="relative z-50 w-fit max-h-[85vh] my-auto flex flex-col rounded-3xl overflow-hidden shadow-xl bg-light/30"
        >
          <RaindropContainer
            bgColor={bgColor}
            innerClassName="opacity-30"
            childClassName="p-0 h-full"
            className="rounded-2xl from-light/80 h-full flex flex-col"
          >
            <div className="flex items-center justify-between pl-5 pr-2 py-2 border-b border-dark/10  bg-light/30">
              <h2 className="text-lg font-bold text-dark/90">Import cards</h2>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-full text-dark/60 hover:text-dark hover:bg-dark/10 transition-colors"
                aria-label="Close"
              >
                <RxCross2 className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 p-3 overflow-y-auto flex-1 min-h-0 items-center">
              {!parsed && (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 }}
                    className="flex flex-col gap-1 w-full max-w-md"
                  >
                    <RaindropContainer className="flex flex-col gap-1 rounded-xl p-1 w-full">
                      <label className="text-md font-semibold text-dark/80 px-1">
                        Paste card list
                      </label>
                      <textarea
                        value={deckText}
                        onChange={(e) => {
                          setDeckText(e.target.value);
                          setParseError(null);
                        }}
                        placeholder="e.g.&#10;4x Llanowar Elves&#10;2x Shivan Dragon&#10;3 Counterspell"
                        rows={5}
                        className={cn(
                          "w-full rounded-lg border border-dark/20 bg-light/80 px-3 py-2 text-sm text-dark placeholder:text-dark/50 focus:outline-dark/30 focus:outline resize-y min-h-24",
                        )}
                      />
                    </RaindropContainer>
                  </motion.div>

                  {parseError && (
                    <p className="text-sm text-red-600/90 px-1 w-full max-w-md">
                      {parseError}
                    </p>
                  )}

                  <div className="flex gap-2 items-center">
                    <Button
                      variant="secondaryBlue"
                      size="default"
                      className="rounded-xl font-medium"
                      onClick={handleParse}
                      disabled={loading}
                    >
                      {loading ? "Checking…" : "Validate list"}
                    </Button>
                  </div>
                </>
              )}

              {parsed && (
                <>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ delay: 0.1 }}
                    className="flex gap-3"
                  >
                    <div className="flex flex-col gap-1.5 min-w-72">
                      <ImportCardList
                        sectionLabel={`New cards (${parsed.newLines.length} entries)`}
                        displayCards={linesToDisplayCards(parsed.newLines)}
                        visibleGroups={visibleGroupsNew}
                        toggleGroupVisibility={toggleGroupVisibilityNew}
                        imagePosition="right"
                      />
                    </div>

                    {parsed.duplicateLines.length > 0 && (
                      <ImportCardList
                        sectionLabel={`Already in deck (${parsed.duplicateLines.length} entries)`}
                        displayCards={linesToDisplayCards(
                          parsed.duplicateLines,
                        )}
                        visibleGroups={visibleGroupsDup}
                        toggleGroupVisibility={toggleGroupVisibilityDup}
                        isDuplicateSection
                        imagePosition="left"
                      />
                    )}
                  </motion.div>
                  {parsed.unsupportedCount > 0 && (
                    <span
                      className="inline-flex w-fit items-center rounded-full bg-red-500/80 px-2.5 py-0.5 text-xs font-medium text-white"
                      role="status"
                    >
                      {parsed.unsupportedCount} card
                      {parsed.unsupportedCount !== 1 ? "s" : ""} not supported
                      by color identity
                    </span>
                  )}

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="flex flex-wrap items-center justify-between gap-3 pt-2 w-full"
                  >
                    <Button
                      variant="darkFrosted"
                      size="default"
                      className="rounded-full text-dark/70 hover:text-dark"
                      onClick={() => setParsed(null)}
                    >
                      Change import text
                    </Button>
                    <div className="flex items-center gap-3">
                      {parsed.duplicateLines.length > 0 && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={includeDuplicates}
                            onChange={(e) =>
                              setIncludeDuplicates(e.target.checked)
                            }
                            className="w-4 h-4 border-dark/30 text-dark/80 focus:ring-dark/30"
                          />
                          <span className="text-md font-medium text-dark/80">
                            Import duplicates
                          </span>
                        </label>
                      )}
                      <Button
                        variant="raindrop"
                        size="default"
                        className="rounded-full font-bold"
                        onClick={handleImport}
                        disabled={!canImport}
                      >
                        Import cards
                      </Button>
                      <Button
                        variant="cancel"
                        size="default"
                        className="rounded-full"
                        onClick={handleClose}
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                </>
              )}
            </div>
          </RaindropContainer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
