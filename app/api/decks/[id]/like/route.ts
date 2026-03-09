import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/** Toggle like for the current user. Returns { liked: boolean, likeCount: number }. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: deckId } = await params;
  if (!deckId) {
    return NextResponse.json({ error: "Missing deck ID" }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to like decks" }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("deck_likes")
    .select("deck_id")
    .eq("deck_id", deckId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error: delErr } = await supabase
      .from("deck_likes")
      .delete()
      .eq("deck_id", deckId)
      .eq("user_id", user.id);
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }
    const { count } = await supabase
      .from("deck_likes")
      .select("deck_id", { count: "exact", head: true })
      .eq("deck_id", deckId);
    return NextResponse.json({ liked: false, likeCount: count ?? 0 });
  }

  const { error: insErr } = await supabase
    .from("deck_likes")
    .insert({ deck_id: deckId, user_id: user.id });
  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }
  const { count } = await supabase
    .from("deck_likes")
    .select("deck_id", { count: "exact", head: true })
    .eq("deck_id", deckId);
  return NextResponse.json({ liked: true, likeCount: count ?? 0 });
}
