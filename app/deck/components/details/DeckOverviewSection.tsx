"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardTitle,
} from "@/app/components/ui/card";
import { useCardList } from "@/app/context/CardListContext";
import { useCommander } from "@/app/context/CommanderContext";
import { ManaCost } from "@/app/components/ui/manaCost";
import PerspectiveCard from "../card/perspectiveCardUI/PerspectiveCard";
import { ExpandablePillsMini } from "../overview/expandablePillsMini";
import { CardRecord } from "@/lib/schemas";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
        if (deckDetails) setDeckDetails({ ...deckDetails, tags: newTags });
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
  const creatorName = (deckDetails as { creatorName?: string | null } | null)
    ?.creatorName;

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
        <div className="flex-1 min-w-0 flex flex-col md:flex-row md:gap-4">
          {/* Left: title row, meta, mana, description */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            {/* Title + Commander on same row, title ellipsis on overflow */}
            <div className="flex items-baseline gap-2 min-w-0">
              <CardTitle className="font-bold text-dark/90 truncate min-w-0">
                {name}
              </CardTitle>
              {commanderCard && (
                <span className="text-sm text-dark/60 shrink-0">
                  · {commanderCard.name}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-dark/60">
              {creatorName && <span>by {creatorName}</span>}
              {releaseDate && <span>{formatDate(releaseDate)}</span>}
              {type && (
                <span className="font-normal bg-light/20 px-2 rounded-md whitespace-nowrap">
                  {type}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {commanderCard?.mana_cost && (
                <ManaCost manaCost={commanderCard.mana_cost} />
              )}
            </div>

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

          {/* Right: expandable pills, then tag pills below */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {difficulty && (
              <ExpandablePillsMini difficulty={difficulty} />
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-end">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-light/40 px-2 py-0.5 text-xs font-medium text-dark/80"
                  >
                    {formatTagLabel(tag)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
