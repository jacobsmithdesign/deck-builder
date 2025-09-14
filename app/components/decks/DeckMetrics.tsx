import { BsFillLightningChargeFill } from "react-icons/bs";
import { RiBrainFill } from "react-icons/ri";
import { AiFillInteraction } from "react-icons/ai";
import { IoExtensionPuzzle } from "react-icons/io5";

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

// Complexity
export const complexityColors: Record<string, string> = {
  Low: "bg-green-200 outline outline-green-300",
  Medium: "bg-yellow-200 outline outline-yellow-300",
  High: "bg-red-200 outline outline-red-300",
};

// Pilot Skill
export const pilotSkillColors: Record<string, string> = {
  Beginner: "bg-green-200 outline outline-green-300",
  Intermediate: "bg-yellow-200 outline outline-yellow-300",
  Advanced: "bg-red-200 outline outline-red-300",
};

// Interaction Intensity
export const interactionColors: Record<string, string> = {
  Low: "bg-green-200 outline outline-green-300",
  Medium: "bg-yellow-200 outline outline-yellow-300",
  High: "bg-red-200 outline outline-red-300",
};

const metricConfig = [
  {
    key: "ai_power_level",
    colorMap: powerLevelColors,
    icon: BsFillLightningChargeFill,
    label: (deck: any) => deck?.ai_power_level,
  },
  {
    key: "ai_pilot_skill",
    colorMap: pilotSkillColors,
    icon: RiBrainFill,
    label: (deck: any) => deck?.ai_pilot_skill,
  },
  {
    key: "ai_interaction_intensity",
    colorMap: interactionColors,
    icon: AiFillInteraction,
    label: (deck: any) => deck?.ai_interaction,
  },
  {
    key: "ai_complexity",
    colorMap: complexityColors,
    icon: IoExtensionPuzzle,
    label: (deck: any) => deck?.ai_complexity,
  },
];
export function DeckMetrics({ deck }: { deck: any }) {
  return (
    <div className="flex gap-1">
      {metricConfig.map(({ key, colorMap, icon: Icon, label }) => {
        const value = label(deck);
        if (!value) return null;

        const colorClass = colorMap[value] ?? "bg-light/50";

        return (
          <div key={key} className="relative group flex items-center">
            {/* Metric pill */}
            <div
              className={`w-fit rounded px-1 pr-1.5 gap-1 flex items-center cursor-default ${colorClass}`}
            >
              <Icon className="h-3 text-dark/80" />
              <p className="text-sm text-dark/80">{value}</p>
            </div>

            {/* Tooltip */}
            <div
              className={`absolute bottom-full mb-1 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-100 ease-out rounded px-1 whitespace-nowrap shadow z-20 ${colorClass} h-5 flex items-center pointer-events-none`}
            >
              <span className="text-dark/80 font-medium text-sm">
                {key.replace("ai_", "").replace(/_/g, " ")}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
