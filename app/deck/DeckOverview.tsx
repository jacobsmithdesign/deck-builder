"use client";
import { useEffect, useState } from "react";
import { Board, BoardHeader, BoardTitle } from "./components/Board";
import { useUser } from "@/app/context/userContext";
import { MainBoard } from "./components/MainBoard";
import { useCardList } from "../context/CardListContext";
import { motion, AnimatePresence } from "framer-motion";
import AddToCollectionModal from "./components/AddToCollectionModal";
import { Button } from "./components/button";
import { RxArrowRight, RxCheck, RxCheckCircled } from "react-icons/rx";
import Link from "next/link";
import { useCompactView } from "../context/compactViewContext";

export const DeckOverview = () => {
  // Get deck and user info from context
  const { profile } = useUser();
  const { cards, deck } = useCardList();
  // states to determine deck ownership and render "edit" / "add to collection" buttons appropriately
  const isOwner = deck?.userId === profile?.id; // check if the current user is the owner of the deck
  const [editMode, setEditMode] = useState<boolean>(false); // Toggle for edit mode
  const [isEditing, setIsEditing] = useState<boolean>(false); // State to manage if the deck is being edited (isOwner && editMode)
  const [showModal, setShowModal] = useState<boolean>(false);
  const [newCreatedDeck, setNewCreatedDeck] = useState<string>();
  const { compactView, toggleCompactView, bgColor } = useCompactView();
  const toggleEditing = () => {
    setEditMode((prev) => !prev); // Toggle edit mode
    console.log(editMode);
    if (isOwner && editMode) {
      setIsEditing(true);
      console.log(isEditing);
    } else {
      setIsEditing(false);
    }
  };
  useEffect(() => {
    if (editMode && isOwner) {
      setIsEditing(true);
      console.log(isEditing);
    } else {
      setIsEditing(false);
    }
  }, [editMode]);

  const saveDeck = async () => {
    closeModal(); // Close the modal after saving
  };
  const closeModal = () => {
    setShowModal(false); // Toggle modal visibility
  };

  if (!deck) {
    return <div className="text-center text-lg">Loading deck...</div>;
  }

  // state to manage modal visibility and group visibility

  return (
    <Board className={`relative z-10 overflow-y-scroll px-2 pb-2`}>
      <BoardHeader className="pl-0 rounded-lg relative flex my-1">
        <AnimatePresence>
          {/* Conditionally render add to collection or edit button */}
          {isOwner ? (
            <div className=" flex gap-2">
              <motion.div
                key="edit/cancel-button"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                transition={{
                  type: "spring",
                  duration: 0.005,
                  damping: 18,
                  stiffness: 450,
                }}
              >
                <Button
                  variant="secondary"
                  onClick={() => toggleEditing()}
                  title={isEditing ? "Cancel" : "Edit deck"}
                  className="drop-shadow-none"
                />
              </motion.div>
              {editMode && (
                <motion.div
                  key="save-button"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{
                    type: "spring",
                    duration: 0.005,
                    damping: 18,
                    stiffness: 450,
                  }}
                >
                  <Button
                    variant="save"
                    onClick={() => toggleEditing()}
                    title="Save changes"
                  />
                </motion.div>
              )}
            </div>
          ) : (
            <div>
              {newCreatedDeck ? (
                <motion.div
                  key="go-to-collection-button"
                  initial={{ opacity: 0, scale: 0.95, width: 0 }}
                  animate={{ opacity: 1, scale: 1, width: 200 }}
                  exit={{ opacity: 0, scale: 0.95, width: 0 }}
                  whileHover={{ scale: 1.03, width: 210 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{
                    type: "spring",
                    duration: 0.005,
                    damping: 18,
                    stiffness: 450,
                  }}
                >
                  <Link
                    href={`/deck/${newCreatedDeck}`}
                    className="w-full flex justify-between items-center gap-2 h-8 bg-green-500/20 md:hover:bg-green-500/30 transition-colors duration-150 text-green-600 rounded-lg px-3 pl-4 cursor-pointer"
                  >
                    <span className="overflow-ellipsis">
                      Added to collection!
                    </span>
                    <RxArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  key="add-to-collection-button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, width: 0 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{
                    type: "spring",
                    duration: 0.005,
                    damping: 18,
                    stiffness: 450,
                  }}
                >
                  <button
                    className="w-full cursor-pointer p-2 items-center justify-center text-light font-bold flex gap-1 bg-buttonBlue md:hover:bg-buttonBlue/90 h-8 rounded-md transition-all duration-100 ease-out active:scale-[97%]"
                    onClick={() => {
                      setShowModal(true);
                    }}
                  >
                    <p className="drop-shadow-sm">+ Add to collection</p>
                  </button>
                </motion.div>
              )}

              <AddToCollectionModal
                preconDeckId={deck.id}
                preconDeckName={deck.name}
                showModal={showModal}
                closeModal={closeModal}
                saveDeck={saveDeck}
                onDeckCreated={setNewCreatedDeck}
              />
            </div>
          )}
          <Button
            className=""
            onClick={toggleCompactView}
            variant="secondary"
            title={compactView ? "Show overview" : "Minimise overview"}
          />
        </AnimatePresence>
      </BoardHeader>
      <MainBoard isEditMode={isEditing} />
    </Board>
  );
};
