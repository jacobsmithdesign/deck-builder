// app/api/ai/analyse/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { buildFeatures } from "@/lib/ai/features";
import { createServerSupabase } from "@/lib/supabase/server"; // 👈 use SSR client (anon key + cookies)

// ---------- OpenAI ----------
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
const LOG_TOKENS = true;
const ai_spec = "v5-difficulty-axes-gpt-4.1";
const openai = new OpenAI({ apiKey: OPENAI_API_KEY, maxRetries: 1 });

// ---------- Types/Schemas ----------
type CardMini = {
  name: string;
  mana_value: number;
  type: string;
  text: string;
};

const AiOverviewSchema = z.object({
  tagline: z.string().min(8).max(70),
  tags: z.array(z.string()).min(3).max(6),
  strengths: z.array(z.string()).min(2).max(4),
  weaknesses: z.array(z.string()).min(2).max(4),
  confidence: z.number().min(0).max(1).optional(),
});
type AiOverviewOut = z.infer<typeof AiOverviewSchema>;

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
type DifficultyOut = z.infer<typeof DifficultyJsonSchema>;

// ---------- Helpers (use per-request client) ----------
async function getUserSupabase() {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user ?? null;
  return { supabase, user };
}

// Only fetch the deck if it belongs to the user (extra guard on top of RLS)
async function fetchOwnedDeckById(
  supabase: any,
  deckId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from("decks")
    .select(
      `
      id,
      name,
      user_id,
      commander:cards!decks_commander_uuid_fkey(uuid,name,mana_value,mana_cost,type,text),
      deck_cards(
        count, board_section,
        card:cards!deck_cards_card_uuid_fkey(uuid,name,mana_value,mana_cost,type,text)
      )
    `
    )
    .eq("id", deckId)
    .eq("user_id", userId) // 👈 enforce ownership
    .eq("deck_cards.board_section", "mainboard")
    .single();

  if (error) throw error;
  if (!data) throw new Error("Deck not found or not owned by user");
  return data as any;
}

async function fetchMainboardCardMinis(
  supabase: any,
  deckId: string,
  userId: string
): Promise<CardMini[]> {
  const { data, error } = await supabase
    .from("decks")
    .select(
      `
      id, user_id,
      deck_cards:deck_cards!inner(
        count, board_section,
        card:cards!deck_cards_card_uuid_fkey(name,mana_value,type,text)
      )
    `
    )
    .eq("id", deckId)
    .eq("user_id", userId) // 👈 enforce ownership
    .eq("deck_cards.board_section", "mainboard")
    .single();

  if (error) throw error;
  const rows =
    (data?.deck_cards as Array<{
      count: number | null;
      board_section: string;
      card: {
        name: string;
        mana_value: number | null;
        type: string;
        text: string | null;
      };
    }>) ?? [];

  return rows.map(({ card }) => ({
    name: card.name,
    mana_value: card.mana_value ?? 0,
    type: card.type,
    text: card.text ?? "",
  }));
}

// ---------- Unified prompt ----------
const TAG_VOCAB =
  '["Token Swarm","Treasure","Aristocrats","Graveyard","Reanimator","Stax","Voltron","Spellslinger","Blink","+1/+1 Counters","Lifegain","Control","Combo","Ramp","Landfall","Mill","Extra Turns","Vehicles","Dragons","Elves","Artifacts","Enchantress","Aura","Discard","Steal/Copy","Flicker","Proliferate","Burn","Big Mana"]';

function buildUnifiedAnalysisPrompt(
  cards: CardMini[],
  rawFeatures: any
): string {
  const CARDS = JSON.stringify(cards);
  const FEATURES = JSON.stringify(rawFeatures);
  return `Return ONLY minified JSON with EXACT keys:
{"tagline":string,"tags":string[],"strengths":string[],"weaknesses":string[],"confidence":0..1,
"power_level":1..10,"power_level_explanation":string(<=170),
"complexity":"Low"|"Medium"|"High","complexity_explanation":string(<=170),
"pilot_skill":"Beginner"|"Intermediate"|"Advanced","pilot_skill_explanation":string(<=170),
"interaction_intensity":"Low"|"Medium"|"High","interaction_explanation":string(<=170),
"upkeep":"Low"|"Medium"|"High","upkeep_explanation":string(<=170),"confidence":0..1}
Rules: tagline ≤60 chars. tags: 3–6 from ${TAG_VOCAB}. strengths/weaknesses: 2–4 items, 1–3 words.
Explanations: one sentence each; 60–170 chars; plain words; no lists/newlines/quotes.
Cards:${CARDS}
Features:${FEATURES}`;
}

