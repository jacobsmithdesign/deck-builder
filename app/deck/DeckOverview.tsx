"use client";
import { useState } from "react";
import { Deck, UserDeck } from "@/lib/schemas";
import { Board, BoardHeader, BoardTitle } from "./components/Board";
import { useUser } from "@/app/context/userContext";
import { MainBoard } from "./components/MainBoard";
import { EditBoard } from "./components/EditBoard";
import { CardListProvider } from "../context/CardListContext";
import { useCardList } from "../context/CardListContext";

export const DeckOverview = () => {
  // Get deck and user info from context
  const { profile } = useUser();
  const { cards, deck } = useCardList();
  // states to determine deck ownership and render "edit" / "add to collection" buttons appropriately
  const isUserDeck = deck?.isUserDeck; // Determine if deck is owned by a user or is public
  const isOwner = deck?.userId === profile?.id; // check if the current user is the owner of the deck
  const [editMode, setEditMode] = useState<boolean>(false); // Toggle for edit mode
  const [isEditing, setIsEditing] = useState<boolean>(false); // State to manage if the deck is being edited (isOwner && editMode)
  const [showModal, setShowModal] = useState<boolean>(false);
  const toggleEditing = () => {
    setEditMode(!editMode); // Toggle edit mode
    if (isOwner && editMode) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  };

  if (!deck) {
    return <div className="text-center text-lg">Loading deck...</div>;
  }

  // state to manage modal visibility and group visibility

  return (
    <Board className="relative">
      <BoardHeader className="mb-1 rounded-lg">
        <BoardTitle className="text-2xl font-bold">{deck.name}</BoardTitle>
        {/* Conditionally render add to collection or edit button */}
        {isOwner ? (
          editMode ? (
            <button onClick={() => toggleEditing()}>Save</button>
          ) : (
            <button
              className="cursor-pointer p-2 items-center justify-center font-bold flex gap-1 bg-darksecondary/10 md:hover:bg-darksecondary/20 h-8 rounded-md transition-all duration-100 ease-out active:scale-[97%] text-dark/70 md:hover:text-dark"
              onClick={() => toggleEditing()}
            >
              Edit
            </button>
          )
        ) : (
          <button
            className="cursor-pointer p-2 items-center justify-center text-light font-bold flex gap-1 bg-buttonBlue md:hover:bg-buttonBlue/90 h-8 rounded-md transition-all duration-100 ease-out active:scale-[97%]"
            onClick={() => {
              setShowModal(true);
            }}
          >
            <p className="drop-shadow-sm">+ Add to collection</p>
          </button>
        )}
      </BoardHeader>
      <MainBoard isEditMode={editMode} />
    </Board>
  );
};
