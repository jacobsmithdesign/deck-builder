"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCardList } from "@/app/context/CardListContext";
import { CardTitle } from "@/app/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function niceLabel(slug: string) {
  return slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Displays deck pillars from the DB: a list with pillar name on the left and
 * markdown description on the right. Reads from CardListContext.pillars.
 */
export function PillarsPanel({
  pillars: pillarsProp,
  title = "Deck Pillars",
}: {
  pillars?: Record<string, string> | null;
  title?: string;
}) {
  const { pillars: pillarsContext } = useCardList();
  const pillarsRecord = pillarsProp ?? pillarsContext?.pillars ?? {};
  const entries = Object.entries(pillarsRecord);
  const hasPillars = entries.length > 0;

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 250,
          damping: 12,
          bounce: 0.1,
          duration: 0.005,
          delay: 0.2,
        }}
        className="mt-8"
      >
        <div className="rounded-xl border border-amber-600/10 bg-amber-500/10 p-4 backdrop-blur">
          <header className="mb-4 flex items-center justify-center p-1">
            <CardTitle className="text-amber-700">{title}</CardTitle>
          </header>

          {hasPillars ? (
            <ul className="space-y-4">
              {entries.map(([slug, markdown], i) => (
                <motion.li
                  key={slug}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 12,
                    bounce: 0.1,
                    duration: 0.005,
                    delay: 0.1 * i + 0.1,
                  }}
                  className="flex flex-col gap-2 rounded-lg bg-linear-to-t from-light/10 to-light/20 p-3 outline outline-light/20 sm:flex-row sm:items-start sm:gap-4"
                >
                  <span className="shrink-0 text-base font-semibold text-amber-800 bg-light/20 rounded-md w-fit px-3 py-1.5 outline outline-light/30">
                    {niceLabel(slug)}
                  </span>
                  <div className="min-w-0 flex-1 text-sm leading-snug text-amber-950">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {markdown}
                      </ReactMarkdown>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">No pillars available.</p>
          )}
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
