import { supabase } from "@/lib/supabase/client";

const LOOKUP_BATCH_SIZE = 100;

type CardInfo = { uuid: string; name: string; type: string };

export async function lookupCardsByName(names: string[]): Promise<Record<string, CardInfo[]>> {
  const lowerNames = names.map((n) => n.toLowerCase());
  const matches: Record<string, CardInfo[]> = {};

  for (let i = 0; i < lowerNames.length; i += LOOKUP_BATCH_SIZE) {
    const chunk = lowerNames.slice(i, i + LOOKUP_BATCH_SIZE);
    const { data, error } = await supabase.rpc("idx_cards_lower_name", {
      lower_names: chunk,
    });

    if (error) throw error;

    for (const row of data ?? []) {
      const key = (row.name ?? "").toLowerCase();
      if (!key) continue;
      matches[key] ??= [];
      matches[key].push({
        uuid: row.uuid,
        name: row.name,
        type: row.type,
      });
    }
  }
  return matches;
}
