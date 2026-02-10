"use client";

import { useState } from "react";
import { BsFillLightningChargeFill } from "react-icons/bs";
import { RiBrainFill } from "react-icons/ri";
import { AiFillInteraction } from "react-icons/ai";
import { IoExtensionPuzzle } from "react-icons/io5";
import { AnimatePresence, motion } from "framer-motion";

// Power Level: numeric 1–10
export const bracketColors: Record<number, string> = {
  1: "bg-green-200 outline outline-green-300",
  2: "bg-yellow-200 outline outline-yellow-300",
  3: "bg-amber-200 outline outline-amber-300",
  4: "bg-orange-200 outline outline-orange-300",
  5: "bg-red-200 outline outline-red-300",
};

export const complexityColors: Record<string, string> = {
  Low: "bg-green-200 outline outline-green-300 text-green-800/70",
  Medium: "bg-yellow-200 outline outline-yellow-300 text-yellow-950/70",
  High: "bg-red-200 outline outline-red-300 text-red-950/70",
};

export const pilotSkillColors: Record<string, string> = {
  Beginner: "bg-green-200 outline outline-green-300 text-green-800/70",
  Intermediate: "bg-yellow-200 outline outline-yellow-300 text-yellow-950/70",
  Advanced: "bg-red-200 outline outline-red-300 text-red-950/70",
};

export const interactionColors: Record<string, string> = {
  Low: "bg-green-200 outline outline-green-300 text-green-800/70",
  Medium: "bg-yellow-200 outline outline-yellow-300 text-yellow-950/70",
  High: "bg-red-200 outline outline-red-300 text-red-950/70",
};

type MetricKey =
  | "bracket"
  | "pilot_skill"
  | "interaction_intensity"
  | "complexity";

type MetricDef = {
  key: MetricKey;
  icon: React.ComponentType<{ className?: string }>;
  colorMap: Record<number, string> | Record<string, string>;
  get: (ai: any) => number | string | null | undefined;
  descKeys: string[];
};

type Difficulty = {
  bracket?: number;
  bracket_explanation?: string;
  complexity?: "Low" | "Medium" | "High";
  complexity_explanation?: string;
  interaction_intensity?: "Low" | "Medium" | "High";
  interaction_explanation?: string;
  pilot_skill?: "Beginner" | "Intermediate" | "Advanced";
  pilot_skill_explanation?: string;
};
const metricConfig: MetricDef[] = [
  {
    key: "bracket",
    colorMap: bracketColors,
    icon: BsFillLightningChargeFill,
    get: (ai) => ai?.bracket,
    descKeys: ["bracket_explanation", "bracket_desc", "bracket_text"],
  },
  {
    key: "pilot_skill",
    colorMap: pilotSkillColors,
    icon: RiBrainFill,
    get: (ai) => ai?.pilot_skill,
    descKeys: [
      "pilot_skill_explanation",
      "pilot_skill_desc",
      "pilot_skill_text",
    ],
  },
  {
    key: "interaction_intensity",
    colorMap: interactionColors,
    icon: AiFillInteraction,
    get: (ai) => ai?.interaction_intensity,
    descKeys: [
      "interaction_explanation",
      "interaction_intensity_desc",
      "interaction_intensity_text",
    ],
  },
  {
    key: "complexity",
    colorMap: complexityColors,
    icon: IoExtensionPuzzle,
    get: (ai) => ai?.complexity,
    descKeys: ["complexity_explanation", "complexity_desc", "complexity_text"],
  },
];

function prettyLabel(k: string) {
  return k.replace("", "").replace(/_/g, " ");
}

export function ExpandablePillsMini({
  className = "",
  difficulty,
}: {
  className?: string;
  difficulty: Difficulty;
}) {
  if (!difficulty) return null;

  return (
    <div className={`flex gap-1`} role="tablist" aria-label="Deck metrics">
      {metricConfig.map((def, i) => {
        const value = def.get(difficulty);

        let colorClass = "bg-light/50 outline outline-dark/10";
        if (def.key === "bracket" && typeof value === "number") {
          const n = Math.max(1, Math.min(10, value));
          colorClass =
            (bracketColors as Record<number, string>)[n] ?? colorClass;
        } else if (typeof value === "string") {
          colorClass =
            (def.colorMap as Record<string, string>)[value] ?? colorClass;
        }

        const Icon = def.icon;

        return (
          <button
            key={def.key}
            type="button"
            role="tab"
            aria-controls={`metric-panel-${def.key}`}
            onClick={() => {}}
            className={
              "relative group flex items-center rounded transition-transform cursor-pointer"
            }
          >
            <div
              className={`w-fit rounded-xs px-1 gap-1 flex items-center jsutify-center transition-all duration-200 ${colorClass} hover:opacity-80 group`}
            >
              <Icon
                className={`"h-3.5 w-3.5 transition-all duration-200 text-dark outline-none ${colorClass}
                `}
              />
              <p className="text-sm">{value}</p>
            </div>

            {/* Tooltip */}
            <div
              className={`absolute left-0 bottom-7 ml-1 translate-y-0 group-hover:translate-y-1 transition-all duration-100 ease-out rounded px-1 whitespace-nowrap shadow z-20 ${colorClass} h-5 flex items-center pointer-events-none opacity-0 group-hover:opacity-100`}
            >
              <span
                className={`font-medium text-sm outline-none ${colorClass}`}
              >
                {prettyLabel(def.key)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
