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
        bracket: { type: "integer", minimum: 1, maximum: 10 },
        bracket_explanation: { type: "string", maxLength: 160 },
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
        "bracket",
        "bracket_explanation",
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
    "Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE, OPENAI_API_KEY",
  );
  process.exit(1);
}

// ────────── CLI ARGS ──────────
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"];
  }),
);
const LIMIT = Number(args.limit ?? 25);
const FORCE = args.force === "true" || args.force === "1";
const MODEL = args.model ?? "gpt-5-mini-2025-08-07";
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
  bracket: z.number().min(1).max(10),
  bracket_explanation: z.string().min(10).max(190),
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
    `,
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
            id, name, user_id,
            commander:cards!decks_commander_uuid_fkey(uuid,name,mana_value,mana_cost,type,text,power,toughness),
            deck_cards(
              count, board_section,
              card:cards!deck_cards_card_uuid_fkey(uuid,name,mana_value,mana_cost,type,text,power,toughness)
            )
    `,
    )
    .eq("id", deckId)
    .eq("deck_cards.board_section", "mainboard")
    .single();

  if (error) throw error;
  return data ? [data as unknown as DeckRow] : [];
}
// This is for fetching cards and mapping them to an array of CardMinis for the full card list AI suggestion
export async function fetchMainboardCardMinis(
  deckId: string,
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
    `,
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
    `,
    )
    .eq("type", "Commander Deck")
    .is("user_id", null)
    .eq("deck_cards.board_section", "mainboard")
    .not("commander_uuid", "is", null)
    .or(
      [
        "ai_spec_version.is.null",
        `ai_spec_version.neq.${ai_spec}`,
        "ai_bracket_explanation.is.null",
        "ai_complexity_explanation.is.null",
        "ai_pilot_skill_explanation.is.null",
        "ai_interaction_explanation.is.null",
        "ai_upkeep_explanation.is.null",
      ].join(","),
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

function pick<T extends Record<string, any>>(obj: T, keys: string[]) {
  const out: Record<string, any> = {};
  for (const k of keys) if (obj && obj[k] != null) out[k] = obj[k];
  return out;
}

// Minimal motif derivation (≤3 words) using commander text + keywords/counts
function derivePlan(f: Features): string[] {
  const plan = new Set<string>();
  const commanderText = (f.meta?.commander?.text || "").toLowerCase();

  const addIf = (word: string, re: RegExp) => {
    if (plan.size >= 3) return;
    if (re.test(commanderText)) plan.add(word);
  };

  // Commander-driven hints
  addIf("tokens", /\btoken|create .* token|myriad|populate/);
  addIf("sacrifice", /\bsacrifice\b|dies|aristocrat/);
  addIf("spellslinger", /\binstant|sorcery|cast.*spell/);
  addIf("blink", /\bblink\b|exile.*return.*battlefield/);
  addIf("copy", /\bcopy\b/);
  addIf("counters", /\bproliferate|\+1\/\+1 counter|energy/);
  addIf("treasure", /\btreasure\b/);
  addIf("protection", /\bindestructible|hexproof|ward|phase out/);

  // Keyword histogram (presence)
  const kh = f.keyword_histogram || {};
  const pushKH = (key: string, tag: string) =>
    kh[key] && plan.size < 3 && plan.add(tag);
  pushKH("storm", "storm");
  pushKH("cascade", "cascade");
  pushKH("landfall", "landfall");
  pushKH("proliferate", "proliferate");

  // Counts backup
  const c = f.counts || {};
  const orderedTuples: [string, number, string][] = [
    ["token", c.token ?? 0, "tokens"],
    ["stax", c.stax ?? 0, "stax"],
    ["copy", c.copy ?? 0, "copy"],
    ["blink", c.blink ?? 0, "blink"],
    ["ramp", c.ramp ?? 0, "ramp"],
    ["counters", c.counters ?? 0, "counters"],
  ];

  orderedTuples.sort((a, b) => b[1] - a[1]);

  for (const [, val, tag] of orderedTuples) {
    if (plan.size >= 3) break;
    if (val > 0) plan.add(tag);
  }

  return Array.from(plan).slice(0, 3);
}

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

// 3–5 exemplar pairs: [shortName, role]
function deriveExamples(f: Features): Array<[string, string]> {
  const signals = Array.isArray(f.signals) ? f.signals.slice(0, 8) : [];
  const rolesSeen = new Set<string>();
  const out: Array<[string, string]> = [];

  for (const s of signals) {
    const name = (s as any)?.name || "Card";
    const role = tagToRole(((s as any)?.tags || []).slice(0, 6));
    if (!rolesSeen.has(role)) {
      out.push([String(name).slice(0, 24), role]);
      rolesSeen.add(role);
    }
    if (out.length >= 5) break;
  }

  // Fallback if empty
  if (out.length === 0 && f.meta?.commander?.name) {
    out.push([String(f.meta.commander.name).slice(0, 24), "commander"]);
  }

  return out.slice(0, 5);
}

// ────────── PRUNE (prompt-facing) ──────────
// Keep high-signal pieces ONLY for LLM, remove forbidden families.
// Add tiny grounding: plan + examples.
function pruneFeatures(f: Features) {
  return {
    meta: {
      commander: {
        name: f.meta.commander.name,
        text: (f.meta.commander.text || "").replace(/\s+/g, " ").slice(0, 240),
      },
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
      "token",
      "blink",
      "copy",
      "choose_modes",
      "flash",
    ]),
    // Curve kept for overview only; not used in difficulty heuristics
    curve: f.curve,
    type_counts: f.type_counts,
    // Keyword presence is fine; the model sees a compact map
    keyword_histogram: f.keyword_histogram,
    stack_complexity_markers: Array.from(
      new Set(f.stack_complexity_markers || []),
    ).slice(0, 8),
    // Signals for overview grounding; difficulty uses "examples" instead
    signals: (f.signals || [])
      .slice(0, 8)
      .map((s) => ({ n: s.name, mv: s.mv, t: (s.tags || []).slice(0, 3) })),
    // Needed families retained (allowed)
    interaction: (f as any).interaction,
    upkeep_load: (f as any).upkeep_load,
    token_profile: (f as any).token_profile,
    color_tension_index: (f as any).color_tension_index,

    // New: tiny grounding anchors for difficulty prompt
    plan: derivePlan(f),
    examples: deriveExamples(f),
  };
}

