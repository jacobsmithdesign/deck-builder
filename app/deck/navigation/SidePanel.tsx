import CustomScrollArea from "@/app/components/ui/CustomScrollArea";
import { useCommander } from "@/app/context/CommanderContext";
import { AnimatePresence, motion } from "framer-motion";
import { ManaCurve } from "../components/overview/manaCurve";
import { useCardList } from "@/app/context/CardListContext";
import { SpellTypeCounts } from "../components/overview/spellTypeCounts";
import { useCompactView } from "@/app/context/compactViewContext";
import { useEffect, useState } from "react";
import {
  CardTypeCount,
  getCardTypeCounts,
  getKeywordCounts,
  KeywordCount,
} from "@/lib/getCardCounts";
import { getAverageColorFromImage } from "@/lib/getAverageColour";
import { CardTitle } from "@/app/components/ui/card";
import { ManaCost } from "@/app/components/ui/manaCost";
import { Button } from "../components/primitives/button";
import Link from "next/link";
import PerspectiveCard from "../components/card/perspectiveCardUI/PerspectiveCard";

export default function SidePanel() {
  const { compactView, toggleCompactView, setBgColor, bgColor } =
    useCompactView();
  const { deckDetails, commanderCard } = useCommander();
  const [artworkColor, setArtworkColor] = useState<string>();
  const [typeCount, setTypeCount] = useState<CardTypeCount[]>([]);
  const [keywordCount, setKeywordCount] = useState<KeywordCount[]>([]);
  const { deckFeatures, aiOverview, strengthsAndWeaknesses } = useCardList();
  const [showCommander, setShowCommander] = useState<boolean>(false);
  // Set the artworkColour from the card artwork image
  useEffect(() => {
    async function fetchColor() {
      if (commanderCard?.artwork) {
        console.log("Commander artwork found");
        const proxiedUrl = `/api/proxy?url=${encodeURIComponent(
          commanderCard.artwork,
        )}`;
        const color = await getAverageColorFromImage(proxiedUrl);
        setArtworkColor(color);
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
    .replace(")", ", 0.1)");
  const rgbaTo = artworkColor?.replace("rgb(", "rgba(").replace(")", ", 0)");
  return (
    <AnimatePresence>
      <div className="min-w-86 max-w-86 h-full bg-darksecondary/10 hide-scrollbar z-10 p-2 flex flex-col gap-1 ml-2 mb-1 mt-1 rounded-xl">
        {/* Deck Details */}
        <CardTitle
          className="pb-0 flex justify-between items-center bg-light/40 pl-2 pr-1 rounded-md col-span-2 h-8 mb-2 select-none"
          // onClick={() => setShowCommander(!showCommander)}
        >
          <h2 className="font-bold truncate ">{commanderCard?.name}</h2>
          {commanderCard?.mana_cost && (
            <ManaCost manaCost={commanderCard.mana_cost} />
          )}
        </CardTitle>
        <div className="flex">
          {commanderCard && (
            <motion.div
              key="commander-card"
              initial={{
                opacity: 0,
                scale: 0,
                height: 0,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                height: "auto",
              }}
              exit={{
                opacity: 0,
                height: 0,
                transition: { delay: 0.05 },
              }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", duration: 0.3, ease: "easeOut" }}
              className={`absolute rounded-xl z-20 cursor-pointer `}
              onClick={() => setShowCommander(!showCommander)}
            >
              <img
                className="w-26 h-36 rounded-md"
                src={commanderCard?.imageFrontUrl || null}
              />
            </motion.div>
          )}
          <div className="w-full flex flex-col ml-28 h-36">
            <h1 className="flex md:text-sm lg:text-base text-xs text-dark/70 font-bold mb-2 w-full">
              <span className="font-normal bg-light/20 px-2 rounded-md mr-2 whitespace-nowrap">
                {deckDetails?.type}
              </span>
            </h1>
            <h1 className="flex md:text-sm lg:text-base text-xs text-dark/70 font-bold mb-2 w-full">
              <span className="text-ellipsis whitespace-nowrap overflow-hidden block mr-2">
                {deckDetails?.name}
              </span>
            </h1>
          </div>
        </div>
        <div className="h-fit">
          <SpellTypeCounts spellCounts={typeCount} compactView={false} />
        </div>
        {/* <div className="flex flex-col gap-1">
          <p className="font-bold text-dark/80">Jump to</p>
          <Link href={`#card-view`}>
            <div className="w-full rounded-lg">
              <Button variant="navigation" className="w-full justify-start">
                Cards
              </Button>
              <div className="flex flex-col pl-1">
                {typeCount.map((type) => (
                  <Link key={type.type} href={`#${type.type}`}>
                    <Button
                      variant="navigation"
                      key={type.type}
                      className="w-full justify-start pl-2"
                    >
                      {type.type}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </Link>
          <Link href={`#overview`}>
            <Button variant="navigation" className="w-full justify-start">
              Archetype
            </Button>
          </Link>
        </div> */}
        <div className="overflow-y-scroll w-full flex flex-col hide-scrollbar gap-1">
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.7,
              translateX: -60,
              translateY: -60,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              translateY: 0,
              translateX: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.4,
              translateX: -40,
              translateY: -60,
              transition: { delay: 0.05 },
            }}
            transition={{ duration: 0.2 }}
            className="h-33"
          >
            <ManaCurve
              deckFeatures={deckFeatures}
              defaultMode="pool"
              compactView={false}
            />
          </motion.div>
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.7,
              translateX: -60,
              translateY: -60,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              translateY: 0,
              translateX: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.4,
              translateX: -40,
              translateY: -60,
              transition: { delay: 0.05 },
            }}
            transition={{ duration: 0.2 }}
            className="min-h-33"
          >
            <ManaCurve
              deckFeatures={deckFeatures}
              defaultMode="curve"
              compactView={false}
            />
          </motion.div>
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.7,
              translateX: -60,
              translateY: -60,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              translateY: 0,
              translateX: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.4,
              translateX: -40,
              translateY: -60,
              transition: { delay: 0.05 },
            }}
            transition={{ duration: 0.2 }}
            className="min-h-33"
          >
            <ManaCurve
              deckFeatures={deckFeatures}
              defaultMode="cost"
              compactView={false}
            />
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
