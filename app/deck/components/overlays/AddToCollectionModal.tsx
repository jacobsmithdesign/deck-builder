"use client";

import { useEffect, useRef, useState } from "react";
import { Checkbox, Field, Label } from "@headlessui/react";
import { RxCheck } from "react-icons/rx";
import { AnimatedButton } from "../primitives/AnimatedButton";
import { useCardList } from "@/app/context/CardListContext";
import { useCompactView } from "@/app/context/compactViewContext";
import { addToCollectionClient } from "@/lib/api/decks/client/addToCollectionClient";

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
    <div
      ref={modalRef}
      className={`top-0 overflow-clip hide-scrollbar bg-light justify-between flex flex-col p-1 max-w-lg text-left  ${
        showBoard
          ? "outline outline-dark/5 rounded-br-lg"
          : "rounded-lg outline outline-dark/15"
      }`}
    >
      <input
        type="text"
        placeholder="Deck Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-96 p-1 text-base bg-dark/10 rounded-sm mb-1 border border-dark/10"
      />
      <textarea
        placeholder="Optional description..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-2 bg-dark/10 rounded-l-md rounded-t-md mb-1 max-h-48 min-h-10 border border-dark/10"
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
          className="shadow-none transition-all duration-150 px-2 h-6"
          onClick={closeModal}
          title="Cancel"
        />
        <button
          disabled={loading}
          className="px-2 lg:text-base text-sm rounded-sm h-6 bg-buttonBlue md:hover:bg-buttonBlue/80 text-light cursor-pointer"
          onClick={handleSaveClick}
        >
          {loading ? "Saving..." : "Save Deck"}
        </button>
      </div>
    </div>
  );
}
