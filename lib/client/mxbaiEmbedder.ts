"use client";

import { pipeline } from "@huggingface/transformers";

const MODEL_ID = "mixedbread-ai/mxbai-embed-large-v1";
const QUERY_PROMPT =
  "Represent this sentence for searching relevant passages: ";

/** Feature-extraction pipeline: (input(s), options) => promise of tensor-like with tolist() */
type FeatureExtractor = (
  inputs: string | string[],
  options?: { pooling?: string },
) => Promise<{ tolist(): number[][] | number[] }>;

let extractor: FeatureExtractor | null = null;

async function getExtractor(): Promise<FeatureExtractor> {
  if (!extractor) {
    // Use WASM so tokenizer and model run on the same backend. WebGPU causes
    // "invalid data location: undefined" because tokenizer outputs have no GPU location.
    const pipe = await pipeline("feature-extraction", MODEL_ID, {
      dtype: "fp32",
      device: "wasm",
    });
    extractor = pipe as unknown as FeatureExtractor;
  }
  return extractor;
}

/**
 * Embeds a search query using mxbai-embed-large-v1 (same family as Ollama mxbai-embed-large:latest).
 * Use for semantic card search against rules_embedding in the DB.
 */
export async function embedQueryMxbai(text: string): Promise<number[]> {
  const raw = typeof text === "string" ? text.trim() : "";
  if (!raw) throw new Error("embedQueryMxbai requires non-empty text");
  const pipe = await getExtractor();
  const queryWithPrompt = `${QUERY_PROMPT}${raw}`;
  // Pass as single string; pipeline may fail with [string] due to tokenizer/input_ids handling
  const output = await pipe(queryWithPrompt, { pooling: "cls" });
  const list = output.tolist();
  // Single input can return shape (1, dim) or (dim,) depending on pipeline version
  const vec =
    Array.isArray(list[0]) && typeof list[0][0] === "number" ? list[0] : list;
  return vec as number[];
}
