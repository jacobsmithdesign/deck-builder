#!/usr/bin/env tsx
import "dotenv/config";
import OpenAI from "openai";
import { Ollama } from "ollama";

import pLimit from "p-limit";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

import { buildFeatures } from "@/lib/ai/features";
import { compressLands } from "@/lib/ai/landCompression";

dotenv.config({ path: ".env.local" });

/** ---------- HARD-LOCK TO LOCAL OLLAMA ---------- */
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/v1"; // OpenAI-compatible
const MODEL = process.env.MODEL || "qwen3:4b"; // e.g. qwen2.5:14b, mistral:7b, mixtral:8x7b

/** ---------- ENV ---------- */
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const AI_CONCURRENCY = Number(process.env.AI_CONCURRENCY ?? 1);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error("Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

/** ---------- CLI ARGS ---------- */
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"];
  })
);
/**
 * --limit=50          max rows per page (default 30)
 * --force=true|false  process even if already analysed (default false)
 * --pages=all|N       number of pages to scan (default "all")
 * --type="Commander Deck"  deck type filter
 */
const LIMIT = Number(args.limit ?? 30);
const FORCE = args.force === "true" || args.force === "1";
const PAGES = args.pages ?? "all";
const DECK_TYPE = args.type ?? "Commander Deck";

/** ---------- SUPABASE / OPENAI (LOCAL ONLY) ---------- */
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});

// Key is required by SDK but ignored by Ollama
const openai = new OpenAI({
  apiKey: "ollama",
  baseURL: OLLAMA_URL,
});

const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || "http://localhost:11434",
});

/** ---------- TYPES ---------- */
type CardRow = {
  uuid: string;
  name: string | null;
  mana_value: number | null;
  mana_cost: string | null;
  type: string | null;
  text: string | null;
  identifiers?: any;
  color_identity?: string[] | null;
};
type DeckRow = {
  id: string;
  name: string;
  user_id: string | null;
  type: string | null;
  commander: CardRow | null;
  deck_cards: { count: number; board_section: string; card: CardRow }[];
  deck_archetype_overview?: { deck_id: string } | null;
  deck_ai_difficulty?: { deck_id: string } | null;
  deck_ai_strengths_weaknesses?: { deck_id: string } | null;
  deck_ai_pillars?: { deck_id: string } | null;
};

/** ---------- FETCH PAGE ---------- */
async function fetchDeckPage(offset = 0): Promise<DeckRow[]> {
  const { data, error } = await supabase
    .from("decks")
    .select(
      `
      id, name, user_id, type,
      commander:cards!decks_commander_uuid_fkey(
        uuid, name, mana_value, mana_cost, type, text, identifiers, color_identity
      ),
      deck_cards(
        count, board_section,
        card:cards!deck_cards_card_uuid_fkey(
          uuid, name, mana_value, mana_cost, type, text, identifiers, color_identity
        )
      ),
      deck_archetype_overview(deck_id),
      deck_ai_difficulty(deck_id),
      deck_ai_strengths_weaknesses(deck_id),
      deck_ai_pillars(deck_id)
    `
    )
    .eq("type", DECK_TYPE)
    .is("user_id", null)
    .order("id", { ascending: true })
    .range(offset, offset + LIMIT - 1);

  if (error) throw error;
  return (data ?? []) as unknown as DeckRow[];
}

/** ---------- HELPER: Land signal heuristic ---------- */
function isSignalLand(card: {
  type?: string | null;
  text?: string | null;
  name?: string | null;
}) {
  const type = (card.type || "").toLowerCase();
  const text = (card.text || "").toLowerCase();
  const name = (card.name || "").toLowerCase();

  if (type.includes("creature")) return true;
  const signalPatterns = [
    /draw a card/,
    /create .* token/,
    /search your library.*land/,
    /graveyard/,
    /exile.*graveyard/,
    /becomes? a creature/,
    /no maximum hand size/,
    /add .* for each/,
    /can't be countered/,
  ];
  if (signalPatterns.some((re) => re.test(text))) return true;
  if (
    /nykthos|field of the dead|urza|bojuka bog|gaea|sanctum|cabal coffers|reliquary tower/.test(
      name
    )
  )
    return true;

  return false;
}

