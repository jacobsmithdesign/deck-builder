import { createServerSupabase } from "@/lib/supabase/server";
export async function fetchCommanderDecks(page = 0, pageSize = 30) {
  const supabase = await createServerSupabase();

  const offset = page * pageSize;

  const { data, error, count } = await supabase
    .from("decks")
    .select(
      `id,
      code,
      name,
      type,
      user_id,
      release_date,
      sealed_product,
      is_public,
      original_deck_id,
      commander_uuid,
      display_card_uuid,
      tagline,

      commander:commander_uuid (
        name,
        color_identity,
        identifiers
      ),

      sets:code (
      code,
      name,
      release_date, 
      type
      ),

      deck_ai_strengths_weaknesses (strengths, weaknesses),
      
      deck_ai_difficulty (
        power_level,
        power_level_explanation,
        complexity,
        complexity_explanation,
        pilot_skill,
        pilot_skill_explanation,
        interaction_intensity,
        interaction_explanation,
        updated_at
      ),
      deck_archetype_overview(axes, description)`,
      { count: "exact" }
    )
    .eq("type", "Commander Deck") // adjust this if needed
    .is("user_id", null)
    .order("release_date", { ascending: false })
    .order("id", { ascending: true })
    .range(offset, offset + pageSize - 1);

  console.log("📦 deck fetch result:", {
    count,
    dataType: typeof data,
    dataLength: data?.length,
    firstRow: data?.[3],
    error,
  });
  if (error) throw new Error(error.message);

  return {
    data,
    hasMore: count ? offset + pageSize < count : false,
  };
}
