import { commanderSchema } from "@/lib/schemas";
import { streamObject } from "ai";
import { google } from "@ai-sdk/google";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { commanderName, text } = await req.json();
  const result = streamObject({
    model: google("gemini-1.5-flash"),
    messages: [
      {
        role: "system",
        content: ``,
      },
      {
        role: "user",
        content: `Commander: ${commanderName}\nOracle text: ${oracleText}`,
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
