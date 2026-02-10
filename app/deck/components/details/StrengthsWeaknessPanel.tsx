"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCardList } from "@/app/context/CardListContext";
import { CardTitle } from "@/app/components/ui/card";

// If you already have niceLabel, feel free to delete this and import yours
function niceLabel(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * A modern, responsive two-column panel that lists Strengths (left) and Weaknesses (right)
 * showing both keys (pretty labels) and their descriptions.
 *
 * It reads from CardListContext.aiOverview by default, but you can also pass strengths/weaknesses directly.
 */
export function StrengthsWeaknessesPanel({
  strengths: strengthsProp,
  weaknesses: weaknessesProp,
  title = "Strengths & Weaknesses",
}: {
  strengths?: Record<string, string> | null;
  weaknesses?: Record<string, string> | null;
  title?: string;
}) {
  const { strengthsAndWeaknesses } = useCardList();
  const strengths = strengthsProp ?? strengthsAndWeaknesses?.strengths ?? {};
  const weaknesses = weaknessesProp ?? strengthsAndWeaknesses?.weaknesses ?? {};

  const hasStrengths = strengths && Object.keys(strengths).length > 0;
  const hasWeaknesses = weaknesses && Object.keys(weaknesses).length > 0;

  return (
    <AnimatePresence>
      <motion.section>
        {/* Header */}
        {/* <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <div className="text-xs text-neutral-500">
          {new Date().toLocaleDateString()}
        </div>
      </div> */}

        {/* Grid */}
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 mt-8">
          {/* Strengths */}
          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 250,
              damping: 12,
              bounce: 0.1,
              duration: 0.005,
              delay: 0.8,
            }}
            className="rounded-xl border border-emerald-600/10 bg-emerald-500/15 p-2 backdrop-blur "
          >
            <header className="mb-3 flex items-center justify-center p-1">
              <CardTitle className="text-emerald-600">Strengths</CardTitle>
            </header>

            {hasStrengths ? (
              <dl className="space-y-2">
                {Object.entries(strengths!).map(([key, value], i) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 12,
                      bounce: 0.1,
                      duration: 0.005,
                      delay: 0.15 * i + 0.6,
                    }}
                    key={key}
                    className="group rounded-lg p-1 transition-colors bg-gradient-to-t from-light/10 to-light/20 outline outline-light/20"
                  >
                    <dt className="mb-1 text-md font-semibold text-emerald-800  bg-light/20 rounded-md w-fit px-2 outline outline-light/30">
                      + {niceLabel(key)}
                    </dt>
                    <dd className="text-sm leading-snug text-emerald-950  p-1">
                      {value}
                    </dd>
                  </motion.div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-neutral-500">
                No strengths available.
              </p>
            )}
          </motion.article>

          {/* Weaknesses */}
          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 250,
              damping: 12,
              bounce: 0.1,
              duration: 0.005,
              delay: 1,
            }}
            className="rounded-xl border border-red-600/10 bg-red-700/15 p-2 backdrop-blur"
          >
            <header className="mb-3 flex items-center justify-center p-1">
              <CardTitle className="text-red-700">Weaknesses</CardTitle>
            </header>

            {hasWeaknesses ? (
              <dl className="space-y-2">
                {Object.entries(weaknesses!).map(([key, value], i) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 12,
                      bounce: 0.1,
                      duration: 0.005,
                      delay: 0.15 * i + 0.8,
                    }}
                    key={key}
                    className="group rounded-lg bg-gradient-to-t from-light/10 to-light/20 p-1 transition-colors outline outline-light/20"
                  >
                    <dt className="mb-1 text-base font-semibold text-rose-800 bg-light/15 w-fit px-2 outline outline-light/30 rounded-md">
                      - {niceLabel(key)}
                    </dt>
                    <dd className="text-sm leading-snug text-rose-950 p-1">
                      {value}
                    </dd>
                  </motion.div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-neutral-500">
                No weaknesses available.
              </p>
            )}
          </motion.article>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}

/**
 * Optional: A full-width variant with a subtle heading & scrollable columns for long lists.
 * Use when your strengths/weaknesses might get long.
 */
export function StrengthsWeaknessesWide({
  maxHeight = 420,
}: {
  maxHeight?: number;
}) {
  const { aiOverview } = useCardList();
  const strengths = aiOverview?.ai_strengths ?? {};
  const weaknesses = aiOverview?.ai_weaknesses ?? {};

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full"
    >
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-xl font-semibold tracking-tight">
          Strengths & Weaknesses
        </h2>
        <p className="text-sm text-neutral-500">
          Generated insights · {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-neutral-200/60 bg-white/80 shadow-sm backdrop-blur ">
          <header className="sticky top-0 z-10 border-b border-neutral-200/60 bg-white/80 p-4 backdrop-blur ">
            <h3 className="text-base font-medium">Strengths</h3>
          </header>
          <div style={{ maxHeight }} className="overflow-auto px-4 py-3">
            <dl className="space-y-4">
              {Object.entries(strengths).map(([k, v]) => (
                <div key={k} className="rounded-xl p-2 hover:bg-emerald-50/60 ">
                  <dt className="text-sm font-semibold text-emerald-800 ">
                    {niceLabel(k)}
                  </dt>
                  <dd className="text-sm text-neutral-700 ">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200/60 bg-white/80 shadow-sm backdrop-blur  ">
          <header className="sticky top-0 z-10 border-b border-neutral-200/60 bg-white/80 p-4 backdrop-blur ">
            <h3 className="text-base font-medium">Weaknesses</h3>
          </header>
          <div style={{ maxHeight }} className="overflow-auto px-4 py-3">
            <dl className="space-y-4">
              {Object.entries(weaknesses).map(([k, v]) => (
                <div key={k} className="rounded-xl p-2 hover:bg-rose-50/60 ">
                  <dt className="text-sm font-semibold text-rose-800 ">
                    {niceLabel(k)}
                  </dt>
                  <dd className="text-sm text-neutral-700 ">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </div>
    </motion.section>
  );
}
