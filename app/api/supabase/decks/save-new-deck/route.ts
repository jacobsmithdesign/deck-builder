import { NextRequest, NextResponse } from "next/server";
import { saveNewDeckOnServer } from "@/lib/api/decks/saveNewDeck";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { preconDeckId, name, description, isPublic } = body ?? {};
    if (!preconDeckId || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { newDeckId } = await saveNewDeckOnServer({
      preconDeckId,
      name,
      description,
      isPublic,
    });

    return NextResponse.json({ success: true, newDeckId });
  } catch (e) {
    console.error("save-user-deck error:", e);
    return NextResponse.json(
      { success: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
