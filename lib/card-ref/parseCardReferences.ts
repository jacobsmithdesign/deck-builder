/**
 * Parses text for explicit card references in the form [[Card Name]].
 * Single square brackets are not treated as references.
 */

export type Segment =
  | { type: "text"; value: string }
  | { type: "ref"; rawName: string };

const CARD_REF_REGEX = /\[\[([^\]]+)\]\]/g;

/**
 * Splits text into segments of plain text and card references.
 * Only [[...]] is matched; [...] is left as plain text.
 */
export function parseCardReferences(text: string): Segment[] {
  if (!text || typeof text !== "string") return [{ type: "text", value: text || "" }];

  const segments: Segment[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  CARD_REF_REGEX.lastIndex = 0;
  while ((m = CARD_REF_REGEX.exec(text)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, m.index) });
    }
    segments.push({ type: "ref", rawName: m[1].trim() });
    lastIndex = m.index + m[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments.length ? segments : [{ type: "text", value: text }];
}

/**
 * Returns the list of unique raw card names found in text (as in [[Card Name]]).
 */
export function extractCardReferenceNames(text: string): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;

  CARD_REF_REGEX.lastIndex = 0;
  while ((m = CARD_REF_REGEX.exec(text)) !== null) {
    const raw = m[1].trim();
    if (raw && !seen.has(raw)) {
      seen.add(raw);
      names.push(raw);
    }
  }
  return names;
}
