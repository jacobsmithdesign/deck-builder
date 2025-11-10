import { useCompactView } from "@/app/context/compactViewContext";
import { AnimatePresence, motion } from "framer-motion";
import AddToCollectionModal from "./AddToCollectionModal";
import { useEffect, useState } from "react";
import { useIsDeckSaved } from "@/app/hooks/useIsDeckSaved";
import { useCardList } from "@/app/context/CardListContext";
import Link from "next/link";
import { RxArrowTopRight, RxCheck } from "react-icons/rx";
import { Button } from "@/app/deck/components/button";
export default function AddToCollectionButton() {
  const { showBoard } = useCompactView();
  const { deck } = useCardList(); // has deck?.id
  const [showModal, setShowModal] = useState<boolean>(false);
  const {
    saved: deckSaved,
    loading: checkingSaved,
    refetch: refetchSaved,
    linkId: userCopyDeckId,
  } = useIsDeckSaved(deck?.id);
  const [deckIsSaved, setDeckIsSaved] = useState<boolean>(false);

  const toggleCloseModal = () => setShowModal(false);

  const toggleOpenModal = () => setShowModal(true);

  const [optimisticLinkId, setOptimisticLinkId] = useState<
    string | undefined
  >();

  const handleDeckSaved = async (newUserDeckId: string) => {
    // 1) optimistic UI
    setOptimisticLinkId(newUserDeckId);

    // 2) confirm from DB
    await refetchSaved();

    setShowModal(false);
  };

  const isSaved = deckSaved || !!optimisticLinkId;
  const linkTarget = userCopyDeckId ?? optimisticLinkId;
  useEffect(() => {
    if (deckSaved) setDeckIsSaved(true);
  }, []);

  return (
    <AnimatePresence>
      {!checkingSaved && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          {/* Add to collection button */}
          {!deckSaved ? (
            <button
              className={`cursor-pointer bg-light/60 h-7 rounded-md backdrop-blur-md md:hover:bg-light/80 border border-dark/20 text-sm md:text-base px-2 md:hover:drop-shadow-sm transition-all duration-150 md:hover:border-light`}
              onClick={toggleOpenModal}
            >
              + Add to collection
            </button>
          ) : (
            <Link
              href={`/deck/${userCopyDeckId}`}
              className={`flex items-center h-7 rounded-md px-2 backdrop-blur-sm cursor-pointer transition-all duration-150 bg-green-300/60 text-green-700 md:hover:bg-green-200/50
              group md:hover:pr-8 border border-green-500/70`}
            >
              <RxCheck className="mr-1 w-4 md:group-hover:w-0 transition-all" />
              In your collection
              <RxArrowTopRight className="w-0 md:group-hover:w-4 right-0 absolute mr-2 transition-all" />
            </Link>
          )}

          {showModal && (
            <div
              className={`absolute z-20 ${
                showBoard ? "mt-1 -translate-x-14" : "mt-1"
              } transition-all duration-150 `}
            >
              <AddToCollectionModal
                closeModal={toggleCloseModal}
                onDeckCreated={handleDeckSaved}
                saveDeck={handleDeckSaved}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
