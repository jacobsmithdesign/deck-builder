import { useCommander } from "@/app/context/CommanderContext";
import { AnimatePresence, motion } from "framer-motion";
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
import { useCompactView } from "@/app/context/compactViewContext";
import { SpellTypeCounts } from "../components/overview/spellTypeCounts";

const OVERVIEW_NAV: { id: string; label: string }[] = [
  { id: "overview-deck", label: "Deck Info" },
  { id: "overview-archetype", label: "Archetype" },
  { id: "overview-strengths", label: "Strengths & Weaknesses" },
  { id: "overview-mana", label: "Mana" },
  { id: "overview-pillars", label: "Pillars" },
  { id: "overview-subtype-probability", label: "Subtype Probability" },
];

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
}

export default function SidePanel() {
  const { setBgColor } = useCompactView();
  const { deckDetails, commanderCard } = useCommander();
  const [artworkColor, setArtworkColor] = useState<string>();
  const [typeCount, setTypeCount] = useState<CardTypeCount[]>([]);
  const [keywordCount, setKeywordCount] = useState<KeywordCount[]>([]);
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

  return (
    <AnimatePresence>
      <div className="min-w-86 max-w-86 h-full bg-darksecondary/10 hide-scrollbar z-10 p-2 flex flex-col gap-1 ml-2 mb-1 mt-1 rounded-xl">
        {/* Deck Details */}
        <CardTitle
          className="pb-0 flex justify-between items-center  pl-1 pr-1 rounded-md col-span-2 h-6 mb-2 select-none"
          // onClick={() => setShowCommander(!showCommander)}
        >
          <h2 className="font-bold truncate ">{deckDetails?.name}</h2>
        </CardTitle>
        <div className="flex">
          <div className="w-full flex flex-col">
            <h1 className="flex md:text-sm lg:text-base text-xs text-dark/70 font-bold mb-2 w-full">
              <span className="font-normal bg-light/20 px-2 rounded-md mr-2 whitespace-nowrap">
                {deckDetails?.type}
              </span>
            </h1>
          </div>
        </div>
        <div className="h-fit">
          <SpellTypeCounts spellCounts={typeCount} compactView={false} />
        </div>

        <nav
          className="w-full flex flex-col gap-1 mt-2"
          aria-label="Overview sections"
        >
          {OVERVIEW_NAV.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollToSection(id)}
              className="text-left text-sm font-medium text-dark/80 hover:text-dark hover:bg-light/20 rounded-md px-2 py-1.5 transition-colors w-full"
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
    </AnimatePresence>
  );
}
