// embedCards.ts
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import crypto from "crypto";
import PQueue from "p-queue";

import { rolesToNaturalLanguage } from "../lib/roleTaxonomy";

dotenv.config();

// ------------------------------
// ENV
// ------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "qwen3-embedding:8b";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Recommended settings
const BATCH_SIZE = 256;
const QUEUE_CONCURRENCY = 8;
/** Upsert in small chunks to avoid Supabase statement timeout (vector payload is large). */
const UPSERT_CHUNK_SIZE = 25;

// ------------------------------
// Helpers
// ------------------------------

/** Card shape used for building embed text and hash. */
type EmbedCard = {
  name?: string | null;
  type?: string | null;
  power?: number | string | null;
  toughness?: number | string | null;
  loyalty?: number | string | null;
  defense?: number | string | null;
  life?: number | string | null;
  mana_cost?: string | null;
  mana_value?: number | null;
  color_identity?: string[] | null;
  rarity?: string | null;
  primary_roles?: string[] | null;
  secondary_roles?: string[] | null;
  keywords?: string[] | null;
  text?: string | null;
  flavor_text?: string | null;
};

/**
 * Build dense, search-friendly text for embedding. Minimal labels so query phrases
 * ("flying lifelink", "cheap red") align with card content. Role types are
 * converted to natural language so queries like "card draw" or "board wipes" match.
 */
function buildCardText(card: EmbedCard): string {
  const parts: string[] = [];

  if (card.name) parts.push(card.name);
  if (card.type) parts.push(card.type);

  // Stats on one line: P/T, loyalty, defense, life (no labels – "3/3" and "loyalty 4" are clear)
  const stats: string[] = [];
  if (card.power != null && card.toughness != null)
    stats.push(`${card.power}/${card.toughness}`);
  if (card.loyalty != null) stats.push(`loyalty ${card.loyalty}`);
  if (card.defense != null) stats.push(`defense ${card.defense}`);
  if (card.life != null) stats.push(`life ${card.life}`);
  if (stats.length) parts.push(stats.join(" "));

  if (card.mana_cost) parts.push(card.mana_cost);
  if (card.mana_value != null) parts.push(`CMC ${card.mana_value}`);
  if (card.color_identity?.length) parts.push(card.color_identity.join(" "));
  if (card.rarity) parts.push(card.rarity);

  const primaryPhrases = rolesToNaturalLanguage(card.primary_roles ?? []);
  if (primaryPhrases) parts.push(primaryPhrases);
  const secondaryPhrases = rolesToNaturalLanguage(card.secondary_roles ?? []);
  if (secondaryPhrases) parts.push(secondaryPhrases);

  // Keywords as plain list – no "Keywords:" so "flying lifelink" matches directly
  if (card.keywords?.length) parts.push(card.keywords.join(", "));

  if (card.text) parts.push(card.text);

  // Flavor last; optional prefix so it doesn't dominate
  if (card.flavor_text) parts.push(card.flavor_text);
  return parts.join(". ");
}

function buildHashSource(card: EmbedCard): string {
  const parts: string[] = [];
  if (card.name) parts.push(card.name);
  if (card.type) parts.push(card.type);
  if (card.power != null) parts.push(String(card.power));
  if (card.toughness != null) parts.push(String(card.toughness));
  if (card.loyalty != null) parts.push(String(card.loyalty));
  if (card.mana_value != null) parts.push(String(card.mana_value));
  if (card.rarity) parts.push(card.rarity);
  if (card.primary_roles?.length) parts.push(card.primary_roles.join(","));
  if (card.secondary_roles?.length) parts.push(card.secondary_roles.join(","));
  if (card.keywords?.length) parts.push(card.keywords.join(","));
  if (card.text) parts.push(card.text);
  return parts.join("\n");
}

