import { CardRecord } from "@/lib/schemas";
import { Button } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import { RxCross1 } from "react-icons/rx";
export function CardInfoPanel({
  closeInfoPanel,
  card,
  setCloseInfoPanel,
}: {
  closeInfoPanel: boolean;
  card: CardRecord;
  setCloseInfoPanel: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{
          opacity: 0,
          z: 0,
          scale: 0,
        }}
        animate={{
          opacity: 1,
          z: 20,
          scale: 0.87,
        }}
        exit={{
          opacity: 0,
          z: 0,
          scale: 0.0,
        }}
        transition={{
          type: "spring",
          stiffness: 450,
          damping: 30,
          bounce: 3,
          duration: 0.005,
        }}
        className="h-full absolute w-full rounded-lg backdrop-blur-sm bg-light/60 border border-light/20 flex flex-col overflow-hidden text-xs"
      >
        <div className="flex w-full justify-between h-6 pl-1 border-b border-dark/10 text-sm text-ellipsis ">
          <h1 className="font-bold text-sm w-full h-6 overflow-hidden ">
            {card.name}
          </h1>
          <Button
            className="w-6 h-6 flex items-center justify-center cursor-pointer hover:bg-light/60 right-0 "
            onClick={setCloseInfoPanel}
          >
            <RxCross1 />
          </Button>
        </div>
        <div className="grid gap-1">
          {}
          <button className="h-6 md:hover:bg-light/60 flex items-center p-2 cursor-pointe rounded-sm">
            <p>View Variations</p>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
