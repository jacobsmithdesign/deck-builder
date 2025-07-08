import { commanderSchema } from "@/lib/schemas";
import { streamObject } from "ai";
import { google } from "@ai-sdk/google";

export const maxDuration = 60;

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: Request) {
  const { commanderName, edhrecData, mana_cost } = await req.json();
  "Mana Cost:", mana_cost;

  if (!edhrecData) {
    return new Response("Commander not found.", { status: 404 });
  }

  const result = streamObject({
    model: google("gemini-1.5-flash"),
    messages: [
      {
        role: "system",
        content: `
You are an expert Magic: The Gathering deck builder.
Given a commander's name, an API call from EDHREC for that commander, and a mana cost from scryfall, output a JSON object including:
- name
- type
- mana_cost (e,g. "2GWR")
- colorIdentity
- health
-robustness
-archetype
- short playstyle description
- list of strengths ( 1-2 words, e.g. "Aggro", "Control", "Combo")
- list of weaknesses 
- 3-5 important cards with a short role description.
Return strictly JSON matching the schema.`,
      },
      {
        role: "user",
        content: `Commander: ${commanderName}\nEDHREC API response: ${JSON.stringify(
          edhrecData
        )}\nMana cost: ${mana_cost}\n`,
      },
    ],
    schema: commanderSchema,
    output: "object",
    onFinish: ({ object }) => {
      const res = commanderSchema.safeParse(object);
      if (res.error) {
        throw new Error(res.error.errors.map((e) => e.message).join("\n"));
      }
    },
  });

  return result.toTextStreamResponse();
}
