import { createServerSupabase } from "@/lib/supabase/server";

export async function fetchUserCommanderDecks(
  userId: string,
  page = 0,
  pageSize = 30
) {
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
    .eq("type", "Commander Deck")
    .eq("user_id", userId)
    .order("release_date", { ascending: false })
    .order("id", { ascending: true })
    .range(offset, offset + pageSize - 1);

  if (error) throw new Error(error.message);

  return {
    data,
    hasMore: count ? offset + pageSize < count : false,
  };
}
