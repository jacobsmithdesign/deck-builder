"use client";

import { DeckFeatureVector } from "@/lib/ai/features";

const COLORS: Array<keyof DeckFeatureVector["coloured_mana_curve"]> = [
  "W",
  "U",
  "B",
  "R",
  "G",
];

const MANA: Array<keyof DeckFeatureVector["mana_pool"]> = [
  "W",
  "U",
  "B",
  "R",
  "G",
];

const colorClasses: Record<string, string> = {
  W: "bg-yellow-200", // white
  U: "bg-sky-300", // blue
  B: "bg-neutral-600", // black
  R: "bg-red-400", // red
  G: "bg-emerald-300", // green
};

const bgColorClasses: Record<string, string> = {
  W: "bg-yellow-100/25", // white
  U: "bg-sky-200/25", // blue
  B: "bg-neutral-400/25", // black
  R: "bg-red-300/25", // red
  G: "bg-emerald-200/25", // green
};

export function ColouredManaCurve({
  deckFeatures,
  title = "Colored Mana Curve",
  compactView = false,
  manaPool = false,
}: {
  deckFeatures: DeckFeatureVector;
  title?: string;
  compactView?: boolean;
  manaPool?: boolean;
}) {
  const curve = deckFeatures?.coloured_mana_curve;
  const pool = deckFeatures?.mana_pool;
  const total = COLORS.reduce((sum, c) => sum + (curve?.[c] ?? 0), 0) || 1; // avoid /0
  const maxCurve = Math.max(...COLORS.map((c) => curve?.[c] ?? 0));
  const maxPool = Math.max(...COLORS.map((c) => curve?.[c] ?? 0));
  const ORDER = ["W", "U", "B", "R", "G"] as const;
  return (
    <div
      className={`flex flex-col gap-1 w-full bg-light/60 p-1  outline outline-dark/20 transition-all duration-250 ${
        compactView ? " h-16 rounded" : "h-full rounded-md"
      }`}
    >
      <h3
        className={`${
          compactView ? "text-xs" : "text-sm"
        } border-b border-dark/20 transition-all duration-250`}
      >
        {title}
      </h3>
      <div className="flex flex-row gap-1 w-full h-full">
        {ORDER.map((c) => {
          // pick data source & max based on `manaPool` flag
          const value = (manaPool ? pool?.[c] : curve?.[c]) ?? 0;
          const max = manaPool ? maxPool : maxCurve;
          const pct = Math.max(
            0,
            Math.min(100, (value / Math.max(max, 1)) * 100)
          );

          const barClass = colorClasses[c];
          const bgBarClass = bgColorClasses[c];

          return (
            <div key={c} className="flex flex-col items-center gap-2 w-full">
              {/* Track */}
              <div
                className={`flex items-end h-full rounded ${bgBarClass} overflow-hidden justify-center relative w-full`}
              >
                {/* Fill (do NOT add h-full here; height comes from style) */}
                <div
                  className={`w-full ${barClass} transition-all duration-700 ease-out`}
                  style={{ height: `${pct}%` }}
                  aria-label={`${c} ${value} pips (${Math.round(pct)}%)`}
                />
                <span className="text-right text-xs tabular-nums text-dark/60 absolute top-0">
                  {Math.round(value)}
                </span>
              </div>
            </div>
          );
        })}

        {/* Logic for rendering the coloured mana curve */}

        {/* Logic for rendering the mana pool */}
      </div>
    </div>
  );
}
