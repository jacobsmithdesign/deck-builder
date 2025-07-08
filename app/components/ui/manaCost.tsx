import { useCommander } from "@/app/context/CommanderContext";
import { useEffect, useState } from "react";

export const ManaCost = () => {
  const { commanderCard } = useCommander();
  const [manaCostString, setManaCostString] = useState<string | null>();

  useEffect(() => {
    if (commanderCard) {
      setManaCostString(commanderCard.manaCost);
      console.log(manaCostString);
    }
  }, [commanderCard]);
  const manaSymbols = manaCostString
    ?.match(/\{([^}]+)\}/g)
    ?.map((s) => s.replace(/[{}]/g, ""));

  return (
    <div className="flex gap-1 items-center text-sm p-1 rounded-full ">
      {manaSymbols?.map((symbol, index) => {
        if (!isNaN(Number(symbol))) {
          return (
            <div
              key={index}
              className="sm:w-5 sm:h-5 w-4 h-4 rounded-full bg-manaAny flex items-center justify-center text-dark font-normal  text-xs sm:text-sm"
            >
              {symbol}
            </div>
          );
        } else {
          let color = "";
          switch (symbol.toUpperCase()) {
            case "W":
              color = "bg-manaWhite border border-yellow-400";
              break;
            case "U":
              color = "bg-manaBlue border border-cyan-600/60";
              break;
            case "B":
              color = "bg-manaBlack border border-zinc-700/60";
              break;
            case "R":
              color = "bg-manaRed border border-amber-700/60";
              break;
            case "G":
              color = "bg-manaGreen border border-lime-600/60";
              break;
            default:
              color = "bg-gray-500/80 border border-gray-700/60";
          }

          return (
            <div
              key={index}
              className={`sm:w-5 sm:h-5 w-4 h-4 rounded-full ${color} flex items-center bg- justify-center text-white font-bold`}
            ></div>
          );
        }
      })}
    </div>
  );
};
