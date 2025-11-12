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
      tagline, ai_rank, ai_strengths, ai_weaknesses, ai_generated_at, ai_power_level, ai_complexity, ai_pilot_skill, ai_interaction,
      commander:commander_uuid (
        name,
        color_identity,
        identifiers
      )`,
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
    firstRow: data?.[0],
    error,
  });
  if (error) throw new Error(error.message);

  return {
    data,
    hasMore: count ? offset + pageSize < count : false,
  };
}
