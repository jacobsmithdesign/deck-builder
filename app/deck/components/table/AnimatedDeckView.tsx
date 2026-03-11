"use client";

import { useState } from "react";
import {
  CompactViewProvider,
  useCompactView,
} from "@/app/context/compactViewContext";
import { DeckViewProvider, useDeckView } from "@/app/context/DeckViewContext";
import { useCardList } from "@/app/context/CardListContext";
import { AnimatePresence } from "framer-motion";
import Details from "../details/details";
import SidePanel from "../../navigation/SidePanel";
import { CardView } from "./CardView";
import { DeckListView } from "./DeckListView";
import { DeckStackedListView } from "./DeckStackedListView";
import CustomScrollArea from "@/app/components/ui/CustomScrollArea";
import DeckControls from "./DeckControls";
import { ImportCardsModal } from "./ImportCardsModal";
import { ExportCardsModal } from "./ExportCardsModal";
import { Button } from "../primitives/button";

type SlotProps = {
  slotCards?: import("@/lib/schemas").CardRecord[];
  slotDeck?: import("@/app/context/CardListContext").DeckMetadata | null;
  isComparisonSlot?: boolean;
  /** When in compare mode, the other deck's cards to compute diff highlight. */
  otherSlotCards?: import("@/lib/schemas").CardRecord[];
};

function DeckViewContent(props: SlotProps = {}) {
  const { view } = useDeckView();
  if (view === "cards") return <CardView {...props} />;
  if (view === "stacked-list") return <DeckStackedListView {...props} />;
  return <DeckListView {...props} />;
}

export default function AnimatedDeckView() {
  const { bgColor } = useCompactView();

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const { deck, cards, comparisonDeck, comparisonCards, clearComparisonDeck } =
    useCardList();
  const hasComparison = !!comparisonDeck && comparisonCards.length >= 0;

  const totalMainCount = cards.reduce(
    (sum, c) => sum + (typeof c.count === "number" ? c.count : 1),
    0,
  );
  const totalComparisonCount = comparisonCards.reduce(
    (sum, c) => sum + (typeof c.count === "number" ? c.count : 1),
    0,
  );

  return (
    <DeckViewProvider>
      <AnimatePresence>
        <div className="bg-light">
          <div
            style={{ background: bgColor }}
            className="h-dvh items-center text-dark pt-12 flex flex-col overflow-x-hidden"
          >
            <div className="w-full h-full flex gap-2 overflow-y-hidden relative my-1 rounded-xl items-center ">
              <div
                className={`h-full z-20 overflow-y-hidden min-w-86 max-w-86 pb-2 transition-all `}
              >
                <SidePanel />
              </div>
              <div className={`relative w-full h-full z-10 flex gap-2`}>
                {/* Main deck column */}
                <CustomScrollArea
                  className="h-full w-full overflow-y-scroll hide-scrollbar pr-3"
                  trackClassName="bg-dark/20 rounded-xs border-l border-dark/10 w-2 mr-1 rounded-r-full"
                  thumbClassName="bg-light/60 rounded-xs w-4"
                  autoHide={false}
                  thickness={10}
                >
                  <DeckControls
                    onOpenImportModal={() => setImportModalOpen(true)}
                    onOpenExportModal={() => setExportModalOpen(true)}
                  />
                  <div
                    className={`pt-14 overflow-visible
                    ${
                      hasComparison
                        ? "flex-1 min-w-0 min-h-0 grid grid-cols-1 xl:grid-cols-2 gap-2"
                        : "w-full flex-1 min-w-0"
                    }`}
                  >
                    <div className="text-center">
                      <h3 className="font-bold text-dark/90 truncate">
                        {deck?.name ?? "Current deck"}
                        <span className="font-normal text-dark/60 ml-1.5">
                          ({totalMainCount} cards)
                        </span>
                      </h3>
                      <DeckViewContent
                        otherSlotCards={
                          hasComparison ? comparisonCards : undefined
                        }
                      />
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-dark/90 truncate">
                        {comparisonDeck?.name ?? "Comparison"}
                        <span className="font-normal text-dark/60 ml-1.5">
                          ({totalComparisonCount} cards)
                        </span>
                      </h3>
                      <DeckViewContent
                        slotCards={comparisonCards}
                        slotDeck={comparisonDeck}
                        isComparisonSlot
                        otherSlotCards={cards}
                      />
                    </div>
                  </div>
                  <Details />
                </CustomScrollArea>
                <ImportCardsModal
                  isOpen={importModalOpen}
                  onClose={() => setImportModalOpen(false)}
                />
                <ExportCardsModal
                  isOpen={exportModalOpen}
                  onClose={() => setExportModalOpen(false)}
                />

                {/* Comparison deck column */}
                {/* {hasComparison && (
                  <div className="relative h-full min-h-0 min-w-0 flex flex-col border-l border-dark/20 mr-2">
                    <div className="shrink-0 px-2 py-1 flex items-center justify-between gap-2 bg-light/30 border-b border-dark/10">
                      <h3 className="font-bold text-dark/90 truncate">
                        {comparisonDeck?.name ?? "Comparison"}
                      </h3>
                      <Button
                        variant="frosted"
                        size="sm"
                        className="rounded-full text-xs"
                        onClick={clearComparisonDeck}
                      >
                        Close comparison
                      </Button>
                    </div>
                    <CustomScrollArea
                      className="flex-1 min-h-0 overflow-y-scroll hide-scrollbar mr-2 pr-2 h-full"
                      trackClassName="bg-dark/20 rounded-xs w-2"
                      thumbClassName="bg-light/60 rounded-xs"
                      autoHide={false}
                    >
                      <div className="pt-2 overflow-visible">
                        <DeckViewContent
                          slotCards={comparisonCards}
                          slotDeck={comparisonDeck}
                          isComparisonSlot
                          otherSlotCards={cards}
                        />
                      </div>
                    </CustomScrollArea>
                  </div>
                )} */}
              </div>

              <div className="w-full h-full px-1 absolute pointer-events-none">
                <div className="bg-light/60 w-full h-full rounded-xl " />
              </div>
            </div>
          </div>
        </div>
      </AnimatePresence>
    </DeckViewProvider>
  );
}
