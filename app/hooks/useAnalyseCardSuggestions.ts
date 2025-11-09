import { useEffect, useRef, useState } from "react";
import { useCardList } from "../context/CardListContext";

export type ManaColor = "W" | "U" | "B" | "R" | "G" | "C";
export type ColorNoC = Exclude<ManaColor, "C">;

export type Role =
  | "ramp"
  | "draw"
  | "spot_rm"
  | "wipes"
  | "protect"
  | "countermagic"
  | "gy_hate"
  | "art_ench_hate"
  | "tutor"
  | "fixing"
  | "engine"
  | "wincon"
  | "token"
  | "synergy";

export type BudgetHint = "any" | "low" | "mid" | "high";

// Need
export type Need = {
  role: Role;
  target_count: number;
  cmc_range: [number, number];
  preferred_speed: "instant" | "sorcery" | "permanent" | "any";
  preferred_types: string[];
  color_focus: Array<Exclude<ManaColor, "C">>; // color focus excludes "C" typically
  synergy_terms: string[];
  effect_terms: string[];
  hard_must_have: string[]; // literal phrases for ILIKE gating
  hard_must_not: string[];
};

// Cut
export type Cut = {
  card_name: string;
  cardId: string; // uuid as string
  reasons: string[];
  replacement_role: Role;
  replacement_cmc_hint: [number, number];
};

// GapSpec (primary JSON)
export type GapSpec = {
  archetype: string;
  primary_axes: string[];
  commander_signals: string[];
  land_base_flags: string[];
  speed_profile: { instant: number; sorcery: number; permanent: number };
  interaction_profile: {
    spot: number;
    wipes: number;
    counters: number;
    gy_hate: number;
    art_ench_hate: number;
  };
  redundancy_gaps: string[];
  needs: Need[];
  cuts: Cut[];
};

export type CardSuggestionsResult = {
  deckId: string;
  gaps: GapSpec; // GapSpec already includes needs: Need[] and cuts: Cut[]
  updatedAt?: string;
};

export type DonePayload = CardSuggestionsResult & { progress: number };

export function useAnalyseCardSuggestions(opts?: {
  onDone?: (payload: DonePayload) => void;
  endpoint?: string; // override if needed
}) {
  const onDone = opts?.onDone;
  const endpoint = opts?.endpoint ?? "/api/ai/analyse/cardSuggestions";
  const esRef = useRef<EventSource | null>(null);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<null | string>(null);
  const [result, setResult] = useState<CardSuggestionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // const { setArchetypeOverview } = useCardList();
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
        const d = JSON.parse(ev.data) as DonePayload;
        if (!d || !d.deckId || !d.gaps)
          throw new Error("Malformed done payload");

        setResult({
          deckId: d.deckId,
          // If you want to store it directly:
          // ...you could keep just d.gaps or split what you need
        } as any);

        setProgress(100);
        setStep("done");
        console.log(d);
        onDone?.(d);
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
