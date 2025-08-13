"use client";

import type { DeckFeatureVector } from "@/lib/ai/features";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type Color = "W" | "U" | "B" | "R" | "G" | "A";
const COLOR_ORDER: Color[] = ["W", "U", "B", "R", "G", "A"];
const COST_BUCKETS = ["0-1", "2", "3", "4", "5", "6+"] as const;
const MODES: Array<"pool" | "curve" | "cost"> = ["pool", "curve", "cost"];

const fillClasses: Record<Color, string> = {
  W: "bg-yellow-200",
  U: "bg-sky-300",
  B: "bg-neutral-500",
  R: "bg-red-400",
  G: "bg-emerald-300",
  A: "bg-stone-300",
};

const trackCurve: Record<Color, string> = {
  W: "bg-yellow-100/50 outline outline-yellow-200/60",
  U: "bg-sky-200/50 outline outline-sky-300/60",
  B: "bg-neutral-300/50 outline outline-neutral-400/60",
  R: "bg-red-200/50 outline outline-red-300/60",
  G: "bg-emerald-200/50 outline outline-emerald-300/60",
  A: "bg-stone-200/50 outline outline-stone-300/60",
};

const trackPool: Record<Color, string> = {
  W: "bg-yellow-100/50 outline outline-yellow-200/60",
  U: "bg-sky-200/50 outline outline-sky-300/60",
  B: "bg-neutral-300/50 outline outline-neutral-400/60",
  R: "bg-red-200/50 outline outline-red-300/60",
  G: "bg-emerald-200/50 outline outline-emerald-300/60",
  A: "bg-stone-200/50 outline outline-stone-300/60",
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
  const [mode, setMode] = useState<"pool" | "curve" | "cost">(defaultMode);
  const theTitle =
    title ??
    (mode === "pool"
      ? "Mana Pool"
      : mode === "curve"
      ? "Colored Mana Curve"
      : "Mana Cost Curve");
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
    <div
      className={`relative flex flex-col gap-1 w-full bg-light/60 p-1 outline outline-dark/20 transition-all duration-250 cursor-default ${
        compactView ? "h-16 rounded" : "h-full rounded-md"
      } ${className}`}
    >
      {toggle && (
        <button
          className="absolute w-full h-full cursor-pointer  z-10 -translate-y-1 -translate-x-1 rounded-md"
          onClick={handleClick}
        />
      )}
      <h3
        className={`${
          compactView ? "text-xs" : "text-sm"
        } border-b border-dark/20 transition-all duration-250`}
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
            />{" "}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
  const vals = COLOR_ORDER.map((c) => data?.[c] ?? 0);
  const denom =
    normalize === "sum"
      ? Math.max(
          vals.reduce((a, b) => a + b, 0),
          1
        )
      : Math.max(...vals, 1);

  return (
    <div className="flex flex-row gap-1 w-full h-full items-end">
      {COLOR_ORDER.map((c) => {
        const v = data?.[c] ?? 0;
        const pct = Math.max(0, Math.min(100, (v / denom) * 100));
        return (
          <div
            key={c}
            className="flex flex-col items-center gap-1 w-full h-full"
          >
            <div
              className={`relative w-full h-full rounded ${track[c]} overflow-hidden flex items-end justify-center`}
            >
              <div
                className={`${fillClasses[c]} w-full transition-all duration-700 ease-out`}
                style={{ height: `${pct}%` }}
                aria-label={`${c} ${v} (${Math.round(pct)}%)`}
              />
              <span className="absolute top-0 text-[10px] tabular-nums text-dark/60">
                {Number.isInteger(v) ? v : v.toFixed(1)}
              </span>
            </div>
            <div className="text-[10px] leading-none text-dark/80 font-bold absolute bottom-2">
              {c}
            </div>
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

  return (
    <div className="flex flex-row gap-1 w-full h-full items-end">
      {COST_BUCKETS.map((b, i) => {
        const v = values[i];
        const pct = Math.max(0, Math.min(100, (v / max) * 100));
        return (
          <div
            key={b}
            className="flex flex-col items-center justify-end gap-1 w-full h-full"
          >
            <div className="relative w-full h-full rounded bg-dark/10 overflow-hidden flex items-end justify-center">
              <div
                className="w-full bg-dark/25 transition-all duration-700 ease-out"
                style={{ height: `${pct}%` }}
                aria-label={`${b} MV: ${v} (${Math.round(pct)}%)`}
              />
              <span className="absolute top-0 text-[10px] tabular-nums text-dark/60">
                {v}
              </span>
            </div>
            <div className="text-[10px] leading-none text-dark/80 font-bold absolute bottom-2">
              {b}
            </div>
          </div>
        );
      })}
    </div>
  );
}
