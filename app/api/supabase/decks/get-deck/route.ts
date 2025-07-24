// app/api/supabase/decks/get-deck/route.ts
import { getDeckById } from "@/lib/api/decks/getDeckById";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "Missing deck ID" }, { status: 400 });

  try {
    const data = await getDeckById(id);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 404 }
    );
  }
}
