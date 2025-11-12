import { NextRequest, NextResponse } from "next/server";
import { addToCollectionOnServer } from "@/lib/api/decks/addToCollection";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { existingDeckId, name, description, isPublic } = body ?? {};
    if (!name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { newDeckId } = await addToCollectionOnServer({
      existingDeckId,
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
