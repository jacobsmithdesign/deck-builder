import { CardRecord } from "@/lib/schemas";

export function getScryfallUrl({ scryfallId }: { scryfallId?: string }) {
  return scryfallId
    ? `https://cards.scryfall.io/normal/front/${scryfallId[0]}/${scryfallId[1]}/${scryfallId}.jpg`
    : "";
}
