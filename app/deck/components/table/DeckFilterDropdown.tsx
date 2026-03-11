"use client";

import { useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCardList } from "@/app/context/CardListContext";
import {
  useDeckView,
  type ColourFilterMode,
  type DeckFiltersState,
} from "@/app/context/DeckViewContext";
import { getDeckTagOptions } from "@/app/hooks/useFilteredCards";
import { cn } from "@/lib/utils";
import { RaindropContainer } from "../primitives/RaindropContainer";
import { useCompactView } from "@/app/context/compactViewContext";
import { Button } from "../primitives/button";
import { AnimatedButton } from "../primitives/AnimatedButton";

const COLOUR_OPTIONS = [
  { value: "W", label: "W" },
  { value: "U", label: "U" },
  { value: "B", label: "B" },
  { value: "R", label: "R" },
  { value: "G", label: "G" },
] as const;

const COLOUR_MODE_OPTIONS: { value: ColourFilterMode; label: string }[] = [
  { value: "exactly", label: "Exactly these" },
  { value: "including", label: "Including these" },
  { value: "atMost", label: "At most these" },
];

const NUM_INPUT_MAX = 12;
const inputBaseClass = cn(
  "w-10 max-w-12 rounded-lg border border-dark/20 bg-light/80 pl-2 py-1 text-sm text-dark placeholder:text-dark/50",
  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
);
const arrowBtnClass =
  "flex items-center justify-center w-5 h-4 shrink-0 border-l border-dark/20 bg-light/60 text-dark/50 hover:text-dark hover:bg-dark/10 transition-colors";

function NumInputWithArrows({
  value,
  onChange,
  placeholder,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  "aria-label"?: string;
}) {
  const num = value === "" ? null : parseInt(value, 10);
  const clamp = (n: number) => Math.min(NUM_INPUT_MAX, Math.max(0, n));

  return (
    <div className="flex items-stretch rounded-lg border border-dark/20 bg-light/80 overflow-hidden">
      <input
        type="number"
        min={0}
        max={NUM_INPUT_MAX}
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(inputBaseClass, "border-0 rounded-r-none")}
      />
      <div className="flex flex-col justify-between">
        <button
          type="button"
          aria-label="Increment"
          onClick={() => onChange(String(clamp((num ?? 0) + 1)))}
          className={cn(arrowBtnClass, "rounded-tr-lg h-1/2")}
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Decrement"
          onClick={() => {
            const next = (num ?? 0) - 1;
            onChange(next <= 0 ? "" : String(next));
          }}
          className={cn(
            arrowBtnClass,
            "rounded-br-lg border-t h-1/2 border-dark/20",
          )}
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface DeckFilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLDivElement | null>;
}

