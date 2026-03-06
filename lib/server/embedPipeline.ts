/**
 * Server-side embedding via Hugging Face Inference API.
 * Same model as DB rules_embedding: mixedbread-ai/mxbai-embed-large-v1.
 *
 * Set HUGGING_FACE_HUB_TOKEN in .env.local (token with Inference access).
 */

import { InferenceClient } from "@huggingface/inference";

const MODEL_ID = "mixedbread-ai/mxbai-embed-large-v1";
const QUERY_PROMPT =
  "Represent this sentence for searching relevant passages: ";

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

export async function embedQuery(text: string): Promise<number[]> {
  const raw = text.trim();
  if (!raw) throw new Error("embedQuery requires non-empty text");

  const output = await getClient().featureExtraction({
    model: MODEL_ID,
    inputs: `${raw}`,
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
