import { NextRequest, NextResponse } from "next/server";
import { fetchCommanderDecks } from "@/lib/api/decks/fetchCommanderDecks";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam, 10) : 0;
  const search = searchParams.get("search") ?? undefined;
  const includeUserDecks =
    searchParams.get("includeUserDecks") === "true" ||
    searchParams.get("includeUserDecks") === "1";
  try {
    const { data, hasMore } = await fetchCommanderDecks(page, 30, {
      search: search || undefined,
      includeUserDecks,
    });
    return NextResponse.json({ data, hasMore });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
