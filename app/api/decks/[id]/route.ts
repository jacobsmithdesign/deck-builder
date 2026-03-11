import { NextRequest, NextResponse } from "next/server";
import { getDeckById } from "@/lib/api/decks/getDeckById";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing deck id" }, { status: 400 });
  }
  try {
    const result = await getDeckById(id);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "Deck not found" },
      { status: 404 }
    );
  }
}