function normaliseDifficulty(d: any) {
  // Trim + case-normalise strings
  const norm = (s?: string) => (typeof s === "string" ? s.trim() : "");

  // Map a bunch of common variants → allowed enum
  const mapToTriLevel = (v?: string) => {
    const x = norm(v).toLowerCase();
    if (["low", "lo", "light", "minimal", "little"].includes(x)) return "Low";
    if (["medium", "med", "moderate", "mid", "avg", "average"].includes(x))
      return "Medium";
    if (["high", "hi", "heavy", "intense", "strong"].includes(x)) return "High";
    // fallback if model gave junk
    return "Medium";
  };

  // power level must be 1..10 integer
  const pln = Number(d?.power_level);
  const power_level = isFinite(pln)
    ? Math.min(10, Math.max(1, Math.round(pln)))
    : 5;

  const out = {
    power_level,
    power_level_explanation: norm(d?.power_level_explanation).slice(0, 170),

    complexity: mapToTriLevel(d?.complexity),
    complexity_explanation: norm(d?.complexity_explanation).slice(0, 170),

    pilot_skill: (() => {
      const x = norm(d?.pilot_skill).toLowerCase();
      if (["beginner", "novice", "new"].includes(x)) return "Beginner";
      if (["intermediate", "mid", "average"].includes(x)) return "Intermediate";
      if (["advanced", "expert"].includes(x)) return "Advanced";
      return "Intermediate";
    })(),
    pilot_skill_explanation: norm(d?.pilot_skill_explanation).slice(0, 170),

    interaction_intensity: mapToTriLevel(d?.interaction_intensity),
    interaction_explanation: norm(d?.interaction_explanation).slice(0, 170),
  };

  return out;
}

/** ---------- PROMPT ---------- */
function buildPrompt(cards: any[], landFeatures: any, commander: any) {
  const CARDS = JSON.stringify(cards);
  const LANDFEATURES = JSON.stringify(landFeatures);
  const TAG_VOCAB =
    '["token swarm","treasure","aristocrats","graveyard","reanimator","stax","voltron","spellslinger","blink","+1/+1 counters","lifegain","control","combo","camp","landfall","mill","extra turns","vehicles","dragons","elves","artifacts","enchantress","aura","discard","steal/copy","flicker","proliferate","burn","big mana"]';

  return `
Return ONLY minified JSON with EXACT keys:
{
  "archetype": {
    "axes": { "<slug-1>": 0, ... },
    "explanation_md": { "<slug-1>": "<markdown>", ... }, 
    "description": "<1-2 sentences>"
  },
  "sw": {
    "strengths": { "<slug-1>": "<3-5 sentences markdown>", ... },
    "weaknesses": { "<slug-1>": "<3-5 sentences markdown>", ... }
  },
  "difficulty": {
    "power_level": 1-10,
    "power_level_explanation":"<=170 chars",
    "complexity":"Low"|"Medium"|"High",
    "complexity_explanation":"<=170 chars",
    "pilot_skill":"Beginner"|"Intermediate"|"Advanced",
    "pilot_skill_explanation":"<=170 chars",
    "interaction_intensity":"Low"|"Medium"|"High",
    "interaction_explanation":"<=170 chars"
  },
  "pillars": { "<slug-1>": "<2-4 sentences markdown>", ... }
}

Archetype vocabulary=${TAG_VOCAB}
RULES:
- Archetypes: 4–7 short lowercase slugs based on the deck’s actual cards.
- Axes: 0–100; keys ⊆ archetypes; reflect strength in this list.
- Explanations: purely extractive; only use provided cards.
- Do NOT invent cards.

DECK INFO:
Commander: ${JSON.stringify({
    name: commander?.name ?? null,
    type: commander?.type ?? null,
    text: commander?.text ?? null,
  })}
LandFeatures: ${LANDFEATURES}
Cards: ${CARDS}
`.trim();
}

