import { useEffect, useRef, useState } from "react";
import { useCardList } from "../context/CardListContext";

export type ArchetypeOverviewResult = {
  deckId: string;
  archetypes: string[];
  axes: Record<string, number>;
  explanation_md?: string;
};

type DonePayload = ArchetypeOverviewResult & { progress: number };

export function useAnalyseArchetypeProgress(opts?: {
  onDone?: (payload: DonePayload) => void;
  endpoint?: string; // override if needed
}) {
  const onDone = opts?.onDone;
  const endpoint = opts?.endpoint ?? "/api/ai/analyse/archetype";
  const esRef = useRef<EventSource | null>(null);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<null | string>(null);
  const [result, setResult] = useState<ArchetypeOverviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setArchetypeOverview } = useCardList();
  const start = (deckId: string) => {
    if (!deckId) return;
    setProgress(0);
    setStep("starting");
    setError(null);
    setResult(null);

    const es = new EventSource(
      `${endpoint}?deckId=${encodeURIComponent(deckId)}`
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
        // Expect: { progress, deckId, archetypes, axes, explanation_md? }
        if (!d || !d.deckId || !Array.isArray(d.archetypes) || !d.axes) {
          throw new Error("Malformed done payload");
        }
        const clean: ArchetypeOverviewResult = {
          deckId: String(d.deckId),
          archetypes: d.archetypes as string[],
          axes: d.axes as Record<string, number>,
          explanation_md:
            typeof d.explanation_md === "string" ? d.explanation_md : undefined,
        };

        setResult(clean);
        setProgress(100);
        setStep("done");

        setArchetypeOverview({
          deckId: String(d.deckId),
          archetypes: d.archetypes as string[],
          axes: d.axes as Record<string, number>,
          explanation_md:
            typeof d.explanation_md === "string" ? d.explanation_md : undefined,
        });

        onDone?.({
          progress: 100,
          deckId: clean.deckId,
          archetypes: clean.archetypes,
          axes: clean.axes,
          explanation_md: clean.explanation_md,
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
