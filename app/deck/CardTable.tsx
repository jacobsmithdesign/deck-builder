"use client";
import { useEffect, useState } from "react";
import {
  Board,
  BoardContent,
  BoardHeader,
  BoardTitle,
} from "./components/card/Board";
import { useUser } from "@/app/context/userContext";
import { MainBoard } from "./components/card/MainBoard";
import { useCardList } from "../context/CardListContext";
import { motion, AnimatePresence } from "framer-motion";
import { useCompactView } from "../context/compactViewContext";
import { CardDescription } from "../components/ui/card";
import { RxArrowLeft, RxCross1, RxMinus, RxPlus } from "react-icons/rx";
import EditButton from "./components/card/EditControls";
import { Button } from "@/app/deck/components/button";
import EditControls from "./components/card/EditControls";
import { useEditMode } from "../context/editModeContext";
import AddToCollectionButton from "./components/card/AddToCollectionButton";

export const CardTable = () => {
  const { deck, userOwnsDeck } = useCardList();
  const { editMode, toggleEditMode } = useEditMode();
  const { profile } = useUser();
  const [isEditing, setIsEditing] = useState<boolean>(false); // State to manage if the deck is being edited (isOwner && editMode)
  const { showBoard, toggleShowBoard } = useCompactView();

  if (!deck) {
    return <div className="text-center text-lg">Loading deck...</div>;
  }

  return (
    // This is the entire deck preview board, starting with the header containing edit/ save/ minimise buttons etc.
    // and then the MainBoard itself which is categorised card groups (e.g. lands, enchantments, creatures, etc.)

    <Board
      className={` ${
        showBoard ? "pb-2 w-full" : " h-8 w-full"
      } transition-all duration-200 relative z-0 hide-scrollbar rounded-none ease-in-out px-1 text-center mt-0`}
    >
      {/* The header above the board of cards */}
      <BoardHeader
        className={`flex relative rounded-md ${
          showBoard
            ? "bg-light/60 rounded-b-none h-9 rounded-t-lg justify-between"
            : "h-7 justify-start"
        }  transition-all duration-100 ease-out mx-auto items-center`}
      >
        {!showBoard ? (
          <button
            className="bg-light/60 border border-dark/20 md:hover:border-light w-28 h-7 px-1 text-sm md:text-base md:hover:bg-light/80 md:hover: md:hover:drop-shadow-sm z-0 items-center justify-center flex rounded-md backdrop-blur-md transition-all duration-150 cursor-pointer"
            onClick={toggleShowBoard}
          >
            <p> Show Cards</p>
          </button>
        ) : (
          // Back button to minimise the board
          <div className="flex gap-1">
            <Button
              variant="darkFrosted"
              className="h-7 w-12 z-10"
              onClick={toggleShowBoard}
            >
              <RxArrowLeft className="h-4 w-4" />
            </Button>
            {!userOwnsDeck && <AddToCollectionButton />}
          </div>
        )}

        {!userOwnsDeck && !showBoard && <AddToCollectionButton />}
        {/* Deck editing controls. e.g. Edit / Save */}
        {showBoard && <EditControls />}
      </BoardHeader>
      {/* The board holding all cards */}
      <AnimatePresence>
        <div
          className={`h-full transition-all ${
            showBoard
              ? "opacity-100 duration-150 "
              : "opacity-0 duration-200  pointer-events-none "
          }`}
        >
          <MainBoard />
        </div>
      </AnimatePresence>
    </Board>
  );
};
