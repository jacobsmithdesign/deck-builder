import { lookupCardsByName } from "@/lib/db/lookupCardsByName";

export type CardLine = {
  count: number;
  name: string;
  uuid?: string;
  type?: string;
};

export async function parseDeckText(deckText: string): Promise<CardLine[]> {
  const lines = deckText.split(/\r?\n/);
  const cardLines: CardLine[] = [];
  const cards: string[] = [];

  const lineRegex = /^\s*(\d+)(?:x)?\s+(.+)$/i;

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) continue; // skip blank
    if (trimmed.startsWith("---")) continue; // skip dividers
    if (/^(Sideboard|Commander|Decklist|Cards|Deck|Main deck)$/i.test(trimmed))
      continue; // skip headers

    const m = trimmed.match(lineRegex);
    if (!m) continue; // could be a header, e.g. “Sideboard” – skip

    const count = parseInt(m[1], 10);
    const name = m[2].trim();

    cardLines.push({ count, name });
    cards.push(name);
  }
  const cardLookup = await lookupCardsByName(cards);
  const resolved = cardLines
    .map((line) => {
      const matches = cardLookup[line.name.toLowerCase()];
      if (matches && matches.length > 0) {
        return {
          ...line,
          name: matches[0].name,
          uuid: matches[0].uuid,
          type: matches[0].type,
        };
      }
      return null; // no match
    })
    .filter(Boolean); // remove null entries
  console.log(resolved);
  if (resolved.length === 0) {
    return null;
  }
  return resolved;
}
