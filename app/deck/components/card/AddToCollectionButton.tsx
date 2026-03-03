import { useCompactView } from "@/app/context/compactViewContext";
import { AnimatePresence, motion } from "framer-motion";
import AddToCollectionModal from "../overlays/AddToCollectionModal";
import { useEffect, useState } from "react";
import { useIsDeckSaved } from "@/app/hooks/useIsDeckSaved";
import { useCardList } from "@/app/context/CardListContext";
import Link from "next/link";
import { RxArrowTopRight, RxCheck } from "react-icons/rx";
import { Button } from "@/app/deck/components/primitives/button";
import { useUser } from "@/app/context/userContext";
import { FrostedElement } from "../primitives/FrostedPill";
import { AnimatedButton } from "../primitives/AnimatedButton";
export default function AddToCollectionButton() {
  const { showBoard } = useCompactView();
  const { userLoggedIn } = useUser();
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
    <div>
      {!checkingSaved && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          {/* Add to collection button */}
          {!deckSaved ? (
            <AnimatedButton
              variant="frosted"
              className="h-fit rounded-full text-lg px-3"
              onClick={toggleOpenModal}
              title="+ Add to your collection"
            ></AnimatedButton>
          ) : (
            <Link
              href={`/deck/${userCopyDeckId}`}
              className={`flex items-center h-7 px-3 backdrop-blur-sm cursor-pointer transition-all duration-150 bg-green-300/60 text-green-700 md:hover:bg-green-200/50
              group md:hover:pr-8 border border-green-500/70 rounded-full`}
            >
              <RxCheck className="mr-2 w-4 md:group-hover:w-0 transition-all" />
              In your collection
              <RxArrowTopRight className="w-0 md:group-hover:w-4 right-0 absolute mr-2 transition-all" />
            </Link>
          )}

          {showModal && (
            <AnimatePresence>
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
            </AnimatePresence>
          )}
        </motion.div>
      )}
    </div>
  );
}
