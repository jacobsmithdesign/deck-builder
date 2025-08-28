// RadarIdentity.tsx
"use client";
import { useCompactView } from "@/app/context/compactViewContext";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

// Input: { [slug]: number } 0..100
type Axes = Record<string, number>;

export function RadarIdentity({
  axes,
  max = 100,
  caption,
  theme = "emerald",
}: {
  axes: Axes;
  max?: number;
  caption?: string;
  theme?: "emerald" | "violet" | "amber";
}) {
  const { bgColor } = useCompactView();
  const entries = Object.entries(axes);
  const data = entries.map(([k, v]) => ({ axis: niceLabel(k), value: v }));

  const color = {
    emerald: { stroke: "#10b981", fill: "url(#radarFillEmerald)" },
    violet: { stroke: "#8b5cf6", fill: "url(#radarFillViolet)" },
    amber: { stroke: "#f59e0b", fill: "url(#radarFillAmber)" },
  }[theme];

  return (
    <div className="w-full h-70 rounded-md flex">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="55%" outerRadius="70%">
          {/* Fancy gradient */}
          <defs>
            <radialGradient id="radarFillEmerald">
              <stop offset="0%" stopColor={bgColor} stopOpacity={1} />
              <stop offset="100%" stopColor={bgColor} stopOpacity={0.7} />
            </radialGradient>
            <radialGradient id="radarFillViolet" cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.38} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.0} />
            </radialGradient>
            <radialGradient id="radarFillAmber" cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.38} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.12} />
            </radialGradient>
          </defs>

          {/* Grid: customize count, shape, and stroke */}
          <PolarGrid
            gridType="polygon"
            radialLines={true}
            stroke={bgColor}
            strokeOpacity={0.2}
            strokeWidth={1}
          />

          {/* Angle labels (axes names) */}
          <PolarAngleAxis
            dataKey="axis"
            tick={(props) => <AngleTick {...props} />}
          />

          {/* Radius ticks (rings) — hide labels, keep rings */}
          <PolarRadiusAxis
            angle={90}
            domain={[0, max]}
            tick={false}
            axisLine={false}
          />

          {/* The polygon */}

          <Radar
            name="Deck"
            dataKey="value"
            stroke={bgColor}
            strokeOpacity={0.6}
            strokeWidth={8}
            fill={bgColor}
            opacity={0.85}
            strokeLinejoin="round" // <- smooth joins
            strokeLinecap="round" // <- smooth dot caps
            isAnimationActive={true}
            animationDuration={300}
            animationEasing="ease-out"
          />
          <Tooltip content={<RadarTip />} animationDuration={0} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function niceLabel(slug: string) {
  return slug.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

// Custom angle tick: wrap long labels, add icons, tweak offset
function AngleTick({ payload, x, y, textAnchor, ...rest }: any) {
  const label: string = payload.value;
  const lines = wrap(label, 14); // naive wrap
  return (
    <g transform={`translate(${x},${y})`} {...rest}>
      <text
        textAnchor={textAnchor}
        className="fill-dark/70 translate-y-1 rounded "
        fontSize={16}
        fontWeight={600}
      >
        {lines.map((ln, i) => (
          <tspan key={i} x={0} dy={i === 0 ? 0 : 14}>
            {ln}
          </tspan>
        ))}
      </text>
    </g>
  );
}

function wrap(text: string, width: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  words.forEach((w) => {
    const test = line ? `${line} ${w}` : w;
    if (test.length > width) {
      lines.push(line);
      line = w;
    } else line = test;
  });
  if (line) lines.push(line);
  return lines;
}

// Custom tooltip
function RadarTip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { axis, value } = payload[0].payload;
  return (
    <div className="flex backdrop-blur-xs rounded-lg border border-light/60 bg-light/50 shadow-inner shadow-light/70 px-1 py-1 text-sm drop-shadow-lg drop-shadow-dark/5">
      <div className="font-semibold mr-2">{axis}</div>
      <div className="opacity-80">{Math.round(value)}</div>
    </div>
  );
}
