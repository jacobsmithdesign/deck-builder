import type { LanguageModelV1 } from "@ai-sdk/provider";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

export type AIProviderId = "openai" | "anthropic" | "google";

const PROVIDER = (process.env.AI_PROVIDER ?? "openai") as AIProviderId;
const AI_MODEL = process.env.AI_MODEL;

const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest";
const GOOGLE_MODEL = process.env.GOOGLE_GENERATIVE_AI_MODEL ?? "gemini-1.5-pro";

function getModelId(): string {
  if (AI_MODEL) return AI_MODEL;
  switch (PROVIDER) {
    case "anthropic":
      return ANTHROPIC_MODEL;
    case "google":
      return GOOGLE_MODEL;
    case "openai":
    default:
      return OPENAI_MODEL;
  }
}

/**
 * Returns an AI SDK LanguageModel for the configured provider and model.
 * Set AI_PROVIDER=openai|anthropic|google and optionally AI_MODEL (or
 * OPENAI_MODEL, ANTHROPIC_MODEL, GOOGLE_GENERATIVE_AI_MODEL) to swap providers.
 */
export function getLanguageModel(): LanguageModelV1 {
  const modelId = getModelId();
  switch (PROVIDER) {
    case "anthropic": {
      const anthropic = createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      return anthropic.chat(modelId as any);
    }
    case "google": {
      const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      });
      return google.chat(modelId as any);
    }
    case "openai":
    default: {
      const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      return openai.chat(modelId as any);
    }
  }
}
