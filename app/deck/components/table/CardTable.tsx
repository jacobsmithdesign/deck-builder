"use client";
import { Board, BoardHeader } from "../primitives/Board";
import { MainBoard } from "./MainBoard";
import { useCardList } from "../../../context/CardListContext";
import { AnimatePresence } from "framer-motion";
import { useCompactView } from "../../../context/compactViewContext";
import { RxArrowLeft } from "react-icons/rx";
import { Button } from "@/app/deck/components/primitives/button";
import EditControls from "./EditControls";
import AddToCollectionButton from "../card/AddToCollectionButton";
import SearchBox from "../primitives/SearchBox";
import {
  searchCardForDeck,
  selectCardDataFromId,
} from "@/lib/db/searchCardForDeck";
import { CardView } from "./CardView";
import UnsavedChanges from "../overlays/UnsavedChanges";

export const CardTable = () => {
  const { deck, userOwnsDeck, addCard } = useCardList();
  const { showBoard, toggleShowBoard } = useCompactView();

  if (!deck) {
    return <div className="text-center text-lg">Loading deck...</div>;
  }
  // Function for selecting a search result and adding it to the deck
  const addSelectedCard = async (uuid: string) => {
    const card = await selectCardDataFromId(uuid);
    addCard(card);
  };

  return (
    // This is the entire deck preview board, starting with the header containing edit/ save/ minimise buttons etc.
    // and then the MainBoard itself which is categorised card groups (e.g. lands, enchantments, creatures, etc.)

    <Board
      className={`pb-1 w-full h-fit transition-all duration-200 relative z-0 hide-scrollbar rounded-none ease-in-out px-1 text-center mt-0`}
    >
      {/* The board holding all cards */}
      <CardView />
    </Board>
  );
};
