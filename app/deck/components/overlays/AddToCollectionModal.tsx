"use client";

import { useEffect, useRef, useState } from "react";
import { Checkbox, Field, Label } from "@headlessui/react";
import { RxCheck } from "react-icons/rx";
import { AnimatedButton } from "../primitives/AnimatedButton";
import { useCardList } from "@/app/context/CardListContext";
import { useCompactView } from "@/app/context/compactViewContext";
import { addToCollectionClient } from "@/lib/api/decks/client/addToCollectionClient";
import { FrostedElement } from "../primitives/FrostedPill";
import { AnimatePresence, motion } from "framer-motion";
import { RaindropContainer } from "../primitives/RaindropContainer";

export default function AddToCollectionModal({
  closeModal,
  onDeckCreated,
}: {
  closeModal: () => void;
  saveDeck: (newUserDeckId: string) => void;
  onDeckCreated?: (id: string) => void;
}) {
  const { deck } = useCardList();
  const { showBoard } = useCompactView();
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState<string>(deck?.name || "");
  const modalRef = useRef<HTMLDivElement>(null);
  const { bgColor } = useCompactView();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        closeModal();
        document.removeEventListener("mousedown", handleClickOutside);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
  }, []);

  const existingDeckId = deck?.id;
  const handleSaveClick = async () => {
    setLoading(true);
    try {
      const { newDeckId } = await addToCollectionClient({
        existingDeckId: existingDeckId,
        name: deck.name,
        description: description,
        isPublic: isPublic,
      });

      onDeckCreated?.(newDeckId);
      closeModal();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ scale: 0, backdropFilter: "blur(0px)" }}
      animate={{ scale: 1, backdropFilter: "blur(8px)" }}
      exit={{ scale: 0, backdropFilter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className="rounded-xl w-92"
    >
      <RaindropContainer
        bgColor={bgColor}
        childClassName="flex flex-col gap-2 w-full p-2"
        innerClassName="opacity-30"
        ref={modalRef}
        className={`overflow-clip hide-scrollbar justify-between flex flex-col p-0 text-left rounded-xl mt-1 gap-2 w-92 backdrop-blur-sm border-t border-light/40 from-light/90 to-light/40 shadow-light`}
      >
        <input
          type="text"
          placeholder="Deck Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-2 py-1 text-base bg-light/50 outline-dark/30  focus:bg-light outline rounded-lg w-full"
        />
        <textarea
          placeholder="Optional description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-2 py-1 bg-dark/10 rounded-l-lg rounded-t-lg max-h-48 min-h-10 "
        />
        <Field className="flex items-center gap-2 group cursor-pointer">
          <Checkbox
            checked={isPublic}
            onChange={setIsPublic}
            className="group size-6 rounded-md bg-light/50 p-1 ring-1 ring-light/30 ring-inset focus:not-data-focus:outline-none data-checked:bg-light data-focus:outline data-focus:outline-offset-2 data-focus:outline-light group-active:scale-90 transition-all duration-100 outline outline-dark/20"
          >
            <RxCheck className="hidden size-4 fill-black group-data-checked:block" />
          </Checkbox>
          <Label>Make this deck public</Label>
        </Field>
        <div className="flex justify-end gap-2">
          <AnimatedButton
            variant="secondary"
            className="shadow-none transition-all duration-150 px-2 h-6"
            onClick={closeModal}
            title="Cancel"
          />
          <AnimatedButton
            variant="primary"
            disabled={loading}
            onClick={handleSaveClick}
            title="Add Deck"
          >
            {loading ? "Saving..." : "Save Deck"}
          </AnimatedButton>
        </div>
      </RaindropContainer>
    </motion.div>
  );
}
