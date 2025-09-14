"use client";

import { useState } from "react";
import { Checkbox, Field, Label } from "@headlessui/react";
import { RxCheck } from "react-icons/rx";
import { AnimatedButton } from "../AnimatedButton";
import { saveNewDeckClient } from "@/lib/api/decks/client/saveNewDeckClient";
import { useCardList } from "@/app/context/CardListContext";

export default function AddToCollectionModal({
  closeModal,
  onDeckCreated,
}: {
  closeModal: () => void;
  saveDeck: (newUserDeckId: string) => void;
  onDeckCreated?: (id: string) => void;
}) {
  const { deck } = useCardList();
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState<string>(deck?.name || "");

  const preconDeckId = deck?.id;
  const handleSaveClick = async () => {
    setLoading(true);
    try {
      const { newDeckId } = await saveNewDeckClient({
        preconDeckId: deck.id,
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
    <div className="top-0 overflow-clip hide-scrollbar bg-light/70 justify-between flex flex-col p-1 backdrop-blur-md px-1 pb-2 rounded-lg max-w-lg shadow-inner shadow-light/60">
      <h2 className="text-lg font-bold rounded-sm px-1">Save new deck</h2>
      <input
        type="text"
        placeholder="Deck Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-96 p-1 text-base bg-light/80 rounded-md mb-1"
      />
      <textarea
        placeholder="Optional description..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-2 bg-light/80 rounded-md mb-1 max-h-48 min-h-10"
      />
      <Field className="flex items-center gap-2 group cursor-pointer">
        <Checkbox
          checked={isPublic}
          onChange={setIsPublic}
          className="group size-6 rounded-md bg-light/50 p-1 ring-1 ring-light/30 ring-inset focus:not-data-focus:outline-none data-checked:bg-light data-focus:outline data-focus:outline-offset-2 data-focus:outline-light group-active:scale-90 transition-all duration-100 "
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
          className="px-2 lg:text-base text-sm rounded-md h-6 bg-buttonBlue md:hover:bg-buttonBlue/80 text-light cursor-pointer"
          onClick={handleSaveClick}
        >
          {loading ? "Saving..." : "Save Deck"}
        </button>
      </div>
    </div>
  );
}
