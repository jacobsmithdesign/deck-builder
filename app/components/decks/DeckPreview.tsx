import { CommanderDeckRecord, DeckRecord } from "@/lib/schemas";
import Image from "next/image";
import { DeckMetrics } from "./DeckMetrics";
import { ManaCost } from "../ui/manaCost";
import { useState } from "react";
import { scryfallIdToUrls } from "@/lib/ScryfallIdToUrls";
import Link from "next/link";
import { ChevronUp } from "lucide-react";
import { ExpandablePillsMini } from "@/app/deck/components/overview/expandablePillsMini";
import { AnimatePresence, motion } from "framer-motion";

export default function DeckPreview({ deck }: { deck: CommanderDeckRecord }) {
  const [openPanel, setOpenPanel] = useState(false);

  const scryfallId = deck.commander?.identifiers.scryfallId ?? null;
  const [front, back, artwork] = scryfallId
    ? scryfallIdToUrls(scryfallId)
    : [null, null, null];
  return (
    <div className="rounded-xl min-w-32 h-72 overflow-clip relative flex flex-col justify-between">
      {/* Top card details: colour identity, deck type */}
      {!openPanel && (
        <div className="relative flex justify-between z-10 p-2 w-full top-0 items-start pointer-events-none">
          <div className="gap-1 flex flex-col">
            <div className="w-fit bg-light rounded-md px-1 h-5 shadow text-sm">
              <p>{deck.type}</p>
            </div>
          </div>
          <ManaCost colorIdentity={deck.commander?.color_identity} />
        </div>
      )}

      {/* Bottom card detail: title, creator, AI tags, release date */}
      <div className="mb-9 absolute w-full p-2 bottom-0">
        <AnimatePresence>
          <motion.div
            className={`relative w-full p-2 z-10 rounded-lg bg-gradient-to-b from-light/60 to-light/40 shadow-inner shadow-light/80 transition-all ease-out duration-250 overflow-clip text-left backdrop-blur-sm ${
              openPanel ? "h-59 " : "h-16"
            } `}
          >
            <button
              className="px-1 mb-1 font-bold text-md w-full overflow-hidden bg-light/60 md:hover:bg-light rounded flex justify-between cursor-pointer transition-all"
              onClick={() => setOpenPanel(!openPanel)}
            >
              <h3 className="text-left truncate flex-1">{deck.name}</h3>
              <ChevronUp
                className={`${openPanel && "rotate-180"} transition-all`}
              />
            </button>
            {/* AI Ranks */}
            {!openPanel && (
              <div className="pb-2  top-0 left-30 w-fit">
                <ExpandablePillsMini difficulty={deck.deck_ai_difficulty} />
              </div>
            )}

            {/* Hidden deck details */}
            {openPanel && (
              <div className="flex flex-col h-full mb-8 gap-1 rounded">
                {/* Tagline */}

                <div className="flex flex-wrap gap-2 text-base bg-green-300/60 shadow-inner shadow-green-200/60 w-fit p-1 rounded-sm outline outline-green-200/40 items-centers">
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
                      {name}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1 text-base bg-red-300/60 shadow-inner shadow-red-200/60 w-fit p-1 rounded-sm outline outline-red-200/50 items-center">
                  <span className="px-1 w-fit rounded-xs bg-light/30 outline outline-light/40">
                    Weaknesses
                  </span>

                  {Object.keys(
                    deck.deck_ai_strengths_weaknesses?.weaknesses ?? {}
                  ).map((name) => (
                    <div
                      key={name}
                      className="bg-red-400/30 w-fit h-fit px-1 rounded"
                    >
                      {name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <Link href={`/deck/${deck.id}`} className="absolute inset-0 mb-9">
        <Image src={artwork} fill alt="" className="object-cover rounded-xl" />
      </Link>

      <div className="absolute bottom-3 flex justify-between items-center w-full text-xs z-10 h-5 px-2">
        <p className="bg-dark/10 md:hover:bg-dark/20 rounded-md px-1 cursor-pointer">
          {deck.user_id || "WizardsOfTheCoast"}
        </p>
        <p className="text-muted-foreground cursor-default">
          {deck.release_date}
        </p>
      </div>
    </div>
  );
}
