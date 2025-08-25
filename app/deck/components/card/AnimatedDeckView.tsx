"use client";

import { DeckOverview } from "../../DeckOverview";
import CommanderOverview from "@/app/components/ui/commanderOverview";
import {
  CompactViewProvider,
  useCompactView,
} from "@/app/context/compactViewContext";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export default function AnimatedDeckView() {
  const { showBoard, bgColor } = useCompactView();

  return (
    <div className="bg-light ">
      <div
        style={{ background: bgColor }}
        className="h-lvh items-center text-dark pt-12 overflow-y-scroll hide-scrollbar flex flex-col justify-between relative"
      >
        <CommanderOverview />
        <div className="w-full h-full flex relative">
          <div className="w-full h-full px-1 pb-1">
            <div className="bg-light/60 w-full h-full rounded-b-xl p-1"></div>
          </div>
          <AnimatePresence>
            <motion.div
              animate={{
                height: showBoard ? "100%" : 40,
              }}
              transition={{
                type: "tween",
                duration: 0.5,
                damping: 25,
                stiffness: 270,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`w-full ${!showBoard && "mb-1"} absolute px-1`}
            >
              <DeckOverview />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
