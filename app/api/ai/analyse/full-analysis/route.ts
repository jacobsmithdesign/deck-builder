// app/api/ai/analyse/full-analysis/route.ts
import { NextRequest } from "next/server";
import { generateText, Output } from "ai";
import { getLanguageModel } from "@/lib/ai/model";
import { buildFeatures } from "@/lib/ai/features";
import { createServerSupabase } from "@/lib/supabase/server";
import { compressLands } from "@/lib/ai/landCompression";
import { fullAnalysisOutputSchema, FullAnalysisOutput } from "@/lib/schemas";
import { zodToJsonSchema } from "zod-to-json-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const ai_spec = "gemini-3-flash";
const LOG_TOKENS = true; // <- add
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

// helper function to put cards in a string for the model to use
function buildCardText(cards: any[]): string {
  const parts: string[] = [];
  for (const card of cards) {
    // Fill card details into string, seperated by periods.
    if (card.name) parts.push(card.name);
    if (card.type) parts.push(card.type);

    // Stats on one line: P/T, loyalty, defense, life (no labels – "3/3" and "loyalty 4" are clear)
    const stats: string[] = [];
    if (card.power != null && card.toughness != null)
      stats.push(`${card.power}/${card.toughness}`);
    if (card.loyalty != null) stats.push(`loyalty ${card.loyalty}`);
    if (card.defense != null) stats.push(`defense ${card.defense}`);
    if (card.life != null) stats.push(`life ${card.life}`);
    if (stats.length) parts.push(stats.join(" "));

    if (card.mana_cost) parts.push(card.mana_cost);
    if (card.mana_value != null) parts.push(`CMC ${card.mana_value}`);
    if (card.color_identity?.length) parts.push(card.color_identity.join(" "));
    if (card.rarity) parts.push(card.rarity);
    if (card.primary_roles?.length) parts.push(card.primary_roles.join(", "));
    if (card.secondary_roles?.length)
      parts.push(card.secondary_roles.join(", "));

    // Keywords as plain list – no "Keywords:" so "flying lifelink" matches directly
    if (card.keywords?.length) parts.push(card.keywords.join(", "));

    if (card.text) parts.push(card.text);

    // Flavor last; optional prefix so it doesn't dominate
    if (card.flavor_text) parts.push(card.flavor_text);
    parts.push(". ");
  }

  return parts.join("");
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
      const model = getLanguageModel();
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
            commander:cards!decks_commander_uuid_fkey(uuid,name,mana_cost,type,text,power,toughness),
            deck_cards(
              count, board_section,
              card:cards!deck_cards_card_uuid_fkey(uuid,name,mana_cost,type,text,power,toughness,loyalty,defense)
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
        console.log("commander", commander);

        write("progress", { step: "extracting cards", progress: 45 });

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
        const cards = ((deckRow?.deck_cards ?? []) as any[])
          .map(({ card }) => ({
            name: card.name,
            mana_cost: card.mana_cost ?? "",
            type: card.type,
            text: card.text ?? "",
            power: card.power ?? 0,
            toughness: card.toughness ?? 0,
            loyalty: card.loyalty ?? 0,
            defense: card.defense ?? 0,
          }))
          .filter((c) => {
            const isLand = (c.type || "").toLowerCase().includes("land");
            if (!isLand) return true; // keep all nonlands
            return isSignalLand(c); // only keep interesting lands
          });

        const cardText = buildCardText(cards);

        // One unified prompt (overview + difficulty)
        write("progress", { step: "Analysing deck", progress: 65 });
        const TAG_VOCAB =
          '["token swarm","treasure","aristocrats","graveyard","reanimator","stax","voltron","spellslinger","blink","+1/+1 counters","lifegain","control","combo","camp","landfall","mill","extra turns","vehicles","dragons","elves","artifacts","enchantress","aura","discard","steal/copy","flicker","proliferate","burn","big mana"]';
        const prompt = (() => {
          const LANDFEATURES = JSON.stringify(rawLandFeatures);
          const CARDS = JSON.stringify(cards);
          return `
                  Analyse this Commander deck and fill the structured output. Return arrays of objects as specified; each array has a minimum length.

                  Archetype vocabulary (choose 4-8 that fit): ${TAG_VOCAB}
                  - axes: array of { "slug": string, "score": number 0-100 }. Length 4-8. Same slugs in explanation_md.
                  - explanation_md: array of { "slug": string, "markdown": string }. Same slugs as axes; 3-5 sentences each.
                  - description: 3-5 sentences overall deck summary.

                  - strengths: array of 3 - 5 items { "name": string (1-2 words), "explanation": string (3-6 sentences) }. Length 1-4. 
                  - weaknesses: array of 3 - 5 items { "name": string (1-2 words), "explanation": string (3-6 sentences) }. Length 1-4.
                  - pillars: array of { "slug": string (e.g. ramp, card_draw, interaction, wincon), "markdown": string (2-4 sentences) }. Length at least 1.
                  
                  You must provide explanations for all difficulty metrics.
                  Rate pilot skill based on how much deck building and prior game experience is required to play the deck to its potential and how beginner friendly the deck is.
                  Rate interaction intensity based on the frequency of interactions with the board.
                  Rate complexity based on the variety of cards and the potential for multiple interactions with the board.

                  DECK INFO:
                  Commander: ${commander}
                  Land feature extraction: ${LANDFEATURES}
                  Cards: ${cardText}
                `.trim();
        })();
        // Use generateText then parse + validate with our schema (transforms handle model quirks)
        const { text, usage } = await generateText({
          model: model as unknown as Parameters<
            typeof generateText
          >[0]["model"],
          maxRetries: 1,
          system:
            "You are an MTG Commander deck analyst. Given a list of cards you must analyse the deck to determine the archetypes, complexity, interaction intensity, pilot skill, power level, strengths and disadvantages of the deck.",
          prompt,
          providerOptions: {
            google: {
              temperature: 0.75,
              thinkingConfig: {
                thinkingLevel: "high",
              },
            },
          },
          output: Output.object({ schema: fullAnalysisOutputSchema }),
        });
        if (LOG_TOKENS && usage) {
          console.log(
            `[tokens overview] prompt=${usage.inputTokens} out=${usage.outputTokens} total=${usage.totalTokens}`,
          );
          if (LOG_DEBUG)
            write("debug", {
              label: "tokens",
              usage: {
                prompt_tokens: usage.inputTokens,
                completion_tokens: usage.outputTokens,
                total_tokens: usage.totalTokens,
              },
            });
        }
        console.log("model response: ", text);
        write("progress", { step: "parsing", progress: 85 });

        let raw = (text ?? "").trim();
        const codeBlockMatch = raw.match(
          /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/m,
        );
        if (codeBlockMatch) raw = codeBlockMatch[1].trim();
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw || "{}");
        } catch (e) {
          console.error(
            "[full-analysis] Invalid JSON. Raw (first 2000 chars):",
            raw.slice(0, 2000),
          );
          throw new Error("Model returned invalid JSON");
        }
        const parsedResult = fullAnalysisOutputSchema.safeParse(parsed);
        if (!parsedResult.success) {
          const first = parsedResult.error.flatten().fieldErrors;
          const msg =
            parsedResult.error.issues?.[0]?.message ??
            "Schema validation failed";
          console.error(
            "[full-analysis] Schema validation failed:",
            msg,
            "issues:",
            JSON.stringify(parsedResult.error.issues?.slice(0, 5)),
          );
          console.error(
            "[full-analysis] Raw object keys:",
            typeof parsed === "object" && parsed !== null
              ? Object.keys(parsed as object)
              : "not object",
          );
          throw new Error(`Validation failed: ${msg}`);
        }
        const json = parsedResult.data;
        if (!json?.archetype || !json?.difficulty) {
          throw new Error("Model output missing required fields");
        }
        // Derive tags from archetype axes: only those with score 65+, sorted highest first
        const axes = json.archetype.axes as Record<string, number>;
        const tags = Object.entries(axes ?? {})
          .filter(([, score]) => Number(score) >= 65)
          .sort(([, a], [, b]) => Number(b) - Number(a))
          .map(([slug]) => slug);
        write("progress", { step: "saving", progress: 92 });
        // 1) Add deck difficulty
        const { error: difficultyErr } = await supabase
          .from("deck_ai_difficulty")
          .upsert({
            deck_id: deckId,
            complexity: json.difficulty.complexity,
            complexity_explanation: json.difficulty.complexity_explanation,
            pilot_skill: json.difficulty.pilot_skill,
            pilot_skill_explanation: json.difficulty.pilot_skill_explanation,
            interaction_intensity: json.difficulty.interaction_intensity,
            interaction_explanation:
              json.difficulty.interaction_intensity_explanation,
            power_level: json.difficulty.power_level,
            power_level_explanation: json.difficulty.power_level_explanation,
            updated_at: new Date().toISOString(),
          });
        if (difficultyErr) throw difficultyErr;
        // 2) Add strengths and weaknesses
        const { error: swErr } = await supabase
          .from("deck_ai_strengths_weaknesses")
          .upsert({
            deck_id: deckId,
            strengths: json.sw.strengths,
            weaknesses: json.sw.weaknesses,
          });
        if (swErr) throw swErr;
        // 3) Add pillars
        const { error: pillarsErr } = await supabase
          .from("deck_ai_pillars")
          .upsert({
            deck_id: deckId,
            pillars: json.pillars,
          });
        if (pillarsErr) throw pillarsErr;
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
        // 5) Update deck with tags (1-5)
        const { error: deckUpdateErr } = await supabase
          .from("decks")
          .update({ tags })
          .eq("id", deckId);
        if (deckUpdateErr) throw deckUpdateErr;
        write("done", {
          step: "done",
          progress: 100,
          deckId,
          archetype: json.archetype,
          sw: json.sw,
          pillars: json.pillars,
          difficulty: json.difficulty,
          tags,
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
