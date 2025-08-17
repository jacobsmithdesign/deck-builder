import "dotenv/config";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import dotenv from "dotenv";
import pLimit from "p-limit";

import { buildFeatures } from "@/lib/ai/features";

dotenv.config({ path: ".env.local" });

// Strict function schema for tool-calling
const DIFFICULTY_FN = {
  type: "function",
  function: {
    name: "set_difficulty",
    description: "Return difficulty ratings with short explanations.",
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

// ---------- ENV ----------
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const AI_CONCURRENCY = Number(process.env.AI_CONCURRENCY ?? 3);
const LOG_TOKENS = true;

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
const TASK = (args.task as string) || "overview"; // "overview" | "difficulty"

// ---------- SUPABASE / OPENAI ----------
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});
const openai = new OpenAI({ apiKey: OPENAI_API_KEY, maxRetries: 1 });

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
  commander_uuid?: string | null;
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

// ---------- DIFFICULTY-ONLY OUTPUT SCHEMA ----------
const DifficultyJsonSchema = z.object({
  power_level: z.number().min(1).max(10),
  power_level_explanation: z.string().min(10).max(170),

  complexity: z.enum(["Low", "Medium", "High"]),
  complexity_explanation: z.string().min(10).max(170),

  pilot_skill: z.enum(["Beginner", "Intermediate", "Advanced"]),
  pilot_skill_explanation: z.string().min(10).max(170),

  interaction_intensity: z.enum(["Low", "Medium", "High"]),
  interaction_explanation: z.string().min(10).max(170),

  upkeep: z.enum(["Low", "Medium", "High"]),
  upkeep_explanation: z.string().min(10).max(170),

  confidence: z.number().min(0).max(1).optional(),
});
type DifficultyOutput = z.infer<typeof DifficultyJsonSchema>;

// ---------- FETCH (trimmed columns to reduce payload) ----------
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

// Fetch next batch that still needs difficulty explanations
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
        "ai_spec_version.neq.v4.5-difficulty-axes",
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

// ---------- PROMPT (lean) + FEATURES PRUNE ----------
const TAG_VOCAB =
  '["Token Swarm","Treasure","Aristocrats","Graveyard","Reanimator","Stax","Voltron","Spellslinger","Blink","+1/+1 Counters","Lifegain","Control","Combo","Ramp","Landfall","Mill","Extra Turns","Vehicles","Dragons","Elves","Artifacts","Enchantress","Aura","Discard","Steal/Copy","Flicker","Proliferate","Burn","Big Mana"]';

type Features = ReturnType<typeof buildFeatures>;

function pick<T extends Record<string, any>>(obj: T, keys: string[]) {
  const out: Record<string, any> = {};
  for (const k of keys) if (obj && obj[k] != null) out[k] = obj[k];
  return out;
}

// keep only high-signal pieces for overview (unchanged behavior)
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
      "token",
      "blink",
      "copy",
      "choose_modes",
      "flash",
    ]),
    curve: f.curve,
    type_counts: f.type_counts,
    keyword_histogram: f.keyword_histogram,
    interaction_density: Number(
      (f as any).interaction_density?.toFixed?.(3) ?? f.interaction_density ?? 0
    ),
    stack_complexity_markers: Array.from(
      new Set(f.stack_complexity_markers || [])
    ).slice(0, 8),
    signals: (f.signals || [])
      .slice(0, 10)
      .map((s) => ({ n: s.name, mv: s.mv, t: (s.tags || []).slice(0, 3) })),
    // additional fields (used by difficulty slice builder; harmless for overview)
    interaction: (f as any).interaction,
    upkeep_load: (f as any).upkeep_load,
    c_pips: (f as any).c_pips,
    effective_curve: (f as any).effective_curve,
    token_profile: (f as any).token_profile,
    tutor_breadth: (f as any).tutor_breadth,
    color_tension_index: (f as any).color_tension_index,
  };
}

// --------- ORIGINAL OVERVIEW PROMPT ----------
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

// ---------- ORIGINAL AI CALL (cap output) ----------
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

  if (LOG_TOKENS && completion.usage) {
    console.log(
      `[tokens overview] prompt=${completion.usage.prompt_tokens} out=${completion.usage.completion_tokens} total=${completion.usage.total_tokens}`
    );
  }

  const raw = completion.choices[0]?.message?.content ?? "{}";
  return AiJsonSchema.parse(JSON.parse(raw));
}

// ---------- ORIGINAL UPDATE (column names mirror DB) ----------
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

