import { useCardList } from "@/app/context/CardListContext";
import { AnimatePresence, motion } from "framer-motion";

export function StrengthsAndWeaknesses({
  compactView = false,
}: {
  compactView?: boolean;
}) {
  const { aiOverview } = useCardList();
  return (
    <AnimatePresence>
      {!compactView && (
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.85,
            translateY: -60,
            translateX: -80,
          }}
          animate={{ opacity: 1, scale: 1, translateY: 0, translateX: 0 }}
          exit={{
            opacity: 0,
            scale: 0.65,
            translateY: -45,
            translateX: -90,
            transition: { delay: 0.05 },
          }}
          transition={{ duration: 0.15, delay: 0 }}
          className="flex flex-col row-span-2 h-fit z-0"
        >
          <div className="flex flex-col h-full gap-1 p-1 bg-light/60 outline outline-dark/20 rounded-md">
            <div className="flex flex-wrap gap-1 text-sm">
              Strengths:
              {aiOverview?.ai_strengths?.map((strength) => (
                <div className="bg-green-300/40 w-fit px-1 text-sm rounded">
                  {strength}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1 text-sm">
              Weaknesses:
              {aiOverview?.ai_weaknesses?.map((weakeness) => (
                <div className="bg-red-300/40 w-fit px-1 text-sm rounded">
                  {weakeness}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
