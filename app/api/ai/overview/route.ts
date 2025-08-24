import "dotenv/config";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import dotenv from "dotenv";
import pLimit from "p-limit";

import { buildFeatures, CardLite } from "@/lib/ai/features";
import { CardRecord } from "@/lib/schemas";
import { Console } from "console";

dotenv.config({ path: ".env.local" });

export type CardMini = {
  name: string;
  mana_value: number;
  type: string;
  text: string;
};

// ───────────────────────────────────────────────────────────────────────────────
// Tool-calling schema (short description; small, strict output)
// ───────────────────────────────────────────────────────────────────────────────
const DIFFICULTY_FN = {
  type: "function",
  function: {
    name: "set_difficulty",
    description:
      "Return difficulty ratings (power, complexity, pilot skill, interaction, upkeep) with short explanations and confidence.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        power_level: { type: "integer", minimum: 1, maximum: 10 },
        power_level_explanation: { type: "string", maxLength: 160 },
        complexity: { type: "string", enum: ["Low", "Medium", "High"] },
        complexity_explanation: { type: "string", maxLength: 160 },
        pilot_skill: {
          type: "string",
          enum: ["Beginner", "Intermediate", "Advanced"],
        },
        pilot_skill_explanation: { type: "string", maxLength: 160 },
        interaction_intensity: {
          type: "string",
          enum: ["Low", "Medium", "High"],
        },
        interaction_explanation: { type: "string", maxLength: 160 },
        upkeep: { type: "string", enum: ["Low", "Medium", "High"] },
        upkeep_explanation: { type: "string", maxLength: 160 },
        confidence: { type: "number", minimum: 0, maximum: 1 },
      },
      required: [
        "power_level",
        "power_level_explanation",
        "complexity",
        "complexity_explanation",
        "pilot_skill",
        "pilot_skill_explanation",
        "interaction_intensity",
        "interaction_explanation",
        "upkeep",
        "upkeep_explanation",
        "confidence",
      ],
    },
  },
} as const;

// ────────── ENV ──────────
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const LOG_TOKENS = true;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE || !OPENAI_API_KEY) {
  console.error(
    "Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE, OPENAI_API_KEY"
  );
  process.exit(1);
}

// ────────── CLI ARGS ──────────
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"];
  })
);
const LIMIT = Number(args.limit ?? 25);
const FORCE = args.force === "true" || args.force === "1";
const MODEL = args.model ?? "gpt-4.1-mini";
const TASK = (args.task as string) || "overview"; // "overview" | "difficulty"
const DECK_ID = args.deckId ?? null;

const AI_CONCURRENCY = Number(args.concurrency) || 1;

// ────────── constants ──────────
const ai_spec = "v5-difficulty-axes-gpt-4.1";

// ────────── SUPABASE / OPENAI ──────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});
const openai = new OpenAI({ apiKey: OPENAI_API_KEY, maxRetries: 1 });

// ────────── TYPES ──────────
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
  commander_uuid?: string | null;
  deck_cards: { count: number; board_section: string; card: CardRow }[];
  ai_generated_at: string | null;
};

// ────────── AI OUTPUT SCHEMAS ──────────
const AiJsonSchema = z.object({
  tagline: z.string().min(8).max(70),
  tags: z.array(z.string()).min(3).max(6),
  strengths: z.array(z.string()).min(2).max(4),
  weaknesses: z.array(z.string()).min(2).max(4),
  confidence: z.number().min(0).max(1).optional(),
});
type AiOutput = z.infer<typeof AiJsonSchema>;

const DifficultyJsonSchema = z.object({
  power_level: z.number().min(1).max(10),
  power_level_explanation: z.string().min(10).max(190),
  complexity: z.enum(["Low", "Medium", "High"]),
  complexity_explanation: z.string().min(10).max(190),
  pilot_skill: z.enum(["Beginner", "Intermediate", "Advanced"]),
  pilot_skill_explanation: z.string().min(10).max(190),
  interaction_intensity: z.enum(["Low", "Medium", "High"]),
  interaction_explanation: z.string().min(10).max(190),
  upkeep: z.enum(["Low", "Medium", "High"]),
  upkeep_explanation: z.string().min(10).max(190),
  confidence: z.number().min(0).max(1).optional(),
});
type DifficultyOutput = z.infer<typeof DifficultyJsonSchema>;

