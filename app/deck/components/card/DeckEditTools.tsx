import { AnimatePresence, motion } from "framer-motion";
import AddToCollectionModal from "./AddToCollectionModal";
import { useCompactView } from "@/app/context/compactViewContext";
import { useEffect, useState } from "react";
import { useCardList } from "@/app/context/CardListContext";
import { useUser } from "@/app/context/userContext";
import { Link } from "lucide-react";
import { RxArrowRight } from "react-icons/rx";
import { Button } from "../button";
export default function DeckEditTools() {
  // Get deck and user info from context
  const { profile } = useUser();
  const { cards, deck, resetCards } = useCardList();
  // states to determine deck ownership and render "edit" / "add to collection" buttons appropriately
  const isOwner = deck?.userId === profile?.id; // check if the current user is the owner of the deck
  const [editMode, setEditMode] = useState<boolean>(false); // Toggle for edit mode
  const [isEditing, setIsEditing] = useState<boolean>(false); // State to manage if the deck is being edited (isOwner && editMode)
  const [showModal, setShowModal] = useState<boolean>(false);
  const [openNewCardModal, setOpenNewCardModal] = useState<boolean>(true);
  const [newCreatedDeck, setNewCreatedDeck] = useState<string>();
  const {
    compactView,
    toggleCompactView,
    bgColor,
    showBoard,
    toggleShowBoard,
  } = useCompactView();
  const toggleEditing = () => {
    setEditMode((prev) => !prev); // Toggle edit mode
    console.log(editMode);
    if (isOwner && editMode) {
      resetCards();
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

  return (
    <AnimatePresence>
      {/* Conditionally render add to collection or edit button */}
      {isOwner ? (
        <div className="flex ml-1 rounded-lg z-20 overflow-hidden relative gap-1">
          <button
            onClick={() => toggleEditing()}
            className={`drop-shadow-none h-6 rounded-lg active:scale-95 transition-all duration-300 text-ellipsis whitespace-nowrap overflow-hidden md:text-sm text-xs bg-light/40 md:hover:bg-light/70 border border-light/20 cursor-pointer ${
              isEditing ? "w-16" : "w-20"
            }`}
          >
            <span className="">{isEditing ? "Cancel" : "Edit deck"}</span>
          </button>
          <motion.div
            key="save-button"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileTap={{ scale: 0.95 }}
            transition={{
              type: "spring",
              duration: 0.005,
              damping: 18,
              stiffness: 450,
            }}
          >
            {isEditing && (
              <Button
                className=""
                variant="save"
                onClick={() => toggleEditing()}
                title="Save changes"
              />
            )}
          </motion.div>
        </div>
      ) : (
        <div className="pl-1 z-20">
          {newCreatedDeck ? (
            <motion.div
              key="go-to-collection-button"
              initial={{ opacity: 0, scale: 0.95, width: 0 }}
              animate={{ opacity: 1, scale: 1, width: 200 }}
              exit={{ opacity: 0, scale: 0.95, width: 0 }}
              whileHover={{ width: 210 }}
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
                className="w-full flex justify-between items-center gap-2 bg-green-200/70 md:hover:bg-green-300/20 transition-colors duration-150 text-green-400 rounded-lg px-3 pl-4 cursor-pointer h-6 text-xs md:text-sm"
              >
                <span className="overflow-ellipsis pt-0.5">
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
                className="w-full cursor-pointer items-center px-2 h-6 justify-center text-light font-bold flex bg-buttonBlue md:hover:bg-buttonBlue/90 rounded-lg transition-all duration-100 ease-out active:scale-[97%] text-xs md:text-sm"
                onClick={() => {
                  setShowModal(true);
                }}
              >
                <p>+ Add to collection</p>
              </button>
            </motion.div>
          )}
        </div>
      )}
      <motion.div
        key="minimise-button"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileTap={{ scale: 0.95 }}
        transition={{
          type: "spring",
          duration: 0.005,
          damping: 18,
          stiffness: 450,
        }}
        className="flex gap-1 z-20"
      >
        <Button
          className="pt-1.5 text-xs md:text-sm rounded-lg"
          onClick={toggleCompactView}
          title={compactView ? "Show overview" : "Minimise overview"}
        />
      </motion.div>
    </AnimatePresence>
  );
}
