// components/ArchetypeOverview.tsx
"use client";
import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { useCardList } from "@/app/context/CardListContext";
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

  const hasData = explanationArray.length > 0 && radarData.length > 0;

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
            <CardContent className="p-0 flex gap-2">
              {/* Radar */}
              <div className="h-64 md:h-76 w-1/3 rounded-md my-auto">
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
              {/* Explanation */}
              <div className="max-w-none flex flex-col w-2/3">
                <div className="w-full rounded-md my-auto grid gap-1 grid-cols-2">
                  {explanationArray ? (
                    explanationArray.map(({ axis, value, score }) => (
                      <div
                        key={axis}
                        className="rounded-md bg-gradient-to-t to-light/15 from-transparent w-full text-center border border-dark/10 bg-light/5"
                      >
                        <h3
                          className={`rounded-sm w-fit rounded-tl-md h-fit  text-base font-bold p-1`}
                        >
                          <span
                            className={`p-1 px-2 mr-2 rounded-md font-bold ${getArchetypeScoreColor(score)}`}
                          >
                            {score}
                          </span>
                          {axis}
                        </h3>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          className="text-sm w-full p-2 py-1 text-left"
                        >
                          {value}
                        </ReactMarkdown>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground ">
                      {analysing
                        ? "Generating overview…"
                        : "No overview yet. Once generated, a concise Markdown explanation of the deck’s archetype will appear here."}
                    </p>
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
