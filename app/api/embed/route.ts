import { NextResponse } from "next/server";
import { embedQuery } from "@/lib/server/embedPipeline";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/embed
 * Body: { text: string }
 * Returns: { vector: number[] }
 * Uses Hugging Face Transformers.js on the Next.js server (Node + onnxruntime-node).
 * Same model as DB rules_embedding: mixedbread-ai/mxbai-embed-large-v1.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!text) {
      return NextResponse.json(
        { error: "Missing or invalid 'text' in request body" },
        { status: 400 }
      );
    }

    const vector = await embedQuery(text);
    if (!Array.isArray(vector) || vector.length === 0) {
      return NextResponse.json(
        { error: "Embedding failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ vector });
  } catch (err) {
    console.error("API /embed error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Embedding failed",
      },
      { status: 500 }
    );
  }
}
