import { useCompactView } from "@/app/context/compactViewContext";
import { AnimatePresence, motion } from "framer-motion";
import AddToCollectionModal from "./AddToCollectionModal";
import { useEffect, useState } from "react";
import { useIsDeckSaved } from "@/app/hooks/useIsDeckSaved";
import { useCardList } from "@/app/context/CardListContext";
import Link from "next/link";
import {
  RxArrowTopRight,
  RxCheck,
  RxCheckCircled,
  RxCross1,
} from "react-icons/rx";
import { Button } from "@/app/deck/components/button";
import { useUserOwnsDeck } from "@/app/hooks/useUserOwnsDeck";
import { useSaveUserDeck } from "@/app/hooks/useSaveUserDeck";
import { BsFillSaveFill } from "react-icons/bs";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import SearchBox from "./SearchBox";
import { useEditMode } from "@/app/context/editModeContext";
export default function EditControls() {
  const { deck, cards } = useCardList();
  const { editMode, toggleEditMode } = useEditMode();
  const { progress, step, saving, error, start, result, reset } =
    useSaveUserDeck();
  const { isOwner: isOwner } = useUserOwnsDeck(deck?.id);

  if (!isOwner) return null;

  // Compress the cards into a new array for the save function
  const newCards = (cards ?? []).map((c) => ({
    uuid: c.uuid,
    count: c.count ?? 1,
    board_section: "mainboard",
  }));
  console.log("cards ", cards);
  console.log(newCards);

  return (
    <div className="flex gap-1 items-center">
      <AnimatePresence>
        {/* Save button */}
        {editMode && (
          <motion.div>
            <Button
              variant="darkFrosted"
              title={step || error || "Save"}
              disabled={saving}
              className={`bg-green-600/10 md:hover:bg-green-400/20 text-green-500/80 md:hover:text-green-500 gap-2 h-7 outline outline-current/30`}
              onClick={() => start(deck.id, newCards)}
            >
              {saving ? (
                <div className="animate-spin">
                  <AiOutlineLoading3Quarters className="h-4" />
                </div>
              ) : (
                <BsFillSaveFill className="h-4" />
              )}
            </Button>
          </motion.div>
        )}
        {/* Saved indication message */}
        {result && !error && (
          <div className="text-sm flex items-center rounded-sm h-6  px-1 text-green-500/80 cursor-default ">
            <RxCheckCircled className=" h-5 w-5 mr-1" />
            <p>Deck saved!</p>
          </div>
        )}
        {/* Edit/ cancel button */}
        <Button
          variant="darkFrosted"
          title={editMode ? "Cancel" : "Edit Deck"}
          className={`${
            editMode
              ? "bg-red-400/10 md:hover:bg-red-400/20 text-red-500/60 md:hover:text-red-500/80"
              : ""
          } w-20 h-7 gap-2`}
          onClick={() => {
            toggleEditMode();
            reset();
          }}
        >
          {editMode && <RxCross1 />}
        </Button>
      </AnimatePresence>
    </div>
  );
}
