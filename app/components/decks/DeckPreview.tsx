import { CommanderDeckRecord, DeckRecord } from "@/lib/schemas";
import Image from "next/image";
import { DeckMetrics } from "./DeckMetrics";
import { ManaCost } from "../ui/manaCost";
import { useState } from "react";
import { scryfallIdToUrls } from "@/lib/ScryfallIdToUrls";
import Link from "next/link";
import { ChevronUp } from "lucide-react";

export default function DeckPreview({ deck }: { deck: CommanderDeckRecord }) {
  const [openPanel, setOpenPanel] = useState(false);

  const scryfallId = deck.commander.identifiers.scryfallId ?? null;
  const [front, back, artwork] = scryfallIdToUrls(scryfallId);
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
          <ManaCost colorIdentity={deck.commander.color_identity} />
        </div>
      )}

      {/* Bottom card detail: title, creator, AI tags, release date */}
      <div className="mb-9 absolute w-full p-2 bottom-0">
        <div
          className={`relative w-full p-2 z-10 rounded-lg shadow bg-gradient-to-b from-light to-light/60 transition-all ease-out duration-250 overflow-clip text-left ${
            openPanel ? "h-59 backdrop-blur-sm" : "h-17 bg-light"
          } `}
        >
          <button
            className="px-1 mb-1 font-bold text-md w-full overflow-hidden bg-dark/10 md:hover:bg-dark/20 rounded flex justify-between cursor-pointer transition-all"
            onClick={() => setOpenPanel(!openPanel)}
          >
            <h3 className="text-left truncate flex-1">{deck.name}</h3>
            <ChevronUp
              className={`${openPanel && "rotate-180"} transition-all`}
            />
          </button>
          {/* Hidden deck details */}
          {openPanel && (
            <div className="flex flex-col h-full mb-8 gap-1 rounded px-1">
              <p className="text-sm">
                {deck.tagline || "No tagline available"}
              </p>
              <div className="flex flex-wrap gap-1 text-sm">
                Strengths:
                {deck.ai_strengths?.map((strength) => (
                  <div className="bg-green-300/40 w-fit px-1 text-sm rounded">
                    {strength}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1 text-sm">
                Weaknesses:
                {deck.ai_weaknesses?.map((weakeness) => (
                  <div className="bg-red-300/40 w-fit px-1 text-sm rounded">
                    {weakeness}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* AI Ranks */}
          <div className="absolute bottom-0 pb-2">
            <DeckMetrics deck={deck} />
          </div>
        </div>
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
