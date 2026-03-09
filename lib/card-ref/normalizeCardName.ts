/**
 * Normalises a card name for indexed lookup.
 * - Trims and collapses internal whitespace to a single space.
 * - Lowercases for case-insensitive matching against the card database.
 */
export function normalizeCardName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}
