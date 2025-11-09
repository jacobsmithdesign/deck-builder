// app/api/ai/analyse/stream/route.ts
import { NextRequest } from "next/server";
import OpenAI from "openai";
import { buildFeatures } from "@/lib/ai/features";
import { createServerSupabase } from "@/lib/supabase/server";
import { compressLands } from "@/lib/ai/landCompression";
import { GapSpec } from "@/app/hooks/useAnalyseCardSuggestions";

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
  data?: any
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
        console.log(deckRow);

        write("progress", { step: "building features", progress: 35 });
        const rawLandFeatures = compressLands(deckRow as any);

        write("progress", { step: "extracting cards", progress: 45 });

        // this is the cards array
        const cards = ((deckRow?.deck_cards ?? []) as any[]).map(
          ({ card }) => ({
            cardId: card.uuid,
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

          return `
Return ONLY minified JSON with EXACT keys and shapes of GapSpec:
{"archetype":"<string>","primary_axes":["<string>", "..."],"commander_signals":["<string>", "..."],"land_base_flags":["<string>", "..."],"speed_profile":{"instant":0,"sorcery":0,"permanent":0},"interaction_profile":{"spot":0,"wipes":0,"counters":0,"gy_hate":0,"art_ench_hate":0},"redundancy_gaps":["<string>", "..."],"needs":[{"role":"<ramp|draw|spot_rm|wipes|protect|countermagic|gy_hate|art_ench_hate|tutor|fixing|engine|wincon|token|synergy>","target_count":0,"cmc_range":[0,0],"preferred_speed":"<instant|sorcery|permanent|any>","preferred_types":["<string>", "..."],"color_focus":["<W|U|B|R|G>", "..."],"synergy_terms":["<string>", "..."],"effect_terms":["<string>", "..."],"hard_must_have":["<literal phrase>", "..."],"hard_must_not":["<literal phrase>", "..."]}],"cuts":[{"card_name":"<string>","cardId":"<uuid>","reasons":["<string>", "..."],"replacement_role":"<ramp|draw|spot_rm|wipes|protect|countermagic|gy_hate|art_ench_hate|tutor|fixing|engine|wincon|token|synergy>","replacement_cmc_hint":[0,0]}]}

            ALWAYS provide 5 - 10 cuts and 5 - 10 needs, even if some are low quality or redundant.
            
            Cards:${CARDS}
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
                "You are an expert MTG Commander deck analyst. You output only structured JSON; no prose, no code fences, no extra text. Your judgements prioritise color identity legality, curve discipline, redundancy for core engines, efficient interaction, and consistency (ramp/draw/fixing before flashy wincons). When referencing cards you must never invent card names or IDs, or use any card not present in the corresponding provided list.",
            },
            { role: "user", content: prompt },
          ],
        });
        if (LOG_TOKENS && (completion as any).usage) {
          const u = (completion as any).usage;
          console.log(
            `[tokens overview] prompt=${u.prompt_tokens} out=${u.completion_tokens} total=${u.total_tokens}`
          );
          if (LOG_DEBUG) write("debug", { label: "tokens", usage: u });
        }

        write("progress", { step: "parsing", progress: 85 });
        const json = JSON.parse(
          completion.choices[0]?.message?.content ?? "{}"
        );
        // basic guards
        if (!json) {
          throw new Error("Model output data is missing or malformed");
        }

        write("progress", { step: "saving", progress: 92 });
        write("done", {
          progress: 100,
          deckId,
          gaps: json as GapSpec, // `json` is exactly the GapSpec the model returned
        });
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
