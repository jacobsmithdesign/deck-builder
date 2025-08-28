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

        write("progress", { step: "building features", progress: 35 });
        const rawFeatures = buildFeatures(deckRow as any);
        const rawLandFeatures = compressLands(deckRow as any);

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
              name
            )
          ) {
            return true;
          }

          // Otherwise: boring mana land → filter out
          return false;
        };

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
            "archetypes": ["<slug-1>", "..."],
            "axes": { "<slug-1>": 0, "...": 0 },
            "explanation_md": "<markdown string>"
            }

            Archetype vocabulary=${TAG_VOCAB}

            RULES:
            archetypes: 4–7 short lowercase slugs that capture the deck’s playstyle and card frequency. Choose from archetype vocabulary. If an archetype that does not exist in the vocabular could be derived from the commander or the cards always include it. 
            axes: 0–100, keys ⊆ archetypes, reflecting the strength of each chosen archetype in this deck.

            explanation_md: maximum 120 words in Markdown, purely extractive. Explain the overall archetype of the deck. You may use just a few example cards from the card list justify the archetypes and their relative weighting. 
            
            Land feature extraction: ${LANDFEATURES}

            Cards:${CARDS}
            `;
        })();

        const completion = await openai.chat.completions.create({
          model: MODEL,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You are an MTG Commander deck analyst. Your job is to extract a deck’s archetypal identity only from the provided card list. Do not invent cards, categories, or details that are not directly supported. Return exactly one JSON object.",
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

        console.log("Archetype JSON data: ", json);
        // basic guards
        if (!json || !Array.isArray(json.archetypes) || !json.axes) {
          throw new Error("Model output missing required fields");
        }

        write("progress", { step: "saving", progress: 92 });
        // Persist archetype overview
        const { error: updateErr } = await supabase
          .from("deck_archetype_overview")
          .upsert({
            deck_id: deckId,
            archetypes: json.archetypes,
            axes: json.axes,
            explanation_md: json.explanation_md ?? "",
            updated_at: new Date().toISOString(),
          });
        if (updateErr) throw updateErr;

        write("done", {
          progress: 100,
          deckId,
          archetypes: json.archetypes,
          axes: json.axes,
          explanation_md: json.explanation_md ?? "",
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
