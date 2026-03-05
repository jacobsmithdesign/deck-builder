"use client";

import type { DeckFeatureVector } from "@/lib/ai/features";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { RaindropContainer } from "../primitives/RaindropContainer";
import { useCompactView } from "@/app/context/compactViewContext";

type Color = "W" | "U" | "B" | "R" | "G" | "A";
const COLOR_ORDER: Color[] = ["W", "U", "B", "R", "G", "A"];
const COST_BUCKETS = ["0-1", "2", "3", "4", "5", "6+"] as const;
const MODES: Array<"pool" | "curve" | "cost"> = ["pool", "curve", "cost"];

const fillClasses: Record<Color, string> = {
  W: "bg-manaWhite",
  U: "bg-manaBlue",
  B: "bg-manaBlack/60",
  R: "bg-manaRed",
  G: "bg-manaGreen",
  A: "bg-manaAny",
};

const trackCurve: Record<Color, string> = {
  W: "bg-manaWhiteBg/0",
  U: "bg-manaBlueBg/10",
  B: "bg-manaBlackBg/10",
  R: "bg-manaRedBg/10",
  G: "bg-manaGreenBg/10",
  A: "bg-manaAnyBg/10",
};

const trackPool: Record<Color, string> = {
  W: "bg-manaWhiteBg/10",
  U: "bg-manaBlueBg/10",
  B: "bg-manaBlackBg/10",
  R: "bg-manaRedBg/10",
  G: "bg-manaGreenBg/10",
  A: "bg-manaAnyBg/10",
};

