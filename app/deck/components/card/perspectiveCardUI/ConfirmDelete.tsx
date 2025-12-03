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
          <motion.div
            key="confirmRemove"
            initial={{
              opacity: 0,
              z: 10,
              scale: 0.8,
            }}
            animate={{
              opacity: 1,
              z: 20,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              z: 0,
              scale: 0.8,
            }}
            whileHover={{ z: 50 }}
            whileTap={{
              z: 20,
            }}
            transition={{
              type: "spring",
              stiffness: 650,
              damping: 20,
              bounce: 3,
              duration: 0.15,
              delay: 0,
            }}
            className="cursor-pointer z-10 rounded-lg text-red-600 md:hover:text-light p-1 items-center justify-start flex h-6 px-2 w-36 transition-colors duration-150 absolute left-0 ml-5 gap-2 bg-light/40 md:hover:bg-red-600/70 group border border-light/30 shadow-inner shadow-light/60 md:hover:shadow-light/20"
            onClick={() => {
              setEditMode(true);
              if (card) removeCard(card);
              setDeleteClicked(false);
            }}
          >
            <IoTrashOutline className="h-4 w-4 mb-2 text-red-600 md:group-hover:text-light mt-1.5 transition-colors duration-150" />
            <p>Delete</p>
          </motion.div>
          {/* Cancel remove button */}
          <motion.div
            key="cancelRemove"
            initial={{
              opacity: 0,
              z: 10,
              scale: 0.8,
            }}
            animate={{
              opacity: 1,
              z: 20,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              z: 0,
              scale: 0.8,
            }}
            whileHover={{ z: 50 }}
            whileTap={{
              z: 20,
            }}
            transition={{
              type: "spring",
              stiffness: 650,
              damping: 20,
              bounce: 3,
              duration: 0.15,
            }}
            className="absolute w-36 cursor-pointer z-0 rounded-lg bg-light/30 text-dark justify-start flex items-center gap-2 p-1 h-6 px-2 transition-colors duration-150 pt-1.5 mt-13 md:hover:text-light md:hover:bg-dark border border-light/30 group md:hover:drop-shadow-2xl shadow-inner shadow-light/60 md:hover:shadow-light/10"
            onClick={() => setDeleteClicked(false)}
          >
            <RxCross1 className="h-4 w-4 mb-2 text-dark md:group-hover:text-light transition-colors duration-150 mt-1.5" />
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
            className="absolute w-37 mx-auto rounded-full -translate-y-7 text-base text-center"
          >
            <p>Confirm</p>
          </motion.div>

          {/* Background plate for Confirm Delete popup */}
          <motion.div
            key="popup"
            initial={{
              opacity: 0,
              z: 0,
              scale: 0.95,
              backdropFilter: "blur(0px)",
            }}
            animate={{
              opacity: 1,
              z: 10,
              scale: 1,
              backdropFilter: "blur(4px)",
            }}
            exit={{
              opacity: 0,
              z: 0,
              scale: 0.95,
              backdropFilter: "blur(0px)",
              transition: { type: "linear" },
            }}
            transition={{
              type: "spring",
              stiffness: 450,
              damping: 20,
              bounce: 1,
              duration: 0.005,
            }}
            className={`will-change-[transform,opacity] absolute z-10 drop-shadow-xl  rounded-xl bg-gradient-to-t from-light/10 to-light/60 shadow-inner shadow-light/40 text-dark p-2 flex flex-col items-between text-center md:text-base text-xs h-22 w-39`}
          ></motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDelete;