// ────────── FETCH (trimmed columns) ──────────
async function fetchDeckPage(offset = 0): Promise<DeckRow[]> {
  let query = supabase
    .from("decks")
    .select(
      `
      id,
      name,
      ai_generated_at,
      commander_uuid,
      commander:cards!decks_commander_uuid_fkey(
        uuid,
        name,
        mana_value,
        mana_cost,
        type,
        text
      ),
      deck_cards!inner(
        count,
        board_section,
        card:cards!deck_cards_card_uuid_fkey(
          uuid, name, mana_value, mana_cost, type, text
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

async function fetchDeckById(deckId: string): Promise<DeckRow[]> {
  const { data, error } = await supabase
    .from("decks")
    .select(
      `
      id,
      name,
      ai_generated_at,
      commander:cards!decks_commander_uuid_fkey(
        uuid, name, mana_value, mana_cost, type, text
      ),
      deck_cards(
        count,
        board_section,
        card:cards!deck_cards_card_uuid_fkey(
          uuid, name, mana_value, mana_cost, type, text
        )
      )
    `
    )
    .eq("id", deckId)
    .eq("deck_cards.board_section", "mainboard")
    .single();

  if (error) throw error;
  return data ? [data as unknown as DeckRow] : [];
}
// This is for fetching cards and mapping them to an array of CardMinis for the full card list AI suggestion
export async function fetchMainboardCardMinis(
  deckId: string
): Promise<CardMini[]> {
  const { data, error } = await supabase
    .from("decks")
    .select(
      `
      deck_cards:deck_cards!inner(
        count,
        board_section,
        card:cards!deck_cards_card_uuid_fkey(
          name, mana_value, type, text
        )
      )
    `
    )
    .eq("id", deckId)
    .eq("deck_cards.board_section", "mainboard")
    .single();

  if (error) throw error;

  const rows = (data?.deck_cards ?? []) as unknown as Array<{
    count: number | null;
    board_section: string;
    card: {
      name: string;
      mana_value: number | null;
      type: string;
      text: string | null;
    };
  }>;

  // Map to CardMini[], coalescing nulls
  const minis: CardMini[] = rows.map(({ card }) => ({
    name: card.name,
    mana_value: card.mana_value ?? 0,
    type: card.type,
    text: card.text ?? "",
  }));

  return minis;
}

async function fetchBatchNeedingDifficulty(): Promise<DeckRow[]> {
  const { data, error } = await supabase
    .from("decks")
    .select(
      `
      id,
      name,
      ai_generated_at,
      ai_spec_version,
      commander_uuid,
      commander:cards!decks_commander_uuid_fkey(
        uuid, name, mana_value, mana_cost, type, text
      ),
      deck_cards!inner(
        count, board_section,
        card:cards!deck_cards_card_uuid_fkey(
          uuid, name, mana_value, mana_cost, type, text
        )
      )
    `
    )
    .eq("type", "Commander Deck")
    .is("user_id", null)
    .eq("deck_cards.board_section", "mainboard")
    .not("commander_uuid", "is", null)
    .or(
      [
        "ai_spec_version.is.null",
        `ai_spec_version.neq.${ai_spec}`,
        "ai_power_level_explanation.is.null",
        "ai_complexity_explanation.is.null",
        "ai_pilot_skill_explanation.is.null",
        "ai_interaction_explanation.is.null",
        "ai_upkeep_explanation.is.null",
      ].join(",")
    )
    .order("id", { ascending: true })
    .limit(LIMIT);

  if (error) throw error;
  return (data ?? []) as unknown as DeckRow[];
}

// ────────── PROMPT HELPERS ──────────
const TAG_VOCAB =
  '["Token Swarm","Treasure","Aristocrats","Graveyard","Reanimator","Stax","Voltron","Spellslinger","Blink","+1/+1 Counters","Lifegain","Control","Combo","Ramp","Landfall","Mill","Extra Turns","Vehicles","Dragons","Elves","Artifacts","Enchantress","Aura","Discard","Steal/Copy","Flicker","Proliferate","Burn","Big Mana"]';

type Features = ReturnType<typeof buildFeatures>;

// Map signal tags to 1–2 word roles
function tagToRole(tags: string[]): string {
  const t = new Set((tags || []).map((x) => x.toLowerCase()));
  if (t.has("wipes")) return "mass";
  if (t.has("spot")) return "spot";
  if (t.has("counters")) return "counter";
  if (t.has("token")) return "tokens";
  if (t.has("copying") || t.has("copy")) return "copy";
  if (t.has("blink")) return "blink";
  if (t.has("protection")) return "protection";
  if (t.has("cast_trigger")) return "cast";
  return "engine";
}

// ────────── UNIFIED PROMPT (overview | difficulty) ──────────
function buildUnifiedAnalysisPrompt(
  cards: CardMini[],
  rawFeatures: any,
  mode: "overview" | "difficulty"
): string {
  const CARDS = JSON.stringify(cards);
  const FEATURES = JSON.stringify(rawFeatures); // raw, not pruned

  if (mode === "overview") {
    return `Return ONLY minified JSON:
{"tagline":string,"tags":string[],"strengths":string[],"weaknesses":string[],"confidence":0..1}

Rules: tagline ≤ 60 chars. tags: pick 3–6 from ${TAG_VOCAB}. strengths/weaknesses: 2–4 items each, 1–3 words.
Cards:${CARDS}
Features:${FEATURES}`;
  }

  // difficulty mode
  return `Return ONLY minified JSON with EXACT keys:
{"power_level":1..10,"power_level_explanation":string(<=170),
"complexity":"Low"|"Medium"|"High","complexity_explanation":string(<=170),
"pilot_skill":"Beginner"|"Intermediate"|"Advanced","pilot_skill_explanation":string(<=170),
"interaction_intensity":"Low"|"Medium"|"High","interaction_explanation":string(<=170),
"upkeep":"Low"|"Medium"|"High","upkeep_explanation":string(<=170),
"confidence":0..1}

Rules: one sentence per explanation; 60–170 chars; plain words; no lists/newlines/quotes; do not restate Features.
Cards:${CARDS}
Features:${FEATURES}`;
}
// ────────── OVERVIEW AI CALL ──────────
async function getAiAssessment(rawFeatures: any, cards: CardMini[]) {
  const completion = await openai.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Use this tags vocabulary when possible: ${TAG_VOCAB}. Output strict minified JSON only.`,
      },
      {
        role: "user",
        content: buildUnifiedAnalysisPrompt(cards, rawFeatures, "overview"),
      },
    ],
  });

  if (LOG_TOKENS && completion.usage) {
    const u = completion.usage;
    console.log(
      `[tokens overview] prompt=${u.prompt_tokens} out=${u.completion_tokens} total=${u.total_tokens}`
    );
  }

  const raw = completion.choices[0]?.message?.content ?? "{}";
  return AiJsonSchema.parse(JSON.parse(raw));
}

