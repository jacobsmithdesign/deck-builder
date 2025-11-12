import { supabase } from "@/lib/supabase/client";

type CardInfo = { uuid: string; name: string; type: string };

export async function lookupCardsByName(names: string[]) {
  const lowerNames = names.map((n) => n.toLowerCase());

  const { data, error } = await supabase.rpc("idx_cards_lower_name", {
    lower_names: lowerNames,
  });

  if (error) throw error;

  const matches: Record<string, CardInfo[]> = {};

  for (const row of data) {
    const key = row.name.toLowerCase();
    matches[key] ??= [];
    matches[key].push({
      uuid: row.uuid,
      name: row.name,
      type: row.type,
    });
  }
  return matches;
}
