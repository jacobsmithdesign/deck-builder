"use client";

import { useState } from "react";
import { BsFillLightningChargeFill } from "react-icons/bs";
import { RiBrainFill } from "react-icons/ri";
import { AiFillInteraction } from "react-icons/ai";
import { IoExtensionPuzzle } from "react-icons/io5";
import { useCardList } from "@/app/context/CardListContext";
import { ExpandablePills } from "./expandablePill";

// Power Level: numeric 1–10
export const powerLevelColors: Record<number, string> = {
  1: "bg-green-200/40 outline outline-green-300",
  2: "bg-green-200/40 outline outline-green-300",
  3: "bg-green-200/40 outline outline-green-300",
  4: "bg-yellow-200/40 outline outline-yellow-300",
  5: "bg-yellow-200/40 outline outline-yellow-300",
  6: "bg-orange-200/40 outline outline-orange-300",
  7: "bg-orange-200/40 outline outline-orange-300",
  8: "bg-red-200/40 outline outline-red-300",
  9: "bg-red-200/40 outline outline-red-300",
  10: "bg-red-300 outline outline-red-300",
};

export const complexityColors: Record<string, string> = {
  Low: "bg-green-200/40 outline outline-green-300",
  Medium: "bg-yellow-200/40 outline outline-yellow-300",
  High: "bg-red-200/40 outline outline-red-300",
};

export const pilotSkillColors: Record<string, string> = {
  Beginner: "bg-green-200/40 outline outline-green-300",
  Intermediate: "bg-yellow-200/40 outline outline-yellow-300",
  Advanced: "bg-red-200/40 outline outline-red-300",
};

export const interactionColors: Record<string, string> = {
  Low: "bg-green-200/40 outline outline-green-300",
  Medium: "bg-yellow-200/40 outline outline-yellow-300",
  High: "bg-red-200/40 outline outline-red-300",
};

type MetricKey =
  | "power_level"
  | "pilot_skill"
  | "interaction_intensity"
  | "complexity";

type MetricDef = {
  key: MetricKey;
  icon: React.ComponentType<{ className?: string }>;
  colorMap: Record<number, string> | Record<string, string>;
  get: (d: any) => number | string | null | undefined;
  descKeys: string[];
};

const metricConfig: MetricDef[] = [
  {
    key: "power_level",
    colorMap: powerLevelColors,
    icon: BsFillLightningChargeFill,
    get: (d) => d?.power_level,
    descKeys: ["power_level_explanation"],
  },
  {
    key: "pilot_skill",
    colorMap: pilotSkillColors,
    icon: RiBrainFill,
    get: (d) => d?.pilot_skill,
    descKeys: ["pilot_skill_explanation"],
  },
  {
    key: "interaction_intensity",
    colorMap: interactionColors,
    icon: AiFillInteraction,
    get: (d) => d?.interaction_intensity,
    descKeys: ["interaction_intensity_explanation", "interaction_explanation"],
  },
  {
    key: "complexity",
    colorMap: complexityColors,
    icon: IoExtensionPuzzle,
    get: (d) => d?.complexity,
    descKeys: ["complexity_explanation"],
  },
];

function prettyLabel(k: string) {
  return k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function pickDescription(obj: any, candidates: string[]) {
  for (const key of candidates) {
    const v = obj?.[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

export function DeckMetricsXL({ className = "" }: { className?: string }) {
  const { difficulty } = useCardList(); // new shape set via hydrateDeckIntoContext
  const [idx, setIdx] = useState(0);
  if (!difficulty) return null;

  const current = metricConfig[idx];
  const currentValue = current.get(difficulty);

  // decide colour
  let currentColor = "bg-light/50";
  if (current.key === "power_level" && typeof currentValue === "number") {
    const n = Math.max(1, Math.min(10, currentValue));
    currentColor =
      (powerLevelColors as Record<number, string>)[n] ?? currentColor;
  } else if (typeof currentValue === "string") {
    currentColor =
      (current.colorMap as Record<string, string>)[currentValue] ??
      currentColor;
  }

  const CurrentIcon = current.icon;
  const description =
    pickDescription(difficulty, current.descKeys) ??
    `No description provided yet for ${prettyLabel(current.key)}.`;

  const handleIdxChange = (number: number) => setIdx(number);

  return (
    <div className={`w-full h-full gap-1 flex flex-col ${className}`}>
      <div
        id={`metric-panel-${current.key}`}
        className="w-full h-full text-left bg-light/60 rounded-md transition-all flex flex-col relative"
      >
        <div
          className={`items-start ${currentColor} rounded-md p-1 h-full flex flex-col`}
        >
          <ExpandablePills setIndex={handleIdxChange} />
          <div className="flex gap-1 items-center">
            <CurrentIcon className="h-3 min-w-3 text-dark/80" />
            <span className="text-sm font-bold rounded text-dark/90 ">
              {prettyLabel(current.key)} -
            </span>
            <div className="flex items-center gap-1">
              {currentValue != null && currentValue !== "" && (
                <span className="text-sm font-bold rounded text-dark/90 ">
                  {String(currentValue)}
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-dark/80 leading-snug my-auto">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
