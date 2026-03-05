"use client";

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

function DeckViewContent() {
  const { view } = useDeckView();
  if (view === "list") return <DeckListView />;
  if (view === "stacked-list") return <DeckStackedListView />;
  return <CardView />;
}

export default function AnimatedDeckView() {
  const { bgColor } = useCompactView();

  return (
    <DeckViewProvider>
      <AnimatePresence>
        <div className="bg-light">
          <div
            style={{ background: bgColor }}
            className="h-dvh items-center text-dark pt-12 flex flex-col"
          >
            <div className="w-full h-full flex gap-2 overflow-y-hidden relative my-1 rounded-xl">
              <div className="h-full min-w-88 max-w-86 z-20 overflow-y-hidden pb-2">
                <SidePanel />
              </div>
              <CustomScrollArea className="h-full w-full overflow-y-scroll overflow-x-hidden hide-scrollbar z-10">
                <DeckControls />
                <div className="pt-14">
                  <DeckViewContent />
                </div>
                <Details />
              </CustomScrollArea>
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
