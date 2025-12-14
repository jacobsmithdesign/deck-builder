"use client";

import { BsFillLightningChargeFill } from "react-icons/bs";
import { RiBrainFill } from "react-icons/ri";
import { AiFillInteraction } from "react-icons/ai";
import { IoExtensionPuzzle } from "react-icons/io5";
import { useCardList } from "@/app/context/CardListContext";
import { AnimatePresence, motion } from "framer-motion";

// Power Level: numeric 1–10
export const powerLevelColors: Record<number, string> = {
  1: "bg-green-200 outline outline-green-300 md:group-hover:bg-light text-green-800/70",
  2: "bg-green-200 outline outline-green-300 md:group-hover:bg-light text-green-800/70",
  3: "bg-green-200 outline outline-green-300 md:group-hover:bg-light text-green-800/70",
  4: "bg-yellow-200 outline outline-yellow-300 md:group-hover:bg-light text-yellow-950/70",
  5: "bg-yellow-200 outline outline-yellow-300 md:group-hover:bg-light text-yellow-950/70",
  6: "bg-orange-200 outline outline-orange-300 md:group-hover:bg-light text-orange-950/70",
  7: "bg-orange-200 outline outline-orange-300 md:group-hover:bg-light text-orange-950/70",
  8: "bg-red-200 outline outline-red-300 md:group-hover:bg-light text-red-900/70",
  9: "bg-red-200 outline outline-red-300 md:group-hover:bg-light text-red-900/70",
  10: "bg-red-300 md:group-hover:bg-light outline outline-red-300 md:group-hover:bg-light text-red-900/70",
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

type MetricDef = {
  index: number;
  key: "ai_power_level" | "ai_pilot_skill" | "ai_interaction" | "ai_complexity";
  icon: React.ComponentType<{ className?: string }>;
  colorMap: Record<number, string> | Record<string, string>;
  get: (ai: any) => number | string | null | undefined;
};

const metricConfig: MetricDef[] = [
  {
    index: 0,
    key: "ai_power_level",
    colorMap: powerLevelColors,
    icon: BsFillLightningChargeFill,
    get: (ai) => ai?.power_level, // number 1–10
  },
  {
    index: 1,
    key: "ai_pilot_skill",
    colorMap: pilotSkillColors,
    icon: RiBrainFill,
    get: (ai) => ai?.pilot_skill, // "Beginner" | "Intermediate" | "Advanced"
  },
  {
    index: 2,
    key: "ai_interaction",
    colorMap: interactionColors,
    icon: AiFillInteraction,
    get: (ai) => ai?.interaction_intensity, // "Low" | "Medium" | "High"
  },
  {
    index: 3,
    key: "ai_complexity",
    colorMap: complexityColors,
    icon: IoExtensionPuzzle,
    get: (ai) => ai?.complexity, // "Low" | "Medium" | "High"
  },
];

export function DeckMetricsMini({
  className = "",
  compactView,
}: {
  className?: string;
  compactView: boolean;
}) {
  const { difficulty } = useCardList();
  if (!difficulty) return null;

  return (
    <AnimatePresence>
      <div className={`grid grid-rows-4 h-16 ${className} ml-1`}>
        {metricConfig.map(({ index, key, colorMap, icon: Icon, get }) => {
          const value = get(difficulty);
          if (value === null || value === undefined || value === "")
            return null;

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
            <>
              {compactView && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, translateX: 20 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    translateX: 0,
                    transition: { delay: index * 0.1 },
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  key={key}
                  className="relative group flex items-center"
                >
                  <div
                    className={`w-fit rounded px-1 pr-1.5 gap-1 flex items-center cursor-default ${colorClass} h-3.5 `}
                  >
                    <Icon className="h-3 text-dark/80" />
                    <p className="text-sm text-dark/80">{String(value)}</p>
                  </div>

                  <div
                    className={` bottom-full  opacity-0 translate-x-0 md:group-hover:opacity-100 md:group-hover:translate-x-1 transition-all duration-100 ease-out rounded px-1 whitespace-nowrap shadow z-20 ${colorClass} h-3.5 flex items-center pointer-events-none `}
                  >
                    <span className="text-dark/80 font-medium text-sm">
                      {tooltip}
                    </span>
                  </div>
                </motion.div>
              )}
            </>
          );
        })}
      </div>
    </AnimatePresence>
  );
}
