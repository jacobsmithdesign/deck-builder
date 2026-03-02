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
import AddToCollectionButton from "../card/AddToCollectionButton";
import { useIsDeckSaved } from "@/app/hooks/useIsDeckSaved";
import { EditModeProvider } from "@/app/context/editModeContext";
import SidePanel from "../../navigation/SidePanel";
import { CardView } from "./CardView";
import CustomScrollArea from "@/app/components/ui/CustomScrollArea";

// This is the main section of the deck page that contains the
// CardTable and Details view underneath the commander overview.
//

export default function AnimatedDeckView() {
  const { showBoard, bgColor } = useCompactView();
  const { deck } = useCardList();
  const { profile } = useUser();
  const { saved: deckSaved } = useIsDeckSaved(deck?.id);
  const [userOwnsDeck, setUserOwnsDeck] = useState<boolean>(false);
  const [enableAddToCollectionButton, setEnableAddToCollectionButton] =
    useState<boolean>(false);

  useEffect(() => {
    if (deck && profile) {
      setUserOwnsDeck(profile.id === deck.userId);
      setEnableAddToCollectionButton(true);
    }
  }, [profile, deck]);

  return (
    <EditModeProvider>
      <AnimatePresence>
        <div className="bg-light">
          <div
            style={{ background: bgColor }}
            className="h-dvh items-center text-dark pt-12 flex flex-col"
          >
            <CommanderOverview />
            <div className="w-full h-full flex overflow-y-hidden relative pr-1 mb-1 rounded-b-xl">
              <SidePanel />
              <CustomScrollArea className="h-full w-full overflow-y-scroll hide-scrollbar z-10">
                <CardTable />
                <Details />
              </CustomScrollArea>
              <div className="w-full h-full px-1 absolute">
                <div className="bg-light/60 w-full h-full rounded-b-xl " />
              </div>
            </div>
          </div>
        </div>
      </AnimatePresence>
    </EditModeProvider>
  );
}
