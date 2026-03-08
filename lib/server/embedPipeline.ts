/**
 * Server-side embedding via Hugging Face Inference API.
 * Same model as DB rules_embedding: mixedbread-ai/mxbai-embed-large-v1.
 *
 * Optional: natural-language search is rewritten with an LLM into search-optimized
 * text (creature types, keywords, mechanics) before embedding. Set AI_PROVIDER and
 * the corresponding API key to enable. If unset or rewrite fails, the raw query is embedded.
 *
 * Set HUGGING_FACE_HUB_TOKEN in .env.local (token with Inference access).
 */

import { generateText } from "ai";
import { InferenceClient } from "@huggingface/inference";
import { getLanguageModel } from "@/lib/ai/model";

const MODEL_ID = "mixedbread-ai/mxbai-embed-large-v1";
const QUERY_PROMPT =
  "Represent this sentence for searching relevant passages: ";

const REWRITE_SYSTEM = `You rewrite Magic: The Gathering card search queries for vector similarity search.
- Input: natural language (e.g. "Find me dinosaurs with flying and lifelink").
- Output: a single short phrase optimized for matching card text: creature types, card types, keywords (flying, lifelink, trample, etc.), mechanics, and colors. No sentences, no explanation.
- Preserve exact game terms. Examples:
  - "dinosaurs with flying and lifelink" → "Creature Dinosaur flying lifelink"
  - "cheap red burn spells" → "Instant Sorcery red burn damage low cost"
  - "cards that draw when creatures enter" → "draw card creature enters battlefield"
Output only the rewritten phrase, nothing else.`;

let client: InferenceClient | null = null;

function getClient(): InferenceClient {
  if (client) return client;
  const token = process.env.HUGGING_FACE_HUB_TOKEN;
  if (!token) {
    throw new Error(
      "HUGGING_FACE_HUB_TOKEN is not set. Add it to .env.local for semantic search.",
    );
  }
  client = new InferenceClient(token);
  return client;
}

/** Rewrite natural-language query into search-optimized phrase. Returns original on failure or if no AI configured. */
async function rewriteSearchQuery(raw: string): Promise<string> {
  try {
    const model = getLanguageModel();
    console.log("model", model);
    const { text } = await generateText({
      model: model as unknown as Parameters<typeof generateText>[0]["model"],
      system: REWRITE_SYSTEM,
      prompt: raw,
    });
    const rewritten = text?.trim();
    if (rewritten && rewritten.length > 0) return rewritten;
  } catch {
    // no API key or model error: fall back to raw
  }
  return raw;
}

export async function embedQuery(text: string): Promise<number[]> {
  const raw = text.trim();
  if (!raw) throw new Error("embedQuery requires non-empty text");

  const toEmbed = await rewriteSearchQuery(raw);
  console.log("toEmbed", toEmbed);
  const input = `${QUERY_PROMPT}${toEmbed}`;

  const output = await getClient().featureExtraction({
    model: MODEL_ID,
    inputs: input,
    provider: "hf-inference",
  });

  const vec = Array.isArray(output?.[0])
    ? (output as number[][])[0]
    : (output as number[]);
  if (!Array.isArray(vec) || vec.length === 0) {
    throw new Error("Hugging Face API returned no embedding");
  }
  return vec;
}
