import { CardTitle } from "@/app/components/ui/card";
import { CommanderCard } from "@/app/context/CommanderContext";
import { parseDeckText } from "@/app/hooks/parseDeckText";
import { saveNewDeckClient } from "@/lib/api/decks/client/saveNewDeckClient";
import { searchCommander, searchCommanderMini } from "@/lib/db/searchCommander";
import { Checkbox, Field } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RxCheck, RxCross1, RxCross2 } from "react-icons/rx";
import { Button } from "../../components/primitives/button";
import { BsMenuButton } from "react-icons/bs";
import SearchBox from "../../components/table/SearchBox";

// This interface represents the structure of a card in the database deck_cards table
interface dbCardInterface {
  card_uuid: string;
  count: number;
  board_section: string; // "mainboard" | "sideboard" etc
}
type CardLine = {
  count: number;
  name: string;
  uuid?: string;
  type?: string;
};
export default function BlankDeckForm({ onCancel }: { onCancel: () => void }) {
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [deckText, setDeckText] = useState<string>("");
  const [importSuccess, setImportSuccess] = useState<boolean | null>(null);
  const [commanderOptions, setCommanderOptions] = useState<CardLine[] | null>(
    null,
  );
  const [name, setName] = useState<string | null>(null);
  const [commander, setCommander] = useState<CommanderCard | null>(null);
  const [cardList, setCardList] = useState<dbCardInterface[] | null>(null);

  const router = useRouter();

  // The function to handle importing the deck text which parses the text,
  // displays the Legendary Creatures as commander options, and stores the full card list

  const validDeck = name && commander;

  const handleSaveClick = async () => {
    if (validDeck) {
      setLoading(true);
      try {
        const { newDeckId } = await saveNewDeckClient({
          name: name,
          commander_uuid: commander?.id,
          display_card_uuid: commander?.id,
          description: description,
          isPublic: isPublic,
          type: "Commander Deck",
          cards: cardList || [],
        });
        router.push(`/deck/${newDeckId}`);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSelectCommander = async (id?: string) => {
    const result = await searchCommander(undefined, id);
    if (result) {
      setCommander(result[0]);
    }
  };

  return (
    <div className="2 mt-8 text-left gap-2 flex flex-col">
      <div className="flex gap-4 justify-between items-center">
        <CardTitle>New Commander deck</CardTitle>

        <Button variant="cancel" title="Cancel" onClick={onCancel}>
          <RxCross2 />
        </Button>
      </div>

      <SearchBox
        searchFunction={searchCommanderMini}
        placeholder="Find a commander"
      />
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
        <p>Make this deck public</p>
      </Field>
      <Button
        variant="secondaryBlue"
        size="lg"
        className="mt-4 h-8 px-4 w-fit rounded-lg"
        onClick={() => handleSaveClick()}
      >
        Create
      </Button>
    </div>
  );
}
