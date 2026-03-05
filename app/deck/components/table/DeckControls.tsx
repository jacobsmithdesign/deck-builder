import { useCompactView } from "@/app/context/compactViewContext";
import SearchBox from "../primitives/SearchBox";
import UnsavedChanges from "../overlays/UnsavedChanges";
import AddToCollectionButton from "../primitives/AddToCollectionButton";
import { useUserOwnsDeck } from "@/app/hooks/useUserOwnsDeck";
import { useEffect, useState } from "react";
import { useUser } from "@/app/context/userContext";
import { useCardList } from "@/app/context/CardListContext";
import {
  searchCardForDeck,
  selectCardDataFromId,
} from "@/lib/db/searchCardForDeck";
import { useEditMode } from "@/app/context/editModeContext";
import { RaindropContainer } from "../primitives/RaindropContainer";
import { Button } from "@headlessui/react";
import { AnimatedButton } from "../primitives/AnimatedButton";
import {
  BsFilter,
  BsFilterCircle,
  BsSortDown,
  BsWindow,
  BsWindowDock,
} from "react-icons/bs";
import { RiFilter2Line, RiFilterFill } from "react-icons/ri";

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
      <RaindropContainer
        className="w-full h-10 rounded-full drop-shadow-xl backdrop-blur-sm p-0 from-light/80"
        innerClassName="scale-100 outline-light border-t border-light/20 outline"
        bgColor={bgColor ? bgColor : "light"}
      ></RaindropContainer>
      {userOwnsDeck ? (
        <div className="absolute w-full items-center h-10 pl-2 pr-6 grid grid-cols-3">
          <div className="relative flex mb-6">
            <div className="absolute">
              <UnsavedChanges />
            </div>
          </div>
          <div className="flex justify-center">
            <SearchBox
              searchFunction={searchCardForDeck}
              selectFunction={addSelectedCard}
              placeholder="Search for new card"
              padding={12}
            />
          </div>

          <div className="flex justify-end gap-1">
            {/* View Button */}
            <AnimatedButton
              variant="raindrop"
              className="w-fit h-8 rounded-full bg-light/0 font-bold text-dark/80 gap-1"
              title="View"
              icon={<BsWindow className="w-5 h-4" />}
            />
            {/* Sort Button */}
            <AnimatedButton
              variant="raindrop"
              className="w-fit h-8 rounded-full bg-light/0 font-bold text-dark/80 gap-1"
              title="Sort"
              icon={<BsSortDown className="w-5 h-4" />}
            />
            {/* Filter Button */}
            <AnimatedButton
              variant="raindrop"
              className="w-fit h-8 rounded-full bg-light/0 font-bold text-dark/80 gap-1"
              title="Filters"
              icon={<RiFilter2Line className="w-5 h-4" />}
            />
          </div>
        </div>
      ) : (
        <div className="absolute w-fit z-10 pt-[6px] pl-1.5 justify-center items-center">
          <AddToCollectionButton />
        </div>
      )}
    </div>
  );
}
