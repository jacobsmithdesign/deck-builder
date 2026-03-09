"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";
import type { CardPreview } from "@/lib/card-ref";

type Position = { x: number; y: number };

type CardPreviewContextValue = {
  hoveredCard: CardPreview | null;
  position: Position | null;
  setHoveredCard: (card: CardPreview | null) => void;
  setPreviewPosition: (pos: Position | null) => void;
};

const CardPreviewContext = createContext<CardPreviewContextValue | null>(null);

const OFFSET = 16;
const PREVIEW_WIDTH = 260;

export function CardPreviewProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hoveredCard, setHoveredCard] = useState<CardPreview | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const raf = useRef<number | null>(null);
  const posRef = useRef<Position | null>(null);

  const setPreviewPosition = useCallback((pos: Position | null) => {
    posRef.current = pos;
    if (raf.current != null) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = null;
      setPosition(posRef.current);
    });
  }, []);

  return (
    <CardPreviewContext.Provider
      value={{
        hoveredCard,
        position,
        setHoveredCard,
        setPreviewPosition,
      }}
    >
      {children}
      <CardPreviewPortal />
    </CardPreviewContext.Provider>
  );
}

function CardPreviewPortal() {
  const ctx = useContext(CardPreviewContext);
  if (!ctx) return null;
  const { hoveredCard, position } = ctx;

  if (!hoveredCard || !position) return null;

  const { name, imageFrontUrl } = hoveredCard;
  const offset = OFFSET;
  let x = position.x + offset;
  let y = position.y + offset;
  if (typeof window !== "undefined") {
    if (x + PREVIEW_WIDTH > window.innerWidth)
      x = position.x - PREVIEW_WIDTH - offset;
    if (y + 320 > window.innerHeight) y = position.y - 320 - offset;
    x = Math.max(8, x);
    y = Math.max(8, y);
  }

  return (
    <div
      className="fixed z-40 pointer-events-none rounded-xl overflow-hidden bshadow-xl"
      style={{
        left: x,
        top: y,
        width: PREVIEW_WIDTH,
      }}
    >
      {imageFrontUrl ? (
        <img src={imageFrontUrl} alt={name} className="w-full h-auto block" />
      ) : (
        <div className="p-3 text-sm text-light/90">{name}</div>
      )}
    </div>
  );
}

export function useCardPreview() {
  const value = useContext(CardPreviewContext);
  if (!value) {
    throw new Error("useCardPreview must be used within CardPreviewProvider");
  }
  return value;
}
