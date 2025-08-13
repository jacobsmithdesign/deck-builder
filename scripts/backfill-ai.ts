import "dotenv/config";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import dotenv from "dotenv";
import pLimit from "p-limit";

import { buildFeatures } from "@/lib/ai/features";

dotenv.config({ path: ".env.local" });

// ---------- ENV ----------
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const AI_CONCURRENCY = Number(process.env.AI_CONCURRENCY ?? 3);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE || !OPENAI_API_KEY) {
  console.error(
    "Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE, OPENAI_API_KEY"
  );
  process.exit(1);
}

// ---------- CLI ARGS ----------
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"];
  })
);
const LIMIT = Number(args.limit ?? 25);
const FORCE = args.force === "true" || args.force === "1";
const MODEL = args.model || process.env.OPENAI_MODEL || "gpt-5-mini";

// ---------- SUPABASE / OPENAI ----------
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// ---------- TYPES ----------
export type CardRow = {
  uuid: string;
  name: string | null;
  mana_value: number | null;
  type: string | null;
  text: string | null;
};

export type DeckRow = {
  id: string;
  name: string;
  commander: CardRow | null;
  deck_cards: { count: number; board_section: string; card: CardRow }[];
  ai_generated_at: string | null;
};

// ---------- AI OUTPUT SCHEMA ----------
const AiJsonSchema = z.object({
  tagline: z.string().min(8).max(70), // keep 70 to avoid strict failures
  power_level: z.number().min(1).max(10),
  complexity: z.enum(["Low", "Medium", "High"]),
  pilot_skill: z.enum(["Beginner", "Intermediate", "Advanced"]),
  interaction_intensity: z.enum(["Low", "Medium", "High"]),
  tags: z.array(z.string()).min(3).max(6),
  strengths: z.array(z.string()).min(2).max(4),
  weaknesses: z.array(z.string()).min(2).max(4),
  confidence: z.number().min(0).max(1).optional(),
});
type AiOutput = z.infer<typeof AiJsonSchema>;

// ---------- FETCH (trimmed columns to reduce payload) ----------
async function fetchDeckPage(offset = 0): Promise<DeckRow[]> {
  let query = supabase
    .from("decks")
    .select(
      `
      id,
      name,
      ai_generated_at,
      commander:cards!decks_commander_uuid_fkey(
        uuid,
        name,
        mana_value,
        mana_cost,
        type,
        text
      ),
      deck_cards(
        count,
        board_section,
        card:cards!deck_cards_card_uuid_fkey(
          uuid,
          name,
          mana_value,
          mana_cost,
          type,
          text
        )
      )
    `
    )
    .eq("type", "Commander Deck")
    .is("user_id", null)
    .eq("deck_cards.board_section", "mainboard")
    .order("release_date", { ascending: false });

  if (!FORCE) {
    query = query.is("ai_generated_at", null);
  }

  query = query.range(offset, offset + LIMIT - 1);

  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as DeckRow[];
}

// ---------- PROMPT (lean) + FEATURES PRUNE ----------
const TAG_VOCAB =
  '["Token Swarm","Treasure","Aristocrats","Graveyard","Reanimator","Stax","Voltron","Spellslinger","Blink","+1/+1 Counters","Lifegain","Control","Combo","Ramp","Landfall","Mill","Extra Turns","Vehicles","Dragons","Elves","Artifacts","Enchantress","Aura","Discard","Steal/Copy","Flicker","Proliferate","Burn","Big Mana"]';

type Features = ReturnType<typeof buildFeatures>;

// keep only high-signal pieces to save tokens
function pruneFeatures(f: Features) {
  return {
    meta: {
      deck_id: f.meta.deck_id,
      commander: {
        name: f.meta.commander.name,
        text: (f.meta.commander.text || "").replace(/\s+/g, " ").slice(0, 240),
      },
      avg_mv: Number(
        (f as any).meta?.avg_mv?.toFixed?.(2) ?? f.meta.avg_mv ?? 0
      ),
      mainboard_count: f.meta.mainboard_count,
    },
    counts: pick(f.counts, [
      "ramp",
      "rocks",
      "dorks",
      "draw",
      "tutors",
      "wipes",
      "spot",
      "counters",
      "recursion",
      "stax",
      "extra_turns",
      "extra_combat",
      "token",
      "blink",
      "copy",
    ]),
    curve: f.curve,
    type_counts: f.type_counts,
    interaction_density: Number(
      (f as any).interaction_density?.toFixed?.(3) ?? f.interaction_density ?? 0
    ),
    stack_complexity_markers: Array.from(
      new Set(f.stack_complexity_markers || [])
    ).slice(0, 8),
    signals: (f.signals || []).slice(0, 8).map((s) => ({
      n: s.name,
      mv: s.mv,
      t: (s.tags || []).slice(0, 3),
    })),
  };
}

