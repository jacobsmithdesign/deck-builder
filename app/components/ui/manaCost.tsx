interface ManaCostProps {
  manaCost?: string | null; // e.g. "{2}{W}{U}"
  colorIdentity?: string[] | null; // e.g. ["G", "W"]
}

export const ManaCost: React.FC<ManaCostProps> = ({
  manaCost,
  colorIdentity,
}) => {
  let symbols: string[] | undefined;

  if (manaCost) {
    // Extract mana symbols from the cost string
    symbols = manaCost
      ?.match(/\{([^}]+)\}/g)
      ?.map((s) => s.replace(/[{}]/g, ""));
  } else if (colorIdentity && colorIdentity.length > 0) {
    // Use colour identity directly
    symbols = [...colorIdentity];
  }

  if (!symbols) return null;

  return (
    <div className="flex gap-1 items-center text-sm rounded-full">
      {symbols.map((symbol, index) => {
        if (!isNaN(Number(symbol))) {
          // Numeric cost
          return (
            <div
              key={`${symbol}-${index}`}
              className="sm:w-5 sm:h-5 w-4 h-4 rounded-full bg-manaAny flex items-center justify-center text-dark font-normal text-xs sm:text-sm"
            >
              {symbol}
            </div>
          );
        } else {
          // Coloured mana
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
              key={`${symbol}-${index}`}
              className={`sm:w-5 sm:h-5 w-4 h-4 rounded-full ${color} flex items-center justify-center text-white font-bold`}
            ></div>
          );
        }
      })}
    </div>
  );
};
