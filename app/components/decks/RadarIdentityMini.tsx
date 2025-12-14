// RadarIdentity.tsx
"use client";
import React, { useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

// Input: { [slug]: number } 0..100
type Axes = Record<string, number>;

export function RadarIdentity({
  axes,
  max = 100,
  caption,
  theme = "emerald",
  bgColor,
}: {
  axes: Axes;
  max?: number;
  caption?: string;
  theme?: "emerald" | "violet" | "amber";
  bgColor: string;
}) {
  const [mouseOverGraph, setMouseOverGraph] = useState<boolean>(false);

  const entries = Object.entries(axes);
  const data = entries.map(([k, v]) => ({ axis: niceLabel(k), value: v }));
  const color = {
    emerald: { stroke: "#10b981", fill: "url(#radarFillEmerald)" },
    violet: { stroke: "#8b5cf6", fill: "url(#radarFillViolet)" },
    amber: { stroke: "#f59e0b", fill: "url(#radarFillAmber)" },
  }[theme];
  const handleEnterGraph = () => {
    if (mouseOverGraph) {
      setMouseOverGraph(false);
    } else {
      setMouseOverGraph(true);
    }
  };

  return (
    <div className="w-full h-full rounded-md flex select-none pointer-events-none">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          data={data}
          cx="50%"
          cy="50%"
          outerRadius="80%"
          className="select-none"
        >
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
            strokeOpacity={0.4}
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
            opacity={0.95}
            strokeLinejoin="round" // <- smooth joins
            strokeLinecap="round" // <- smooth dot caps
            isAnimationActive={true}
            animationDuration={300}
            animationEasing="ease-out"
          />
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
        className="fill-dark/70 translate-y-1"
        fontSize={14}
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
