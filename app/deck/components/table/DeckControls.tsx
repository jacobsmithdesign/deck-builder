import { useCompactView } from "@/app/context/compactViewContext";
import SearchBox from "../primitives/SearchBox";
import UnsavedChanges from "../overlays/UnsavedChanges";
import AddToCollectionButton from "../card/AddToCollectionButton";
import { useUserOwnsDeck } from "@/app/hooks/useUserOwnsDeck";
import { useEffect, useState } from "react";
import { useUser } from "@/app/context/userContext";
import { useCardList } from "@/app/context/CardListContext";
import {
  searchCardForDeck,
  selectCardDataFromId,
} from "@/lib/db/searchCardForDeck";
import { useEditMode } from "@/app/context/editModeContext";

export default function DeckControls() {
  const { deck, addCard } = useCardList();
  const { profile } = useUser();
  const [userOwnsDeck, setUserOwnsDeck] = useState<boolean>(false);
  const [enableAddToCollectionButton, setEnableAddToCollectionButton] =
    useState<boolean>(false);
  const { setEditMode } = useEditMode();
  useEffect(() => {
    if (deck && profile) {
      setUserOwnsDeck(profile.id === deck.userId);
      setEnableAddToCollectionButton(true);
    }
  }, [profile, deck]);
  const { bgColor } = useCompactView(); // Function for selecting a search result and adding it to the deck
  const addSelectedCard = async (uuid: string) => {
    const card = await selectCardDataFromId(uuid);
    addCard(card);
    setEditMode(true);
  };
  console.log("colour", bgColor);
  return (
    <div className="absolute z-10 flex w-full pr-4 pt-2 h-10 pl-1">
      <div
        className="w-full h-10 bg-gradient-to-t from-light/60 to-lightsecondary/20 p-1 shadow-inner shadow-light/65 rounded-full drop-shadow-xl z-10"
        color={bgColor ? bgColor : "light"}
      >
        <div
          style={{ background: bgColor }}
          className="absolute w-full h-full opacity-30 -translate-y-1 -translate-x-1 rounded-full z-0 border-t-2 border-light/40"
        />
      </div>
      {useUserOwnsDeck ? (
        <div className="absolute flex h-10 w-full justify-center items-center">
          <SearchBox
            searchFunction={searchCardForDeck}
            selectFunction={addSelectedCard}
            placeholder="Search for new card"
            padding={12}
          />
          <div className="left-2 top-2 absolute z-10 pointer-events-none">
            <UnsavedChanges />
          </div>
        </div>
      ) : (
        <div className="absolute w-fit z-10 pt-1.5 pl-2 justify-center items-center">
          <AddToCollectionButton />
        </div>
      )}
    </div>
  );
}
