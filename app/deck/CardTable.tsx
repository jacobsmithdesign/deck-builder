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
        showBoard ? "h-full" : " h-10"
      } transition-all duration-200 relative z-10 overflow-y-scroll hide-scrollbar rounded-none ease-in-out px-1 pb-2 pt-1`}
    >
      {/* The header above the board of cards */}
      <BoardHeader
        className={`pl-0 bg-light/40 outline outline-light/70 md:hover:outline-light/90 flex relative justify-between backdrop-blur-sm group ${
          showBoard ? "rounded-b-none " : "shadow-inner shadow-light/40 "
        }  transition-all duration-100 ease-out md:hover:bg-light/60 mx-auto`}
      >
        <button
          className="w-full h-full absolute z-0 cursor-pointer"
          onClick={toggleShowBoard}
        />
        <BoardTitle className="p-1 w-full text-center flex justify-center items-center pointer-events-none">
          <CardDescription
            className={`font-normal text-dark/60 md:group-hover:pr-3 md:group-hover:text-dark/80 transition-all duration-100 ease-out pointer-events-none z-10 `}
          >
            Card table
          </CardDescription>
          {showBoard ? (
            <RxMinus
              className={`text-dark h-4 absolute ml-20 md:group-hover:ml-24 opacity-0 md:group-hover:opacity-100 transition-all duration-100 z-10`}
            />
          ) : (
            <RxPlus
              className={`text-dark h-4 absolute ml-20 md:group-hover:ml-24 opacity-0 md:group-hover:opacity-100 transition-all duration-100 z-10`}
            />
          )}
        </BoardTitle>
      </BoardHeader>
      {/* The board holding all cards */}
      <AnimatePresence>
        <div
          className={`h-full transition-all ${
            showBoard
              ? "opacity-100 duration-150"
              : "opacity-0 duration-200 pointer-events-none"
          }`}
        >
          <MainBoard isEditMode={isEditing} />
        </div>
      </AnimatePresence>
    </Board>
  );
};
