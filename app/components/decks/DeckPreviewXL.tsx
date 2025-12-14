"use client";
import { CommanderDeckRecord } from "@/lib/schemas";
import Image from "next/image";
import { DeckMetrics } from "./DeckMetrics";
import { ManaCost } from "../ui/manaCost";
import { useEffect, useState } from "react";
import { scryfallIdToUrls } from "@/lib/ScryfallIdToUrls";
import Link from "next/link";
import { ChevronUp } from "lucide-react";
import { getAverageColorFromImage } from "@/lib/getAverageColour";
import { Card, CardDescription, CardTitle } from "../ui/card";
import { DeckMetricsXL } from "@/app/deck/components/overview/deckMetricsXL";
import { niceLabel } from "@/app/deck/components/details/ArchetypeOverview";
import ArchetypeOverview from "./ArchetypeOverviewMini";
import { Button } from "@/app/deck/components/button";

export default function DeckPreviewXL({ deck }: { deck: CommanderDeckRecord }) {
  const scryfallId = deck.commander.identifiers.scryfallId ?? null;
  const [front, back, artwork] = scryfallIdToUrls(scryfallId);
  const [bgColor, setBgColor] = useState<string | null>(null);

  useEffect(() => {
    async function fetchColor() {
      if (artwork) {
        console.log("Commander artwork found");
        const proxiedUrl = `/api/proxy?url=${encodeURIComponent(artwork)}`;
        const color = await getAverageColorFromImage(proxiedUrl);
        setBgColor(color);
      }
    }
    fetchColor();
  }, [artwork]);

  const rgbaFrom = bgColor?.replace("rgb(", "rgba(").replace(")", ", 1)");
  const rgbaTo = bgColor?.replace("rgb(", "rgba(").replace(")", ", 0.4)");
  return (
    <Card
      style={
        {
          "--from-color": rgbaFrom ?? "rgba(100, 100, 100, 0.25)",
          "--to-color": rgbaTo ?? "rgba(100, 100, 100, 0.50)",
        } as React.CSSProperties
      }
      className="rounded-2xl min-w-28 h-full bg-gradient-to-r from-[var(--from-color)] to-[var(--to-color)] overflow-clip relative flex w-full"
    >
      {/* Card image on left */}
      <div className="h-92 z-20 w-84 relative overflow-clip">
        <Link href={`/deck/${deck.id}`} className="w-full h-full ">
          <Image src={front} fill alt="" className="object-cover" />
        </Link>
      </div>

      {/* container for data right of image */}
      <div className="w-full flex flex-col p-2 ">
        {/* Deck title section */}
        <div className="relative flex rounded-lg">
          <div className="flex flex-col items-start md:text-sm lg:text-lg text-xs text-dark/80 font-bold w-full  rounded-lg gap-2">
            <Link href={`/deck/${deck.id}`} className="z-0">
              <button className="cursor-pointer text-ellipsis whitespace-nowrap overflow-hidden block mr-2 h-7 px-2 rounded-lg text-lg bg-light/40 md:hover:bg-light/60 z-20 ">
                {deck.name}
              </button>
            </Link>
            <div className="flex gap-2 items-center justify-center z-10">
              <button className="cursor-pointer font-normal bg-light/20 md:hover:bg-light/30 h-fit px-1 rounded-md whitespace-nowrap md:text-sm lg:text-base text-xs">
                {deck.sets.name}
              </button>
              <div className="">
                <DeckMetrics deck={deck} />
              </div>
            </div>
          </div>
          <Link href={`/deck/${deck.id}`} className=" z-0">
            <Button variant="frosted" className="w-22 rounded-full">
              View deck
            </Button>
          </Link>
        </div>

        {/* Deck overview section */}
        <div className="flex flex-col h-full gap-1 rounded-lg px-1 z-10 bg-light/20 outline outline-light/30  shadow-inner shadow-light/40 mt-2">
          {/* Tagline */}
          <p className="text-base text-left px-2 bg-light/25 outline outline-light/30 mt-1 h-fit rounded-md">
            {deck.deck_archetype_overview?.description ||
              "No tagline available"}
          </p>

          {/* Strengths and weaknesses and difficulty*/}
          <div className="flex w-full">
            <ArchetypeOverview
              archetypeOverview={deck.deck_archetype_overview}
              bgColor={bgColor}
            />
            <div className="flex gap-1 flex-col min-w-1/2 h-full">
              <div className="flex flex-wrap gap-2 text-base bg-green-200/20 w-fit p-1 rounded-md outline outline-green-200/40 items-centers">
                <span className="px-1 w-fit rounded-sm bg-light/30 outline outline-light/40">
                  Strengths
                </span>
                {Object.keys(
                  deck.deck_ai_strengths_weaknesses?.strengths ?? {}
                ).map((name) => (
                  <div
                    key={name}
                    className="bg-green-300/40 w-fit px-1 rounded"
                  >
                    {niceLabel(name)}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 text-base bg-red-200/30 w-fit p-1 rounded-md outline outline-red-200/50 items-center">
                <span className="px-1 w-fit rounded-sm bg-light/30 outline outline-light/40">
                  Weaknesses
                </span>

                {Object.keys(
                  deck.deck_ai_strengths_weaknesses?.weaknesses ?? {}
                ).map((name) => (
                  <div
                    key={name}
                    className="bg-red-400/30 w-fit h-fit px-1 rounded"
                  >
                    {niceLabel(name)}
                  </div>
                ))}
              </div>
              <DeckMetricsXL
                difficulty={deck.deck_ai_difficulty}
                className="text-base"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Display card artwork image */}
    </Card>
  );
}
