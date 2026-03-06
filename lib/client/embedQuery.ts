// lib/client/embedQuery.ts
import { embedQueryMxbai } from "@/lib/client/mxbaiEmbedder";

/**
 * Embeds a search query for semantic card search.
 * Uses mxbai-embed-large-v1 (compatible with DB rules_embedding from Ollama mxbai-embed-large:latest).
 */
export async function embedQuery(text: string): Promise<number[]> {
  return embedQueryMxbai(text);
}