/** ---------- AI CALL (LOCAL OLLAMA) ---------- */
async function runAnalysis(deck: DeckRow) {
  const main = (deck.deck_cards ?? [])
    .filter((dc) => (dc?.board_section || "").toLowerCase() === "mainboard")
    .map(({ card, count }) => ({
      name: card?.name,
      mana_value: card?.mana_value ?? 0,
      type: card?.type,
      text: card?.text ?? "",
      count: Number(count ?? 1),
    }))
    .filter((c) => {
      const isLand = (c.type || "").toLowerCase().includes("land");
      return !isLand || isSignalLand(c);
    });

  // You’re already using these elsewhere; leaving them for parity (even if not embedded into the prompt)
  const _rawFeatures = buildFeatures({
    id: deck.id,
    name: deck.name,
    commander: deck.commander,
    deck_cards: deck.deck_cards,
  } as any);
  const landFeatures = compressLands({
    id: deck.id,
    name: deck.name,
    commander: deck.commander,
    deck_cards: deck.deck_cards,
  } as any);

  const prompt = buildPrompt(main, landFeatures, deck.commander);

  const res = await ollama.chat({
    model: process.env.MODEL || "qwen3:4b",
    messages: [
      { role: "system", content: "Return exactly one valid JSON object." },
      { role: "user", content: prompt },
    ],
    format: "json", // enforces JSON from many Ollama models
    options: {
      num_ctx: 12000, // increase context
      num_predict: 4096, // ensure enough output
      // temperature: 0,
    },
  });

  const completion = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are an expert MTG Commander deck analyst. Return exactly one valid JSON object matching the schema. No extra text.",
      },
      { role: "user", content: prompt },
    ],
  });

  // res.message.content is your JSON string
  const raw = res.message?.content ?? "{}";
  let obj: any;
  try {
    obj = JSON.parse(raw);
  } catch (e) {
    // last-resort cleanup for trailing junk
    const maybe = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    obj = JSON.parse(maybe);
  }

  if (!obj || !obj.archetype || !obj.difficulty) {
    throw new Error("Model output missing required fields");
  }
  return obj;
}

/** ---------- UPSERTS ---------- */

async function upsertAll(deckId: string, json: any) {
  const diff = normaliseDifficulty(json.difficulty);
  // difficulty
  {
    const { error } = await supabase.from("deck_ai_difficulty").upsert({
      deck_id: deckId,
      power_level: diff.power_level,
      power_level_explanation: diff.power_level_explanation,
      complexity: diff.complexity,
      complexity_explanation: diff.complexity_explanation,
      pilot_skill: diff.pilot_skill,
      pilot_skill_explanation: diff.pilot_skill_explanation,
      interaction_intensity: diff.interaction_intensity,
      interaction_explanation: diff.interaction_explanation,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  }

  // strengths/weaknesses
  {
    const { error } = await supabase
      .from("deck_ai_strengths_weaknesses")
      .upsert({
        deck_id: deckId,
        strengths: json.sw?.strengths ?? null,
        weaknesses: json.sw?.weaknesses ?? null,
      });
    if (error) throw error;
  }

  // pillars
  {
    const { error } = await supabase.from("deck_ai_pillars").upsert({
      deck_id: deckId,
      pillars: json.pillars ?? {},
    });
    if (error) throw error;
  }

  // archetype overview
  {
    const { error } = await supabase.from("deck_archetype_overview").upsert({
      deck_id: deckId,
      axes: json.archetype.axes,
      explanation_md: json.archetype.explanation_md,
      description: json.archetype.description,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  }
}

/** ---------- MAIN ---------- */
function nowMs() {
  return Number(process.hrtime.bigint() / 1_000_000n);
}

(async () => {
  console.log(
    `Backfilling (LOCAL OLLAMA)… type="${DECK_TYPE}" limit=${LIMIT} force=${FORCE} model=${MODEL} concurrency=${AI_CONCURRENCY} base=${OLLAMA_URL}`
  );

  const limit = pLimit(AI_CONCURRENCY);
  let offset = 0;
  let pageNum = 0;
  let processed = 0;

  while (true) {
    pageNum++;
    const decks = await fetchDeckPage(offset);
    if (decks.length === 0) break;

    const toProcess = FORCE
      ? decks
      : decks.filter(
          (d) =>
            !(
              d.deck_archetype_overview ||
              d.deck_ai_difficulty ||
              d.deck_ai_strengths_weaknesses ||
              d.deck_ai_pillars
            )
        );

    console.log(
      `Page ${pageNum}: fetched ${decks.length} — will process ${toProcess.length}`
    );

    await Promise.allSettled(
      toProcess.map((deck) =>
        limit(async () => {
          const t0 = nowMs();
          try {
            if (!deck.commander || (deck.deck_cards?.length ?? 0) === 0) {
              console.warn(
                `Skipping ${deck.id} (${deck.name}): no commander or cards`
              );
              return;
            }
            const json = await runAnalysis(deck);
            await upsertAll(deck.id, json);
            processed++;
            const dt = nowMs() - t0;
            console.log(`✓ ${deck.name} — saved in ${dt}ms`);
          } catch (e: any) {
            console.error(`✗ ${deck.id} (${deck.name}): ${e?.message || e}`);
          }
        })
      )
    );

    if (PAGES !== "all" && pageNum >= Number(PAGES)) break;
    offset += LIMIT;
  }

  console.log(`Done. Processed ${processed} decks.`);
})().catch((e) => {
  console.error("Fatal error:", e?.message || e);
  process.exit(1);
});
