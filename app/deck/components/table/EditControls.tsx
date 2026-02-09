import { AnimatePresence, motion } from "framer-motion";
import { useCardList } from "@/app/context/CardListContext";
import { RxCheckCircled, RxCross1 } from "react-icons/rx";
import { Button } from "@/app/deck/components/primitives/button";
import { useUserOwnsDeck } from "@/app/hooks/useUserOwnsDeck";
import { useSaveUserDeck } from "@/app/hooks/useSaveUserDeck";
import { BsFillSaveFill } from "react-icons/bs";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useEditMode } from "@/app/context/editModeContext";
import { useEffect } from "react";
import { set } from "zod";
export default function EditControls() {
  const { deck, cards, changesMadeState, resetCards } = useCardList();
  const { editMode, toggleEditMode, setEditMode } = useEditMode();
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

  // This is purely for console logging the basic card data
  const basicCardData = (cards ?? []).map((c) => ({
    name: c.name,
    type: c.type,
    text: c.text,
  }));
  console.log("Simplified card data ", basicCardData);

  return (
    <div className="flex gap-1 items-center">
      <AnimatePresence>
        {/* Save button */}
        {changesMadeState.length !== 0 && (
          <>
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
            </motion.div>{" "}
            {/* Edit/ cancel button */}
            <Button
              variant="darkFrosted"
              title={"Cancel"}
              className={`bg-red-400/10 md:hover:bg-red-400/20 text-red-500/60 md:hover:text-red-500/80 w-20 h-7 gap-2`}
              onClick={() => {
                toggleEditMode();
                resetCards();
                reset();
              }}
            >
              <RxCross1 />
            </Button>
          </>
        )}
        {/* Saved indication message */}
        {result && !error && (
          <div className="text-sm flex items-center rounded-sm h-6  px-1 text-green-500/80 cursor-default ">
            <RxCheckCircled className=" h-5 w-5 mr-1" />
            <p>Deck saved!</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
