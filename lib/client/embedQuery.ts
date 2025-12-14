// lib/client/embedQuery.ts
import { getEmbedder } from "@/lib/client/applicationSingleton";

export async function embedQuery(text: string) {
  const { tokenizer, text_model } = await getEmbedder();

  const inputs = tokenizer(text, { padding: true, truncation: true });
  const { text_embeds } = await text_model(inputs);

  return text_embeds.tolist()[0];
}
