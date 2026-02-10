// app/api/ai/analyse/stream/route.ts
import { NextRequest } from "next/server";
import OpenAI from "openai";
import { buildFeatures } from "@/lib/ai/features";
import { createServerSupabase } from "@/lib/supabase/server";
import { compressLands } from "@/lib/ai/landCompression";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
const ai_spec = "v5-difficulty-axes-gpt-4.1";
const LOG_TOKENS = process.env.LOG_TOKENS === "true"; // <- add
const LOG_DEBUG = process.env.LOG_DEBUG === "true"; // <- add

function sse(event: string, data: any) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}
// helper: server log + optional SSE mirror to client
function debugLog(
  write: (e: string, d: any) => void,
  label: string,
  data?: any,
) {
  try {
    const safe =
      data && typeof data === "object"
        ? JSON.stringify(data).slice(0, 2000)
        : String(data ?? "");
    console.log(`[analyse] ${label}:`, safe);
    if (LOG_DEBUG) write("debug", { label, data }); // <- shows in browser via SSE
  } catch (e) {
    console.log(`[analyse] ${label}: [unserializable]`);
  }
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
        15000,
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
          `,
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
        const rawLandFeatures = compressLands(deckRow as any);
        const commander = deckRow.commander;

        write("progress", { step: "extracting cards", progress: 45 });
        const { data: cardRows, error: cardErr } = await supabase
          .from("decks")
          .select(
            `
            deck_cards:deck_cards!inner(
              count, board_section,
              card:cards!deck_cards_card_uuid_fkey(name,mana_value,type,text)
            )
          `,
          )
          .eq("id", deckId)
          .eq("deck_cards.board_section", "mainboard")
          .single();
        if (cardErr) throw cardErr;

        // This function determines if a land card is important enough to keep in the card object.
        const isSignalLand = (card: {
          type?: string | null;
          text?: string | null;
          name?: string | null;
        }) => {
          const type = (card.type || "").toLowerCase();
          const text = (card.text || "").toLowerCase();
          const name = (card.name || "").toLowerCase();

          // 1. Always keep land creatures (Dryad Arbor, Mutavault, etc.)
          if (type.includes("creature")) return true;

          // 2. Known signal land heuristics
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

          // 3. Heavy-hitter names (shortcut for efficiency)
          if (
            /nykthos|field of the dead|urza|bojuka bog|gaea|sanctum|cabal coffers|reliquary tower/.test(
              name,
            )
          ) {
            return true;
          }

          // Otherwise: boring mana land → filter out
          return false;
        };

        // this is the cards array
        const cards = ((cardRows?.deck_cards ?? []) as any[])
          .map(({ card }) => ({
            name: card.name,
            mana_value: card.mana_value ?? 0,
            type: card.type,
            text: card.text ?? "",
          }))
          .filter((c) => {
            const isLand = (c.type || "").toLowerCase().includes("land");
            if (!isLand) return true; // keep all nonlands
            return isSignalLand(c); // only keep interesting lands
          });
        // One unified prompt (overview + difficulty)
        write("progress", { step: "calling OpenAI", progress: 65 });
        const prompt = (() => {
          const CARDS = JSON.stringify(cards);
          const LANDFEATURES = JSON.stringify(rawLandFeatures);
          const TAG_VOCAB =
            '["token swarm","treasure","aristocrats","graveyard","reanimator","stax","voltron","spellslinger","blink","+1/+1 counters","lifegain","control","combo","camp","landfall","mill","extra Turns","vehicles","dragons","elves","artifacts","enchantress","aura","discard","steal/copy","flicker","proliferate","burn","big mana"]';

          return `
          Return ONLY minified JSON with EXACT keys:
            {
              archetype: {
                "axes": { "<slug-1>": 0, ... },
                "explanation_md": { "<slug-1>": <markdown string>, ... }, 
                "description": <text> (2-4 sentences)
              },
              sw: {
                "strengths": { "name" (1-2 words): <markdown string> (3-6 sentences), ... },
                "weaknesses": { "name" (1-2 words): <markdown string> (3-6 sentences), ... },

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
                "bracket":<number> (1-5),           
              },
              pillars: { "<slug-1>": <markdown string> (2-4 sentences), ... }

            Archetype vocabulary=${TAG_VOCAB}

            RULES:
            You MUST be accurate about difficulty and power level assessment. 
            Consider the intent of play, not just the content of cards. Use this to determine relative strength and bracket. 

            archetypes: 4–7 short lowercase slugs that capture the deck’s playstyle and card frequency. Choose from archetype vocabulary. If an archetype that does not exist in the vocabular could be derived from the commander or the cards always include it. 
            axes: ranked 0–100, keys ⊆ archetypes, reflecting the strength of each chosen archetype in this deck.

            explanation_md: maximum 150 words in Markdown, purely extractive. Explain the reasoning behind the archetype's rank and its impact on the deck's playstyle. You may use some example cards from the card list justify the archetypes and their relative weighting. 

            strengths/weaknesses: 2–4 items, 1–3 words.
            

            Power brackets must follow this distribution:
            Bracket 1 - 2: ~50% of decks
            Bracket 3: 30%
            bracket 4-5: 20%
            Most decks are likely to be low. If uncertain, rank lower, not higher.

            Brackets 1 & 2) NO game changers, NO mass land denial, NO chaining extra turns, NO 2-card combos
            Bracket 3) 0-3 game changers, NO mass land denial, NO chaning extra turns, NO 2-card combos (before turn six)

            Bracket 1 Exhibitionist - Mostly focuses theme or goal over power
            Bracket 2 Core - Average power level deck with winning potential
            Bracket 3 Upgraded - A more powerful, focussed deck deck with high quality cards
            Bracket 4 Optimized - A well optimized deck focusing on lethality and winning quickly
            Bracket 5 cEDH - Competitive decks designed to win ASAP using metagame rules

            DECK INFO:
            Commander: ${commander}
            Land feature extraction: ${LANDFEATURES}
            Cards: ${CARDS}
            `;
        })();
        // Submission to OpenAI with full prompt
        const completion = await openai.chat.completions.create({
          model: MODEL,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You are an expert MTG Commander deck analyst. You must analyse cards from a deck to accurately determine it's strengths, weaknesses, archetype, power level, and difficulty with brutal honesty and high precision. DO NOT RANK BRACKET TOO HIGH Return only JSON in the provided format.",
            },
            { role: "user", content: prompt },
          ],
        });
        if (LOG_TOKENS && (completion as any).usage) {
          const u = (completion as any).usage;
          console.log(
            `[tokens overview] prompt=${u.prompt_tokens} out=${u.completion_tokens} total=${u.total_tokens}`,
          );
          if (LOG_DEBUG) write("debug", { label: "tokens", usage: u });
        }

        write("progress", { step: "parsing", progress: 85 });
        const json = JSON.parse(
          completion.choices[0]?.message?.content ?? "{}",
        );
        // basic guards
        if (!json || !json.archetype || !json.difficulty) {
          throw new Error("Model output missing required fields");
        }
        console.log("Full analysis model output:", json);
        write("progress", { step: "saving", progress: 92 });
        // 1) Add deck difficulty
        await supabase.from("deck_ai_difficulty").upsert({
          deck_id: deckId,
          power_level: json.difficulty.power_level,
          power_level_explanation: json.difficulty.power_level_explanation,
          complexity: json.difficulty.complexity,
          complexity_explanation: json.difficulty.complexity_explanation,
          pilot_skill: json.difficulty.pilot_skill,
          pilot_skill_explanation: json.difficulty.pilot_skill_explanation,
          interaction_intensity: json.difficulty.interaction_intensity,
          interaction_explanation: json.difficulty.interaction_explanation,
          bracket: json.difficulty.bracket,
          updated_at: new Date().toISOString(),
        });
        // 2) Add strengths and weaknesses
        await supabase.from("deck_ai_strengths_weaknesses").upsert({
          deck_id: deckId,
          strengths: json.sw.strengths,
          weaknesses: json.sw.weaknesses,
        });
        // 3) Add strengths and weaknesses
        await supabase.from("deck_ai_pillars").upsert({
          deck_id: deckId,
          pillars: json.pillars,
        });
        // 4) Add archetype overview
        const { error: updateErr } = await supabase
          .from("deck_archetype_overview")
          .upsert({
            deck_id: deckId,
            axes: json.archetype.axes,
            explanation_md: json.archetype.explanation_md,
            description: json.archetype.description,
            updated_at: new Date().toISOString(),
          });
        if (updateErr) throw updateErr;
        write("done", {
          step: "done",
          progress: 100,
          deckId,
          archetype: json.archetype,
          sw: json.sw,
          pillars: json.pillars,
          difficulty: json.difficulty,
        });
      } catch (err: any) {
        controller.enqueue(
          enc.encode(sse("error", { message: err?.message || String(err) })),
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
