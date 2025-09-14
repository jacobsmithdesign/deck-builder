// lib/db/archetypeOverview.ts
import { createServerSupabase } from "@/lib/supabase/server";

export type ArchetypeOverviewRow = {
  deck_id: string;
  axes: Record<string, number>;
  explanation_md: Record<string, string>;
  description: string;
  updated_at: string | null;
};

export async function getArchetypeOverview(deckId: string) {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("deck_archetype_overview")
    .select(
      "deck_id, archetypes, axes, explanation_md, description, updated_at"
    )
    .eq("deck_id", deckId)
    .maybeSingle<ArchetypeOverviewRow>();

  if (error) throw new Error(error.message);
  return data; // may be null if no row yet
}
