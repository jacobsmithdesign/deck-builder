"use client";

import {
  env,
  AutoTokenizer,
  CLIPTextModelWithProjection,
} from "@xenova/transformers";

// must be set BEFORE load
env.allowLocalModels = false;
env.useBrowserCache = true;
env.localModelPath = null;

const MODEL_ID = "Xenova/clip-vit-base-patch16";

let instance: { tokenizer: any; text_model: any } | null = null;

async function ApplicationSingleton() {
  const [tokenizer, text_model] = await Promise.all([
    AutoTokenizer.from_pretrained(MODEL_ID),
    CLIPTextModelWithProjection.from_pretrained(MODEL_ID, {
      quantized: true,
    }),
  ]);

  return { tokenizer, text_model };
}

export async function getEmbedder() {
  if (!instance) {
    instance = await ApplicationSingleton();
  }
  return instance;
}
