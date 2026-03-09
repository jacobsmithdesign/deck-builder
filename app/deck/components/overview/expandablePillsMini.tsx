"use client";

import { useState, useMemo, useEffect } from "react";
import { BsFillLightningChargeFill } from "react-icons/bs";
import { RiBrainFill } from "react-icons/ri";
import { AiFillInteraction } from "react-icons/ai";
import { IoExtensionPuzzle } from "react-icons/io5";
import { AnimatePresence, motion } from "framer-motion";
import { useResolvedCardReferences } from "@/app/hooks/useResolvedCardReferences";
import { CardReferenceText } from "@/app/components/card-ref/CardReferenceText";

// Power Level: numeric 1–10 (green = low, red = high)
export const power_levelColors: Record<number, string> = {
  1: "bg-green-200 outline outline-green-300 text-green-800/80",
  2: "bg-green-300 outline outline-green-400 text-green-800/80",
  3: "bg-yellow-200 outline outline-yellow-300 text-yellow-950/80",
  4: "bg-yellow-300 outline outline-yellow-400 text-yellow-950/80",
  5: "bg-amber-200 outline outline-amber-300 text-amber-950/80",
  6: "bg-orange-200 outline outline-orange-300 text-orange-950/80",
  7: "bg-orange-300 outline outline-orange-400 text-orange-950/80",
  8: "bg-red-200 outline outline-red-300 text-red-950/80",
  9: "bg-red-200 outline outline-red-400 text-red-950/80",
  10: "bg-red-300 outline outline-red-500 text-red-950/90",
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

type Difficulty = {
  power_level?: number;
  power_level_explanation?: string;
  complexity?: "Low" | "Medium" | "High";
  complexity_explanation?: string;
  interaction_intensity?: "Low" | "Medium" | "High";
  interaction_intensity_explanation?: string;
  pilot_skill?: "Beginner" | "Intermediate" | "Advanced";
  pilot_skill_explanation?: string;
};

function getExplanation(difficulty: Difficulty, descKeys: string[]): string {
  for (const key of descKeys) {
    const v = (difficulty as Record<string, unknown>)[key];
    if (typeof v === "string" && v.trim()) return v;
  }
  return "";
}
const metricConfig: MetricDef[] = [
  {
    key: "power_level",
    colorMap: power_levelColors,
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
      "interaction_intensity_explanation",
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
  return k.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export function ExpandablePillsMini({
  className = "",
  difficulty,
}: {
  className?: string;
  difficulty: Difficulty;
}) {
  const [hoveredKey, setHoveredKey] = useState<MetricKey | null>(null);
  const { resolved: resolvedCards, resolve } = useResolvedCardReferences();

  const explanationTextsKey = useMemo(() => {
    if (!difficulty) return "";
    const texts = metricConfig.map((def) =>
      getExplanation(difficulty, def.descKeys),
    );
    return JSON.stringify(texts);
  }, [difficulty]);

  useEffect(() => {
    if (!difficulty) return;
    const texts = metricConfig
      .map((def) => getExplanation(difficulty, def.descKeys))
      .filter(Boolean);
    if (texts.length) resolve(texts);
  }, [difficulty, resolve, explanationTextsKey]);

  if (!difficulty) return null;

  return (
    <div className={`flex gap-1`} role="tablist" aria-label="Deck metrics">
      {metricConfig.map((def) => {
        const rawValue = def.get(difficulty);

        let colorClass = "bg-light/50 outline outline-dark/10";
        let displayValue: React.ReactNode = rawValue;

        if (def.key === "power_level") {
          const n = Math.max(1, Math.min(10, Number(rawValue) || 0));
          if (n >= 1) {
            colorClass =
              (power_levelColors as Record<number, string>)[n] ?? colorClass;
            displayValue = n;
          }
        } else if (typeof rawValue === "string") {
          colorClass =
            (def.colorMap as Record<string, string>)[rawValue] ?? colorClass;
        }

        const Icon = def.icon;
        const explanation = getExplanation(difficulty, def.descKeys);
        const isHovered = hoveredKey === def.key;

        return (
          <div
            key={def.key}
            className="relative"
            onMouseEnter={() => setHoveredKey(def.key)}
            onMouseLeave={() => setHoveredKey(null)}
          >
            <button
              type="button"
              role="tab"
              aria-controls={`metric-panel-${def.key}`}
              aria-expanded={isHovered}
              onClick={() => {}}
              className="flex items-center rounded transition-transform mb-1"
            >
              <div
                className={`w-fit rounded-xs px-1 gap-1 flex items-center justify-center transition-all duration-200 ${colorClass}`}
              >
                <Icon className="h-3.5 w-3.5 transition-all duration-200 outline-none shrink-0" />
                <p className="text-sm font-medium">{displayValue}</p>
              </div>
            </button>

            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className={`absolute right-0 top-full z-20 min-w-78 max-w-64 rounded-md shadow-lg border border-dark/10 overflow-hidden ${colorClass}`}
                >
                  <div className="p-2">
                    <p className="font-semibold text-sm">
                      {prettyLabel(def.key)}
                    </p>
                    {explanation ? (
                      <p className="text-xs mt-1 leading-snug">
                        <CardReferenceText
                          text={explanation}
                          resolvedCards={resolvedCards}
                        />
                      </p>
                    ) : null}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