function pick<T extends Record<string, any>>(obj: T, keys: string[]) {
  const out: Record<string, any> = {};
  for (const k of keys) if (obj[k] != null) out[k] = obj[k];
  return out;
}

function buildPrompt(prunedFeatures: ReturnType<typeof pruneFeatures>): string {
  return `Return ONLY minified JSON:
{"tagline":string,"power_level":1-10,"complexity":"Low"|"Medium"|"High","pilot_skill":"Beginner"|"Intermediate"|"Advanced","interaction_intensity":"Low"|"Medium"|"High","tags":string[],"strengths":string[],"weaknesses":string[],"confidence":0..1}

Rules:
- tagline ≤ 60 chars.
- tags: pick 3–6 from ${TAG_VOCAB}
- strengths/weaknesses: 2–4 items each, 1–3 words.

Features:
${JSON.stringify(prunedFeatures)}`;
}

// ---------- AI CALL (cap output) ----------
async function getAiAssessment(pruned: ReturnType<typeof pruneFeatures>) {
  const completion = await openai.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Use this tags vocabulary when possible: ${TAG_VOCAB}. Output strict minified JSON only.`,
      },
      { role: "user", content: buildPrompt(pruned) },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  return AiJsonSchema.parse(JSON.parse(raw));
}

// ---------- UPDATE (column names mirror DB) ----------
async function updateDeckAI(id: string, payload: AiOutput) {
  const { error } = await supabase
    .from("decks")
    .update({
      tagline: payload.tagline,
      ai_power_level: String(payload.power_level), // your column is TEXT; cast number to string
      ai_complexity: payload.complexity,
      ai_pilot_skill: payload.pilot_skill,
      ai_interaction: payload.interaction_intensity, // fixed name
      ai_tags: payload.tags,
      ai_strengths: payload.strengths,
      ai_weaknesses: payload.weaknesses,
      ai_confidence: payload.confidence ?? null,
      ai_spec_version: "v2-composite-axes",
      ai_generated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}

// ---------- MAIN ----------
function nowMs() {
  return Number(process.hrtime.bigint() / 1_000_000n);
}

(async () => {
  try {
    console.log(
      `Backfilling AI tags… limit=${LIMIT} force=${FORCE} model=${MODEL} concurrency=${AI_CONCURRENCY}`
    );

    const limit = pLimit(AI_CONCURRENCY);
    let offset = 0;
    let totalProcessed = 0;

    while (true) {
      const decks = await fetchDeckPage(offset);
      if (decks.length === 0) break;

      console.log(
        `Page ${Math.floor(offset / LIMIT) + 1}: fetched ${
          decks.length
        }, processing…`
      );

      const toProcess = FORCE ? decks : decks.filter((d) => !d.ai_generated_at);

      const results = await Promise.allSettled(
        toProcess.map((deck) =>
          limit(async () => {
            const t0 = nowMs();
            try {
              if (!deck.commander || deck.deck_cards.length === 0) {
                console.warn(
                  `Skipping ${deck.id} (${deck.name}): missing commander or cards`
                );
                return;
              }

              // features
              const f0 = nowMs();
              const rawFeatures = buildFeatures(deck as any);
              const features = pruneFeatures(rawFeatures);
              const f1 = nowMs();

              // openai
              const ai = await getAiAssessment(features);
              const f2 = nowMs();

              // db update
              await updateDeckAI(deck.id, ai);
              const f3 = nowMs();

              console.log(
                `✓ ${deck.name}: ${ai.tagline} [P${ai.power_level}/C${ai.complexity}/S${ai.pilot_skill}/I${ai.interaction_intensity}] — ` +
                  `total ${f3 - t0}ms (features ${f1 - f0}ms, openai ${
                    f2 - f1
                  }ms, db ${f3 - f2}ms)`
              );
              totalProcessed++;
            } catch (e) {
              console.error(
                `✗ Failed for ${deck.id} (${deck.name}):`,
                e instanceof Error ? e.message : e
              );
            }
          })
        )
      );

      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed) console.warn(`⚠ ${failed} decks failed on this page`);

      if (!FORCE) {
        if (toProcess.length === 0) break;
      } else {
        offset += LIMIT;
      }
    }

    console.log(`Done. Processed ${totalProcessed} decks.`);
  } catch (err) {
    console.error("Fatal error:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
})();
