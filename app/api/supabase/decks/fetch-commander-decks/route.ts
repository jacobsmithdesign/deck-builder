import { NextRequest, NextResponse } from "next/server";
import { fetchCommanderDecks } from "@/lib/api/decks/fetchCommanderDecks";

export async function GET(req: NextRequest) {
  const pageParam = req.nextUrl.searchParams.get("page");
  const page = pageParam ? parseInt(pageParam, 10) : 0;
  try {
    const { data, hasMore } = await fetchCommanderDecks(page);
    return NextResponse.json({ data, hasMore });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
