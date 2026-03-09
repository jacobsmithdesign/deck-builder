import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeCardName } from "./normalizeCardName";
import type { CardPreview } from "./types";

const CARDS_SELECT =
  "uuid, name, identifiers, edhrec_rank";

/**
 * Server-side batch resolver: given card names, returns a map from
 * normalised name (lowercase, trimmed) to CardPreview (uuid, name, imageFrontUrl).
 * When multiple printings match a name, the one with the best (lowest) edhrec_rank
 * is chosen so the most popular print is shown. No per-hover lookups—call before render.
 *
 * @param supabase - Server Supabase instance (e.g. from createServerSupabase())
 * @param names - Raw card names as they appear in [[Card Name]]
 */
export async function resolveCardReferences(
  supabase: SupabaseClient,
  names: string[],
): Promise<Record<string, CardPreview>> {
  const uniqueNormalized = [...new Set(names.map(normalizeCardName).filter(Boolean))];
  if (uniqueNormalized.length === 0) return {};

  const { data: rows, error } = await supabase.rpc("idx_cards_lower_name", {
    lower_names: uniqueNormalized,
  });

  if (error) {
    console.error("resolveCardReferences idx_cards_lower_name:", error.message);
    return {};
  }

  // Collect all uuids per normalised name (multiple prints can match)
  const nameToUuids: Record<string, string[]> = {};
  for (const row of rows ?? []) {
    const key = (row.name ?? "").toLowerCase();
    if (!key) continue;
    if (!nameToUuids[key]) nameToUuids[key] = [];
    nameToUuids[key].push(row.uuid);
  }

  const allUuids = [...new Set(Object.values(nameToUuids).flat())];
  if (allUuids.length === 0) return {};

  const BATCH = 150;
  type Row = {
    uuid: string;
    name: string | null;
    identifiers: Record<string, string> | null;
    edhrec_rank: number | null;
  };
  const results: Row[] = [];

  for (let i = 0; i < allUuids.length; i += BATCH) {
    const chunk = allUuids.slice(i, i + BATCH);
    const { data, error: selectError } = await supabase
      .from("cards")
      .select(CARDS_SELECT)
      .in("uuid", chunk);

    if (selectError) {
      console.error("resolveCardReferences select cards:", selectError.message);
      continue;
    }
    results.push(...(data ?? []));
  }

  const uuidToRow = new Map(results.map((r) => [r.uuid, r]));

  // For each name, pick the card with the best (lowest) edhrec_rank; null = worst
  const out: Record<string, CardPreview> = {};
  for (const norm of uniqueNormalized) {
    const uuids = nameToUuids[norm];
    if (!uuids?.length) continue;
    let best: Row | null = null;
    let bestRank = Infinity;
    for (const uuid of uuids) {
      const row = uuidToRow.get(uuid);
      if (!row) continue;
      const rank = row.edhrec_rank ?? Infinity;
      if (rank < bestRank) {
        bestRank = rank;
        best = row;
      }
    }
    if (best) {
      out[norm] = {
        uuid: best.uuid,
        name: best.name ?? "",
        imageFrontUrl: buildImageUrl(best.identifiers),
      };
    }
  }
  return out;
}

function buildImageUrl(identifiers: Record<string, string> | null): string | null {
  const id = identifiers?.scryfallId;
  if (!id) return null;
  return `https://cards.scryfall.io/normal/front/${id[0]}/${id[1]}/${id}.jpg`;
}
