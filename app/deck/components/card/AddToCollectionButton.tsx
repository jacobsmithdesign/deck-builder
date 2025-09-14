import { useCompactView } from "@/app/context/compactViewContext";
import { AnimatePresence, motion } from "framer-motion";
import AddToCollectionModal from "./AddToCollectionModal";
import { useEffect, useState } from "react";
import { useIsDeckSaved } from "@/app/hooks/useIsDeckSaved";
import { useCardList } from "@/app/context/CardListContext";
import Link from "next/link";
import { RxArrowTopRight, RxCheck } from "react-icons/rx";
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
    <div className="z-20">
      <AnimatePresence>
        {!deckSaved ? (
          <button
            className={`absolute border shadow-inner h-7 rounded-md px-2 mt-1 backdrop-blur-sm cursor-pointer transition-all duration-150 ml-1 ${
              showBoard ? "mt-2 ml-2" : "ml-25"
            } text-dark/60 bg-light/40 md:hover:bg-light/80 border-light/60 md:hover:outline-light shadow-light/40`}
            onClick={toggleOpenModal}
          >
            {checkingSaved ? "Checking…" : "+ Add to collection"}
          </button>
        ) : (
          <Link
            href={`/deck/${userCopyDeckId}`}
            className={`absolute border shadow-inner flex items-center h-7 rounded-md px-2 mt-1 backdrop-blur-sm cursor-pointer transition-all duration-150 group ml-1 ${
              showBoard ? "mt-2 ml-2" : "ml-25 "
            } bg-green-300/60 shadow-green-200/60 border-green-400 text-green-700 md:hover:bg-green-200/80
               md:hover:pr-8 `}
          >
            <RxCheck className="mr-1 w-4 md:group-hover:w-0 transition-all" />
            In your collection
            <RxArrowTopRight className="w-0 md:group-hover:w-4 right-0 absolute mr-2 transition-all" />
          </Link>
        )}

        {showModal && (
          <div
            className={`absolute ${
              showBoard ? "mt-11 ml-2" : "mt-9 ml-1 "
            } transition-all duration-150`}
          >
            <AddToCollectionModal
              closeModal={toggleCloseModal}
              onDeckCreated={handleDeckSaved}
              saveDeck={handleDeckSaved}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
