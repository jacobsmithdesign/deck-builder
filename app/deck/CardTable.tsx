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
import { RxMinus, RxPlus } from "react-icons/rx";

export const CardTable = () => {
  const { deck } = useCardList();
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
        showBoard ? "pb-2" : " h-8 w-25 delay-200"
      } transition-all duration-200 relative z-0 overflow-y-scroll hide-scrollbar rounded-none ease-in-out px-1 text-center pt-1`}
    >
      {/* The header above the board of cards */}
      <BoardHeader
        className={`pl-0 bg-light/40 border border-light/60 md:hover:outline-light flex relative justify-between backdrop-blur-sm group md:hover:drop-shadow-sm rounded-md ${
          showBoard
            ? "rounded-b-none h-9 rounded-t-lg"
            : "shadow-inner shadow-light/40 h-7"
        }  transition-all duration-100 ease-out md:hover:bg-light/80 mx-auto`}
      >
        <button
          className="w-full h-7 absolute z-0 cursor-pointer"
          onClick={toggleShowBoard}
        />
        <BoardTitle className="w-full pl-1 text-center flex justify-center items-center pointer-events-none h-7">
          <CardDescription
            className={`font-normal text-dark/60 md:group-hover:text-dark/80 transition-all duration-100 ease-out pointer-events-none h-7 z-10 flex items-center`}
          >
            {showBoard ? " " : "View "}
            cards
          </CardDescription>
        </BoardTitle>
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
          <MainBoard isEditMode={isEditing} />
        </div>
      </AnimatePresence>
    </Board>
  );
};
