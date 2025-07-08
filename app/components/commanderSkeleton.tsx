import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { ManaCost } from "./ui/manaCost";
import {
  Spell,
  SpellCount,
  SpellType,
  Strength,
  Weakeness,
} from "./ui/overviewButtons";
import ManaCurve from "./ui/manaCurve";
import ScrollingLabels from "./ui/scrollingLabels";
export const CommanderSkeleton = () => {
  return (
    <div className="w-full">
      <CardDescription className="text-lg text-dark/70 h-full">
        <CardContent className="text-dark grid md:grid-cols-2 grid-cols-1 gap-2 p-0 h-full ">
          <CardHeader className="md:px-3 px-0">
            <div className="md:flex grid grid-cols-3 gap-2 flex-col h-full">
              {/* Image Skeleton */}
              <div className="object-contain sm:w-full w-20 sm:h-full h-20 md:rounded-2xl sm:rounded-xl rounded-sm block md:hidden sm:static absolute" />
              {/* Card with title and oracle text Skeleton*/}
              <Card className="sm:col-span-2 col-span-3 sm:ml-0 ml-20 grid grid-cols-1 sm:grid-rows-3 h-full">
                <div>
                  <CardTitle className="pb-0 flex justify-between items-center bg-light/40 pl-2 pr-1 md:rounded-xl rounded-md col-span-2">
                    <h1 className="font-bold truncate">Loading...</h1>

                    <ManaCost />
                  </CardTitle>
                  <p className="lg:text-lg md:text-sm text-xs text-dark/70 pl-2 pt-1">
                    Loading...
                  </p>
                  <div className="lg:h-7 md:h-5 text-center flex mt-2 mb-2">
                    <p className="lg:px-3 px-2 bg-darksecondary/10 md:rounded-lg rounded-md lg:text-lg md:text-sm text-xs text-dark/70">
                      Loading...
                    </p>
                  </div>
                </div>

                {/* Card oracle text for medium displays */}
                <CardContent className="hidden sm:flex flex-col p-0 row-span-2 bg-light/20 rounded-sm">
                  <div className="p-2 my-auto overflow-scroll flex flex-col md:h-58"></div>
                </CardContent>
              </Card>
              {/* Card oracle text for small displays */}
              <div className="bg-light/20 p-2 rounded-lg flex flex-col sm:hidden col-span-3"></div>
            </div>
          </CardHeader>
          {/* Overview panel with pemanent types, strengths and weaknesses */}
          <div className="">
            <CardTitle className="font-bold text-dark">Deck Overview</CardTitle>
            <CardContent className="grid grid-cols-2 gap-1 text-dark p-0 pt-3">
              <Spell>
                <SpellType>Lands:</SpellType>
                <SpellCount></SpellCount>
              </Spell>
              <Spell>
                <SpellType>Creatures:</SpellType>
                <SpellCount></SpellCount>
              </Spell>
              <Spell>
                <SpellType>Artifacts:</SpellType>
                <SpellCount></SpellCount>
              </Spell>
              <Spell>
                <SpellType>Enchantments:</SpellType>
                <SpellCount></SpellCount>
              </Spell>
              <Spell>
                <SpellType>Sorceries:</SpellType>
                <SpellCount></SpellCount>
              </Spell>
              <Spell>
                <SpellType>Instants:</SpellType>
                <SpellCount></SpellCount>
              </Spell>
              <Spell>
                <SpellType>Planeswalkers:</SpellType>
                <SpellCount></SpellCount>
              </Spell>
              <Spell>
                <SpellType className="text-dark/50">Mana Curve</SpellType>
              </Spell>
            </CardContent>
            {/* Strengths and Weaknesses */}
            <div className="pt-2 flex lg:text-lg md:text-base text-sm font-bold flex-col">
              <p>Strengths:</p>
              <ScrollingLabels>
                <div className="w-10">Loading...</div>
              </ScrollingLabels>

              <p>Weaknesses:</p>
              <ScrollingLabels>
                <div className="w-10">Loading...</div>
              </ScrollingLabels>
            </div>
          </div>
        </CardContent>
      </CardDescription>
    </div>
  );
};
