// app/api/supabase/search/route.ts
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic"; // optional but often useful
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const vector = body.vector;
    const match_threshold = body.threshold ?? 0.1;
    const match_count = body.limit ?? 50;

    if (!Array.isArray(vector) || vector.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid 'vector' in request body" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();

    const { data, error } = await supabase.rpc("match_cards", {
      query_embedding: vector,
      match_threshold,
      match_count,
    });

    if (error) {
      console.error("Supabase match_cards error:", error);
      return NextResponse.json(
        { error: "Failed to search cards" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("API /supabase/search error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
