import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type CardFilter = {
  colorIdentity?: string[]; // e.g. ["W", "G"]
  type?: string; // e.g. "Creature"
  manaCost?: number;
  rarity?: string; // e.g. "Rare"
  keywords?: string[]; // e.g. ["Flying", "Lifelink"]
  groupBy?: "rarity" | "manaCost" | "keywords" | "type"; // Grouping preference
};

export const filterAndGroupCards = (
  cards: any[],
  groupBy: CardFilter["groupBy"]
) => {
  const grouped: Record<string, any[]> = {};

  for (const card of cards) {
    let groupKey = "Other";

    switch (groupBy) {
      case "rarity":
        groupKey = card.rarity || "Unknown";
        break;
      case "manaCost":
        groupKey = card.mana_value?.toString() || "X";
        break;
      case "keywords":
        groupKey = card.keywords?.[0] || "None"; // or allow multiple groups?
        break;
      case "type":
      default:
        groupKey = card.type || "Other";
    }

    if (!grouped[groupKey]) grouped[groupKey] = [];
    grouped[groupKey].push(card);
  }

  return Object.entries(grouped).map(([type, cards]) => ({
    type,
    cards,
  }));
};

// Table for filters used in card search
export const filterConfigByCardType: Record<
  string,
  Record<string, { label: string; options: string[]; isSingle?: boolean }>
> = {
  Creature: {
    colorIdentity: {
      label: "Colours",
      options: ["W", "U", "B", "R", "G"],
    },
    rarity: {
      label: "Rarity",
      options: ["common", "uncommon", "rare", "mythic"],
      isSingle: true,
    },
    keywords: {
      label: "Keywords",
      options: ["Flying", "Lifelink", "Trample", "Haste"],
    },
  },
  Land: {
    colorIdentity: {
      label: "Colours",
      options: ["W", "U", "B", "R", "G"],
    },
    rarity: {
      label: "Rarity",
      options: ["common", "uncommon", "rare", "mythic"],
      isSingle: true,
    },
    landType: {
      label: "Land Type",
      options: ["Basic", "Nonbasic", "Dual", "Shock", "Fetch"],
    },
  },
  Enchantment: {
    colorIdentity: {
      label: "Colours",
      options: ["W", "U", "B", "R", "G"],
    },
    keywords: {
      label: "Keywords",
      options: ["Aura", "Saga", "Curse"],
    },
  },
  // Add more types as needed...
};
