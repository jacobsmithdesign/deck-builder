"use client";

import { CardTable } from "./CardTable";
import CommanderOverview from "@/app/components/ui/commanderOverview";
import {
  CompactViewProvider,
  useCompactView,
} from "@/app/context/compactViewContext";
import { AnimatePresence, motion, useTime } from "framer-motion";
import { use, useEffect, useState } from "react";
import Details from "../details/details";
import AddToCollectionModal from "../overlays/AddToCollectionModal";
import { useCardList } from "@/app/context/CardListContext";
import { useUser } from "@/app/context/userContext";
import AddToCollectionButton from "../primitives/AddToCollectionButton";
import { useIsDeckSaved } from "@/app/hooks/useIsDeckSaved";
import { EditModeProvider, useEditMode } from "@/app/context/editModeContext";
import SidePanel from "../../navigation/SidePanel";
import { CardView } from "./CardView";
import CustomScrollArea from "@/app/components/ui/CustomScrollArea";
import UnsavedChanges from "../overlays/UnsavedChanges";
import SearchBox from "../primitives/SearchBox";
import {
  searchCardForDeck,
  selectCardDataFromId,
} from "@/lib/db/searchCardForDeck";
import {
  FrostedElement,
  FrostedElementColoured,
} from "../primitives/FrostedPill";
import DeckControls from "./DeckControls";

interface ViewStates {}

// This is the main section of the deck page that contains the
// CardTable and Details view underneath the commander overview.
//

export default function AnimatedDeckView() {
  const { bgColor } = useCompactView();
  const { deck } = useCardList();
  const { profile } = useUser();
  const { addCard } = useCardList();
  const { setEditMode } = useEditMode();
  const [view, setView] = useState();
  return (
    <AnimatePresence>
      <div className="bg-light">
        <div
          style={{ background: bgColor }}
          className="h-dvh items-center text-dark pt-12 flex flex-col"
        >
          {/* <CommanderOverview /> */}
          <div className="w-full h-full flex gap-2 overflow-y-hidden relative my-1 rounded-xl">
            <div className="h-full min-w-88 max-w-86 z-20 overflow-y-hidden pb-2">
              <SidePanel />
            </div>
            <CustomScrollArea className="h-full w-full overflow-y-scroll hide-scrollbar z-10">
              {/* Deck Controls at top of page */}
              <DeckControls />
              {/* Cards and details panel */}
              <div className="pt-14">
                <CardView />
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
  );
}
