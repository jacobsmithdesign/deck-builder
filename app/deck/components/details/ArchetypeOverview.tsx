// components/ArchetypeOverview.tsx
"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";
import { useCardList } from "@/app/context/CardListContext";
import { AnimatedButtonLoading } from "../AnimatedButtonLoading";
import { useAnalyseArchetypeProgress } from "@/app/hooks/useAnalyseArchetypeProgress";
import { BoardHeader } from "../card/Board";
import { RadarIdentity } from "./RadarIdentity";

function toRadarData(axes?: Record<string, number> | null) {
  const safe = axes ?? {};
  return Object.entries(safe).map(([k, v]) => ({
    axis: k,
    value: Math.max(0, Math.min(100, Number(v) || 0)),
  }));
}

export default function ArchetypeOverview() {
  const { archetypeOverview, deck } = useCardList();
  const { analysing, progress, step, start, error } =
    useAnalyseArchetypeProgress();

  const data = React.useMemo(
    () => toRadarData(archetypeOverview?.axes),
    [archetypeOverview?.axes]
  );

  const hasData =
    Boolean(archetypeOverview?.archetypes?.length) && data.length > 0;

  const handleAnalyse = () => {
    if (!deck?.id || analysing) return;
    start(deck.id);
  };

  return (
    <Card className="w-full mt-2 text-dark/80 rounded-lg border border-dark/10 overflow-clip">
      <CardHeader className="gap-1 py-1 bg-light/20 border-b border-dark/10 px-1">
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
        <CardContent className="grid gap-6 md:grid-cols-2 p-1 px-1 bg-dark/5">
          {/* Explanation */}
          <div className="max-w-none flex flex-col ">
            <div className="flex justify-between items-center rounded-md bg-dark/10 my-2 w-full px-2 ml-1">
              <BoardHeader className="w-fit font-bold mr-4 p-0">
                Core Archetypes
              </BoardHeader>
              <div className="flex gap-2">
                {archetypeOverview?.archetypes?.map((a) => (
                  <span
                    key={a}
                    className="rounded-full h-5 outline outline-light/60 px-2 py-0.5 text-xs bg-light/40"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
            <div className="mx-1 w-full px-2 rounded-md my-auto">
              {archetypeOverview?.explanation_md?.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {archetypeOverview.explanation_md}
                </ReactMarkdown>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {analysing
                    ? "Generating overview…"
                    : "No overview yet. Once generated, a concise Markdown explanation of the deck’s archetype will appear here."}
                </p>
              )}
            </div>
          </div>

          {/* Radar */}
          <div className="h-64 md:h-72">
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
        </CardContent>
      )}
    </Card>
  );
}
