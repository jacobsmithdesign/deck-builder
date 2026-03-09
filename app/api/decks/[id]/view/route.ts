import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/** Increment deck view_count. No auth required. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: deckId } = await params;
  if (!deckId) {
    return NextResponse.json({ error: "Missing deck ID" }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  const { error } = await supabase.rpc("increment_deck_view_count", {
    deck_id: deckId,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
