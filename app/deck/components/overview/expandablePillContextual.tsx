"use client";

import { useState } from "react";
import { BsFillLightningChargeFill } from "react-icons/bs";
import { RiBrainFill } from "react-icons/ri";
import { AiFillInteraction } from "react-icons/ai";
import { IoExtensionPuzzle } from "react-icons/io5";
import { useCardList } from "@/app/context/CardListContext";
import { AnimatePresence, motion } from "framer-motion";

// Power Level: numeric 1–10
// Power Level: numeric 1–10
export const powerLevelColors: Record<number, string> = {
  1: "bg-green-200 outline outline-green-300 text-green-800/70",
  2: "bg-green-200 outline outline-green-300 text-green-800/70",
  3: "bg-green-200 outline outline-green-300 text-green-800/70",
  4: "bg-yellow-200 outline outline-yellow-300 text-yellow-950/70",
  5: "bg-yellow-200 outline outline-yellow-300 text-yellow-950/70",
  6: "bg-orange-200 outline outline-orange-300 text-orange-950/70",
  7: "bg-orange-200 outline outline-orange-300 text-orange-950/70",
  8: "bg-red-200 outline outline-red-300 text-red-900/70",
  9: "bg-red-200 outline outline-red-300 text-red-900/70",
  10: "bg-red-300 outline outline-red-300 text-red-900/70",
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
  | "power_level"
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

const metricConfig: MetricDef[] = [
  {
    key: "power_level",
    colorMap: powerLevelColors,
    icon: BsFillLightningChargeFill,
    get: (ai) => ai?.power_level,
    descKeys: [
      "power_level_explanation",
      "power_level_desc",
      "power_level_text",
    ],
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
      "interaction_desc",
      "interaction_text",
      "interaction_intensity_explanation",
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

export function ExpandablePills({
  className = "",
  setIndex,
}: {
  className?: string;
  setIndex: (number: number) => void;
}) {
  const { difficulty } = useCardList();
  const [idx, setIdx] = useState(0);
  if (!difficulty) return null;

  const current = metricConfig[idx];
  const cycle = () => setIdx((i) => (i + 1) % metricConfig.length);

  // compute current state for bottom card
  const currentValue = current.get(difficulty);
  let currentColor = "bg-light/50 outline outline-dark/10";
  if (current.key === "power_level" && typeof currentValue === "number") {
    const n = Math.max(1, Math.min(10, currentValue));
    currentColor =
      (powerLevelColors as Record<number, string>)[n] ?? currentColor;
  } else if (typeof currentValue === "string") {
    currentColor =
      (current.colorMap as Record<string, string>)[currentValue] ??
      currentColor;
  }

  return (
    <div
      className={`flex gap-1 ${className} absolute right-0 top-0 p-1 rounded-tl-none rounded-br-none  border-light rounded-sm `}
      role="tablist"
      aria-label="Deck metrics"
    >
      {metricConfig.map((def, i) => {
        const value = def.get(difficulty);
        if (value === null || value === undefined || value === "") return null;

        let colorClass = "bg-light/50 outline outline-dark/10";
        if (def.key === "power_level" && typeof value === "number") {
          const n = Math.max(1, Math.min(10, value));
          colorClass =
            (powerLevelColors as Record<number, string>)[n] ?? colorClass;
        } else if (typeof value === "string") {
          colorClass =
            (def.colorMap as Record<string, string>)[value] ?? colorClass;
        }

        const Icon = def.icon;
        const active = i === idx;

        return (
          <button
            key={def.key}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`metric-panel-${def.key}`}
            onClick={() => {
              setIdx(i);
              setIndex(i);
            }}
            className={
              "relative group flex items-center rounded transition-transform cursor-pointer"
            }
          >
            <div
              className={`w-fit rounded-xs p-1 gap-1 flex items-center drop-shadow-sm jsutify-center transition-all duration-200  ${
                active ? "bg-dark" : `${colorClass} hover:opacity-80`
              } `}
            >
              <Icon
                className={`"h-4 w-4 transition-all duration-200  outline-none ${
                  active ? `outline-none text-light` : ""
                }`}
              />
            </div>

            {/* Tooltip */}
            <div
              className={`absolute right-0 bottom-7 ml-1 translate-y-1 group-hover:translate-y-0 transition-all duration-100 ease-out rounded px-1 whitespace-nowrap shadow z-20 ${colorClass} h-5 flex items-center pointer-events-none opacity-0 group-hover:opacity-100 `}
            >
              <span
                className={`text-dark/80 font-medium text-sm ${colorClass} outline-none`}
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
