import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabase();

  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { deckId, tags } = body;
  if (!deckId || !Array.isArray(tags)) {
    return NextResponse.json(
      { error: "Missing deckId or tags array" },
      { status: 400 },
    );
  }

  const { data: deckRow, error: deckErr } = await supabase
    .from("decks")
    .select("user_id")
    .eq("id", deckId)
    .single();

  if (deckErr || !deckRow) {
    return NextResponse.json(
      { error: deckErr?.message ?? "Deck not found" },
      { status: 404 },
    );
  }
  if (deckRow.user_id !== user.id) {
    return NextResponse.json(
      { error: "You do not own this deck." },
      { status: 403 },
    );
  }

  const sanitized = tags
    .filter((t: unknown) => typeof t === "string" && (t as string).trim().length > 0)
    .map((t: string) => (t as string).trim());

  const { error: updateErr } = await supabase
    .from("decks")
    .update({ tags: sanitized })
    .eq("id", deckId);

  if (updateErr) {
    return NextResponse.json(
      { error: updateErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ tags: sanitized });
}
