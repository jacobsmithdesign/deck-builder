// components/ArchetypeOverview.tsx
"use client";
import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { useCardList } from "@/app/context/CardListContext";
import { useResolvedCardReferences } from "@/app/hooks/useResolvedCardReferences";
import { MarkdownWithCardRefs } from "@/app/components/card-ref/MarkdownWithCardRefs";
import { AnimatedButtonLoading } from "../primitives/AnimatedButtonLoading";
import { RadarIdentity } from "./RadarIdentity";
import { useFullAnalysis } from "@/app/hooks/useFullAnalysis";
import { AnimatePresence, motion } from "framer-motion";

// This function makes a slug more presentable by capitalizing words and replacing underscores with spaces.
export function niceLabel(slug: string) {
  return slug.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

// Archetype score 0–100: 5 colours, 100 = green, 0 = red (same style as expandablePillsMini).
const archetypeScoreColors: Record<number, string> = {
  0: "bg-red-300/30 outline outline-red-500/30 text-red-800/90", // 0–19
  1: "bg-amber-200/30 outline outline-amber-400/30 text-amber-800/80", // 20–39
  2: "bg-yellow-200/30 outline outline-yellow-400/30 text-yellow-800/80", // 40–59
  3: "bg-lime-200/30 outline outline-lime-300/30 text-lime-800/80", // 60–79
  4: "bg-green-200/30 outline outline-green-400/30 text-green-800/80", // 80–100
};

function getArchetypeScoreColor(score: number): string {
  const n = Math.max(0, Math.min(100, Number(score) || 0));
  const bucket = n >= 80 ? 4 : n >= 60 ? 3 : n >= 40 ? 2 : n >= 20 ? 1 : 0;
  return archetypeScoreColors[bucket] ?? "bg-light/50 outline outline-dark/10";
}

// This function turns the axis record into something recharts can use, or a blank object.
function toRadarData(axes?: Record<string, number> | null) {
  const safe = axes ?? {};
  return Object.entries(safe).map(([k, v]) => ({
    axis: niceLabel(k),
    value: Math.max(0, Math.min(100, Number(v) || 0)),
  }));
}

// This function turns the explanation record into something we can map over, sorted by archetype score (greatest first), with score included.
function toExplanationArray(
  explanation?: Record<string, string> | null,
  axes?: Record<string, number> | null,
) {
  const safe = explanation ?? {};
  const axesSafe = axes ?? {};
  return Object.entries(safe)
    .map(([slug, markdown]) => ({
      axis: niceLabel(slug),
      value: markdown,
      score: Number(axesSafe[slug]) ?? 0,
    }))
    .sort((a, b) => b.score - a.score);
}

export default function ArchetypeOverview() {
  const { archetypeOverview, deck } = useCardList();
  const { analysing, progress, step, start, error } = useFullAnalysis();
  const { userOwnsDeck } = useCardList();

  // These two constants memoize the radar data and explanation array to avoid unnecessary re-renders.
  const radarData = React.useMemo(
    () => toRadarData(archetypeOverview?.axes),
    [archetypeOverview?.axes],
  );
  const explanationArray = React.useMemo(
    () =>
      toExplanationArray(
        archetypeOverview?.explanation_md,
        archetypeOverview?.axes,
      ),
    [archetypeOverview?.explanation_md, archetypeOverview?.axes],
  );

  const { resolved: resolvedCards, resolve } = useResolvedCardReferences();
  const explanationTextsKey = React.useMemo(
    () => JSON.stringify(explanationArray.map((e) => e.value)),
    [explanationArray],
  );
  React.useEffect(() => {
    if (explanationArray.length) resolve(explanationArray.map((e) => e.value));
  }, [resolve, explanationTextsKey]);

  const hasData = explanationArray.length > 0 && radarData.length > 0;

  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const selected = explanationArray[selectedIndex] ?? explanationArray[0];

  React.useEffect(() => {
    if (
      selectedIndex >= explanationArray.length &&
      explanationArray.length > 0
    ) {
      setSelectedIndex(0);
    }
  }, [explanationArray.length, selectedIndex]);

  const handleAnalyse = () => {
    if (!deck?.id || analysing) return;
    start(deck.id);
  };
  if (!archetypeOverview)
    return (
      <Card className="w-full mt-2 text-dark/80 rounded-lg overflow-clip">
        <CardHeader className="gap-1 py-1 rounded-md px-1 mb-1">
          <CardTitle className="flex h-7 items-center justify-between rounded-md px-2">
            <div className="flex gap-4 items-center ">
              <span>Archetype Overview</span>
              {userOwnsDeck && (
                <AnimatedButtonLoading
                  variant="aiAnalyse"
                  size="sm"
                  title={
                    analysing
                      ? `Analysing${progress ? ` (${progress}%)` : ""}`
                      : archetypeOverview
                        ? "Re-analyse"
                        : "Analyse Now"
                  }
                  loading={analysing}
                  onClick={handleAnalyse}
                  disabled={!deck?.id}
                />
              )}
            </div>
          </CardTitle>
          <h3 className="ml-2">
            {userOwnsDeck
              ? `Click Analyse Now to generate an archetype analysis of ${deck?.name}.`
              : `The owner of ${deck?.name} has not specified an archetype overview yet. Add this deck to your collection to run an AI analysis of its archetype.`}
          </h3>
        </CardHeader>
      </Card>
    );

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, y: 12, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, delay: 0.4, type: "spring", damping: 15 }}
        className="w-full"
      >
        <Card className="w-full mt-2 text-dark/80 rounded-lg overflow-clip ">
          <CardHeader className="gap-1 py-1 rounded-md px-1 mb-1">
            <CardTitle className="flex h-7 items-center justify-between rounded-md px-2">
              <div className="flex gap-4 items-center ">
                <span>Archetype Overview</span>
                <AnimatedButtonLoading
                  variant="aiAnalyse"
                  size="sm"
                  title={
                    analysing
                      ? `Analysing${progress ? ` (${progress}%)` : ""}`
                      : archetypeOverview
                        ? "Re-analyse"
                        : "Analyse Now"
                  }
                  loading={analysing}
                  onClick={handleAnalyse}
                  disabled={!deck?.id}
                />
              </div>
            </CardTitle>

            {error ? (
              <div className="mt-2">
                <div className="mt-2 text-xs text-red-500">
                  {String(error)}
                  {step ? ` — step: ${step}` : null}
                </div>{" "}
              </div>
            ) : null}
          </CardHeader>
          {archetypeOverview && (
            <CardContent className="p-0 flex  gap-2">
              {/* Radar */}
              <div className="h-64 md:h-76 min-w-2/5 rounded-md my-auto">
                {hasData ? (
                  <RadarIdentity axes={archetypeOverview.axes} />
                ) : (
                  <div className="h-full grid place-items-center text-sm text-muted-foreground">
                    {analysing
                      ? "Crunching numbers…"
                      : "No axes yet — run analysis to populate."}
                  </div>
                )}
              </div>
              {/* Two-column: left = archetype list, right = explanation */}
              <div className="max-w-none flex w-full gap-0 min-h-[200px]">
                {/* Left column: archetype slug + score */}
                <aside className="shrink-0 flex flex-col rounded-l-md my-auto">
                  {explanationArray.length > 0 ? (
                    explanationArray.map(({ axis, score }, i) => (
                      <button
                        key={axis}
                        type="button"
                        onClick={() => setSelectedIndex(i)}
                        className={`w-full text-left rounded-2xl transition-colors pl-1 py-1 cursor-pointer ${selectedIndex === i ? `rounded-r-none` : " "} `}
                      >
                        <div
                          className={`flex items-center gap-2 py-1 px-2 rounded-xl  md:hover:bg-light/10  ${selectedIndex === i ? `rounded-r-none bg-lightsecondary/30 drop-shadow-xl` : ""}
                  `}
                        >
                          <span
                            className={`inline-flex items-center ${getArchetypeScoreColor(score)} justify-center min-w-7 h-6 px-1.5 rounded text-lg font-bold ${selectedIndex === i ? `bg-dark/5` : ""}`}
                          >
                            {score}
                          </span>
                          <span
                            className={` rounded-lg text-lg px-2 ${selectedIndex === i ? `${getArchetypeScoreColor(score)}` : ""} `}
                          >
                            {axis}
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-sm text-muted-foreground">
                      {analysing ? "Generating…" : "No archetypes yet."}
                    </div>
                  )}
                </aside>

                {/* Right: selected archetype explanation with animation */}
                <div className="flex-1 rounded-2xl overflow-hidden bg-lightsecondary/30 drop-shadow-xl min-w-0">
                  {explanationArray.length > 0 && selected ? (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedIndex}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{
                          duration: 0.2,
                          ease: [0.25, 0.1, 0.25, 1],
                        }}
                        className="p-4 h-full overflow-auto rounded-xl"
                      >
                        <h3
                          className={`rounded-lg w-fit text-lg font-bold px-2 mb-2 ${getArchetypeScoreColor(selected.score)}`}
                        >
                          <span className="p-1 px-2 mr-2 rounded-md font-bold">
                            {selected.score}
                          </span>
                          {selected.axis}
                        </h3>
                        <MarkdownWithCardRefs
                          source={selected.value}
                          resolvedCards={resolvedCards}
                          className="text-base w-full text-left"
                        />
                      </motion.div>
                    </AnimatePresence>
                  ) : (
                    <div className="p-4 text-sm text-muted-foreground">
                      {analysing
                        ? "Generating overview…"
                        : "No overview yet. Select an archetype or run analysis."}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </motion.section>
    </AnimatePresence>
  );
}
