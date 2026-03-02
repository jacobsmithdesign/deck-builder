import { useCardList } from "@/app/context/CardListContext";
import { useEditMode } from "@/app/context/editModeContext";
import { CardRecord } from "@/lib/schemas";
import { AnimatePresence, motion } from "framer-motion";
import { IoTrashOutline } from "react-icons/io5";
import { RxCross1 } from "react-icons/rx";
interface ConfirmDeleteProps {
  deleteClicked: boolean;
  setDeleteClicked: (value: boolean) => void;
  card: CardRecord;
}

const ConfirmDelete: React.FC<ConfirmDeleteProps> = ({
  deleteClicked,
  setDeleteClicked,
  card,
}) => {
  const { setEditMode } = useEditMode();
  const { deck, removeCard } = useCardList();

  return (
    <AnimatePresence>
      {/* Remove button */}
      {deleteClicked && (
        <>
          <motion.button
            key="confirmRemove"
            initial={{
              opacity: 0,
              z: 10,
              scale: 0.8,
              backdropFilter: "blur(0px)",
            }}
            animate={{
              opacity: 1,
              z: 20,
              scale: 1,
              backdropFilter: "blur(2.5px)",
            }}
            exit={{
              transition: {
                type: "linear",
                duration: 0.1,
              },
              opacity: 0,
              z: 0,
              scale: 0.8,
              backdropFilter: "blur(0px)",
            }}
            whileHover={{ z: 50, backdropFilter: "blur(3.5px)" }}
            whileTap={{
              z: 12,
              backdropFilter: "blur(1.5px)",
            }}
            transition={{
              type: "spring",
              stiffness: 650,
              damping: 20,
              bounce: 3,
              duration: 0.15,
              delay: 0,
            }}
            className="cursor-pointer z-10 rounded-lg text-red-600 md:hover:text-light p-1 items-center justify-start flex h-6 px-2 w-36 transition-colors duration-150 absolute gap-2 bg-gradient-to-t from-light/70 to-light/45 md:hover:from-light/15 md:hover:to-light/0 md:hover:bg-red-600/70 group border border-light/30 shadow-inner shadow-light/60 md:hover:shadow-light/20"
            onClick={() => {
              setEditMode(true);
              if (card) removeCard(card);
              setDeleteClicked(false);
            }}
          >
            <IoTrashOutline className="h-4 w-4 mb-2 text-red-600 md:group-hover:text-light mt-1.5 transition-colors duration-150" />
            <p>Delete</p>
          </motion.button>
          {/* Cancel remove button */}
          <motion.div
            key="cancelRemove"
            initial={{
              opacity: 0,
              z: 10,
              scale: 0.8,
              backdropFilter: "blur(0px)",
            }}
            animate={{
              opacity: 1,
              z: 20,
              scale: 1,
              backdropFilter: "blur(2.5px)",
            }}
            exit={{
              transition: {
                type: "linear",
                duration: 0.1,
              },
              opacity: 0,
              z: 0,
              scale: 0.8,
              backdropFilter: "blur(0px)",
            }}
            whileHover={{ z: 50 }}
            whileTap={{
              z: 12,
              backdropFilter: "blur(1.5px)",
            }}
            transition={{
              type: "spring",
              stiffness: 650,
              damping: 20,
              bounce: 3,
              duration: 0.15,
            }}
            className="absolute w-36 cursor-pointer z-0 rounded-lg bg-gradient-to-t from-light/70 to-light/45 md:hover:from-light/80 md:hover:to-light/55 shadow-inner shadow-light/40 text-dark justify-start flex items-center gap-2 p-1 h-6 px-2 transition-colors duration-150 pt-1.5 mt-13 border border-light/30 group md:hover:shadow-light/60"
            onClick={() => setDeleteClicked(false)}
          >
            <RxCross1 className="h-4 w-4 mb-2 text-dark transition-colors duration-150 mt-1.5" />
            <p>Cancel</p>
          </motion.div>

          {/* Confirm delete title */}
          <motion.div
            initial={{
              opacity: 0,
              z: 10,
              scale: 0.8,
            }}
            animate={{
              opacity: 1,
              z: 15,
              scale: 1,
            }}
            exit={{
              transition: {
                type: "linear",
                duration: 0.1,
              },
              opacity: 0,
              z: 0,
              scale: 0.8,
            }}
            transition={{
              type: "spring",
              stiffness: 650,
              damping: 20,
              bounce: 3,
              duration: 0.15,
            }}
            className="absolute px-2 mx-auto rounded-full -translate-y-7 text-base text-center
            bg-gradient-to-t from-light/60 to-light/45 shadow-inner shadow-light/40 backdrop-blur-xs"
          >
            <p>Confirm</p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDelete;
