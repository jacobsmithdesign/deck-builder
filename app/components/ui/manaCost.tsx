type ManaSize = "sm" | "md" | "lg" | "xl";

interface ManaCostProps {
  manaCost?: string | null; // e.g. "{2}{W}{U}"
  colorIdentity?: string[] | null; // e.g. ["G", "W"]
  size?: ManaSize;
}

const SIZE_CLASSES: Record<ManaSize, string> = {
  sm: "h-3 w-3 min-w-[0.75rem]",
  md: "h-4 w-4 min-w-[1rem]",
  lg: "h-5 w-5 min-w-[1.25rem]",
  xl: "h-6 w-6 min-w-[1.5rem]",
};

/**
 * Resolve public path for a mana symbol to match card-symbols file naming:
 * - Numbers (0–20) and X, Y, Z: "3.svg", "X.svg"
 * - Everything else (W, U, B, R, G, C, 1/W, W/P, 1/2, S, T, etc.): "{W}.svg", "{1/W}.svg"
 */
function getManaIconPath(symbol: string): string {
  const isNumeric = /^\d+$/.test(symbol);
  const isGeneric = ["X", "Y", "Z"].includes(symbol.toUpperCase());
  if (isNumeric || isGeneric) {
    const name = isGeneric ? symbol.toUpperCase() : symbol;
    return `/card-symbols/${name}.svg`;
  }
  return `/card-symbols/{${symbol}}.svg`;
}

export const ManaCost: React.FC<ManaCostProps> = ({
  manaCost,
  colorIdentity,
  size = "md",
}) => {
  let symbols: string[] | undefined;

  if (manaCost) {
    symbols = manaCost
      ?.match(/\{([^}]+)\}/g)
      ?.map((s) => s.replace(/[{}]/g, ""));
  } else if (colorIdentity && colorIdentity.length > 0) {
    symbols = [...colorIdentity];
  }

  if (!symbols) return null;

  const sizeClass = SIZE_CLASSES[size];

  return (
    <div className="flex gap-0.5 items-center shrink-0 ">
      {symbols.map((symbol, index) => {
        const src = getManaIconPath(symbol);
        return (
          <img
            key={`${symbol}-${index}`}
            src={src}
            alt={symbol}
            className={`object-contain object-center drop-shadow-sm ${sizeClass}`}
            width={
              size === "sm" ? 12 : size === "md" ? 16 : size === "lg" ? 20 : 24
            }
            height={
              size === "sm" ? 12 : size === "md" ? 16 : size === "lg" ? 20 : 24
            }
          />
        );
      })}
    </div>
  );
};
