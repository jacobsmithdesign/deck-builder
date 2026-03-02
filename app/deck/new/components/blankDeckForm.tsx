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
import SearchBox from "../../components/primitives/SearchBox";
import PerspectiveCard from "../../components/card/perspectiveCardUI/PerspectiveCard";
import { selectCardDataFromId } from "@/lib/db/searchCardForDeck";
import { CardRecord } from "@/lib/schemas";
import { getScryfallUrl } from "@/app/hooks/getScryfallUrl";

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
  const [name, setName] = useState<string>("");
  const [commander, setCommander] = useState<CardRecord | null>(null);
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
          commander_uuid: commander?.uuid,
          display_card_uuid: commander?.uuid,
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
    const result = await selectCardDataFromId(id);
    if (result) {
      setCommander(result);
    }
  };

  return (
    <div className="flex items-center flex-col">
      <div className="flex gap-4 justify-between items-center mb-4">
        <CardTitle>New Commander deck</CardTitle>

        <Button variant="cancel" title="Cancel" onClick={onCancel}>
          <RxCross2 />
        </Button>
      </div>
      <div className="flex flex-col gap-4">
        <SearchBox
          searchFunction={searchCommanderMini}
          selectFunction={handleSelectCommander}
          placeholder="Find a commander"
        />
        {commander && (
          <div className="flex gap-4">
            <PerspectiveCard
              card={commander}
              id=""
              image={getScryfallUrl(commander.identifiers)}
              key={commander.uuid}
            ></PerspectiveCard>
            <div className="text-left">
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
          </div>
        )}
      </div>
    </div>
  );
}
