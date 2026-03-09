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
  const { deckId, name, description } = body;
  if (!deckId) {
    return NextResponse.json(
      { error: "Missing deckId" },
      { status: 400 },
    );
  }
  if (name === undefined && description === undefined) {
    return NextResponse.json(
      { error: "Provide at least one of name or description" },
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

  const payload: { name?: string; description?: string | null } = {};
  if (typeof name === "string") payload.name = name.trim();
  if (description !== undefined) payload.description = description === null || description === "" ? null : String(description).trim();

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const { error: updateErr } = await supabase
    .from("decks")
    .update(payload)
    .eq("id", deckId);

  if (updateErr) {
    return NextResponse.json(
      { error: updateErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, ...payload });
}
