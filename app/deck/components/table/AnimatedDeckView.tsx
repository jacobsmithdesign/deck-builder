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
import UnsavedChanges from "../overlays/UnsavedChanges";
import SearchBox from "../primitives/SearchBox";
import {
  searchCardForDeck,
  selectCardDataFromId,
} from "@/lib/db/searchCardForDeck";

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
  const { addCard } = useCardList();
  useEffect(() => {
    if (deck && profile) {
      setUserOwnsDeck(profile.id === deck.userId);
      setEnableAddToCollectionButton(true);
    }
  }, [profile, deck]);
  // Function for selecting a search result and adding it to the deck
  const addSelectedCard = async (uuid: string) => {
    const card = await selectCardDataFromId(uuid);
    addCard(card);
  };
  return (
    <EditModeProvider>
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
                <div className="absolute z-10 flex justify-between w-full p-2">
                  {userOwnsDeck ? (
                    <>
                      <SearchBox
                        searchFunction={searchCardForDeck}
                        selectFunction={addSelectedCard}
                        placeholder="Search for new card"
                      />
                      <div className="absolute right-5 top-2 z-10 pointer-events-none">
                        <UnsavedChanges />
                      </div>
                    </>
                  ) : (
                    <AddToCollectionButton />
                  )}
                </div>
                {/* Cards and details panel */}
                <CardView />
                <Details />
              </CustomScrollArea>
              <div className="w-full h-full px-1 absolute">
                <div className="bg-light/60 w-full h-full rounded-xl " />
              </div>
            </div>
          </div>
        </div>
      </AnimatePresence>
    </EditModeProvider>
  );
}
