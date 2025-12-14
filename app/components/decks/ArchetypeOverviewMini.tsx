// components/ArchetypeOverview.tsx
"use client";
import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { RadarIdentity } from "./RadarIdentityMini";
import { AnimatePresence, motion } from "framer-motion";

type ArchetypeOverview = {
  axes?: Record<string, number>;
  description?: string;
};

// This function makes a slug more presentable by capitalizing words and replacing underscores with spaces.
export function niceLabel(slug: string) {
  return slug.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

// This function turns the axis record into something recharts can use, or a blank object.
function toRadarData(axes?: Record<string, number> | null) {
  const safe = axes ?? {};
  return Object.entries(safe).map(([k, v]) => ({
    axis: niceLabel(k),
    value: Math.max(0, Math.min(100, Number(v) || 0)),
  }));
}

// This function turns the explanation record into something we can map over.
function toExplanationArray(explanation?: Record<string, string> | null) {
  const safe = explanation ?? {};
  return Object.entries(safe).map(([k, v]) => ({
    axis: niceLabel(k),
    value: v,
  }));
}

export default function ArchetypeOverview({
  archetypeOverview,
  bgColor,
}: {
  archetypeOverview: ArchetypeOverview;
  bgColor: string;
}) {
  // These two constants memoize the radar data and explanation array to avoid unnecessary re-renders.
  const radarData = React.useMemo(
    () => toRadarData(archetypeOverview?.axes),
    [archetypeOverview?.axes]
  );

  const hasData = radarData.length > 0;

  if (!archetypeOverview)
    return (
      <Card className="w-full mt-2 text-dark/80 rounded-lg overflow-clip">
        <CardHeader className="gap-1 py-1 rounded-md px-1 mb-1">
          <CardTitle className="flex h-7 items-center justify-between rounded-md px-2">
            <div className="flex gap-4 items-center ">
              <span>Archetype Overview</span>
            </div>
          </CardTitle>
          <h3 className="ml-2">
            {`The owner of this deck has not specified an archetype overview yet.`}
          </h3>
        </CardHeader>
      </Card>
    );

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, y: 12, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, delay: 0.4, type: "spring", damping: 15 }}
        className="w-full"
      >
        <Card className="w-full mt-2 text-dark/80 rounded-lg overflow-clip ">
          {archetypeOverview && (
            <CardContent className="p-0 flex gap-2">
              {/* Radar */}
              <div className="h-54 w-full rounded-md my-auto">
                {hasData ? (
                  <RadarIdentity
                    axes={archetypeOverview.axes}
                    bgColor={bgColor}
                  />
                ) : (
                  <div className="h-full grid place-items-center text-sm text-muted-foreground">
                    No axes yet — run analysis to populate.
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      </motion.section>
    </AnimatePresence>
  );
}