// ────────── OVERVIEW PROMPT (kept lean; forbidden families removed) ──────────
function buildPrompt(
  prunedFeatures: ReturnType<typeof pruneFeatures>,
  cards: CardMini[],
): string {
  return `Return ONLY minified JSON:
{"tagline":string,"tags":string[],"strengths":string[],"weaknesses":string[],"confidence":0..1}

Rules: tagline ≤ 60 chars. tags: pick 3–6 from ${TAG_VOCAB}. strengths/weaknesses: 2–4 items each, 1–3 words.
Cards:
${JSON.stringify(cards)},
Features:
${JSON.stringify(prunedFeatures)}`;
}

// ────────── OVERVIEW AI CALL ──────────
async function getAiAssessment(
  pruned: ReturnType<typeof pruneFeatures>,
  cards: CardMini[],
) {
  const completion = await openai.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Use this tags vocabulary when possible: ${TAG_VOCAB}. Output strict minified JSON only.`,
      },
      { role: "user", content: buildPrompt(pruned, cards) },
    ],
  });

  if (LOG_TOKENS && completion.usage) {
    console.log(
      `[tokens overview] prompt=${completion.usage.prompt_tokens} out=${completion.usage.completion_tokens} total=${completion.usage.total_tokens}`,
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

// ────────── DIFFICULTY CORE (new consolidated fields) ──────────
type DifficultyCore = {
  // consolidated numeric core
  ramp_total?: number;
  tutors_total?: number;
  int_instant?: number;
  int_mass?: number;
  int_spot?: number;
  upkeep_triggers?: number;
  upkeep_costs?: number;
  activations_repeatable?: number;
  color_tension_color?: string; // one of W/U/B/R/G
  color_tension_max?: number; // 0.xx.. value, 2 decimals

  // tiny grounding
  plan?: string[]; // ≤3 words
  examples?: Array<[string, string]>; // 3–5 [name, role]
};

function round(n: unknown, d = 2) {
  return typeof n === "number" ? +n.toFixed(d) : n;
}

function pruneZeros<T>(obj: T): T {
  if (obj == null) return obj;
  if (Array.isArray(obj)) {
    const arr = obj.map(pruneZeros).filter((v) => v !== undefined) as any[];
    return (arr.length ? (arr as any) : undefined) as any;
  }
  if (typeof obj === "object") {
    const out: Record<string, any> = {};
    for (const [k, v0] of Object.entries(obj as Record<string, any>)) {
      const v = pruneZeros(v0);
      if (v === undefined) continue;
      if (typeof v === "number" && v === 0) continue;
      if (
        typeof v === "object" &&
        !Array.isArray(v) &&
        Object.keys(v).length === 0
      )
        continue;
      out[k] = v;
    }
    return (Object.keys(out).length ? (out as any) : undefined) as any;
  }
  return obj as any;
}

function cap(n: number | undefined, max: number) {
  if (typeof n !== "number") return undefined;
  return Math.min(n, max);
}

function difficultyCoreFromPruned(
  pf: ReturnType<typeof pruneFeatures>,
): DifficultyCore {
  const counts = pf.counts || {};
  const interaction = pf.interaction || {};
  const upkeep = pf.upkeep_load || {};
  const cti = pf.color_tension_index || {};

  // Consolidations
  const ramp_total =
    (counts.ramp || 0) + (counts.rocks || 0) + (counts.dorks || 0);
  const tutors_total = counts.tutors || 0;

  // Interaction split
  const int_instant = interaction.instant || 0;
  const int_mass = interaction.mass || 0;
  const int_spot = interaction.spot || 0;

  // Upkeep (capped)
  const upkeep_triggers = cap(upkeep.recurring_triggers || 0, 8);
  const upkeep_costs = cap(upkeep.mandatory_costs || 0, 3);
  const activations_repeatable = cap(upkeep.repeatable_activations || 0, 25);

  // Color tension: pick the max color/value
  let color_tension_color: string | undefined;
  let color_tension_max: number | undefined;
  for (const [c, v] of Object.entries(cti as Record<string, number>)) {
    if (typeof v !== "number") continue;
    if (color_tension_max === undefined || v > (color_tension_max as number)) {
      color_tension_max = v;
      color_tension_color = c;
    }
  }
  if (typeof color_tension_max === "number") {
    color_tension_max = round(color_tension_max, 2) as number;
  }

  const core: DifficultyCore = {
    ramp_total,
    tutors_total,
    int_instant,
    int_mass,
    int_spot,
    upkeep_triggers,
    upkeep_costs,
    activations_repeatable,
    color_tension_color,
    color_tension_max,
    plan: Array.isArray(pf.plan) ? pf.plan.slice(0, 3) : undefined,
    examples: Array.isArray(pf.examples) ? pf.examples.slice(0, 5) : undefined,
  };

  // Prune zeros/empties to save tokens
  return (pruneZeros(core) || {}) as DifficultyCore;
}

// ────────── DIFFICULTY PROMPT (concise rules; new field names) ──────────
function buildDifficultyPrompt(
  prunedFeatures: ReturnType<typeof pruneFeatures>,
): string {
  const INPUT = JSON.stringify(difficultyCoreFromPruned(prunedFeatures));

  return `Return ONLY minified JSON with EXACT keys:
{"bracket":1..10,"bracket_explanation":string(<=170),
"complexity":"Low"|"Medium"|"High","complexity_explanation":string(<=170),
"pilot_skill":"Beginner"|"Intermediate"|"Advanced","pilot_skill_explanation":string(<=170),
"interaction_intensity":"Low"|"Medium"|"High","interaction_explanation":string(<=170),
"upkeep":"Low"|"Medium"|"High","upkeep_explanation":string(<=170),
"confidence":0..1}

Rules: one sentence per explanation; 60–170 chars; plain words; no lists/newlines/quotes; do not restate Features.

Apply internal heuristics silently. Output only the function arguments.

F=${INPUT}`;
}

// Same as above but tailored to the full card list.
function buildDifficultyPromptFromList(
  cards: CardMini[],
  rawFeatures: any,
): string {
  const INPUT = JSON.stringify(cards);
  const features = JSON.stringify(rawFeatures);
  return `Return ONLY minified JSON with EXACT keys:
{"bracket":1..10,"bracket_explanation":string(<=170),
"complexity":"Low"|"Medium"|"High","complexity_explanation":string(<=170),
"pilot_skill":"Beginner"|"Intermediate"|"Advanced","pilot_skill_explanation":string(<=170),
"interaction_intensity":"Low"|"Medium"|"High","interaction_explanation":string(<=170),
"upkeep":"Low"|"Medium"|"High","upkeep_explanation":string(<=170),
"confidence":0..1}

Rules: one sentence per explanation; 60–150 chars.

Apply internal heuristics silently. Output only the function arguments.
Extracted deck features=${features}
Cards=${INPUT}`;
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
    bracket: Math.min(10, Math.max(1, Number(obj.bracket) || 5)),
    bracket_explanation: clampStr(obj.bracket_explanation, 160),
    complexity: ["Low", "Medium", "High"].includes(obj.complexity)
      ? obj.complexity
      : "Medium",
    complexity_explanation: clampStr(obj.complexity_explanation, 160),
    pilot_skill: normalizePilotSkill(obj.pilot_skill),
    pilot_skill_explanation: clampStr(obj.pilot_skill_explanation, 160),
    interaction_intensity: ["Low", "Medium", "High"].includes(
      obj.interaction_intensity,
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

async function getDifficultyAssessment(cards: CardMini[], rawFeatures) {
  // const prompt = buildDifficultyPrompt(pruned);

  const prompt2 = buildDifficultyPromptFromList(cards, rawFeatures);

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
          "Return ONLY a function call to set_difficulty. Do NOT output assistant text. " +
          "You are an expert MTG EDH deck assistant designed to assess difficulty metrics based on a full card list. " +
          "No reasoning, no lists, no preamble. Total output must fit within budget; " +
          "truncate explanations as needed but keep them >= 10 chars. Total tokens used MUST be less than 1000.",
      },
      { role: "user", content: prompt2 },
    ],
  });

  if ((completion as any).usage) {
    const u = (completion as any).usage;
    console.log(
      `[tokens difficulty] prompt=${u.prompt_tokens} out=${u.completion_tokens} total=${u.total_tokens}`,
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
      ai_bracket: String(d.bracket),
      ai_complexity: d.complexity,
      ai_pilot_skill: d.pilot_skill,
      ai_interaction: d.interaction_intensity,
      ai_upkeep: d.upkeep,
      ai_bracket_explanation: d.bracket_explanation,
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
      `Backfill task="${TASK}" limit=${LIMIT} force=${FORCE} model=${MODEL} concurrency=${AI_CONCURRENCY}`,
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
        (d) => d.commander && d.deck_cards?.length > 0,
      );

      const results = await Promise.allSettled(
        candidates.map((deck) =>
          limit(async () => {
            const t0 = nowMs();

            try {
              if (!deck.commander || deck.deck_cards.length === 0) {
                console.warn(
                  `Skipping ${deck.id} (${deck.name}): missing commander or cards`,
                );
                return;
              }

              // Extract & prune features (shared)
              const rawFeatures = buildFeatures(deck as any);
              const features = pruneFeatures(rawFeatures);
              const f1 = nowMs();
              const f0 = nowMs();
              const cards = await fetchMainboardCardMinis(deck.id);

              if (TASK === "difficulty") {
                const diff = await getDifficultyAssessment(cards, rawFeatures);
                const f2 = nowMs();
                await updateDeckDifficulty(deck.id, diff);
                const f3 = nowMs();

                console.log(
                  `✓ [difficulty] ${deck.name}: P${diff.bracket}/${
                    diff.complexity
                  }/${diff.pilot_skill}/I${diff.interaction_intensity}/U${
                    diff.upkeep
                  } — total ${f3 - t0}ms (features ${f1 - f0}ms, openai ${
                    f2 - f1
                  }ms, db ${f3 - f2}ms)`,
                );
              } else {
                const ai = await getAiAssessment(features, cards);
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
                  }ms)`,
                );
              }

              totalProcessed++;
            } catch (e) {
              console.error(
                `✗ Failed for ${deck.id} (${deck.name}):`,
                e instanceof Error ? e.message : e,
              );
            }
          }),
        ),
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
