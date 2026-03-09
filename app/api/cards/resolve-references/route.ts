import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { resolveCardReferences } from "@/lib/card-ref/resolveCardReferences";
import { extractCardReferenceNames } from "@/lib/card-ref/parseCardReferences";

/**
 * POST body: { names?: string[], text?: string }
 * - If names is provided, resolves those card names.
 * - If text is provided, parses [[Card Name]] and resolves the extracted names.
 * - If both are provided, names and names from text are merged (unique).
 *
 * Returns: { cards: Record<normalizedName, { uuid, name, imageFrontUrl }> }
 */
export async function POST(req: NextRequest) {
  let names: string[] = [];

  try {
    const body = await req.json().catch(() => ({}));
    const { names: bodyNames, text } = body;

    if (Array.isArray(bodyNames)) {
      names = bodyNames.filter((n: unknown) => typeof n === "string" && n.trim());
    }
    if (typeof text === "string") {
      const fromText = extractCardReferenceNames(text);
      names = [...new Set([...names, ...fromText])];
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (names.length === 0) {
    return NextResponse.json({ cards: {} });
  }

  const supabase = await createServerSupabase();
  const cards = await resolveCardReferences(supabase, names);
  return NextResponse.json({ cards });
}
