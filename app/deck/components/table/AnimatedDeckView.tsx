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
    <div className="bg-light ">
      <div
        style={{ background: bgColor }}
        className="h-lvh items-center text-dark pt-12 overflow-y-scroll hide-scrollbar flex flex-col justify-between relative"
      >
        <CommanderOverview />
        <div className="w-full h-full flex flex-col relative">
          <AnimatePresence>
            <motion.div
              animate={{
                height: showBoard ? "100%" : 32,
              }}
              transition={{
                type: "tween",
                duration: 0.5,
                damping: 25,
                stiffness: 270,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`w-full ${
                !showBoard && "mb-1 "
              } pt-1 absolute px-1 z-20 flex`}
            >
              <div className={`w-full transition-all`}>
                <EditModeProvider>
                  <CardTable />
                </EditModeProvider>
              </div>
            </motion.div>
            <motion.div className="z-10 h-full">
              <Details />
            </motion.div>
          </AnimatePresence>
          <div className="w-full h-full px-1 pb-1 absolute">
            <div className="bg-light/65 w-full h-full rounded-b-xl p-1"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
