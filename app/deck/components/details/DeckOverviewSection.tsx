"use client";

import * as React from "react";
import { Card, CardContent, CardTitle } from "@/app/components/ui/card";
import { useCardList } from "@/app/context/CardListContext";
import { useCommander } from "@/app/context/CommanderContext";
import { ManaCost } from "@/app/components/ui/manaCost";
import PerspectiveCard from "../card/perspectiveCardUI/PerspectiveCard";
import { ExpandablePillsMini } from "../overview/expandablePillsMini";
import { CardRecord } from "@/lib/schemas";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AnimatePresence, motion } from "framer-motion";

function formatTagLabel(slug: string) {
  return slug.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function tagsFromArchetype(axes?: Record<string, number> | null): string[] {
  if (!axes) return [];
  return Object.entries(axes)
    .filter(([, score]) => Number(score) >= 65)
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .map(([slug]) => slug);
}

function tagsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((t, i) => t === b[i]);
}

export default function DeckOverviewSection() {
  const { deck, difficulty, archetypeOverview, setDeck, userOwnsDeck } =
    useCardList();
  const { deckDetails, commanderCard, setDeckDetails } = useCommander();
  const [visibilitySaving, setVisibilitySaving] = React.useState(false);
  const [visibilityHovered, setVisibilityHovered] = React.useState(false);
  const isPublic = deck?.isPublic ?? false;

  const toggleVisibility = React.useCallback(async () => {
    if (!deck?.id || !userOwnsDeck || visibilitySaving) return;
    const next = !isPublic;
    setVisibilitySaving(true);
    try {
      const res = await fetch("/api/decks/update-visibility", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId: deck.id, isPublic: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("Failed to update visibility:", data.error);
        return;
      }
      setDeck({ ...deck, isPublic: next });
    } finally {
      setVisibilitySaving(false);
    }
  }, [deck, userOwnsDeck, isPublic, visibilitySaving, setDeck]);

  // On page load or archetype change: sync tags from axes (65+) to DB if owner and different
  React.useEffect(() => {
    if (!userOwnsDeck || !deck?.id || !archetypeOverview?.axes) return;
    const expectedTags = tagsFromArchetype(archetypeOverview.axes);
    const currentTags =
      (deckDetails as { tags?: string[] } | null)?.tags ??
      (deck as { tags?: string[] } | null)?.tags ??
      [];
    if (tagsEqual(expectedTags, currentTags)) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/decks/update-tags", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deckId: deck.id, tags: expectedTags }),
        });
        if (cancelled || !res.ok) return;
        const data = await res.json();
        const newTags = data.tags ?? expectedTags;
        setDeck({ ...deck, tags: newTags });
        if (deckDetails)
          setDeckDetails({
            ...deckDetails,
            tags: newTags,
          } as typeof deckDetails);
      } catch {
        // background sync, ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    userOwnsDeck,
    deck?.id,
    deck,
    deckDetails,
    archetypeOverview?.axes,
    setDeck,
    setDeckDetails,
  ]);

  const commanderAsCardRecord = React.useMemo((): CardRecord | null => {
    if (!commanderCard) return null;
    return {
      uuid: commanderCard.uuid,
      name: commanderCard.name,
      type: commanderCard.type,
      text: commanderCard.text,
      mana_cost: commanderCard.mana_cost ?? undefined,
      mana_value: commanderCard.cmc,
      color_identity: commanderCard.colorIdentity,
      imageFrontUrl: commanderCard.imageFrontUrl,
      identifiers: commanderCard.identifiers ?? undefined,
      count: 1,
      board_section: "mainboard",
      flavor_text: commanderCard.flavourText ?? undefined,
    } as CardRecord;
  }, [commanderCard]);

  if (!deck && !deckDetails) return null;

  const name = deck?.name ?? deckDetails?.name ?? "";
  const type = deck?.type ?? deckDetails?.type ?? "";
  const tags =
    (deckDetails as { tags?: string[] } | null)?.tags ??
    (deck as { tags?: string[] } | null)?.tags ??
    [];
  const releaseDate =
    (deckDetails as { releaseDate?: string | null } | null)?.releaseDate ??
    deck?.release_date ??
    null;
  const creatorName =
    (deckDetails as { creatorName?: string | null } | null)?.creatorName ??
    (deck as { creatorName?: string | null } | null)?.creatorName;

  return (
    <Card className="mb-6">
      <CardContent className="flex flex-col gap-4 md:flex-row md:items-start">
        {/* Commander: PerspectiveCard */}
        {commanderCard && commanderAsCardRecord && (
          <div className="shrink-0 flex justify-center md:justify-start">
            <PerspectiveCard
              id={commanderCard.uuid}
              image={commanderCard.imageFrontUrl ?? ""}
              label={commanderCard.name}
              isEditMode={false}
              card={commanderAsCardRecord}
            />
          </div>
        )}
        {/* Top: deck name, creator, release date, type, commander mana cost */}
        <div className="flex-1 flex-col min-w-0">
          <div className="flex justify-between">
            {/* Left: deck name, creator, release date, type, commander mana cost */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <CardTitle className="font-bold text-dark/90 truncate">
                  {name}
                </CardTitle>{" "}
                {type && (
                  <span className="font-normal bg-light/20 px-2 rounded-md whitespace-nowrap">
                    {type}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-dark/60">
                {creatorName && <span>by {creatorName}</span>}
                {releaseDate && <span>{formatDate(releaseDate)}</span>}
                {userOwnsDeck && (
                  <div
                    className="relative inline-block"
                    onMouseEnter={() => setVisibilityHovered(true)}
                    onMouseLeave={() => setVisibilityHovered(false)}
                  >
                    <button
                      type="button"
                      onClick={toggleVisibility}
                      disabled={visibilitySaving}
                      className="flex items-center justify-center rounded-md px-2 py-1 transition-colors hover:bg-light/30 disabled:opacity-60 cursor-pointer"
                      title={
                        isPublic
                          ? "Deck is visible to everyone"
                          : "Only you can see this deck"
                      }
                    >
                      {visibilitySaving ? (
                        <span className="text-dark/60 text-sm">Updating…</span>
                      ) : (
                        <span
                          className={`inline-block h-2 w-2 shrink-0 rounded-full ${isPublic ? "bg-green-500" : "bg-dark/40"}`}
                          aria-hidden
                        />
                      )}
                    </button>
                    <AnimatePresence>
                      {visibilityHovered && !visibilitySaving && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute left-1/2 bottom-full z-20 -translate-x-1/2 mb-1 min-w-20 rounded-md shadow-lg border border-dark/10 overflow-hidden bg-light/95 backdrop-blur-sm"
                        >
                          <div className="px-2 py-1.5">
                            <p className="font-semibold text-sm text-dark/90 whitespace-nowrap">
                              {isPublic ? "Public" : "Private"}
                            </p>
                            <p className="text-xs text-dark/60 leading-snug">
                              {isPublic
                                ? "Deck is visible to everyone"
                                : "Only you can see this deck"}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
              {commanderCard?.mana_cost && (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-md text-dark/70">Commander</p>
                  <div className="flex items-center gap-2 bg-light/15 rounded-lg px-2">
                    <p>{commanderCard.name}</p>
                    <ManaCost manaCost={commanderCard.mana_cost} />
                  </div>
                </div>
              )}
            </div>
            {/* Right: expandable pills, then tag pills below */}
            <div className="flex flex-col justify-between items-end">
              {difficulty && <ExpandablePillsMini difficulty={difficulty} />}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-light/40 px-2 py-0.5 text-sm font-medium text-dark/80"
                    >
                      {formatTagLabel(tag)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Bottom: archetype overview description */}
          <div>
            {archetypeOverview?.description && (
              <div className="mt-3 pt-3 border-t border-dark/10">
                <div className="prose prose-sm dark:prose-invert max-w-none text-dark/80">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {archetypeOverview.description}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