export function DeckFilterDropdown({
  isOpen,
  onClose,
  anchorRef,
}: DeckFilterDropdownProps) {
  const { bgColor } = useCompactView();
  const { cards } = useCardList();
  const { filters, setFilters, resetFilters, hasActiveFilters } = useDeckView();
  const panelRef = useRef<HTMLDivElement>(null);

  const tagOptions = useMemo(() => getDeckTagOptions(cards), [cards]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        anchorRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  const update = (
    patch:
      | Partial<DeckFiltersState>
      | ((prev: DeckFiltersState) => DeckFiltersState),
  ) => {
    setFilters((prev) =>
      typeof patch === "function" ? patch(prev) : { ...prev, ...patch },
    );
  };

  const toggleColour = (value: string) => {
    setFilters((prev) => {
      const next = prev.colours.values.includes(value)
        ? prev.colours.values.filter((c) => c !== value)
        : [...prev.colours.values, value];
      return {
        ...prev,
        colours: { ...prev.colours, values: next },
      };
    });
  };

  const toggleTag = (tag: string) => {
    setFilters((prev) => {
      const next = prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags: next };
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0, transition: { delay: 0.05 } }}
          transition={{
            duration: 0.15,
            type: "spring",
            stiffness: 350,
            damping: 25,
            bounce: 0.5,
          }}
          className="absolute top-full right-0 mt-2 z-50 w-72 max-h-[70vh] hide-scrollbar backdrop-blur-sm rounded-2xl"
        >
          <RaindropContainer
            bgColor={bgColor}
            innerClassName="opacity-30"
            childClassName="p-2 bg-light/20 h-full"
            className="rounded-2xl from-light/60 h-full"
          >
            <div className="flex flex-col gap-2">
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.85,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 350,
                    damping: 15,
                    bounce: 1,
                    delay: 0.05,
                  },
                }}
                exit={{
                  opacity: 0,
                  scale: 0,
                  transition: { duration: 0.15, delay: 0 },
                }}
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 15,
                  bounce: 0.5,
                  delay: 0,
                }}
                className="ml-auto"
              >
                <Button
                  variant={hasActiveFilters ? "raindrop" : "raindropDisabled"}
                  type="button"
                  onClick={resetFilters}
                  disabled={!hasActiveFilters}
                  className="text-md font-medium rounded-full w-fit "
                >
                  Clear all
                </Button>
              </motion.div>

              {/* Card Name */}
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.85,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 350,
                    damping: 15,
                    bounce: 1,
                    delay: 0.1,
                  },
                }}
                exit={{
                  opacity: 0,
                  scale: 0,
                  transition: { duration: 0.15, delay: 0 },
                }}
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 15,
                  bounce: 0.5,
                  delay: 0,
                }}
              >
                <RaindropContainer className="flex flex-col gap-1 rounded-xl p-1">
                  <label className="text-md font-semibold text-dark/80 px-1">
                    Card name
                  </label>
                  <input
                    type="text"
                    value={filters.cardName}
                    onChange={(e) => update({ cardName: e.target.value })}
                    placeholder="Search by name…"
                    className={cn(
                      "w-full rounded-lg border border-dark/20 bg-light/80 px-3 py-2 text-sm text-dark placeholder:text-dark/50 focus:outline-dark/30 focus:outline",
                    )}
                  />
                </RaindropContainer>
              </motion.div>
              {/* Card text (oracle / rules text) */}
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.85,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 350,
                    damping: 15,
                    bounce: 1,
                    delay: 0.12,
                  },
                }}
                exit={{
                  opacity: 0,
                  scale: 0,
                  transition: { duration: 0.15, delay: 0 },
                }}
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 15,
                  bounce: 0.5,
                  delay: 0,
                }}
              >
                <RaindropContainer className="flex flex-col gap-1 rounded-xl p-1">
                  <label className="text-md font-semibold text-dark/80 px-1">
                    Card text
                  </label>
                  <input
                    type="text"
                    value={filters.cardText}
                    onChange={(e) => update({ cardText: e.target.value })}
                    placeholder="Search in rules text…"
                    className={cn(
                      "w-full rounded-lg border border-dark/20 bg-light/80 px-3 py-2 text-sm text-dark placeholder:text-dark/50 focus:outline-dark/30 focus:outline",
                    )}
                  />
                </RaindropContainer>
              </motion.div>
              {/* Colours */}
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.85,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 350,
                    damping: 15,
                    bounce: 1,
                    delay: 0.15,
                  },
                }}
                exit={{
                  opacity: 0,
                  scale: 0,
                  transition: { duration: 0.15, delay: 0 },
                }}
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 15,
                  bounce: 0.5,
                  delay: 0,
                }}
              >
                <RaindropContainer className="flex gap-1 rounded-xl p-1">
                  <div className="flex justify-between">
                    <label className="text-md font-semibold text-dark/80 px-1">
                      Colours
                    </label>
                    <select
                      value={filters.colours.mode}
                      onChange={(e) =>
                        update({
                          colours: {
                            ...filters.colours,
                            mode: e.target.value as ColourFilterMode,
                          },
                        })
                      }
                      className={cn(
                        "w-full rounded-full border border-dark/20 bg-light/80 px-3 py-1 text-sm text-dark mb-1 focus:outline-dark/30 focus:outline",
                      )}
                    >
                      {COLOUR_MODE_OPTIONS.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className=" k"
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOUR_OPTIONS.map((opt) => {
                      const active = filters.colours.values.includes(opt.value);
                      return (
                        <AnimatedButton
                          key={opt.value}
                          type="button"
                          variant="raindrop"
                          size="icon"
                          onClick={() => toggleColour(opt.value)}
                          className={cn(
                            "w-8 h-8 rounded-full text-md font-bold border-2 min-w-8 min-h-8",
                            active
                              ? "!bg-dark/25 !from-dark/20 !to-dark/30 border-dark/50 text-dark shadow-inner"
                              : "bg-light/0 border-dark/20 text-dark/60 hover:border-dark/40 hover:text-dark/80",
                          )}
                        >
                          {opt.label}
                        </AnimatedButton>
                      );
                    })}
                  </div>
                </RaindropContainer>
              </motion.div>
              {/* Mana value */}
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.85,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 350,
                    damping: 15,
                    bounce: 1,
                    delay: 0.2,
                  },
                }}
                exit={{
                  opacity: 0,
                  scale: 0,
                  transition: { duration: 0.15, delay: 0 },
                }}
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 15,
                  bounce: 0.5,
                  delay: 0,
                }}
              >
                <RaindropContainer
                  childClassName="flex gap-1 rounded-xl p-1 items-center justify-between w-full"
                  className="flex gap-1 rounded-xl"
                >
                  <label className="text-md w-fit font-semibold text-dark/80 px-1">
                    Mana value
                  </label>
                  <div className="flex gap-2 items-center">
                    <NumInputWithArrows
                      value={filters.manaValue.min}
                      onChange={(v) =>
                        update({
                          manaValue: { ...filters.manaValue, min: v },
                        })
                      }
                      placeholder="Min"
                      aria-label="Mana value minimum"
                    />
                    <span className="text-dark/50 text-sm">–</span>
                    <NumInputWithArrows
                      value={filters.manaValue.max}
                      onChange={(v) =>
                        update({
                          manaValue: { ...filters.manaValue, max: v },
                        })
                      }
                      placeholder="Max"
                      aria-label="Mana value maximum"
                    />
                  </div>
                </RaindropContainer>
              </motion.div>

              {/* Power */}
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.85,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 350,
                    damping: 15,
                    bounce: 1,
                    delay: 0.25,
                  },
                }}
                exit={{
                  opacity: 0,
                  scale: 0,
                  transition: { duration: 0.15, delay: 0 },
                }}
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 15,
                  bounce: 0.5,
                  delay: 0,
                }}
              >
                <RaindropContainer
                  childClassName="flex gap-1 rounded-xl p-1 items-center justify-between w-full"
                  className="flex flex-col gap-1 rounded-xl "
                >
                  <label className="text-md font-semibold text-dark/80 px-1">
                    Power
                  </label>
                  <div className="flex gap-2 items-center">
                    <NumInputWithArrows
                      value={filters.power.min}
                      onChange={(v) =>
                        update({ power: { ...filters.power, min: v } })
                      }
                      placeholder="Min"
                      aria-label="Power minimum"
                    />
                    <span className="text-dark/50 text-sm">–</span>
                    <NumInputWithArrows
                      value={filters.power.max}
                      onChange={(v) =>
                        update({ power: { ...filters.power, max: v } })
                      }
                      placeholder="Max"
                      aria-label="Power maximum"
                    />
                  </div>
                </RaindropContainer>
              </motion.div>
              {/* Toughness */}
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.85,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 350,
                    damping: 15,
                    bounce: 1,
                    delay: 0.3,
                  },
                }}
                exit={{
                  opacity: 0,
                  scale: 0,
                  transition: { duration: 0.15, delay: 0 },
                }}
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 15,
                  bounce: 0.5,
                  delay: 0,
                }}
              >
                <RaindropContainer
                  childClassName="flex gap-1 rounded-xl p-1 items-center justify-between w-full"
                  className="flex flex-col gap-1 rounded-xl "
                >
                  <label className="text-md font-semibold text-dark/80 px-1">
                    Toughness
                  </label>
                  <div className="flex gap-2 items-center">
                    <NumInputWithArrows
                      value={filters.toughness.min}
                      onChange={(v) =>
                        update({
                          toughness: { ...filters.toughness, min: v },
                        })
                      }
                      placeholder="Min"
                      aria-label="Toughness minimum"
                    />
                    <span className="text-dark/50 text-sm">–</span>
                    <NumInputWithArrows
                      value={filters.toughness.max}
                      onChange={(v) =>
                        update({
                          toughness: { ...filters.toughness, max: v },
                        })
                      }
                      placeholder="Max"
                      aria-label="Toughness maximum"
                    />
                  </div>
                </RaindropContainer>
              </motion.div>
              {/* Tags (keywords from deck cards) */}
              {tagOptions.length > 0 && (
                <motion.div
                  initial={{
                    opacity: 0,
                    scale: 0.85,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    transition: {
                      type: "spring",
                      stiffness: 350,
                      damping: 15,
                      bounce: 1,
                      delay: 0.35,
                    },
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0,
                    transition: { duration: 0.15, delay: 0 },
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 450,
                    damping: 15,
                    bounce: 0.5,
                    delay: 0,
                  }}
                >
                  <RaindropContainer className="flex flex-col gap-1 rounded-xl p-1">
                    <label className="text-md font-semibold text-dark/80 px-1 mp-2">
                      Keywords
                    </label>
                    <div className="flex flex-wrap gap-1.5 overflow-y-auto rounded-lg ">
                      {tagOptions.map((tag) => {
                        const active = filters.tags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={cn(
                              "rounded-full px-2 py- text-sm font-medium border transition-colors cursor-pointer ",
                              active
                                ? "bg-light/80 border-light text-dark"
                                : "border-dark/20 text-dark/50 hover:border-dark/30 hover:text-dark/70",
                            )}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </RaindropContainer>
                </motion.div>
              )}
            </div>
          </RaindropContainer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
