#!/usr/bin/env tsx
import "dotenv/config";
import OpenAI from "openai";
import dotenv from "dotenv";
import pLimit from "p-limit";
import { createClient } from "@supabase/supabase-js";

// If you can reuse your existing helpers, import them.
// Otherwise copy the functions into this script or a shared package.
import { buildFeatures } from "@/lib/ai/features";
import { compressLands } from "@/lib/ai/landCompression";

dotenv.config({ path: ".env.local" });
/** ---------- ENV ---------- */
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const AI_CONCURRENCY = Number(process.env.AI_CONCURRENCY ?? 3);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE || !OPENAI_API_KEY) {
  console.error(
    "Missing env vars. Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY"
  );
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
 * --limit=50            max rows per page (default 30)
 * --force=true|false    process even if already analysed (default false)
 * --pages=all|N         number of pages to scan (default "all" = until empty)
 * --type="Commander Deck"   deck type filter
 */
const LIMIT = Number(args.limit ?? 30);
const FORCE = args.force === "true" || args.force === "1";
const PAGES = args.pages ?? "all";
const DECK_TYPE = args.type ?? "Commander Deck";

/** ---------- SUPABASE / OPENAI ---------- */
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

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
  // We pull related AI tables so we can skip already-analysed decks in code.
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
    .eq("type", DECK_TYPE) // official precons
    .is("user_id", null) // your “official WotC” criterion
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
  ) {
    return true;
  }
  return false;
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
              archetype: {
                "axes": { "<slug-1>": 0, ... },
                "explanation_md": { "<slug-1>": <markdown string>, ... }, 
                "description": <text> (1-2 sentences)
              },
              sw: {
                "strengths": { "name" (1-2 words): <markdown string> (3-5 sentences), ... },
                "weaknesses": { "name" (1-2 words): <markdown string> (3-5 sentences), ... },

              },
              difficulty: {
                "power_level": <number> (1-10),
                "power_level_explanation": <string>(<=170),
                "complexity":"Low"|"Medium"|"High",
                "complexity_explanation":string(<=170),
                "pilot_skill":"Beginner"|"Intermediate"|"Advanced",
                "pilot_skill_explanation":string(<=170),
                "interaction_intensity":"Low"|"Medium"|"High",
                "interaction_explanation":string(<=170),              
              },
              pillars: { "<slug-1>": <markdown string> (2-4 sentences), ... }

            Archetype vocabulary=${TAG_VOCAB}

            RULES:
            archetypes: 4–7 short lowercase slugs that capture the deck’s playstyle and card frequency. Choose from archetype vocabulary. If an archetype that does not exist in the vocabular could be derived from the commander or the cards always include it. 
            axes: ranked 0–100, keys ⊆ archetypes, reflecting the strength of each chosen archetype in this deck.

            explanation_md: maximum 120 words in Markdown, purely extractive. Explain the reasoning behind the archetype's rank and its impact on the deck's playstyle. You may use some example cards from the card list justify the archetypes and their relative weighting. 

            strengths/weaknesses: 2–4 items, 1–3 words.

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

/** ---------- AI CALL ---------- */
async function runAnalysis(deck: DeckRow) {
  // Build filtered “cards” array used in your current route
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

  const rawFeatures = buildFeatures({
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

  const completion = await openai.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are an expert MTG Commander deck analyst. Your job is to read a deck of any bracket to extract its core identity. You must identify its archetypes, strengths and weaknesses, accurately assess its difficulty for most players, and identify its main pillars. ONLY USE CARDS IN DECK INFO. Do not invent cards, categories, or details that are not directly supported. Return exactly one JSON object.",
      },
      { role: "user", content: prompt },
    ],
  });

  const json = JSON.parse(completion.choices[0]?.message?.content ?? "{}");

  // very light guard
  if (!json || !json.archetype || !json.difficulty) {
    throw new Error("Model output missing required fields");
  }

  return json;
}

/** ---------- UPSERTS ---------- */
async function upsertAll(deckId: string, json: any) {
  // 1) difficulty
  {
    const { error } = await supabase.from("deck_ai_difficulty").upsert({
      deck_id: deckId,
      power_level: json.difficulty.power_level,
      power_level_explanation: json.difficulty.power_level_explanation,
      complexity: json.difficulty.complexity,
      complexity_explanation: json.difficulty.complexity_explanation,
      pilot_skill: json.difficulty.pilot_skill,
      pilot_skill_explanation: json.difficulty.pilot_skill_explanation,
      interaction_intensity: json.difficulty.interaction_intensity,
      interaction_explanation: json.difficulty.interaction_explanation,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  }

  // 2) strengths/weaknesses
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

  // 3) pillars
  {
    const { error } = await supabase.from("deck_ai_pillars").upsert({
      deck_id: deckId,
      pillars: json.pillars ?? {},
    });
    if (error) throw error;
  }

  // 4) archetype overview
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
    `Backfilling full analysis… type="${DECK_TYPE}" limit=${LIMIT} force=${FORCE} model=${MODEL} concurrency=${AI_CONCURRENCY}`
  );

  const limit = pLimit(AI_CONCURRENCY);
  let offset = 0;
  let pageNum = 0;
  let processed = 0;

  while (true) {
    pageNum++;
    const decks = await fetchDeckPage(offset);
    if (decks.length === 0) break;

    // Filter if not forcing: skip decks that already have AI rows
    const toProcess = FORCE
      ? decks
      : decks.filter((d) => {
          // consider analysed if ANY of the 4 exists; tune if you want ALL
          return !(
            d.deck_archetype_overview ||
            d.deck_ai_difficulty ||
            d.deck_ai_strengths_weaknesses ||
            d.deck_ai_pillars
          );
        });

    console.log(
      `Page ${pageNum}: fetched ${decks.length} — will process ${toProcess.length}`
    );

    const results = await Promise.allSettled(
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

    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed) console.warn(`⚠ ${failed} failed on this page`);

    if (PAGES !== "all" && pageNum >= Number(PAGES)) break;

    // Only advance the offset when forcing, or always? We want to scan everything.
    offset += LIMIT;
  }

  console.log(`Done. Processed ${processed} decks.`);
})().catch((e) => {
  console.error("Fatal error:", e?.message || e);
  process.exit(1);
});
