"use client";

import { useCardList } from "@/app/context/CardListContext";
import { ManaCurve } from "../overview/manaCurve";

/**
 * Three-column section under the deck overview: Available Mana, Coloured Spell Cost, Total Cost.
 * Uses deckFeatures from context; renders nothing if features are not loaded.
 */
export default function ManaOverviewSection() {
  const { deckFeatures } = useCardList();

  if (!deckFeatures) return null;

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-8">
      <div className="min-w-0">
        <ManaCurve
          deckFeatures={deckFeatures}
          defaultMode="pool"
          title="Available Mana"
          toggle={false}
        />
      </div>
      <div className="min-w-0">
        <ManaCurve
          deckFeatures={deckFeatures}
          defaultMode="curve"
          title="Coloured Spell Cost"
          toggle={false}
        />
      </div>
      <div className="min-w-0">
        <ManaCurve
          deckFeatures={deckFeatures}
          defaultMode="cost"
          title="Total Cost"
          toggle={false}
        />
      </div>
    </section>
  );
}
