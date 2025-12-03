import { AnimatePresence, motion } from "framer-motion";
import { useCardList } from "@/app/context/CardListContext";
import { RxCheckCircled, RxCross1, RxMinus, RxPlus } from "react-icons/rx";
import { Button } from "@/app/deck/components/button";
import { useUserOwnsDeck } from "@/app/hooks/useUserOwnsDeck";
import { useSaveUserDeck } from "@/app/hooks/useSaveUserDeck";
import { BsFillSaveFill } from "react-icons/bs";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useEditMode } from "@/app/context/editModeContext";
import { count } from "console";
import CustomScrollArea from "@/app/components/ui/CustomScrollArea";
import { useState } from "react";
export default function UnsavedChanges() {
  const { deck, cards, changesMadeState, addCard, removeCard, resetCards } =
    useCardList();

  const newCards = (cards ?? []).map((c) => ({
    uuid: c.uuid,
    count: c.count ?? 1,
    board_section: "mainboard",
  }));
  const [hideChanges, sethideChanges] = useState<boolean>(false);
  const { editMode } = useEditMode();
  const { progress, step, saving, error, start, result, reset } =
    useSaveUserDeck();
  const { isOwner: isOwner } = useUserOwnsDeck(deck?.id);

  if (!isOwner) return null;
  const toggleHideChanges = () => {
    sethideChanges(!hideChanges);
  };

  return (
    <div className="flex gap-1 items-center ">
      <AnimatePresence>
        {changesMadeState && changesMadeState.length > 0 && editMode && (
          <div className="flex flex-col gap-1 items-end ">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, height: 0 }}
              animate={{
                opacity: 1,
                scale: 1,
                height: hideChanges ? 34 : changesMadeState.length * 28 + 34,
              }}
              exit={{
                opacity: 0,
                scale: 0.8,
                height: 0,
                transition: { delay: 0.1 },
              }}
              transition={{
                type: "spring",
                stiffness: 250,
                damping: 25,
              }}
              className="flex flex-col text-left rounded-xl bg-gradient-to-t from-light/20 to-light/60 backdrop-blur-sm border border-light/30 shadow-inner shadow-light/80 gap-1 max-h-58 overflow-y-scroll hide-scrollbar w-70 p-1 pointer-events-auto"
            >
              <button
                className="absolute z-10 bg-light/40 md:hover:bg-light/60 outline outline-light/50 rounded-lg px-1.5 w-67.5 flex justify-between items-center cursor-pointer"
                onClick={() => {
                  toggleHideChanges();
                }}
              >
                <p className=" ">Unsaved changes</p>
                {hideChanges ? <RxPlus /> : <RxMinus />}
              </button>
              <CustomScrollArea
                className={`h-full w-full mr-2 gap-1 pt-7 transition-all duration-250 ${
                  hideChanges ? "opacity-0" : ""
                }`}
                scrollAreaClassName={`rounded-t-md`}
                trackClassName={`bg-dark/20 rounded-xs outline outline-dark/20 w-2 mr-1 ml-1 mb-1 rounded-r-sm mt-8`}
                thumbClassName="bg-light/60 rounded-xs"
                hideCustomScrollbar={changesMadeState.length < 8}
                autoHide={false}
              >
                {!hideChanges && (
                  <div className="flex flex-col mr-1 gap-1 justify-center">
                    <AnimatePresence>
                      {changesMadeState
                        .map(({ card, countChange }, index) => (
                          <motion.div
                            key={`unsaved-change-${card.uuid}`}
                            initial={{
                              opacity: 0,
                              scale: 0.8,
                              height: 0,
                            }}
                            animate={{
                              opacity: 1,
                              scale: 1,
                              height: 24,
                            }}
                            exit={{
                              opacity: 0,
                              scale: 0.85,
                              height: 0,
                              transition: {
                                type: "linear",
                                delay: 0,
                                duration: 0.25,
                              },
                            }}
                            transition={{
                              type: "linear",
                              delay: 0,
                              duration: 0.25,
                            }}
                            className={`${
                              countChange > 0
                                ? "bg-green-600/60 border-light/20 md:hover:bg-green-600/80 shadow-inner md:hover:shadow-light/0 shadow-light/30"
                                : " bg-red-600/60 border-light/30 md:hover:bg-red-600/70 shadow-inner md:hover:shadow-light/0 shadow-light/30"
                            } rounded-lg text-base w-full h-6 items-center flex text-light backdrop-blur-md border gap-2 transition-colors duration-150 group overflow-clip`}
                          >
                            <button
                              className="flex gap-2 justify-between items-center h-full w-full px-2 cursor-pointer overflow-clip"
                              onClick={() => {
                                if (countChange > 0) {
                                  removeCard(card);
                                } else addCard(card);
                              }}
                            >
                              <span className="absolute md:group-hover:opacity-100 opacity-0 transition-all duration-150 md:group-hover:delay-100 ease-out md:group-hover:translate-x-0 -translate-x-2">
                                Undo
                              </span>
                              <span className="md:group-hover:ml-11 transition-all duration-250 ease-out text-ellipsis whitespace-nowrap overflow-hidden block mr-2">
                                {card.name}
                              </span>{" "}
                              {countChange > 0 ? "+" : "-"}
                              {Math.abs(countChange)}
                            </button>
                          </motion.div>
                        ))
                        .reverse()}
                    </AnimatePresence>
                  </div>
                )}
              </CustomScrollArea>
            </motion.div>
            <div className="flex gap-1 pointer-events-auto">
              {/* Save button */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{
                  scale: 1,
                  transition: { delay: 0.2 },
                }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                className=""
              >
                <Button
                  variant="default"
                  title={step || error || "Save"}
                  disabled={saving}
                  className={`px-2 rounded-full h-6 w-fit bg-green-200/60 backdrop-blur-sm shadow-inner shadow-light/30 gap-2 border-current/30 text-green-600`}
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
              {/* Cancel button */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{
                  scale: 1,
                  transition: { delay: 0.15 },
                }}
                exit={{ scale: 0, transition: { delay: 0.05 } }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                className=""
              >
                <Button
                  variant="default"
                  title={"Cancel"}
                  className={`px-2 rounded-full h-6 w-fit bg-red-200/60 backdrop-blur-sm shadow-inner shadow-light/30 gap-2 border-current/30 text-red-600`}
                  onClick={() => {
                    resetCards();
                    reset();
                  }}
                >
                  <RxCross1 />
                </Button>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
