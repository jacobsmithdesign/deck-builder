import { createServerSupabase } from "@/lib/supabase/server"; // ✅ correct
export async function fetchCommanderDecks(page = 0, pageSize = 30) {
  const supabase = await createServerSupabase();

  const offset = page * pageSize;

  const { data, error, count } = await supabase
    .from("decks")
    .select("*", { count: "exact" })
    .eq("type", "Commander Deck") // adjust this if needed
    .is("user_id", null)
    .order("release_date", { ascending: false })
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
