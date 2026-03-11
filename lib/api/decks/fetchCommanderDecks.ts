import { createServerSupabase } from "@/lib/supabase/server";

export type FetchCommanderDecksOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  includeUserDecks?: boolean;
};

export async function fetchCommanderDecks(
  page = 0,
  pageSize = 30,
  options: FetchCommanderDecksOptions = {},
) {
  const { search, includeUserDecks = false } = options;
  const supabase = await createServerSupabase();

  const offset = page * pageSize;

  let query = supabase
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
      { count: "exact" },
    )
    .eq("type", "Commander Deck");

  if (!includeUserDecks) {
    query = query.is("user_id", null);
  }

  const trimmed = search?.trim();

  if (trimmed && trimmed.length > 0) {
    // Use RPC so search text (spaces, commas, etc.) is passed as a single parameter
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "search_commander_decks",
      {
        p_search: trimmed,
        p_include_user_decks: includeUserDecks,
        p_offset: offset,
        p_limit: pageSize,
      },
    );
    if (rpcError) throw new Error(rpcError.message);
    const result = rpcData as {
      deck_ids: string[] | null;
      total_count: number;
    } | null;
    const deckIds = result?.deck_ids ?? [];
    const totalCount = result?.total_count ?? 0;
    if (deckIds.length === 0) {
      return { data: [], hasMore: false };
    }
    const { data: rows, error } = await supabase
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
      )
      .in("id", deckIds);
    if (error) throw new Error(error.message);
    const order = new Map(deckIds.map((id, i) => [id, i]));
    const data = (rows ?? []).sort(
      (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
    );
    return {
      data,
      hasMore: offset + pageSize < totalCount,
    };
  }

  const { data, error, count } = await query
    .order("release_date", { ascending: false })
    .order("id", { ascending: true })
    .range(offset, offset + pageSize - 1);

  if (error) throw new Error(error.message);

  return {
    data,
    hasMore: count ? offset + pageSize < count : false,
  };
}
