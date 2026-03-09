"use client";

import React, { useMemo, useEffect } from "react";
import {
  parseCardReferences,
  normalizeCardName,
  type CardPreview,
} from "@/lib/card-ref";
import { useCardPreview } from "@/app/context/CardPreviewContext";

export type CardReferenceTextProps = {
  text: string;
  /** Resolved cards keyed by normalised name. Omit to render refs as plain [[name]]. */
  resolvedCards?: Record<string, CardPreview> | null;
  /** Optional class for the wrapper. */
  className?: string;
  /** Optional class for card links. */
  linkClassName?: string;
};

/**
 * Renders text with [[Card Name]] references as interactive inline links.
 * When resolvedCards is provided, matched refs become links that show a card
 * preview on hover (via CardPreviewProvider). Unresolved refs render as plain
 * [[Name]] text. Single square brackets are not treated as refs.
 */
export function CardReferenceText({
  text,
  resolvedCards,
  className,
  linkClassName,
}: CardReferenceTextProps) {
  const segments = useMemo(() => parseCardReferences(text), [text]);
  const { setHoveredCard, setPreviewPosition } = useCardPreview();

  // Clear preview when this block unmounts (e.g. description switches to edit mode)
  useEffect(() => {
    return () => {
      setHoveredCard(null);
      setPreviewPosition(null);
    };
  }, [setHoveredCard, setPreviewPosition]);

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          return <React.Fragment key={i}>{seg.value}</React.Fragment>;
        }
        const key = normalizeCardName(seg.rawName);
        const card = resolvedCards?.[key];

        if (!card) {
          return (
            <span key={i} className="text-dark/60 bg-light/20 rounded px-1">
              {seg.rawName}
            </span>
          );
        }

        return (
          <span
            key={i}
            role="link"
            tabIndex={0}
            className={
              linkClassName ??
              "cursor-default bg-light/15 font-bold rounded px-1 hover:bg-light text-inherit"
            }
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
            {seg.rawName}
          </span>
        );
      })}
    </span>
  );
}