// ────────── UPDATE (overview) ──────────
async function updateDeckAI(id: string, payload: AiOutput) {
  const { error } = await supabase
    .from("decks")
    .update({
      tagline: payload.tagline,
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

// ────────── DIFFICULTY AI CALL (forced tool; no extra response_format) ──────────
function clampStr(s: any, n: number) {
  return String(s ?? "")
    .replace(/\s+/g, " ")
    .slice(0, n);
}
function normalizePilotSkill(v: any): "Beginner" | "Intermediate" | "Advanced" {
  const t = String(v ?? "").toLowerCase();
  if (t === "low" || t === "novice" || t === "beginner") return "Beginner";
  if (t === "high" || t === "advanced") return "Advanced";
  return "Intermediate";
}
function sanitizeDifficulty(obj: any): DifficultyOutput {
  const out = {
    power_level: Math.min(10, Math.max(1, Number(obj.power_level) || 5)),
    power_level_explanation: clampStr(obj.power_level_explanation, 160),
    complexity: ["Low", "Medium", "High"].includes(obj.complexity)
      ? obj.complexity
      : "Medium",
    complexity_explanation: clampStr(obj.complexity_explanation, 160),
    pilot_skill: normalizePilotSkill(obj.pilot_skill),
    pilot_skill_explanation: clampStr(obj.pilot_skill_explanation, 160),
    interaction_intensity: ["Low", "Medium", "High"].includes(
      obj.interaction_intensity
    )
      ? obj.interaction_intensity
      : "Medium",
    interaction_explanation: clampStr(obj.interaction_explanation, 160),
    upkeep: ["Low", "Medium", "High"].includes(obj.upkeep)
      ? obj.upkeep
      : "Medium",
    upkeep_explanation: clampStr(obj.upkeep_explanation, 160),
    confidence: Math.max(0, Math.min(1, Number(obj.confidence ?? 0.7))),
  };
  return DifficultyJsonSchema.parse(out);
}

function safeJSON<T = any>(s: string, fallback: T): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

function parseToolOrContent(c: OpenAI.Chat.Completions.ChatCompletion): any {
  const choice = (c as any)?.choices?.[0];
  const tc = choice?.message?.tool_calls?.[0];

  if (
    tc &&
    tc.type === "function" &&
    "function" in tc &&
    (tc as any).function
  ) {
    const argStr = (tc as any).function.arguments ?? "{}";
    return safeJSON(argStr, {});
  }
  const raw = choice?.message?.content ?? "{}";
  return safeJSON(raw, {});
}

// ────────── DIFFICULTY AI CALL (tool calling; uses rawFeatures) ──────────
async function getDifficultyAssessment(cards: CardMini[], rawFeatures: any) {
  const prompt = buildUnifiedAnalysisPrompt(cards, rawFeatures, "difficulty");

  const completion = await openai.chat.completions.create({
    model: MODEL,
    tools: [DIFFICULTY_FN],
    tool_choice: { type: "function", function: { name: "set_difficulty" } },
    parallel_tool_calls: false,
    seed: 42069,
    messages: [
      {
        role: "system",
        content:
          "Return ONLY a function call to set_difficulty. No assistant text. " +
          "You are an expert MTG EDH deck assistant assessing difficulty from full card list + features. " +
          "No reasoning; explanations must be short, readable. Keep total tokens < 1000.",
      },
      { role: "user", content: prompt },
    ],
  });

  if ((completion as any).usage) {
    const u = (completion as any).usage;
    console.log(
      `[tokens difficulty] prompt=${u.prompt_tokens} out=${u.completion_tokens} total=${u.total_tokens}`
    );
  }

  const parsed = parseToolOrContent(completion);
  return sanitizeDifficulty(parsed);
}

// ────────── UPDATE (difficulty) ──────────
async function updateDeckDifficulty(id: string, d: DifficultyOutput) {
  const { error } = await supabase
    .from("decks")
    .update({
      ai_power_level: String(d.power_level),
      ai_complexity: d.complexity,
      ai_pilot_skill: d.pilot_skill,
      ai_interaction: d.interaction_intensity,
      ai_upkeep: d.upkeep,
      ai_power_level_explanation: d.power_level_explanation,
      ai_complexity_explanation: d.complexity_explanation,
      ai_pilot_skill_explanation: d.pilot_skill_explanation,
      ai_interaction_explanation: d.interaction_explanation,
      ai_upkeep_explanation: d.upkeep_explanation,
      ai_spec_version: ai_spec,
      ai_generated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}

// ────────── MAIN ──────────
function nowMs() {
  return Number(process.hrtime.bigint() / 1_000_000n);
}

(async () => {
  try {
    console.log(
      `Backfill task="${TASK}" limit=${LIMIT} force=${FORCE} model=${MODEL} concurrency=${AI_CONCURRENCY}`
    );

    const limit = pLimit(AI_CONCURRENCY);
    let offset = 0;
    let totalProcessed = 0;

    while (true) {
      const decks = DECK_ID
        ? await fetchDeckById(DECK_ID)
        : TASK === "difficulty" && !FORCE
        ? await fetchBatchNeedingDifficulty()
        : await fetchDeckPage(offset);
      if (decks.length === 0) break;

      const page = Math.floor(offset / LIMIT) + 1;
      console.log(`Page ${page}: fetched ${decks.length}, processing…`);

      const candidates = decks.filter(
        (d) => d.commander && d.deck_cards?.length > 0
      );

      const results = await Promise.allSettled(
        candidates.map((deck) =>
          limit(async () => {
            const t0 = nowMs();

            try {
              if (!deck.commander || deck.deck_cards.length === 0) {
                console.warn(
                  `Skipping ${deck.id} (${deck.name}): missing commander or cards`
                );
                return;
              }

              // Extract raw features once
              const f0 = nowMs();
              const rawFeatures = buildFeatures(deck as any);
              const f1 = nowMs();

              // Cards (for both overview + difficulty)
              const cards = await fetchMainboardCardMinis(deck.id);

              if (TASK === "difficulty") {
                const diff = await getDifficultyAssessment(cards, rawFeatures);
                const f2 = nowMs();
                await updateDeckDifficulty(deck.id, diff);
                const f3 = nowMs();

                console.log(
                  `✓ [difficulty] ${deck.name}: P${diff.power_level}/${
                    diff.complexity
                  }/${diff.pilot_skill}/I${diff.interaction_intensity}/U${
                    diff.upkeep
                  } — total ${f3 - t0}ms (features ${f1 - f0}ms, openai ${
                    f2 - f1
                  }ms, db ${f3 - f2}ms)`
                );
              } else {
                const ai = await getAiAssessment(rawFeatures, cards);
                const f2 = nowMs();
                await updateDeckAI(deck.id, ai);
                const f3 = nowMs();

                console.log(
                  `✓ [overview] ${deck.name}: ${ai.tagline} [Strengths: ${
                    ai.strengths
                  }/ Weaknesses: ${ai.weaknesses}/ tags: ${ai.tags}/] — total ${
                    f3 - t0
                  }ms (features ${f1 - f0}ms, openai ${f2 - f1}ms, db ${
                    f3 - f2
                  }ms)`
                );
              }

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

      // Only advance offset when using the old paged fetch path
      if (!(TASK === "difficulty" && !FORCE)) {
        offset += LIMIT;
      }
    }

    console.log(`Done. Processed ${totalProcessed} decks.`);
  } catch (err) {
    console.error("Fatal error:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
})();
