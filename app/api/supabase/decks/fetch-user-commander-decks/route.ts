// app/api/supabase/decks/fetch-user-commander-decks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchUserCommanderDecks } from "@/lib/api/decks/fetchUserCommanderDecks";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const pageParam = req.nextUrl.searchParams.get("page");
  const page = pageParam ? parseInt(pageParam, 10) : 0;

  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    console.log("user id ", user.id);
    const { data, hasMore } = await fetchUserCommanderDecks(user.id, page);
    return NextResponse.json({ data, hasMore });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
