import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export type DeckComment = {
  id: string;
  deck_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author?: { username: string | null } | null;
};

/** List comments for a deck, with author username. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: deckId } = await params;
  if (!deckId) {
    return NextResponse.json({ error: "Missing deck ID" }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  const { data: rows, error } = await supabase
    .from("deck_comments")
    .select("id, deck_id, user_id, body, created_at")
    .eq("deck_id", deckId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const commentsList = (rows ?? []) as {
    id: string;
    deck_id: string;
    user_id: string;
    body: string;
    created_at: string;
  }[];
  const userIds = [...new Set(commentsList.map((c) => c.user_id))];
  const profilesMap: Record<string, { username: string | null }> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      profilesMap[p.id] = { username: p.username ?? null };
    }
  }

  const comments: DeckComment[] = commentsList.map((row) => ({
    id: row.id,
    deck_id: row.deck_id,
    user_id: row.user_id,
    body: row.body,
    created_at: row.created_at,
    author: profilesMap[row.user_id] ?? null,
  }));

  return NextResponse.json({ comments });
}

/** Add a comment. Auth required. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: deckId } = await params;
  if (!deckId) {
    return NextResponse.json({ error: "Missing deck ID" }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to comment" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { body: commentBody } = body;
  const trimmed = typeof commentBody === "string" ? commentBody.trim() : "";
  if (!trimmed) {
    return NextResponse.json(
      { error: "Comment body is required" },
      { status: 400 }
    );
  }

  const { data: inserted, error } = await supabase
    .from("deck_comments")
    .insert({
      deck_id: deckId,
      user_id: user.id,
      body: trimmed.slice(0, 2000),
    })
    .select("id, deck_id, user_id, body, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    comment: {
      id: inserted.id,
      deck_id: inserted.deck_id,
      user_id: inserted.user_id,
      body: inserted.body,
      created_at: inserted.created_at,
      author: null,
    },
  });
}
