"use client";

import { BsFillLightningChargeFill } from "react-icons/bs";
import { RiBrainFill } from "react-icons/ri";
import { AiFillInteraction } from "react-icons/ai";
import { IoExtensionPuzzle } from "react-icons/io5";
import { useCardList } from "@/app/context/CardListContext";

// Power Level: numeric 1–10
export const powerLevelColors: Record<number, string> = {
  1: "bg-green-200 outline outline-green-300",
  2: "bg-green-200 outline outline-green-300",
  3: "bg-green-200 outline outline-green-300",
  4: "bg-yellow-200 outline outline-yellow-300",
  5: "bg-yellow-200 outline outline-yellow-300",
  6: "bg-orange-200 outline outline-orange-300",
  7: "bg-orange-200 outline outline-orange-300",
  8: "bg-red-200 outline outline-red-300",
  9: "bg-red-200 outline outline-red-300",
  10: "bg-red-300 outline outline-red-300",
};

export const complexityColors: Record<string, string> = {
  Low: "bg-green-200 outline outline-green-300",
  Medium: "bg-yellow-200 outline outline-yellow-300",
  High: "bg-red-200 outline outline-red-300",
};

export const pilotSkillColors: Record<string, string> = {
  Beginner: "bg-green-200 outline outline-green-300",
  Intermediate: "bg-yellow-200 outline outline-yellow-300",
  Advanced: "bg-red-200 outline outline-red-300",
};

export const interactionColors: Record<string, string> = {
  Low: "bg-green-200 outline outline-green-300",
  Medium: "bg-yellow-200 outline outline-yellow-300",
  High: "bg-red-200 outline outline-red-300",
};

type MetricDef = {
  key: "ai_power_level" | "ai_pilot_skill" | "ai_interaction" | "ai_complexity";
  icon: React.ComponentType<{ className?: string }>;
  colorMap: Record<number, string> | Record<string, string>;
  get: (ai: any) => number | string | null | undefined;
};

const metricConfig: MetricDef[] = [
  {
    key: "ai_power_level",
    colorMap: powerLevelColors,
    icon: BsFillLightningChargeFill,
    get: (ai) => ai?.ai_power_level, // number 1–10
  },
  {
    key: "ai_pilot_skill",
    colorMap: pilotSkillColors,
    icon: RiBrainFill,
    get: (ai) => ai?.ai_pilot_skill, // "Beginner" | "Intermediate" | "Advanced"
  },
  {
    key: "ai_interaction",
    colorMap: interactionColors,
    icon: AiFillInteraction,
    get: (ai) => ai?.ai_interaction, // "Low" | "Medium" | "High"
  },
  {
    key: "ai_complexity",
    colorMap: complexityColors,
    icon: IoExtensionPuzzle,
    get: (ai) => ai?.ai_complexity, // "Low" | "Medium" | "High"
  },
];

export function DeckMetricsXL({ className = "" }: { className?: string }) {
  const { aiOverview } = useCardList();
  if (!aiOverview) return null;

  return (
    <div className={`flex gap-1 ${className}`}>
      {metricConfig.map(({ key, colorMap, icon: Icon, get }) => {
        const value = get(aiOverview);
        if (value === null || value === undefined || value === "") return null;

        let colorClass = "bg-light/50 outline outline-dark/10";
        if (key === "ai_power_level" && typeof value === "number") {
          const n = Math.max(1, Math.min(10, value));
          colorClass =
            (powerLevelColors as Record<number, string>)[n] ?? colorClass;
        } else if (typeof value === "string") {
          colorClass =
            (colorMap as Record<string, string>)[value] ?? colorClass;
        }

        const tooltip = key.replace("ai_", "").replace(/_/g, " ");

        return (
          <div key={key} className="relative group flex items-center">
            <div
              className={`w-fit rounded px-1 pr-1.5 gap-1 flex items-center cursor-default ${colorClass}`}
            >
              <Icon className="h-3 text-dark/80" />
              <p className="text-sm text-dark/80">{String(value)}</p>
            </div>

            <div
              className={`absolute bottom-full mb-1 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-100 ease-out rounded px-1 whitespace-nowrap shadow z-20 ${colorClass} h-5 flex items-center pointer-events-none`}
            >
              <span className="text-dark/80 font-medium text-sm">
                {tooltip}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
