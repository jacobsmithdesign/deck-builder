"use client";

import { pipeline } from "@xenova/transformers";

// Singleton to avoid reloading the model on every keystroke
let embedder: any;

export async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline(
      "feature-extraction",
      "Xenova/bge-large-en-v1.5",
      {
        quantized: true, // much faster init & smaller memory footprint
      }
    );
  }
  return embedder;
}
