// app/api/ai/analyse/stream/route.ts
import { NextRequest } from "next/server";
import OpenAI from "openai";
import { buildFeatures } from "@/lib/ai/features";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
const ai_spec = "v5-difficulty-axes-gpt-4.1";

function sse(event: string, data: any) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deckId = searchParams.get("deckId");

  if (!deckId) {
    return new Response("Missing deckId", { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const supabase = await createServerSupabase();
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        maxRetries: 1,
      });
      const enc = new TextEncoder();
      const write = (event: string, data: any) =>
        controller.enqueue(enc.encode(sse(event, data)));
      const ping = setInterval(
        () => controller.enqueue(enc.encode(": ping\n\n")),
        15000
      );

      try {
        write("progress", { step: "auth", progress: 5 });

        // Auth + ownership guard
        const { data: userRes } = await supabase.auth.getUser();
        const user = userRes?.user;
        if (!user) {
          write("error", { message: "Not signed in" });
          controller.close();
          clearInterval(ping);
          return;
        }

        write("progress", { step: "fetching deck", progress: 15 });

        // Fetch deck + verify ownership
        const { data: deckRow, error: deckErr } = await supabase
          .from("decks")
          .select(
            `
            id, name, user_id,
            commander:cards!decks_commander_uuid_fkey(uuid,name,mana_value,mana_cost,type,text),
            deck_cards(
              count, board_section,
              card:cards!deck_cards_card_uuid_fkey(uuid,name,mana_value,mana_cost,type,text)
            )
          `
          )
          .eq("id", deckId)
          .eq("deck_cards.board_section", "mainboard")
          .single();

        if (deckErr || !deckRow)
          throw new Error(deckErr?.message || "Deck not found");
        if (deckRow.user_id !== user.id) {
          write("error", { message: "You do not own this deck." });
          controller.close();
          clearInterval(ping);
          return;
        }

        write("progress", { step: "building features", progress: 35 });
        const rawFeatures = buildFeatures(deckRow as any);

        write("progress", { step: "extracting cards", progress: 45 });
        const { data: cardRows, error: cardErr } = await supabase
          .from("decks")
          .select(
            `
            deck_cards:deck_cards!inner(
              count, board_section,
              card:cards!deck_cards_card_uuid_fkey(name,mana_value,type,text)
            )
          `
          )
          .eq("id", deckId)
          .eq("deck_cards.board_section", "mainboard")
          .single();
        if (cardErr) throw cardErr;

        const cards = ((cardRows?.deck_cards ?? []) as any[]).map(
          ({ card }) => ({
            name: card.name,
            mana_value: card.mana_value ?? 0,
            type: card.type,
            text: card.text ?? "",
          })
        );

        // One unified prompt (overview + difficulty)
        write("progress", { step: "calling OpenAI", progress: 65 });
        const prompt = (() => {
          const CARDS = JSON.stringify(cards);
          const FEATURES = JSON.stringify(rawFeatures);
          const TAG_VOCAB =
            '["Token Swarm","Treasure","Aristocrats","Graveyard","Reanimator","Stax","Voltron","Spellslinger","Blink","+1/+1 Counters","Lifegain","Control","Combo","Ramp","Landfall","Mill","Extra Turns","Vehicles","Dragons","Elves","Artifacts","Enchantress","Aura","Discard","Steal/Copy","Flicker","Proliferate","Burn","Big Mana"]';

          return `Return ONLY minified JSON with EXACT keys:
{
"tagline":string,
"tags":string[],
"strengths":string[],
"weaknesses":string[],
"confidence":0..1,
"power_level":1..10,"power_level_explanation":string(<=170),
"complexity":"Low"|"Medium"|"High","complexity_explanation":string(<=170),
"pilot_skill":"Beginner"|"Intermediate"|"Advanced","pilot_skill_explanation":string(<=170),
"interaction_intensity":"Low"|"Medium"|"High","interaction_explanation":string(<=170),
"upkeep":"Low"|"Medium"|"High","upkeep_explanation":string(<=170),
"confidence":0..1}

Rules: tagline ≤ 60 chars. tags: pick 3–6 from ${TAG_VOCAB}. strengths/weaknesses: 2–4 items each, 1–3 words.
Explanations: one sentence each; 60–170 chars; plain words; no lists/newlines/quotes.
Cards:${CARDS}`;
        })();

        const completion = await openai.chat.completions.create({
          model: MODEL,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "Output strict minified JSON only. Be extractive and conservative; no assumptions beyond provided features/cards.",
            },
            { role: "user", content: prompt },
          ],
        });

        write("progress", { step: "parsing", progress: 85 });
        const json = JSON.parse(
          completion.choices[0]?.message?.content ?? "{}"
        );

        // Validate / normalize
        const pick = <T extends object>(o: T, k: keyof T) => o?.[k];
        const overview = {
          tagline: String(pick(json, "tagline") ?? ""),
          tags: (Array.isArray(json.tags) ? json.tags : []).slice(0, 6),
          strengths: (Array.isArray(json.strengths)
            ? json.strengths
            : []
          ).slice(0, 4),
          weaknesses: (Array.isArray(json.weaknesses)
            ? json.weaknesses
            : []
          ).slice(0, 4),
          confidence: Math.max(0, Math.min(1, Number(json.confidence ?? 0.7))),
        };

        const clampStr = (s: any, n: number) =>
          String(s ?? "")
            .replace(/\s+/g, " ")
            .slice(0, n);
        const normalizePilot = (v: any) => {
          const t = String(v ?? "").toLowerCase();
          if (t === "low" || t === "novice" || t === "beginner")
            return "Beginner";
          if (t === "high" || t === "advanced") return "Advanced";
          return ["Beginner", "Intermediate", "Advanced"].includes(
            json.pilot_skill
          )
            ? json.pilot_skill
            : "Intermediate";
        };

        const difficulty = {
          power_level: Math.min(10, Math.max(1, Number(json.power_level) || 5)),
          power_level_explanation: clampStr(json.power_level_explanation, 170),
          complexity: ["Low", "Medium", "High"].includes(json.complexity)
            ? json.complexity
            : "Medium",
          complexity_explanation: clampStr(json.complexity_explanation, 170),
          pilot_skill: normalizePilot(json.pilot_skill),
          pilot_skill_explanation: clampStr(json.pilot_skill_explanation, 170),
          interaction_intensity: ["Low", "Medium", "High"].includes(
            json.interaction_intensity
          )
            ? json.interaction_intensity
            : "Medium",
          interaction_explanation: clampStr(json.interaction_explanation, 170),
          upkeep: ["Low", "Medium", "High"].includes(json.upkeep)
            ? json.upkeep
            : "Medium",
          upkeep_explanation: clampStr(json.upkeep_explanation, 170),
          confidence: Math.max(0, Math.min(1, Number(json.confidence ?? 0.7))),
        };

        write("progress", { step: "saving", progress: 92 });
        // Persist
        const { error: updateErr } = await supabase
          .from("decks")
          .update({
            tagline: overview.tagline,
            ai_tags: overview.tags,
            ai_strengths: overview.strengths,
            ai_weaknesses: overview.weaknesses,
            ai_confidence: overview.confidence,
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
          .eq("id", deckId);
        if (updateErr) throw updateErr;

        write("done", { progress: 100, deckId, overview, difficulty });
      } catch (err: any) {
        controller.enqueue(
          enc.encode(sse("error", { message: err?.message || String(err) }))
        );
      } finally {
        clearInterval(ping);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
