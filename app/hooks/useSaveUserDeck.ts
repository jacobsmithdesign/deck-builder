// app/hooks/useSaveDeck.ts
"use client";

import { useState } from "react";
import { useEditMode } from "../context/editModeContext";
import { useCardList } from "../context/CardListContext";

type SaveResult = { deckId: string; savedCount: number };

export function useSaveUserDeck(
  endpoint = "/api/supabase/decks/save-user-deck"
) {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SaveResult | null>(null);
  const { toggleEditMode } = useEditMode();
  const { setChangesMadeState, cards, setCards } = useCardList();
  let currentCards = cards;

  // Async function that starts the fetch process
  const start = async (
    deckId: string,
    cards: Array<{ uuid: string; count: number; board_section?: string }>
  ) => {
    if (!deckId) return;

    setProgress(0);
    setStep("starting");
    setError(null);
    setResult(null);

    try {
      setStep("auth/verify");
      setProgress(20);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId, cards }),
      });

      setStep("saving");
      setProgress(70);

      const json = await res.json().catch(() => ({} as any));
      console.log("Save response: ", json);
      if (!res.ok) {
        setError(json?.error || `Request failed: ${res.status}`);
        setStep("error");
        setProgress(0);
        return;
      }

      setResult({ deckId: json.deckId, savedCount: json.savedCount ?? 0 });
      setStep("done");
      setProgress(100);
      setCards(currentCards);
      setChangesMadeState([]);
      // Optionally reset cards in context to reflect saved state
      toggleEditMode();
    } catch (e: any) {
      setError(e?.message || "Network error");
      setStep("error");
      setProgress(0);
    }
  };

  // Function that resets the states (for components that may want to reuse the hook)
  const reset = () => {
    setProgress(0);
    setStep(null);
    setError(null);
    setResult(null);
  };

  const saving = !!step && step !== "done" && !error;

  return { progress, step, saving, error, result, start, reset };
}
