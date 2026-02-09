import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Checkbox, Field, Label } from "@headlessui/react";
import { RxCheck } from "react-icons/rx";
import { AnimatedButton } from "../../components/primitives/AnimatedButton";
import { saveNewDeckClient } from "@/lib/api/decks/client/saveNewDeckClient";
import { useCardList } from "@/app/context/CardListContext";
import { useCompactView } from "@/app/context/compactViewContext";
import CommanderSearch from "@/app/components/ui/commanderSearch";
import { CommanderCard } from "@/app/context/CommanderContext";
import { useIsDeckSaved } from "@/app/hooks/useIsDeckSaved";
import { useRouter } from "next/navigation";

export default function CommanderFormatForm({
  onCancel,
}: {
  onCancel: () => void;
}) {
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const [selectedCommander, setSelectedCommander] =
    useState<CommanderCard | null>(null);

  const router = useRouter();
  const handleSaveClick = async () => {
    setLoading(true);
    try {
      const { newDeckId } = await saveNewDeckClient({
        name: name,
        commander_uuid: selectedCommander?.id,
        display_card_uuid: selectedCommander?.id,
        description: description,
        isPublic: isPublic,
        type: "Commander Deck",
        cards: [],
      });
      router.push(`/deck/${newDeckId}`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        <motion.div className="flex flex-col mt-8">
          <div
            className={`top-0 overflow-clip hide-scrollbar bg-light justify-between flex flex-col p-1 max-w-lg text-left 
        `}
          >
            <h2>Choose your commander</h2>
            <CommanderSearch
              onSelect={(commander) => setSelectedCommander(commander)}
            />
            {/* Miniature commander panel */}
            {selectedCommander && (
              <div className="flex items-center gap-2 p-2 mt-1 border border-dark/10 rounded-md bg-dark/10 mb-4">
                <img
                  src={selectedCommander.imageFrontUrl}
                  alt={selectedCommander.name}
                  className="w-12 h-16 object-cover rounded-md"
                />
                <div>
                  <h3 className="font-semibold">{selectedCommander.name}</h3>
                  <p className="text-sm text-darksecondary">
                    {selectedCommander.type}
                  </p>
                </div>
              </div>
            )}
            <h2>Deck Name</h2>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-96 p-1 text-base bg-dark/10 rounded-sm mb-1 border border-dark/10"
            />

            <h2>Deck Description (optional)</h2>
            <textarea
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
                title="Cancel"
                onClick={onCancel}
              />
              <button
                disabled={loading}
                className="px-2 lg:text-base text-sm rounded-sm h-6 bg-buttonBlue md:hover:bg-buttonBlue/80 text-light cursor-pointer"
                onClick={handleSaveClick}
              >
                {loading ? "Creating..." : "Create Deck"}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
