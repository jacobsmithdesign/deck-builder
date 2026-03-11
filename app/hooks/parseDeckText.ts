import { lookupCardsByName } from "@/lib/db/lookupCardsByName";
import { selectCardsDataFromIds } from "@/lib/db/searchCardForDeck";
import type { CardRecord } from "@/lib/schemas";

export type CardLine = {
  count: number;
  name: string;
  uuid?: string;
  type?: string;
};

/** One resolved line from a pasted deck list, with full card data available via recordsByUuid. */
export type ResolvedDeckLine = {
  uuid: string;
  count: number;
  name: string;
  type?: string;
};

export type ParseAndResolveResult = {
  lines: ResolvedDeckLine[];
  recordsByUuid: Map<string, CardRecord>;
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
  if (resolved.length === 0) {
    return null;
  }
  return resolved;
}

/**
 * Parse deck list text and resolve every line to full card data by UUID.
 * Use this for any import flow (compare deck, new deck, add-to-deck) so all
 * lines are preserved and no name-based deduping drops cards.
 */
export async function parseAndResolveDeckList(
  deckText: string,
): Promise<ParseAndResolveResult | null> {
  const result = await parseDeckText(deckText);
  if (!result || result.length === 0) return null;

  const uuids = result
    .map((r) => r.uuid)
    .filter((id): id is string => !!id);
  const recordsByUuid = await selectCardsDataFromIds(uuids);

  const lines: ResolvedDeckLine[] = result
    .filter((line): line is CardLine & { uuid: string } => !!line.uuid && recordsByUuid.has(line.uuid))
    .map((line) => ({
      uuid: line.uuid!,
      count: line.count ?? 1,
      name: line.name,
      type: line.type,
    }));

  if (lines.length === 0) return null;
  return { lines, recordsByUuid };
}
