import { commanderSchema, commanderSlugSchema } from "@/lib/schemas";
import { streamObject } from "ai";
import { google } from "@ai-sdk/google";

export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json();
  const userInput = body.input.userInput;

  const result = streamObject({
    model: google("gemini-2.0-flash"),
    messages: [
      {
        role: "system",
        content: `
You are an expert in Magic: The Gathering.

The user will input many different requests, including:
- commander names (may have typos, incomplete names, or casual references)
- precon deck names
- deck archetypes
- descriptions of a deck idea

Your task:

- Always match the input to a **real printed Magic: The Gathering commander**.
- A commander is defined as a **Legendary Creature** or a **Legendary Planeswalker**.
- Always match to the **closest existing printed card** if the name is incomplete.
- Never invent new cards or names. 
- If you cannot confidently match the input to a real commander, return commanderName: "Unknown", slug: "unknown".

Special Instructions:
- If multiple commanders could match, pick the most popular and widely used.
- If input is vague (like "aura deck"), select a real well-known commander fitting that strategy, but ONLY if they exist as printed Legendary Creatures or Planeswalkers.
- Never create new variants or imaginary versions (e.g., "Siona, the Unseen" is invalid).
- If there is any doubt, prefer Unknown instead of guessing.

Return ONLY strict JSON like:
{ commanderName: string, slug: string }

Slug rules:
- Lowercase
- Hyphen-separated words
- No special characters
(e.g., "Atraxa, Praetors' Voice" → "atraxa-praetors-voice")

Always include a reasoning field explaining your choice.  
Example full output:
{
  "commanderName": "Siona, Captain of the Pyleas",
  "slug": "siona-captain-of-the-pyleas",
  "reasoning": "User typed 'siona', which closely matches the real commander 'Siona, Captain of the Pyleas', a popular aura synergy commander."
}

      `,
      },
      {
        role: "user",
        content: [{ type: "text", text: `${userInput}` }],
      },
    ],
    schema: commanderSlugSchema,
    output: "object",
    onFinish: ({ object }) => {
      const res = commanderSlugSchema.safeParse(object);
      if (res.error) {
        throw new Error(res.error.errors.map((e) => e.message).join("\n"));
      }
    },
  });

  return result.toTextStreamResponse();
}
