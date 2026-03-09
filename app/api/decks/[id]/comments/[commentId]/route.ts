import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/** Delete a comment. Allowed if current user is comment author OR deck owner. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id: deckId, commentId } = await params;
  if (!deckId || !commentId) {
    return NextResponse.json(
      { error: "Missing deck ID or comment ID" },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to delete comments" }, { status: 401 });
  }

  const { data: comment, error: commentErr } = await supabase
    .from("deck_comments")
    .select("id, user_id")
    .eq("id", commentId)
    .eq("deck_id", deckId)
    .single();

  if (commentErr || !comment) {
    return NextResponse.json(
      { error: commentErr?.message ?? "Comment not found" },
      { status: 404 }
    );
  }

  const { data: deck } = await supabase
    .from("decks")
    .select("user_id")
    .eq("id", deckId)
    .single();

  const isCommentAuthor = comment.user_id === user.id;
  const isDeckOwner = !!deck?.user_id && deck.user_id === user.id;

  if (!isCommentAuthor && !isDeckOwner) {
    return NextResponse.json(
      { error: "You can only delete your own comments or comments on your deck" },
      { status: 403 }
    );
  }

  const { error: deleteErr } = await supabase
    .from("deck_comments")
    .delete()
    .eq("id", commentId)
    .eq("deck_id", deckId);

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
