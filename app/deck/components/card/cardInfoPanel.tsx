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
          scale: 1,
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
        className="h-52 mt-4.5 absolute rounded-md bg-light/70 border-light/20 backdrop-blur-md w-40 flex flex-col overflow-hidden text-xs "
      >
        <div className="rounded-lg h-full">
          <Button
            className="w-5 h-5 flex items-center justify-center cursor-pointer hover:bg-light/60 right-0.5 top-0.5 absolute rounded-sm"
            onClick={setCloseInfoPanel}
          >
            <RxCross1 />
          </Button>
          <div className="grid gap-1 ">
            <button className="h-6 md:hover:bg-light/60 flex items-center p-2 cursor-pointer rounded-sm">
              <p>Variations</p>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