// ---------- DIFFICULTY: ultra-tiny drivers ----------
type DifficultyTiny = {
  // core
  av: number; // avg mana value
  n: number; // nonland count (mainboard_count)

  // ramp/tutors
  r?: number; // ramp (non-rocks/dorks if you track it)
  rk?: number; // rocks
  dk?: number; // dorks
  tu?: number; // total tutors (broad+narrow or counts.tutors)

  // interaction mix
  wp?: number; // wipes
  sp?: number; // spot removal
  co?: number; // counters
  idn?: number; // interaction density (0..1)
  im?: number; // instants
  imass?: number; // mass removal (from interaction.mass)
  isp?: number; // spot count (from interaction.spot)

  // upkeep load
  up_rt?: number; // recurring triggers
  up_mc?: number; // mandatory costs
  up_ra?: number; // repeatable activations

  // {C} tension + color tension
  cg?: number; // {C} demand
  cs?: number; // {C} supply
  ct?: number; // color tension (avg over colors)
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

function difficultyTinyFromPruned(
  pf: ReturnType<typeof pruneFeatures>
): DifficultyTiny {
  const counts = pf.counts || {};
  const tb = pf.tutor_breadth || { broad: 0, narrow: 0 };
  const tu =
    typeof counts.tutors === "number"
      ? counts.tutors
      : (tb.broad || 0) + (tb.narrow || 0);

  // color tension avg (compact scalar 0..1)
  const cti = pf.color_tension_index || {};
  const ctVals = Object.values(cti).filter(
    (x): x is number => typeof x === "number"
  );
  const ct = ctVals.length
    ? ctVals.reduce((a, b) => a + b, 0) / ctVals.length
    : 0;

  const cPips = pf.c_pips || { demand: 0, supply: 0 };

  const tiny: DifficultyTiny = {
    av: round(Number(pf.meta.avg_mv ?? 0), 2) as number,
    n: Number(pf.meta.mainboard_count ?? 0),

    r: counts.ramp || 0,
    rk: counts.rocks || 0,
    dk: counts.dorks || 0,
    tu,

    wp: counts.wipes || 0,
    sp: counts.spot || 0,
    co: counts.counters || 0,
    idn: pf.interaction_density ?? 0,
    im: pf.interaction?.instant || 0,
    imass: pf.interaction?.mass || 0,
    isp: pf.interaction?.spot || 0,

    up_rt: pf.upkeep_load?.recurring_triggers || 0,
    up_mc: pf.upkeep_load?.mandatory_costs || 0,
    up_ra: pf.upkeep_load?.repeatable_activations || 0,

    cg: cPips.demand || 0,
    cs: cPips.supply || 0,
    ct: round(ct, 3) as number,
  };

  // prune zeros to save tokens
  return (pruneZeros(tiny) || { av: 0, n: 0 }) as DifficultyTiny;
}

// ---------- DIFFICULTY-ONLY PROMPT (lean + readable) ----------
function buildDifficultyPrompt(
  prunedFeatures: ReturnType<typeof pruneFeatures>
): string {
  const INPUT = JSON.stringify(difficultyTinyFromPruned(prunedFeatures));

  return `Return ONLY minified JSON with EXACT keys: {"power_level":1..10,"power_level_explanation":string(<=160),"complexity":"Low"|"Medium"|"High","complexity_explanation":string(<=160),"pilot_skill":"Beginner"|"Intermediate"|"Advanced","pilot_skill_explanation":string(<=160),"interaction_intensity":"Low"|"Medium"|"High","interaction_explanation":string(<=160),"upkeep":"Low"|"Medium"|"High","upkeep_explanation":string(<=160),"confidence":0..1}

Be STRICTLY EXTRACTIVE from F; no unseen cards. Each explanation: 1 sentence, 120–150 chars, no lists/newlines/quotes, no field names or abbreviations; use plain words with ≤3 numbers.

Fields available: av,n,r,rk,dk,tu,wp,sp,co,idn,im,imass,isp,up_rt,up_mc,up_ra,cg,cs,ct.

Heuristics:
- power_level: base 4; +1 per ⌊(r+rk+dk)/3⌋; +1 per ⌊tu/2⌋; +1 if (co+im)≥5; −1 if av≥4.5 and (r+rk+dk)<5; −1 if cg>cs; −1 if ct≥0.6; clamp 1..10; P≥9 only if tu≥6 or co≥5 or im≥8 or rk≥7 or (av≤2.5 and r+rk+dk≥6).
- complexity: Low if (im+co)≤2 and (up_rt+up_ra)≤8 and ct<0.3; High if (im+co)≥6 or up_ra≥20 or ct≥0.6 or cg>cs; else Medium.
- pilot_skill: mirror complexity; bump up if av≥4.2 and (r+rk+dk)<6 or interaction heavy; reduce one tier if tu≥4.
- interaction_intensity: Low if im≤2 and isp≤3 and wp≤1; High if im≥6 or co≥3 or idn≥0.18 or wp≥3; else Medium.
- upkeep: Low if up_rt+up_ra≤8 and up_mc=0; High if up_ra≥20 or up_rt≥6 or up_mc≥2; else Medium.

F=${INPUT}`;
}

// ---------- DIFFICULTY-ONLY AI CALL ----------
// 2) Post-sanitizer so enums never break and texts are clipped
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
  const choice = c.choices?.[0];
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

// 3) Difficulty call using tool-calling (tiny output, fast)
async function getDifficultyAssessment(
  pruned: ReturnType<typeof pruneFeatures>
) {
  const completion = await openai.chat.completions.create({
    model: MODEL,
    tools: [DIFFICULTY_FN],
    tool_choice: { type: "function", function: { name: "set_difficulty" } },
    response_format: { type: "json_object" }, // keep, but optional when forcing tool call
    messages: [
      {
        role: "system",
        content:
          "You are an expert MTG Commander analyst. Be conservative, extractive, and data-grounded. Return ONLY a call to set_difficulty.",
      },
      { role: "user", content: buildDifficultyPrompt(pruned) },
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

// ---------- UPDATE DIFFICULTY COLUMNS ----------
async function updateDeckDifficulty(id: string, d: DifficultyOutput) {
  const { error } = await supabase
    .from("decks")
    .update({
      // existing axes
      ai_power_level: String(d.power_level),
      ai_complexity: d.complexity,
      ai_pilot_skill: d.pilot_skill,
      ai_interaction: d.interaction_intensity,

      // new axis
      ai_upkeep: d.upkeep,

      // explanations (for your UI toggles)
      ai_power_level_explanation: d.power_level_explanation,
      ai_complexity_explanation: d.complexity_explanation,
      ai_pilot_skill_explanation: d.pilot_skill_explanation,
      ai_interaction_explanation: d.interaction_explanation,
      ai_upkeep_explanation: d.upkeep_explanation,

      ai_spec_version: "v4.5-difficulty-axes",
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
      `Backfill task="${TASK}" limit=${LIMIT} force=${FORCE} model=${MODEL} concurrency=${AI_CONCURRENCY}`
    );

    const limit = pLimit(AI_CONCURRENCY);
    let offset = 0;
    let totalProcessed = 0;

    while (true) {
      const decks =
        TASK === "difficulty" && !FORCE
          ? await fetchBatchNeedingDifficulty()
          : await fetchDeckPage(offset); // your existing paged fetch
      if (decks.length === 0) break;

      const page = Math.floor(offset / LIMIT) + 1;
      console.log(`Page ${page}: fetched ${decks.length}, processing…`);

      // safety filter (fetch already enforces most of this)
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

              // Extract & prune features (shared)
              const f0 = nowMs();
              const rawFeatures = buildFeatures(deck as any);
              const features = pruneFeatures(rawFeatures);
              const f1 = nowMs();

              if (TASK === "difficulty") {
                // difficulty-only path (uses tiny slice inside prompt)
                const diff = await getDifficultyAssessment(features);
                const f2 = nowMs();
                await updateDeckDifficulty(deck.id, diff);
                const f3 = nowMs();

                console.log(
                  `✓ [difficulty] ${deck.name}: P${diff.power_level}/${diff.complexity}/${diff.pilot_skill}/I${diff.interaction_intensity}/U${diff.upkeep} — ` +
                    `total ${f3 - t0}ms (features ${f1 - f0}ms, openai ${
                      f2 - f1
                    }ms, db ${f3 - f2}ms)`
                );
              } else {
                // existing overview path (unchanged)
                const ai = await getAiAssessment(features);
                const f2 = nowMs();
                await updateDeckAI(deck.id, ai);
                const f3 = nowMs();

                console.log(
                  `✓ [overview] ${deck.name}: ${ai.tagline} [P${ai.power_level}/C${ai.complexity}/S${ai.pilot_skill}/I${ai.interaction_intensity}] — ` +
                    `total ${f3 - t0}ms (features ${f1 - f0}ms, openai ${
                      f2 - f1
                    }ms, db ${f3 - f2}ms)`
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
        offset += LIMIT; // always advance on paged mode
      }
    }

    console.log(`Done. Processed ${totalProcessed} decks.`);
  } catch (err) {
    console.error("Fatal error:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
})();
