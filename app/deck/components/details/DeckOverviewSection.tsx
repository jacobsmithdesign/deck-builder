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
import { useResolvedCardReferences } from "@/app/hooks/useResolvedCardReferences";
import { MarkdownWithCardRefs } from "@/app/components/card-ref/MarkdownWithCardRefs";
import {
  AiOutlineLoading3Quarters,
  AiOutlineEye,
  AiOutlineHeart,
  AiFillHeart,
  AiOutlineComment,
} from "react-icons/ai";
import CustomScrollArea from "@/app/components/ui/CustomScrollArea";

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
  const [likeLoading, setLikeLoading] = React.useState(false);
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const { resolved: resolvedCards, resolve: resolveCardRefs } =
    useResolvedCardReferences();
  const descriptionForRefs =
    (deck as { description?: string | null })?.description ??
    (deckDetails as { description?: string | null })?.description ??
    "";

  React.useEffect(() => {
    const texts = [
      ...(descriptionForRefs ? [descriptionForRefs] : []),
      ...(archetypeOverview?.description
        ? [archetypeOverview.description]
        : []),
    ];
    if (texts.length) resolveCardRefs(texts);
  }, [descriptionForRefs, archetypeOverview?.description, resolveCardRefs]);
  const [localTitle, setLocalTitle] = React.useState("");
  const [isEditingDescription, setIsEditingDescription] = React.useState(false);
  const [localDescription, setLocalDescription] = React.useState("");
  const [descriptionSaving, setDescriptionSaving] = React.useState(false);
  const titleInputRef = React.useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const cancelDescRef = React.useRef<HTMLButtonElement>(null);
  const isPublic = deck?.isPublic ?? false;

  // Record view once per deck when overview is shown
  React.useEffect(() => {
    if (!deck?.id) return;
    fetch(`/api/decks/${deck.id}/view`, { method: "POST" }).catch(() => {});
  }, [deck?.id]);

  const scrollToComments = React.useCallback(() => {
    document.getElementById("deck-comments")?.scrollIntoView({
      behavior: "smooth",
    });
  }, []);

  const toggleLike = React.useCallback(async () => {
    if (!deck?.id || likeLoading) return;
    setLikeLoading(true);
    const prevLiked = deck.userHasLiked ?? false;
    const prevCount = deck.likeCount ?? 0;
    setDeck({
      ...deck,
      userHasLiked: !prevLiked,
      likeCount: prevCount + (prevLiked ? -1 : 1),
    });
    try {
      const res = await fetch(`/api/decks/${deck.id}/like`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && typeof data.liked === "boolean") {
        setDeck({
          ...deck,
          userHasLiked: data.liked,
          likeCount: data.likeCount ?? deck.likeCount ?? 0,
        });
      } else {
        setDeck({
          ...deck,
          userHasLiked: prevLiked,
          likeCount: prevCount,
        });
      }
    } catch {
      setDeck({
        ...deck,
        userHasLiked: prevLiked,
        likeCount: prevCount,
      });
    } finally {
      setLikeLoading(false);
    }
  }, [deck, likeLoading, setDeck]);

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

  const currentName =
    deck?.name ?? (deckDetails as { name?: string } | null)?.name ?? "";
  const saveTitle = React.useCallback(async () => {
    if (!deck?.id || !userOwnsDeck) return;
    const trimmed = localTitle.trim();
    if (trimmed === currentName) {
      setIsEditingTitle(false);
      return;
    }
    if (!trimmed) {
      setLocalTitle(currentName);
      setIsEditingTitle(false);
      return;
    }
    try {
      const res = await fetch("/api/decks/update-metadata", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId: deck.id, name: trimmed }),
      });
      if (res.ok) {
        setDeck({ ...deck, name: trimmed });
      } else {
        setLocalTitle(currentName);
      }
    } catch {
      setLocalTitle(currentName);
    }
    setIsEditingTitle(false);
  }, [deck, userOwnsDeck, currentName, localTitle, setDeck]);

  const saveDescription = React.useCallback(async () => {
    if (!deck?.id || !userOwnsDeck || descriptionSaving) return;
    const trimmed = localDescription.trim();
    const current =
      (deck as { description?: string | null })?.description ?? "";
    if (trimmed === current) {
      setIsEditingDescription(false);
      return;
    }
    setDescriptionSaving(true);
    try {
      const res = await fetch("/api/decks/update-metadata", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deckId: deck.id,
          description: trimmed || null,
        }),
      });
      if (res.ok) {
        setDeck({
          ...deck,
          description: trimmed || null,
        } as typeof deck & { description: string | null });
      }
    } finally {
      setDescriptionSaving(false);
      setIsEditingDescription(false);
    }
  }, [deck, userOwnsDeck, localDescription, descriptionSaving, setDeck]);

  React.useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      const input = titleInputRef.current;
      input.focus();
      const len = input.value.length;
      input.setSelectionRange(len, len);
    }
  }, [isEditingTitle]);

  React.useEffect(() => {
    if (isEditingDescription && descriptionTextareaRef.current) {
      descriptionTextareaRef.current.focus();
      descriptionTextareaRef.current.setSelectionRange(
        descriptionTextareaRef.current.value.length,
        descriptionTextareaRef.current.value.length,
      );
    }
  }, [isEditingDescription]);

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
  const description =
    (deck as { description?: string | null })?.description ??
    (deckDetails as { description?: string | null })?.description ??
    "";
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
                {userOwnsDeck && isEditingTitle ? (
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={localTitle}
                    onChange={(e) => setLocalTitle(e.target.value)}
                    onBlur={saveTitle}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveTitle();
                      }
                      if (e.key === "Escape") {
                        setLocalTitle(name);
                        setIsEditingTitle(false);
                        titleInputRef.current?.blur();
                      }
                    }}
                    className="font-bold text-dark/90 min-w-0 rounded-md px-2 -mx-2 -my-1 bg-transparent  text-md md:text-lg lg:text-xl hover:bg-light/15 tracking-tight focus:bg-light/25 focus:outline-none transition-colors mr-1"
                    style={{
                      width: `${Math.max(localTitle.length - 1, 0)}ch`,
                    }}
                    aria-label="Deck title"
                  />
                ) : (
                  <CardTitle
                    className={`font-bold text-dark/90 truncate ${userOwnsDeck ? "cursor-pointer rounded-md px-2 py-1 -mx-2 -my-1 hover:bg-light/15 focus:bg-light/25 focus:outline-none transition-colors" : ""} mr-1`}
                    onClick={() => {
                      if (userOwnsDeck) {
                        setLocalTitle(name);
                        setIsEditingTitle(true);
                      }
                    }}
                    onFocus={() =>
                      userOwnsDeck &&
                      (setLocalTitle(name), setIsEditingTitle(true))
                    }
                    tabIndex={userOwnsDeck ? 0 : undefined}
                    role={userOwnsDeck ? "button" : undefined}
                    aria-label={userOwnsDeck ? "Edit deck title" : undefined}
                  >
                    {name}
                  </CardTitle>
                )}
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
                    className="relative inline-flex"
                    onMouseEnter={() => setVisibilityHovered(true)}
                    onMouseLeave={() => setVisibilityHovered(false)}
                  >
                    <button
                      type="button"
                      onClick={toggleVisibility}
                      disabled={visibilitySaving}
                      className="flex items-center justify-center rounded-md px-2 py-1 transition-colors w-full hover:bg-light/30 disabled:opacity-60 cursor-pointer gap-2"
                    >
                      {visibilitySaving ? (
                        <>
                          <AiOutlineLoading3Quarters className="h-4 w-4 p-0.5 shrink-0 animate-spin text-dark/60" />
                          Saving
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block h-2 w-2 shrink-0 ml-1 rounded-full ${isPublic ? "bg-green-500" : "bg-dark/40"}`}
                          />
                          {isPublic ? "Public" : "Private"}
                        </div>
                      )}
                    </button>
                    <AnimatePresence>
                      {visibilityHovered && !visibilitySaving && (
                        <motion.div
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -4 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute left-full top-1/2 z-20 ml-1 -translate-y-1/2 w-max min-w-0 rounded-xl px-2 py-1  bg-light/35 whitespace-nowrap"
                        >
                          <span className="text-dark/70 text-sm">
                            {isPublic
                              ? "Visible to everyone"
                              : "Only you can see this deck"}
                          </span>
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
              {/* Engagement pills: views, likes, comments */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-light/25 px-2.5 py-1 text-xs font-medium text-dark/70"
                  aria-label="Views"
                >
                  <AiOutlineEye className="h-3.5 w-3.5 shrink-0" />
                  {deck?.viewCount ?? 0}
                </span>
                <button
                  type="button"
                  onClick={toggleLike}
                  disabled={likeLoading}
                  className="inline-flex items-center gap-1.5 rounded-full bg-light/25 px-2.5 py-1 text-xs font-medium text-dark/70 transition-colors hover:bg-light/40 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-dark/20"
                  aria-label={deck?.userHasLiked ? "Unlike" : "Like"}
                >
                  {likeLoading ? (
                    <AiOutlineLoading3Quarters className="h-3.5 w-3.5 shrink-0 animate-spin" />
                  ) : deck?.userHasLiked ? (
                    <AiFillHeart className="h-3.5 w-3.5 shrink-0 text-red-500" />
                  ) : (
                    <AiOutlineHeart className="h-3.5 w-3.5 shrink-0" />
                  )}
                  {deck?.likeCount ?? 0}
                </button>
                <button
                  type="button"
                  onClick={scrollToComments}
                  className="inline-flex items-center gap-1.5 rounded-full bg-light/25 px-2.5 py-1 text-xs font-medium text-dark/70 transition-colors hover:bg-light/40 focus:outline-none focus:ring-2 focus:ring-dark/20"
                  aria-label="Scroll to comments"
                >
                  <AiOutlineComment className="h-3.5 w-3.5 shrink-0" />
                  {deck?.commentCount ?? 0}
                </button>
              </div>
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
          {/* Deck description (editable by owner) */}
          {(userOwnsDeck || description) && (
            <div className="mt-3 pt-3 border-t border-dark/10">
              {userOwnsDeck && isEditingDescription ? (
                <div className="relative">
                  <textarea
                    ref={descriptionTextareaRef}
                    value={localDescription}
                    onChange={(e) => setLocalDescription(e.target.value)}
                    onBlur={(e) => {
                      if (
                        (e.relatedTarget as Node) &&
                        cancelDescRef.current?.contains(e.relatedTarget as Node)
                      )
                        return;
                      saveDescription();
                    }}
                    placeholder="Add a description..."
                    className="w-full rounded-md px-3 py-2 text-md text-dark/90 hide-scrollbar focus:border-dark/20 transition-colors resize-y min-h-24 bg-light/60"
                    aria-label="Deck description"
                  />
                  <div className="flex justify-end mt-2 gap-2">
                    <button
                      type="button"
                      onClick={saveDescription}
                      disabled={descriptionSaving}
                      className="rounded-md px-3 py-1.5 text-sm font-medium bg-dark/15 text-dark/80 hover:bg-dark/25 focus:outline-none focus:ring-2 focus:ring-dark/20 disabled:opacity-60 transition-colors"
                    >
                      {descriptionSaving ? (
                        <>
                          <AiOutlineLoading3Quarters className="inline h-4 w-4 mr-1.5 animate-spin align-middle" />
                          Saving
                        </>
                      ) : (
                        "Save"
                      )}
                    </button>
                    <button
                      ref={cancelDescRef}
                      type="button"
                      onClick={() => {
                        setLocalDescription(description);
                        setIsEditingDescription(false);
                      }}
                      className="rounded-md px-3 py-1.5 text-sm font-medium bg-dark/5 text-dark/80 hover:bg-dark/25 focus:outline-none focus:ring-2 focus:ring-dark/20 disabled:opacity-60 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`prose prose-sm dark:prose-invert max-w-none text-dark/80 rounded-md px-3 py-2 min-h-10 ${userOwnsDeck ? "cursor-pointer hover:bg-light/15 focus:bg-light/25 focus:outline-none transition-colors" : ""}`}
                  onClick={() => {
                    if (userOwnsDeck) {
                      setLocalDescription(description);
                      setIsEditingDescription(true);
                    }
                  }}
                  onFocus={() => {
                    if (userOwnsDeck) {
                      setLocalDescription(description);
                      setIsEditingDescription(true);
                    }
                  }}
                  tabIndex={userOwnsDeck ? 0 : undefined}
                  role={userOwnsDeck ? "button" : undefined}
                  aria-label={
                    userOwnsDeck ? "Edit deck description" : undefined
                  }
                >
                  {description ? (
                    <MarkdownWithCardRefs
                      source={description}
                      resolvedCards={resolvedCards}
                      className="prose prose-sm dark:prose-invert max-w-none"
                    />
                  ) : (
                    <span className="text-dark/50 italic">
                      {userOwnsDeck ? "Add a description..." : ""}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
