"use client";

import { useState } from "react";
import {
  CompactViewProvider,
  useCompactView,
} from "@/app/context/compactViewContext";
import { DeckViewProvider, useDeckView } from "@/app/context/DeckViewContext";
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

function DeckViewContent() {
  const { view } = useDeckView();
  if (view === "list") return <DeckListView />;
  if (view === "stacked-list") return <DeckStackedListView />;
  return <CardView />;
}

export default function AnimatedDeckView() {
  const { bgColor } = useCompactView();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  return (
    <DeckViewProvider>
      <AnimatePresence>
        <div className="bg-light">
          <div
            style={{ background: bgColor }}
            className="h-dvh items-center text-dark pt-12 flex flex-col overflow-x-hidden"
          >
            <div className="w-full h-full flex gap-2 overflow-y-hidden relative my-1 rounded-xl items-center ">
              <div className="h-full min-w-88 max-w-86 z-20 overflow-y-hidden pb-2">
                <SidePanel />
              </div>
              <div className="relative h-full w-full flex-1 min-w-0 z-10">
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
                  <div className="pt-14 overflow-visible">
                    <DeckViewContent />
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
              </div>
              <div className="w-full h-full px-1 absolute">
                <div className="bg-light/60 w-full h-full rounded-xl " />
              </div>
            </div>
          </div>
        </div>
      </AnimatePresence>
    </DeckViewProvider>
  );
}
