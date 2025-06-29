"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/app/context/userContext";
import { useRouter } from "next/navigation";
import { Checkbox, Field, Label } from "@headlessui/react";
import { RxCheck } from "react-icons/rx";

export default function AddToCollectionModal({
  preconDeckId,
  preconDeckName,
  onClose,
}: {
  preconDeckId: string;
  preconDeckName: string;
  onClose: () => void;
}) {
  const { profile } = useUser();
  const [name, setName] = useState(preconDeckName);
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    if (!profile) return;

    setLoading(true);

    const { data: newDeck, error } = await supabase
      .from("user_decks")
      .insert({
        user_id: profile.id,
        deck_name: name,
        description: description,
        is_public: isPublic,
        original_deck_id: preconDeckId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating user deck:", error);
      setLoading(false);
      return;
    }

    const { data: cards, error: cardError } = await supabase
      .from("deck_cards")
      .select("*")
      .eq("deck_id", preconDeckId);

    if (cardError) {
      console.error("Error fetching precon cards:", cardError);
    } else {
      const clonedCards = cards.map(({ deck_id, ...rest }) => ({
        ...rest,
        user_deck_id: newDeck.id,
      }));
      const { error: insertError } = await supabase
        .from("user_deck_cards")
        .insert(clonedCards)
        .select();
      if (insertError) {
        console.error("Error inserting:", insertError);
      } else {
        console.log("Inserted card:", clonedCards.length);
      }
    }

    setLoading(false);
    onClose();
    router.push(`/deck/${newDeck.id}`);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-light/70 border border-darksecondary/20 backdrop-blur-lg p-6 rounded-xl w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Save to Your Collection</h2>
        <div>
          <p>Name</p>
          <input
            type="text"
            placeholder="Deck Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-darksecondary/20 bg-light/50 rounded mb-2"
          />
        </div>
        <div>
          <p>Description</p>
          <textarea
            placeholder="Optional description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border border-darksecondary/20 bg-light/50 rounded mb-2"
          />
        </div>
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
          <button
            className="px-4 py-2 rounded bg-darksecondary/30 md:hover:bg-darksecondary/20 cursor-pointer transition-all duration-100"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            disabled={loading}
            className="px-4 py-2 rounded bg-buttonBlue md:hover:bg-buttonBlue/80 text-light cursor-pointer"
            onClick={handleSave}
          >
            {loading ? "Saving..." : "Save Deck"}
          </button>
        </div>
      </div>
    </div>
  );
}
