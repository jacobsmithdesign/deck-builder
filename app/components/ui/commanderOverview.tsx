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
import ManaCurve from "./manaCurve";
import ScrollingLabels from "./scrollingLabels";
import Image from "next/image";
import { CommanderSkeleton } from "../commanderSkeleton";

export default function CommanderOverview() {
  const {
    deckDetails,
    commanderCardImage,
    artwork,
    artworkColor,
    flavorText,
    oracleText,
    error,
  } = useCommander();
  const rgbaFrom = artworkColor
    ?.replace("rgb(", "rgba(")
    .replace(")", ", 0.5)");
  const rgbaTo = artworkColor?.replace("rgb(", "rgba(").replace(")", ", 0.2)");
  if (error) {
    return (
      <Card
        className={`mt-8 w-full h-96 md:max-h-96 max-w-7xl md:rounded-3xl rounded-xl flex flex-col text-dark/90 relative overflow-clip justify-center items-center`}
      >
        <p className="text-6xl mb-10 text-dark rotate-90">:(</p>
        <div className="p-2 rounded-xl bg-red-200 text-red-900 font-bold text-lg mb-4 ">
          Could not resolve commander name
        </div>
        <p>
          We could not find the commander you are looking for or one that suits
          your description.
        </p>
      </Card>
    );
  }

  return (
    <Card
      style={
        {
          "--from-color": rgbaFrom ?? "rgba(100, 100, 100,0.25)",
          "--to-color": rgbaTo ?? "rgba(100, 100, 100,0.25)",
        } as React.CSSProperties
      }
      className={`mt-8 w-full h-full md:max-h-96 max-w-7xl md:rounded-3xl rounded-xl flex bg-gradient-to-r from-[var(--from-color)] to-[var(--to-color)] text-dark/90 relative overflow-clip`}
    >
      <div className="w-full h-full relative flex md:p-3 p-2  z-20">
        {commanderCardImage && (
          <img
            src={commanderCardImage ? commanderCardImage : ""}
            width={400}
            className="border object-cover w-64 border-darksecondary rounded-2xl hidden md:block h-full"
          />
        )}
        {deckDetails ? (
          <div className="w-full">
            <CardDescription className="text-lg text-dark/70 h-full">
              <CardContent className="text-dark grid md:grid-cols-2 grid-cols-1 gap-2 p-0 h-full ">
                <CardHeader className="md:px-3 px-0">
                  <div className="md:flex grid grid-cols-3 gap-2 flex-col h-full">
                    <img
                      src={commanderCardImage ? commanderCardImage : ""}
                      width={100}
                      className=" object-contain sm:w-full w-20 sm:h-full h-20 md:rounded-2xl sm:rounded-xl rounded-sm block md:hidden sm:static absolute"
                    />
                    {/* Card with title and oracle text*/}
                    <Card className="sm:col-span-2 col-span-3 sm:ml-0 ml-20 grid grid-cols-1 sm:grid-rows-3 h-full">
                      <div>
                        <CardTitle className="pb-0 flex justify-between items-center bg-light/40 pl-2 pr-1 md:rounded-xl rounded-md col-span-2">
                          <h2 className="font-bold truncate">
                            {deckDetails?.name}
                          </h2>
                          <ManaCost />
                        </CardTitle>
                        <p className="lg:text-lg md:text-sm text-xs text-dark/70 pl-2 pt-1">
                          {deckDetails.type}
                        </p>
                        <div className="lg:h-7 md:h-5 text-center flex mt-2 mb-2">
                          <p className="lg:px-3 px-2 bg-darksecondary/10 md:rounded-lg rounded-md lg:text-lg md:text-sm text-xs text-dark/70">
                            {deckDetails.archetype}
                          </p>
                        </div>
                      </div>

                      {/* Card oracle text for medium displays */}
                      <CardContent className="hidden sm:flex flex-col p-0 row-span-2 bg-light/20 rounded-sm">
                        <div className="p-2 my-auto overflow-scroll flex flex-col md:h-58">
                          {oracleText?.split("\n").map((line, index) => (
                            <p key={index} className="mb-2 lg:text-lg text-sm">
                              {line}
                            </p>
                          ))}
                          <p className="lg:text-lg text-xs italic font-serif my-auto">
                            {flavorText}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    {/* Card oracle text for small displays */}
                    <div className="bg-light/20 p-2 rounded-lg flex flex-col sm:hidden col-span-3">
                      {oracleText?.split("\n").map((line, index) => (
                        <p key={index} className="mb-2 md:text-lg text-xs">
                          {line}
                        </p>
                      ))}
                      <p className="md:text-lg text-xs italic font-serif my-auto">
                        {flavorText}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                {/* Overview panel with pemanent types, strengths and weaknesses */}
                <div className="">
                  <CardTitle className="font-bold text-dark">
                    Deck Overview
                  </CardTitle>
                  <CardContent className="grid grid-cols-2 gap-1 text-dark p-0 pt-3">
                    <Spell>
                      <SpellType>Lands:</SpellType>
                      <SpellCount>{deckDetails.land}</SpellCount>
                    </Spell>
                    <Spell>
                      <SpellType>Creatures:</SpellType>
                      <SpellCount>{deckDetails.creature}</SpellCount>
                    </Spell>
                    <Spell>
                      <SpellType>Artifacts:</SpellType>
                      <SpellCount>{deckDetails.artifact}</SpellCount>
                    </Spell>
                    <Spell>
                      <SpellType>Enchantments:</SpellType>
                      <SpellCount>{deckDetails.enchantment}</SpellCount>
                    </Spell>
                    <Spell>
                      <SpellType>Sorceries:</SpellType>
                      <SpellCount>{deckDetails.sorcery}</SpellCount>
                    </Spell>
                    <Spell>
                      <SpellType>Instants:</SpellType>
                      <SpellCount>{deckDetails.instant}</SpellCount>
                    </Spell>
                    <Spell>
                      <SpellType>Planeswalkers:</SpellType>
                      <SpellCount>{deckDetails.planeswalker}</SpellCount>
                    </Spell>
                    <Spell>
                      <SpellType className="text-dark/50">Mana Curve</SpellType>
                      <ManaCurve data={deckDetails.manaCurve} />
                    </Spell>
                  </CardContent>
                  {/* Strengths and Weaknesses */}
                  <div className="pt-2 flex lg:text-lg md:text-md text-sm font-bold flex-col">
                    <p>Strengths:</p>
                    <ScrollingLabels>
                      {deckDetails.strengths.map((strength, index) => (
                        <Strength
                          key={index}
                          className="mx-1 font-normal whitespace-nowrap"
                        >
                          {strength}
                        </Strength>
                      ))}
                    </ScrollingLabels>

                    <p>Weaknesses:</p>
                    <ScrollingLabels>
                      {deckDetails.weaknesses.map((weakness, index) => (
                        <Weakeness
                          key={index}
                          className="mx-1 font-normal whitespace-nowrap"
                        >
                          {weakness}
                        </Weakeness>
                      ))}
                    </ScrollingLabels>
                  </div>
                </div>
              </CardContent>
            </CardDescription>
          </div>
        ) : (
          <CommanderSkeleton />
        )}
      </div>
      <div className="absolute w-full h-full items-center flex">
        <div className="absolute backdrop-blur-3xl w-full h-full z-10"></div>
        {artwork && (
          <img
            src={`${artwork ? artwork : null}`}
            alt="Commander Card Background Blur"
            className="object-cover w-96 h-full rounded-2xl hidden md:block absolute z-0 opacity-40 p-4"
          />
        )}
      </div>
    </Card>
  );
}
