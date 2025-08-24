// useAnalyseProgress.ts
import { useEffect, useRef, useState } from "react";
import { useCardList } from "@/app/context/CardListContext";
import { AiOverview } from "@/app/context/CardListContext";
import { AiOutlineAccountBook } from "react-icons/ai";

type DonePayload = {
  progress: number;
  deckId: string;
  aiOverview: AiOverview;
};

export function useAnalyseProgress(opts?: {
  onDone?: (payload: DonePayload) => void;
}) {
  const onDone = opts?.onDone;
  const { setAiOverview } = useCardList();

  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<null | string>(null);
  const [result, setResult] = useState<DonePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const start = (deckId: string) => {
    if (!deckId) return;
    setProgress(0);
    setStep("starting");
    setError(null);
    setResult(null);

    const es = new EventSource(`/api/ai/analyse/stream?deckId=${deckId}`);
    esRef.current = es;

    es.addEventListener("progress", (ev: MessageEvent) => {
      const d = JSON.parse(ev.data);
      setProgress(d.progress ?? 0);
      setStep(d.step ?? "");
    });

    es.addEventListener("done", (ev: MessageEvent) => {
      const d = JSON.parse(ev.data); // { deckId, overview, difficulty, ... }

      // 🔎 sanity log (leave it in until fixed)
      console.log("SSE done payload:", d.overview, d.difficulty);

      setAiOverview({
        // overview
        tagline: d?.overview?.tagline ?? null,
        ai_rank: null, // if unused
        ai_tags: Array.isArray(d?.overview?.tags) ? d.overview.tags : null,
        ai_strengths: Array.isArray(d?.overview?.strengths)
          ? d.overview.strengths
          : null,
        ai_weaknesses: Array.isArray(d?.overview?.weaknesses)
          ? d.overview.weaknesses
          : null,
        ai_confidence:
          typeof d?.overview?.confidence === "number"
            ? d.overview.confidence
            : null,
        ai_generated_at: new Date().toISOString(),
        ai_spec_version: "v5-difficulty-axes-gpt-4.1",

        // difficulty (note: DB stores power level as text in your type)
        ai_power_level:
          typeof d?.difficulty?.power_level === "number"
            ? String(d.difficulty.power_level)
            : d?.difficulty?.power_level ?? null,
        ai_complexity: d?.difficulty?.complexity ?? null,
        ai_pilot_skill: d?.difficulty?.pilot_skill ?? null,
        ai_interaction: d?.difficulty?.interaction_intensity ?? null,
        ai_upkeep: d?.difficulty?.upkeep ?? null,

        ai_power_level_explanation:
          d?.difficulty?.power_level_explanation ?? null,
        ai_complexity_explanation:
          d?.difficulty?.complexity_explanation ?? null,
        ai_pilot_skill_explanation:
          d?.difficulty?.pilot_skill_explanation ?? null,
        ai_interaction_explanation:
          d?.difficulty?.interaction_explanation ?? null,
        ai_upkeep_explanation: d?.difficulty?.upkeep_explanation ?? null,
      });

      es.close();
      esRef.current = null;
      setProgress(100);
      setStep("done");
    });

    es.addEventListener("error", (ev: MessageEvent) => {
      try {
        const d = JSON.parse((ev as any).data ?? "{}");
        setError(d.message || "Unknown error");
      } catch {
        setError("Stream error");
      }
      es.close();
      esRef.current = null;
    });
  };

  const cancel = () => {
    esRef.current?.close();
    esRef.current = null;
  };

  // Clean up on unmount
  useEffect(() => cancel, []);

  const analysing = !!step && step !== "done" && !error;

  return { progress, step, analysing, result, error, start, cancel };
}