function hashText(text: string): string {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

// ------------------------------
// EMBEDDING
// ------------------------------

const queue = new PQueue({ concurrency: QUEUE_CONCURRENCY });

/** The official Ollama API embedding response format */
type OllamaEmbeddingResponse = {
  embedding: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
};

async function embedOne(text: string): Promise<number[]> {
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      prompt: text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Ollama /api/embeddings failed: ${res.status} – ${body}`);
  }

  const json = (await res.json()) as OllamaEmbeddingResponse;

  if (!json.embedding) {
    throw new Error(`No embedding returned: ${JSON.stringify(json)}`);
  }

  return json.embedding;
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  console.log(`>>> NEW embedBatch called with ${texts.length} texts`);

  const results: number[][] = new Array(texts.length);

  await Promise.all(
    texts.map((text, index) =>
      queue.add(async () => {
        results[index] = await embedOne(text);
      }),
    ),
  );

  return results;
}

// ------------------------------
// MAIN LOGIC
// ------------------------------

const embeddingCache = new Map<string, number[]>();

async function embedAllCards() {
  console.log("Starting embedding job with hash dedupe…");

  let processed = 0;
  let lastUuid: string | null = null;

  while (true) {
    const query = supabase
      .from("cards")
      .select(
        `
        uuid,
        name,
        type,
        text,
        flavor_text,
        keywords,
        mana_cost,
        mana_value,
        power,
        toughness,
        loyalty,
        defense,
        life,
        color_identity,
        rarity,
        text_hash,
        rules_embedding,
        primary_roles,
        secondary_roles
      `,
      )
      .is("rules_embedding", null)
      .order("uuid", { ascending: true })
      .limit(BATCH_SIZE);

    if (lastUuid) {
      query.gt("uuid", lastUuid);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching cards:", error);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.log("No more unembedded cards — done.");
      break;
    }

    // Determine which rows need new embeddings
    type Pending = { uuid: string; hash: string; text: string };
    const pendingForNewEmbedding: Pending[] = [];
    const reuseUpdates: any[] = [];

    for (const card of data) {
      const embedText = buildCardText(card);
      if (!embedText.trim()) continue;

      const hashSource = buildHashSource(card);
      const hash = hashText(hashSource);

      // If up-to-date, skip
      if (card.rules_embedding && card.text_hash === hash) continue;

      // If already embedded during this run, reuse
      const cached = embeddingCache.get(hash);
      if (cached) {
        reuseUpdates.push({
          uuid: card.uuid,
          rules_embedding: cached,
          embedded_at: new Date().toISOString(),
          embedding_model: EMBEDDING_MODEL,
          text_hash: hash,
        });
        continue;
      }

      // Needs a fresh embedding
      pendingForNewEmbedding.push({
        uuid: card.uuid,
        hash,
        text: embedText,
      });
    }

    if (pendingForNewEmbedding.length === 0 && reuseUpdates.length === 0) {
      lastUuid = data[data.length - 1].uuid;
      continue;
    }

    const updates: any[] = [];

    // Embed new unique texts
    if (pendingForNewEmbedding.length > 0) {
      console.log(
        `Embedding ${pendingForNewEmbedding.length} unique texts (batch starting at uuid=${data[0].uuid})…`,
      );

      const texts = pendingForNewEmbedding.map((p) => p.text);
      const embeddings = await embedBatch(texts);

      pendingForNewEmbedding.forEach((p, i) => {
        const emb = embeddings[i];
        embeddingCache.set(p.hash, emb);

        updates.push({
          uuid: p.uuid,
          rules_embedding: emb,
          embedded_at: new Date().toISOString(),
          embedding_model: EMBEDDING_MODEL,
          text_hash: p.hash,
        });
      });
    }

    updates.push(...reuseUpdates);

    // Save to DB in chunks to avoid statement timeout (embedding vectors are large)
    if (updates.length > 0) {
      for (let i = 0; i < updates.length; i += UPSERT_CHUNK_SIZE) {
        const chunk = updates.slice(i, i + UPSERT_CHUNK_SIZE);
        const { error: upsertError } = await supabase
          .from("cards")
          .upsert(chunk, { onConflict: "uuid" });

        if (upsertError) {
          console.error("Error updating embeddings:", upsertError);
          process.exit(1);
        }
      }
      processed += updates.length;
      console.log(`✅ Embedded/updated ${processed} cards so far…`);
    }

    lastUuid = data[data.length - 1].uuid;
  }

  console.log("🎉 Embedding job complete (with hash dedupe).");
}

embedAllCards().catch((err) => {
  console.error("Fatal error in embedding job:", err);
  process.exit(1);
});
