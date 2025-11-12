import { CardTitle } from "@/app/components/ui/card";
import { useState } from "react";
import { Button } from "../../components/button";
import { CardLine, parseDeckText } from "@/app/hooks/parseDeckText";
import { useRouter } from "next/navigation";
import { saveNewDeckClient } from "@/lib/api/decks/client/saveNewDeckClient";
import { CommanderCard } from "@/app/context/CommanderContext";
import { Checkbox, Field } from "@headlessui/react";
import { RxCheck } from "react-icons/rx";
import { Label } from "recharts";
import { searchCommander } from "@/lib/db/searchCommander";

// This interface represents the structure of a card in the database deck_cards table
interface dbCardInterface {
  card_uuid: string;
  count: number;
  board_section: string; // "mainboard" | "sideboard" etc
}
export default function ImportDeckForm() {
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [deckText, setDeckText] = useState<string>("");
  const [importSuccess, setImportSuccess] = useState<boolean | null>(null);
  const [commanderOptions, setCommanderOptions] = useState<string[] | null>(
    null
  );
  const [name, setName] = useState<string | null>(null);
  const [commander, setCommander] = useState<CommanderCard | null>(null);
  const [cardList, setCardList] = useState<dbCardInterface[] | null>(null);

  const router = useRouter();

  // The function to handle importing the deck text which parses the text,
  // displays the Legendary Creatures as commander options, and stores the full card list
  const handleDeckImport = async () => {
    const result = await parseDeckText(deckText);
    if (result) {
      setImportSuccess(true);
      const commanderList: string[] = [];
      const cards: dbCardInterface[] = [];
      for (const card of result) {
        // If its legendary add to list of possible commanders
        if (/Legendary\b(?:\s+[^\s]+)*\s+Creature\b/i.test(card.type))
          commanderList.push(card.name);
        // Otherwise add to full card list
        cards.push({
          card_uuid: card.uuid,
          count: card.count,
          board_section: "mainboard",
        });
      }
      // Set the states for other functions to use
      setCommanderOptions(commanderList);
      setCardList(cards);
    } else {
      setImportSuccess(false);
    }
  };

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

  const handleSelectCommander = async (name: string) => {
    const result = await searchCommander(name);
    if (result) {
      setCommander(result[0]);
    }
  };

  return (
    <div className="2 mt-8">
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
      <CardTitle className="mt-6">Import cards</CardTitle>
      {!importSuccess ? (
        <div className=" flex gap-2">
          <textarea
            className="mt-4 w-72 h-48 p-2 rounded-xl bg-dark/10"
            onChange={(e) => setDeckText(e.target.value)}
            placeholder={`E.g. \n4x Llanowar Elves\n2x Shivan Dragon\n3x Counterspell`}
          />
          <Button
            type="submit"
            variant="secondaryBlue"
            title="Import"
            className="mt-4 h-8 px-6 w-fit rounded-xl"
            size="lg"
            onClick={() => handleDeckImport()}
          />
        </div>
      ) : (
        <div className="flex gap-2 flex-col mt-8 items-center">
          <div className="flex gap-2">
            <h2>Deck Imported Successfully!</h2>
          </div>
          <p className="p-1 rounded-lg px-2 text-buttonGreen mb-4">
            Unique cards found: {cardList?.length || 0}
          </p>
          <div className="p-2 bg-dark/10 rounded-lg outline outline-dark/20">
            <p>Choose your commander</p>
            <div className="flex flex-col w-64">
              {commanderOptions?.map((name) => (
                <Button
                  key={name}
                  variant={
                    name === commander?.name
                      ? "darkFrostedActive"
                      : "darkFrosted"
                  }
                  className="mt-2 justify-start text-base"
                  size="sm"
                  onClick={() => handleSelectCommander(name)}
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>
          <Button
            variant="secondaryBlue"
            size="lg"
            className="mt-4 h-8 px-4 w-fit rounded-lg"
            onClick={() => handleSaveClick()}
          >
            Create
          </Button>
        </div>
      )}
    </div>
  );
}
