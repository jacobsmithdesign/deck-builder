"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
import { useCommander } from "@/app/context/CommanderContext";
import { ManaCost } from "./manaCost";
import {
  Spell,
  SpellCount,
  SpellType,
  Strength,
  Weakeness,
} from "./overviewButtons";
import ScrollingLabels from "./scrollingLabels";
import Image from "next/image";
import { CommanderSkeleton } from "../commanderSkeleton";
import { getAverageColorFromImage } from "@/lib/getAverageColour";
import { useEffect, useState } from "react";
import {
  CardTypeCount,
  getCardTypeCounts,
  getKeywordCounts,
  KeywordCount,
} from "@/lib/getCardCounts";
import { AnimatePresence, motion } from "framer-motion";
import { useCompactView } from "@/app/context/compactViewContext";
import { useCardList } from "@/app/context/CardListContext";
import { ColouredManaCurve } from "@/app/deck/components/colouredManaCurve";
import { SpellTypeCounts } from "@/app/deck/components/spellTypeCounts";
import { ManaCurve } from "@/app/deck/components/manaCurve";
import { StrengthsAndWeaknesses } from "@/app/deck/components/strengthsAndWeaknesses";
import { DeckMetricsXL } from "@/app/deck/components/deckMetricsXL";
import { DeckMetricsMini } from "@/app/deck/components/deckMetricsMini";
export default function CommanderOverview() {
  const { compactView, setBgColor, bgColor } = useCompactView();
  const { deckDetails, commanderCard } = useCommander();
  const [artworkColor, setArtworkColor] = useState<string>();
  const [typeCount, setTypeCount] = useState<CardTypeCount[]>([]);
  const [keywordCount, setKeywordCount] = useState<KeywordCount[]>([]);
  const { deckFeatures, aiOverview } = useCardList();
  // Set the artworkColour from the card artwork image
  useEffect(() => {
    async function fetchColor() {
      if (commanderCard?.artwork) {
        console.log("Commander artwork found");
        const proxiedUrl = `/api/proxy?url=${encodeURIComponent(
          commanderCard.artwork
        )}`;
        const color = await getAverageColorFromImage(proxiedUrl);
        setArtworkColor(color);
        console.log("colour:", color);
        setBgColor(color);
      }
    }
    fetchColor();
  }, [commanderCard?.artwork]);

  useEffect(() => {
    if (deckDetails) {
      const typeCount = getCardTypeCounts(deckDetails?.cards);
      const keywordCount = getKeywordCounts(deckDetails?.cards);
      setTypeCount(typeCount);
      setKeywordCount(keywordCount);
    }
  }, [deckDetails?.cards]);

  const rgbaFrom = artworkColor
    ?.replace("rgb(", "rgba(")
    .replace(")", ", 0.5)");
  const rgbaTo = artworkColor?.replace("rgb(", "rgba(").replace(")", ", 0.2)");

  // Function to toggle the compact view of the commander overview

  return (
    <AnimatePresence>
      <div className={`w-full bg-light/90 z-10 px-1 pt-2`}>
        <Card
          style={
            {
              "--from-color": rgbaFrom ?? "rgba(100, 100, 100,0.25)",
              "--to-color": rgbaTo ?? "rgba(100, 100, 100,0.25)",
            } as React.CSSProperties
          }
          className={`w-full mt-1 flex bg-gradient-to-r from-[var(--from-color)] to-[var(--to-color)] text-dark/90 relative overflow-clip`}
        >
          <motion.div
            key="height-container-div"
            layout
            animate={{ height: compactView ? 80 : 324 }}
            transition={{
              type: "spring",
              stiffness: 250,
              damping: 23,
              duration: 0.3,
            }}
            className="w-full h-full relative flex md:p-2 p-1 z-20"
          >
            {/* Desktop card image */}
            <img
              src={commanderCard?.imageFrontUrl || null}
              width={400}
              className={`border object-cover border-darksecondary rounded-2xl hidden md:block h-full transition-all duration-300 ${
                compactView ? "w-10 rounded-xs" : " w-65 "
              }`}
            />
            {deckDetails && commanderCard ? (
              <div className="w-full">
                <CardDescription className="text-lg text-dark/70 h-full">
                  <CardContent className="text-dark grid md:grid-cols-2 grid-cols-1 gap-2 p-0 h-full ">
                    <CardHeader className="md:px-3 px-0">
                      <div className="md:flex grid grid-cols-3 gap-2 flex-col">
                        {/* Mobile card image */}
                        <img
                          src={commanderCard?.imageFrontUrl || null}
                          width={300}
                          className={`object-contain sm:w-full  sm:h-full h-20 md:rounded-2xl sm:rounded-xl rounded-sm block md:hidden sm:static absolute `}
                        />
                        {/* Card with title and oracle text*/}
                        <Card className="sm:col-span-2 col-span-3 sm:ml-0 ml-20 flex flex-col grid-cols-1 sm:grid-rows-3">
                          <div className="w-full  flex flex-col">
                            <h1 className="flex md:text-sm lg:text-base text-xs text-dark/70 font-bold mb-2 w-full">
                              <span className="text-ellipsis whitespace-nowrap overflow-hidden block mr-2">
                                {deckDetails.name}
                              </span>
                              <span className="font-normal bg-light/20 px-2 rounded-md mr-2 whitespace-nowrap">
                                {deckDetails.type}
                              </span>
                            </h1>
                            <CardTitle className="pb-0 flex justify-between items-center bg-light/40 pl-2 pr-1 rounded-md col-span-2 h-6 mb-2">
                              <h2 className="font-bold truncate ">
                                {commanderCard?.name}
                              </h2>
                              {commanderCard?.mana_cost && (
                                <ManaCost manaCost={commanderCard.mana_cost} />
                              )}
                            </CardTitle>
                          </div>

                          {/* Card oracle text for medium displays */}
                          <AnimatePresence>
                            {!compactView && (
                              <motion.div
                                key="compact-card-text"
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 100, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.85 }}
                                transition={{ duration: 0.25 }}
                                className={`p-0 row-span-2 bg-light/20 rounded-sm`}
                              >
                                <div className="p-2 my-auto overflow-scroll hide-scrollbar flex flex-col md:h-58">
                                  {commanderCard.text
                                    ?.split("\n")
                                    .map((line, index) => (
                                      <p
                                        key={index}
                                        className="mb-2 lg:text-base md:text-sm text-xs"
                                      >
                                        {line}
                                      </p>
                                    ))}
                                  <p className="lg:text-lg text-xs italic font-serif my-auto">
                                    {commanderCard.flavourText}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Card>
                        {/* Card oracle text for small displays */}
                        <div className="bg-light/20 p-2 rounded-lg flex flex-col sm:hidden col-span-3">
                          {commanderCard.text
                            ?.split("\n")
                            .map((line, index) => (
                              <p
                                key={index}
                                className="mb-2 md:text-base text-xs"
                              >
                                {line}
                              </p>
                            ))}
                          <p className="md:text-base text-xs italic font-serif my-auto">
                            {commanderCard.flavourText}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    {/* Overview panel with pemanent types, strengths and weaknesses */}
                    <motion.div
                      key="big-deck-overview"
                      initial={{ opacity: 0, translateY: -20 }}
                      animate={{ opacity: 100, translateY: 0 }}
                      exit={{ opacity: 0, translateY: -20 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div
                        className={`${
                          compactView ? "" : "mt-0"
                        } transition-all duration-250 flex gap-1 h-77`}
                      >
                        {/* Mana curve graphs */}
                        <div
                          className={`${
                            compactView ? "w-1/3" : "w-2/5 "
                          } h-77 grid grid-rows-3 gap-1 transition-all duration-250`}
                        >
                          {/* Mana curve graph that always shows */}
                          <AnimatePresence>
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 100, scale: 1 }}
                              exit={{
                                opacity: 0,
                                scale: 0,
                                transition: { delay: 0.05 },
                              }}
                              transition={{ duration: 0.2 }}
                            >
                              <ManaCurve
                                toggle={compactView}
                                deckFeatures={deckFeatures}
                                compactView={compactView}
                                defaultMode="pool"
                              />
                            </motion.div>
                          </AnimatePresence>
                          {/* Mana curve graph for spell mana second in list */}
                          <AnimatePresence>
                            {!compactView && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 100, scale: 1 }}
                                exit={{
                                  opacity: 0,
                                  scale: 0,
                                  transition: { delay: 0.05 },
                                }}
                                transition={{ duration: 0.2 }}
                              >
                                <ManaCurve
                                  deckFeatures={deckFeatures}
                                  compactView={compactView}
                                  defaultMode="curve"
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                          {/* Basic mana curve graph at bottom of list */}
                          <AnimatePresence>
                            {!compactView && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                  opacity: 100,
                                  scale: 1,
                                  transition: { delay: 0.05 },
                                }}
                                exit={{
                                  opacity: 0,
                                  scale: 0,
                                }}
                                transition={{ duration: 0.2 }}
                              >
                                <ManaCurve
                                  deckFeatures={deckFeatures}
                                  compactView={compactView}
                                  defaultMode="cost"
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        {/* Spell type table */}
                        <div className="grid grid-rows-3 w-full gap-1 h-full ">
                          <div className="w-full flex z-10 relative">
                            <div
                              className={`${
                                compactView ? "w-1/2" : "w-full"
                              } transition-all duration-250 z-10`}
                            >
                              <SpellTypeCounts
                                spellCounts={typeCount}
                                compactView={compactView}
                              />
                            </div>
                            {/* Miniature deck metrics list */}
                            <div className="absolute w-full flex">
                              <div
                                className={`pointer-events-none z-0 ${
                                  compactView ? "w-1/2" : "w-full"
                                }`}
                              ></div>
                              <DeckMetricsMini compactView={compactView} />
                            </div>
                          </div>

                          <StrengthsAndWeaknesses
                            aiOverview={aiOverview}
                            compactView={compactView}
                          />
                        </div>
                      </div>
                    </motion.div>
                  </CardContent>
                </CardDescription>
              </div>
            ) : (
              <CommanderSkeleton />
            )}
          </motion.div>
          <div className="absolute w-full h-full items-center flex">
            <div className="absolute backdrop-blur-3xl w-full h-full z-10"></div>
            <img
              src={commanderCard?.artwork || null}
              alt="Commander Card Background Blur"
              className="object-cover w-96 h-full rounded-2xl hidden md:block absolute z-0 opacity-40 p-4"
            />
          </div>
        </Card>
      </div>
    </AnimatePresence>
  );
}
