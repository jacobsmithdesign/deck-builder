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
import { AnimatedButtonLoading } from "../AnimatedButtonLoading";
import { useAnalyseArchetypeProgress } from "@/app/hooks/useAnalyseArchetypeProgress";
import { RadarIdentity } from "./RadarIdentity";
import { arch } from "os";

// This function makes a slug more presentable by capitalizing words and replacing underscores with spaces.
function niceLabel(slug: string) {
  return slug.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

// This function turns the axis record into something recharts can use, or a blank object.
function toRadarData(axes?: Record<string, number> | null) {
  const safe = axes ?? {};
  return Object.entries(safe).map(([k, v]) => ({
    axis: niceLabel(k),
    value: Math.max(0, Math.min(100, Number(v) || 0)),
  }));
}

// This function turns the explanation record into something we can map over.
function toExplanationArray(explanation?: Record<string, string> | null) {
  const safe = explanation ?? {};
  return Object.entries(safe).map(([k, v]) => ({
    axis: niceLabel(k),
    value: v,
  }));
}

export default function ArchetypeOverview() {
  const { archetypeOverview, deck, setArchetypeOverview } = useCardList();
  const { analysing, progress, step, start, error } =
    useAnalyseArchetypeProgress();
  const { userOwnsDeck } = useCardList();

  // These two constants memoize the radar data and explanation array to avoid unnecessary re-renders.
  const radarData = React.useMemo(
    () => toRadarData(archetypeOverview?.axes),
    [archetypeOverview?.axes]
  );
  const explanationArray = React.useMemo(
    () => toExplanationArray(archetypeOverview?.explanation_md),
    [archetypeOverview?.explanation_md]
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
  console.log(archetypeOverview);

  return (
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
        <CardContent className="p-1 px-1 flex gap-2">
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
                explanationArray.map(({ axis, value }) => (
                  <div
                    key={axis}
                    className="rounded-md bg-gradient-to-t to-light/15 from-transparent w-full text-center outline outline-dark/10 bg-light/5"
                  >
                    <h3 className="rounded-sm w-fit rounded-tl-md outline outline-dark/5 h-fit px-2 py-0.5 text-base bg-light/10 font-bold">
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
  );
}
