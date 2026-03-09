"use client";

import React, { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { rehypeCardRefs } from "@/lib/card-ref/rehypeCardRefs";
import { normalizeCardName } from "@/lib/card-ref";
import { useCardPreview } from "@/app/context/CardPreviewContext";
import {
  ResolvedCardsProvider,
  useResolvedCardsFromContext,
} from "./ResolvedCardsContext";
import type { CardPreview } from "@/lib/card-ref";

function CardRefSpan({
  rawName,
  resolvedCards,
}: {
  rawName: string;
  resolvedCards: Record<string, CardPreview> | null;
}) {
  const { setHoveredCard, setPreviewPosition } = useCardPreview();
  const key = normalizeCardName(rawName);
  const card = resolvedCards?.[key];

  // Clear preview when this link unmounts (e.g. parent switches to edit mode)
  useEffect(() => {
    return () => {
      setHoveredCard(null);
      setPreviewPosition(null);
    };
  }, [setHoveredCard, setPreviewPosition]);

  if (!card) {
    return (
      <span className="text-dark/60 bg-light/40 rounded px-1">{rawName}</span>
    );
  }

  return (
    <span
      role="link"
      tabIndex={0}
      className="bg-light/25 font-bold rounded px-1 cursor-default hover:bg-light text-inherit"
      onMouseEnter={(e) => {
        setHoveredCard(card);
        setPreviewPosition({ x: e.clientX, y: e.clientY });
      }}
      onMouseMove={(e) => {
        setPreviewPosition({ x: e.clientX, y: e.clientY });
      }}
      onMouseLeave={() => {
        setHoveredCard(null);
        setPreviewPosition(null);
      }}
      onBlur={() => {
        setHoveredCard(null);
        setPreviewPosition(null);
      }}
    >
      {rawName}
    </span>
  );
}

export type MarkdownWithCardRefsProps = {
  source: string;
  resolvedCards: Record<string, CardPreview> | null;
  className?: string;
};

/**
 * Renders markdown with [[Card Name]] references as interactive card links.
 * Use with ResolvedCardsProvider to supply resolvedCards when rendering
 * inside a parent that has already resolved refs (e.g. from multiple fields).
 */
export function MarkdownWithCardRefs({
  source,
  resolvedCards,
  className,
}: MarkdownWithCardRefsProps) {
  return (
    <ResolvedCardsProvider resolvedCards={resolvedCards}>
      <MarkdownWithCardRefsInner source={source} className={className} />
    </ResolvedCardsProvider>
  );
}

function MarkdownWithCardRefsInner({
  source,
  className,
}: {
  source: string;
  className?: string;
}) {
  const resolvedCards = useResolvedCardsFromContext();

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeCardRefs]}
        components={{
          span: ({ node, children, ...props }) => {
            const dataCardRef = (
              node?.properties as Record<string, unknown> | undefined
            )?.dataCardRef as string | undefined;
            if (dataCardRef != null) {
              return (
                <CardRefSpan
                  rawName={dataCardRef}
                  resolvedCards={resolvedCards}
                />
              );
            }
            return <span {...props}>{children}</span>;
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
