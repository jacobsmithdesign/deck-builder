// app/api/supabase/decks/save/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();

  // auth
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // payload
  const { deckId, cards } = await req.json().catch(() => ({}));
  console.log(cards);
  if (!deckId || !Array.isArray(cards)) {
    return NextResponse.json(
      { error: "Missing deckId or cards[]" },
      { status: 400 }
    );
  }

  // ownership check
  const { data: deckRow, error: deckErr } = await supabase
    .from("decks")
    .select("user_id")
    .eq("id", deckId)
    .single();

  if (deckErr || !deckRow) {
    return NextResponse.json(
      { error: deckErr?.message || "Deck not found" },
      { status: 404 }
    );
  }
  if (deckRow.user_id !== user.id) {
    return NextResponse.json(
      { error: "You do not own this deck." },
      { status: 403 }
    );
  }

  // build rows
  const rows = cards.map((c: any) => ({
    deck_id: deckId,
    card_uuid: c.uuid,
    count: c.count,
    board_section: c.board_section ?? "mainboard",
  }));
  console.log("rows to save", rows);

  // delete old + insert new
  //   const { error: delErr } = await supabase
  //     .from("deck_cards")
  //     .delete()
  //     .eq("deck_id", deckId);
  //   if (delErr) {
  //     return NextResponse.json({ error: delErr.message }, { status: 500 });
  //   }

  //   if (rows.length) {
  //     const { error: insErr } = await supabase.from("deck_cards").insert(rows);
  //     if (insErr) {
  //       return NextResponse.json({ error: insErr.message }, { status: 500 });
  //     }
  //   }

  return NextResponse.json({ ok: true, deckId, savedCount: rows.length });
}
