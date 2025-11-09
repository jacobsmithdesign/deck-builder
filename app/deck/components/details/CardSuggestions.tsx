"use client";

import {
  CardContainer,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { useCardList } from "@/app/context/CardListContext";
import { useAnalyseCardSuggestions } from "@/app/hooks/useAnalyseCardSuggestions";
import { AnimatedButtonLoading } from "../AnimatedButtonLoading";

export default function CardSuggestions() {
  const { deck } = useCardList();
  const { analysing, progress, step, start, error } =
    useAnalyseCardSuggestions();

  const handleAnalyse = () => {
    if (!deck?.id || analysing) return;
    start(deck.id);
  };

  return (
    <div>
      <CardContainer className="h-96 bg-dark/5">
        <CardHeader className="p-4 gap-4 flex flex-row items-center">
          <CardTitle>Suggested Improvements</CardTitle>
          <AnimatedButtonLoading
            variant="aiAnalyse"
            size="sm"
            title={
              analysing
                ? `Analysing${progress ? ` (${progress}%)` : ""}`
                : "Generate New Suggestions"
            }
            loading={analysing}
            onClick={handleAnalyse}
            disabled={!deck?.id}
          />
          {error ? (
            <div className="mt-2">
              <div className="mt-2 text-xs text-red-500">
                {String(error)}
                {step ? ` — step: ${step}` : null}
              </div>{" "}
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="flex"> </CardContent>
      </CardContainer>
    </div>
  );
}
