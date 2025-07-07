"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/app/context/userContext";
import { useRouter } from "next/navigation";
import { Checkbox, Field, Label } from "@headlessui/react";
import { RxCheck } from "react-icons/rx";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { AnimatedButton } from "./AnimatedButton";
import { handleSave } from "@/lib/db/saveDeckForEditor";

export default function AddToCollectionModal({
  preconDeckId,
  preconDeckName,
  showModal,
  closeModal,
  saveDeck,
  onDeckCreated,
}: {
  preconDeckId: string;
  preconDeckName: string;
  showModal: boolean;
  closeModal: () => void;
  saveDeck: () => void;
  onDeckCreated?: (id: string) => void;
}) {
  const { profile } = useUser();
  const [name, setName] = useState(preconDeckName);
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [createdDeckId, setCreatedDeckId] = useState<string | null>(null);

  const handleSaveClick = async () => {
    setLoading(true);
    const { success, error, newDeckId } = await handleSave({
      profileId: profile?.id,
      preconDeckId,
      name,
      description,
      isPublic,
    });
    if (success) {
      onDeckCreated?.(newDeckId);
      saveDeck();
      setLoading(false);
    }
  };
  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.9,
          }}
          animate={{
            opacity: 100,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            scale: 0.9,
          }}
          transition={{ duration: 0.05 }}
          className="absolute top-0 mt-11 z-50 overflow-clip hide-scrollbar bg-light/80 border justify-between flex flex-col border-darksecondary/20 p-1 backdrop-blur-md px-3 pb-3 rounded-xl max-w-lg drop-shadow-xl"
        >
          <h2 className="text-lg font-bold">Save new deck</h2>
          <input
            type="text"
            placeholder="Deck Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-96 p-1 border border-darksecondary/20 bg-light/50 rounded mb-2 "
          />
          <textarea
            placeholder="Optional description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border border-darksecondary/20 bg-light/50 rounded mb-2"
          />
          <Field className="flex items-center gap-2 group cursor-pointer">
            <Checkbox
              checked={isPublic}
              onChange={setIsPublic}
              className="group size-6 rounded-md bg-light/50 p-1 ring-1 ring-light/30 ring-inset focus:not-data-focus:outline-none data-checked:bg-light data-focus:outline data-focus:outline-offset-2 data-focus:outline-light group-active:scale-90 transition-all duration-100"
            >
              <RxCheck className="hidden size-4 fill-black group-data-checked:block" />
            </Checkbox>
            <Label>Make this deck public</Label>
          </Field>
          <div className="flex justify-end gap-2">
            <AnimatedButton>
              <Button className="" onClick={closeModal}>
                Cancel
              </Button>
            </AnimatedButton>
            <button
              disabled={loading}
              className="px-2 py-1 rounded-md h-8 bg-buttonBlue md:hover:bg-buttonBlue/80 text-light cursor-pointer"
              onClick={() => {
                handleSaveClick();
              }}
            >
              {loading ? "Saving..." : "Save Deck"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