export function ManaCurve({
  deckFeatures,
  defaultMode = "curve", // "pool" | "curve" | "cost"
  title,
  toggle = false,
  compactView = false,
  normalize = "max", // for color modes: "max" | "sum"
  className = "",
}: {
  deckFeatures: DeckFeatureVector;
  defaultMode?: "pool" | "curve" | "cost";
  title?: string;
  toggle?: boolean;
  compactView?: boolean;
  normalize?: "max" | "sum";
  className?: string;
}) {
  const { bgColor } = useCompactView();
  const [mode, setMode] = useState<"pool" | "curve" | "cost">(defaultMode);
  const theTitle =
    title ??
    (mode === "pool"
      ? "Available Mana"
      : mode === "curve"
        ? "Colored Spell Cost"
        : "Total Cost");
  const handleClick = () => {
    setMode((prev) => {
      const currentIndex = MODES.indexOf(prev);
      const nextIndex = (currentIndex + 1) % MODES.length;
      return MODES[nextIndex];
    });
  };
  // Make sure to reset mode to default when toggle is off (generally if compactView is off)
  useEffect(() => {
    if (!toggle) {
      setMode(defaultMode);
    }
  }, [toggle]);
  return (
    <RaindropContainer
      bgColor={bgColor}
      childClassName="h-22"
      innerClassName="-translate-y-2 -translate-x-2"
      className={`relative flex flex-col gap-2 w-full bg-darksecondary/15 p-2 transition-all duration-250 cursor-default min-h-33 rounded-3xl shadow-light overflow-hidden`}
    >
      {toggle && (
        <button
          className="absolute w-full h-full cursor-pointer  z-10 -translate-y-1 -translate-x-1 rounded-md"
          onClick={handleClick}
        />
      )}
      <h3
        className={`${
          compactView ? "text-xs" : "text-md"
        } transition-all text-center duration-250 h-6 -translate-y-1 outline outline-light/0 bg-light/20 rounded-full w-fit mx-auto mt-1  px-2`}
      >
        {theTitle}
      </h3>
      <AnimatePresence>
        {mode === "cost" ? (
          <motion.div
            key={"cost-bars"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 100 }}
            exit={{
              opacity: 0,
              transition: { duration: 0 },
            }}
            transition={{ duration: 0.35 }}
            className="w-full h-full"
          >
            <CostBars curve={deckFeatures?.curve} />
          </motion.div>
        ) : (
          <motion.div
            key="mana-bars"
            initial={{ opacity: 0 }}
            animate={{ opacity: 100 }}
            exit={{
              opacity: 0,
              transition: { duration: 0 },
            }}
            transition={{ duration: 0.35 }}
            className="w-full h-full"
          >
            <ColorBars
              data={
                mode === "pool"
                  ? deckFeatures?.mana_pool
                  : deckFeatures?.coloured_mana_curve
              }
              track={mode === "pool" ? trackPool : trackCurve}
              normalize={normalize}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </RaindropContainer>
  );
}

/** Color-based bars (pool or curve) */
function ColorBars({
  data,
  track,
  normalize = "max",
}: {
  data?: Partial<Record<Color, number>>;
  track: Record<Color, string>;
  normalize?: "max" | "sum";
}) {
  const { bgColor } = useCompactView();
  const vals = COLOR_ORDER.map((c) => data?.[c] ?? 0);
  const denom =
    normalize === "sum"
      ? Math.max(
          vals.reduce((a, b) => a + b, 0),
          1,
        )
      : Math.max(...vals, 1);

  return (
    <div className="flex flex-row gap-2 w-full h-full items-end">
      {COLOR_ORDER.map((c) => {
        const v = data?.[c] ?? 0;
        const pct = Math.max(0, Math.min(100, (v / denom) * 100));
        return (
          <div
            key={c}
            className="flex flex-col items-center gap-1 w-full h-full"
          >
            <RaindropContainer
              bgColor={bgColor}
              innerClassName="opacity-50 bg-dark/20"
              childClassName={`rounded-2xl w-full h-full flex items-end justify-center overflow-hidden p-0 ${track[c]} border-t border-light/20`}
              className={`relative w-full h-full rounded-2xl overflow-hidden p-0 from-light/80 shadow-light`}
            >
              <RaindropContainer
                bgColor={bgColor}
                childClassName={` h-full w-full transition-all duration-700 ease-out`}
                className={`w-full p-0 ${fillClasses[c]} from-light/50 to-light/10 outline outline-light/40`}
                innerClassName=""
                style={{ height: `${pct}%` }}
                aria-label={`${c} ${v} (${Math.round(pct)}%)`}
              />
              <span className="absolute top-1 text-md tabular-nums text-dark/80">
                {Number.isInteger(v) ? v : v.toFixed(1)}
              </span>
              <div className="text-md leading-none text-dark/80 font-bold absolute bottom-3">
                {c}
              </div>
            </RaindropContainer>
          </div>
        );
      })}
    </div>
  );
}

/** Classic mana value buckets */
function CostBars({
  curve,
}: {
  curve?:
    | Partial<Record<(typeof COST_BUCKETS)[number], number>>
    | Record<string, number>;
}) {
  const values = COST_BUCKETS.map((b) => Number((curve as any)?.[b] ?? 0));
  const max = Math.max(...values, 1);
  const { bgColor } = useCompactView();

  return (
    <div className="flex flex-row gap-2 w-full h-full items-end">
      {COST_BUCKETS.map((b, i) => {
        const v = values[i];
        const pct = Math.max(0, Math.min(100, (v / max) * 100));
        return (
          <div
            key={b}
            className="flex flex-col items-center justify-end gap-1 w-full h-full"
          >
            <RaindropContainer
              bgColor={bgColor}
              className="p-0 w-full h-full rounded-2xl justify-center bg-dark/20"
              childClassName="w-full h-full flex items-end justify-center p-0"
            >
              <RaindropContainer
                bgColor={bgColor}
                childClassName="w-full bg-dark/25 transition-all duration-700 ease-out"
                className="w-full bg-dark/75 from-light/60 outline outline-light/20"
                style={{ height: `${pct}%` }}
                aria-label={`${b} MV: ${v} (${Math.round(pct)}%)`}
              />
              <span className="absolute top-2 text-md tabular-nums text-dark/60">
                {v}
              </span>{" "}
              <div className="text-md leading-none text-dark/80 font-bold absolute bottom-3">
                {b}
              </div>
            </RaindropContainer>
          </div>
        );
      })}
    </div>
  );
}