// ---------- Run analysis (single OpenAI call) ----------
async function runUnifiedAnalysis(
  supabase: any,
  deckId: string,
  userId: string
): Promise<{ overview: AiOverviewOut; difficulty: DifficultyOut }> {
  // fetch + own
  const deck = await fetchOwnedDeckById(supabase, deckId, userId);
  const rawFeatures = buildFeatures(deck as any);
  const cards = await fetchMainboardCardMinis(supabase, deckId, userId);

  // LLM
  const completion = await openai.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Use this tags vocabulary when possible: ${TAG_VOCAB}. Output strict minified JSON only.`,
      },
      { role: "user", content: buildUnifiedAnalysisPrompt(cards, rawFeatures) },
    ],
  });

  if (LOG_TOKENS && completion.usage) {
    const u = completion.usage;
    console.log(
      `[tokens unified] prompt=${u.prompt_tokens} out=${u.completion_tokens} total=${u.total_tokens}`
    );
  }

  const json = JSON.parse(completion.choices[0]?.message?.content ?? "{}");

  // split + validate
  const overview: AiOverviewOut = AiOverviewSchema.parse({
    tagline: json.tagline,
    tags: json.tags,
    strengths: json.strengths,
    weaknesses: json.weaknesses,
    confidence: json.confidence,
  });

  const difficulty: DifficultyOut = DifficultyJsonSchema.parse({
    power_level: json.power_level,
    power_level_explanation: json.power_level_explanation,
    complexity: json.complexity,
    complexity_explanation: json.complexity_explanation,
    pilot_skill: json.pilot_skill,
    pilot_skill_explanation: json.pilot_skill_explanation,
    interaction_intensity: json.interaction_intensity,
    interaction_explanation: json.interaction_explanation,
    upkeep: json.upkeep,
    upkeep_explanation: json.upkeep_explanation,
    confidence: json.confidence,
  });

  // persist (RLS ensures user can only update their own deck)
  const { error } = await supabase
    .from("decks")
    .update({
      tagline: overview.tagline,
      ai_tags: overview.tags,
      ai_strengths: overview.strengths,
      ai_weaknesses: overview.weaknesses,
      ai_confidence: overview.confidence ?? difficulty.confidence ?? null,
      ai_power_level: String(difficulty.power_level),
      ai_complexity: difficulty.complexity,
      ai_pilot_skill: difficulty.pilot_skill,
      ai_interaction: difficulty.interaction_intensity,
      ai_upkeep: difficulty.upkeep,
      ai_power_level_explanation: difficulty.power_level_explanation,
      ai_complexity_explanation: difficulty.complexity_explanation,
      ai_pilot_skill_explanation: difficulty.pilot_skill_explanation,
      ai_interaction_explanation: difficulty.interaction_explanation,
      ai_upkeep_explanation: difficulty.upkeep_explanation,
      ai_spec_version: ai_spec,
      ai_generated_at: new Date().toISOString(),
    })
    .eq("id", deckId)
    .eq("user_id", userId); // extra guard

  if (error) throw error;

  return { overview, difficulty };
}

// ---------- Route ----------
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const deckId = searchParams.get("deckId");
    if (!deckId) {
      return NextResponse.json(
        { ok: false, error: "Missing deckId" },
        { status: 400 }
      );
    }

    const { supabase, user } = await getUserSupabase();
    if (!user)
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );

    const { overview, difficulty } = await runUnifiedAnalysis(
      supabase,
      deckId,
      user.id
    );

    return NextResponse.json({ ok: true, deckId, overview, difficulty });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
