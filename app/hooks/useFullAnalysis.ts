import { useEffect, useRef, useState } from "react";
import { useCardList } from "../context/CardListContext";
import { streamObject } from "ai";

export type ArchetypeOverviewResult = {
  axes: Record<string, number>;
  explanation_md: Record<string, string>;
  description: string;
};

export type SwResult = {
  strengths: Record<string, string>;
  weaknesses: Record<string, string>;
};

export type PillarsResult = { pillars: Record<string, string> };

export type DifficultyResult = {
  bracket: number;
  bracket_explanation: string;
  complexity: string;
  complexity_explanation: string;
  pilot_skill: string;
  pilot_skill_explanation: string;
  interaction_intensity: string;
  interaction_intensity_explanation: string;
  updatedAt?: string;
};

type DonePayload = { deckId: string } & {
  archetype: ArchetypeOverviewResult;
  sw: SwResult;
  pillars: PillarsResult;
  difficulty: DifficultyResult;
} & { progress: number };

export function useFullAnalysis(opts?: {
  onDone?: (payload: DonePayload) => void;
  endpoint?: string; // override if needed
}) {
  const onDone = opts?.onDone;
  const endpoint = opts?.endpoint ?? "/api/ai/analyse/full-analysis";
  const esRef = useRef<EventSource | null>(null);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<null | string>(null);
  const [result, setResult] = useState<ArchetypeOverviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    setArchetypeOverview,
    setStrengthsAndWeaknesses,
    setPillars,
    setDifficulty,
  } = useCardList();
  const start = (deckId: string) => {
    if (!deckId) return;
    setProgress(0);
    setStep("starting");
    setError(null);
    setResult(null);

    const es = new EventSource(
      `${endpoint}?deckId=${encodeURIComponent(deckId)}`,
    );
    esRef.current = es;

    es.addEventListener("progress", (ev: MessageEvent) => {
      try {
        const d = JSON.parse(ev.data);
        setProgress(Number(d.progress ?? 0));
        setStep(String(d.step ?? ""));
      } catch {
        // ignore malformed progress packets
      }
    });

    es.addEventListener("done", (ev: MessageEvent) => {
      try {
        const d = JSON.parse(ev.data) as Partial<DonePayload>;
        // Expect: { archetype, sw, pillars, difficulty }
        if (!d || !d.archetype || !d.sw || !d.pillars || !d.difficulty) {
          throw new Error("Malformed done payload");
        }
        // Create a clean version of the data
        const archetypeClean = {
          deckId: d.deckId as string,
          axes: d.archetype.axes as Record<string, number>,
          explanation_md: d.archetype.explanation_md as Record<string, string>,
          description: d.archetype.description as string,
        };
        const swClean = {
          deckId: d.deckId as string,
          strengths: d.sw.strengths as Record<string, string>,
          weaknesses: d.sw.weaknesses as Record<string, string>,
        };
        const pillarsClean = {
          deckId: d.deckId as string,
          pillars: d.pillars.pillars as Record<string, string>,
        };
        const difficultyClean = {
          deckId: d.deckId as string,
          bracket: d.difficulty.bracket as number,
          bracket_explanation: d.difficulty.bracket_explanation as string,
          complexity: d.difficulty.complexity as string,
          complexity_explanation: d.difficulty.complexity_explanation as string,
          pilot_skill: d.difficulty.pilot_skill as string,
          pilot_skill_explanation: d.difficulty
            .pilot_skill_explanation as string,
          interaction_intensity: d.difficulty.interaction_intensity as string,
          interaction_intensity_explanation: d.difficulty
            .interaction_intensity_explanation as string,
        };

        setProgress(100);
        setStep("done");

        // Set the context states of the cleaned data
        setArchetypeOverview(archetypeClean);
        setStrengthsAndWeaknesses(swClean);
        setPillars(pillarsClean);
        setDifficulty(difficultyClean);

        onDone?.({
          progress: 100,
          deckId: d.deckId,
          archetype: archetypeClean,
          sw: swClean,
          pillars: pillarsClean,
          difficulty: difficultyClean,
        });
      } catch (e: any) {
        setError(e?.message || "Parse error");
      } finally {
        es.close();
        esRef.current = null;
      }
    });

    es.addEventListener("error", (ev: MessageEvent) => {
      try {
        const d = JSON.parse((ev as any).data ?? "{}");
        setError(d.message || "Stream error");
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

  useEffect(() => cancel, []);

  const analysing = !!step && step !== "done" && !error;

  return { progress, step, analysing, result, error, start, cancel };
}
