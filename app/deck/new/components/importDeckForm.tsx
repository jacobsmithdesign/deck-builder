import { CardTitle } from "@/app/components/ui/card";
import { CommanderCard } from "@/app/context/CommanderContext";
import { parseDeckText } from "@/app/hooks/parseDeckText";
import { saveNewDeckClient } from "@/lib/api/decks/client/saveNewDeckClient";
import { searchCommander } from "@/lib/db/searchCommander";
import { selectCardsDataFromIds } from "@/lib/db/searchCardForDeck";
import { Checkbox, Field } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RxCheck, RxCross1, RxCross2 } from "react-icons/rx";
import { Button } from "../../components/primitives/button";
import { BsMenuButton } from "react-icons/bs";

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
export default function ImportDeckForm({ onCancel }: { onCancel: () => void }) {
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

  // The function to handle importing the deck text: parse text, then batch-fetch
  // full card data (same as deck editor import) and build commander options + card list.
  const handleDeckImport = async () => {
    const result = await parseDeckText(deckText);
    if (!result || result.length === 0) {
      setImportSuccess(false);
      return;
    }
    const uniqueUuids = [
      ...new Set(result.map((r) => r.uuid).filter(Boolean)),
    ] as string[];
    const cardRecordsByUuid = await selectCardsDataFromIds(uniqueUuids);
    const commanderList: CardLine[] = [];
    const cards: dbCardInterface[] = [];
    for (const card of result) {
      if (!card.uuid || !cardRecordsByUuid.has(card.uuid)) continue;
      if (/Legendary\b(?:\s+[^\s]+)*\s+Creature\b/i.test(card.type ?? ""))
        commanderList.push(card);
      cards.push({
        card_uuid: card.uuid,
        count: card.count,
        board_section: "mainboard",
      });
    }
    if (cards.length === 0) {
      setImportSuccess(false);
      return;
    }
    setImportSuccess(true);
    setCommanderOptions(commanderList);
    setCardList(cards);
  };

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
    const result = await searchCommander(undefined, id);
    if (result) {
      setCommander(result[0]);
    }
  };

  return (
    <div className="2 mt-8 text-left gap-2 flex flex-col">
      <div className="flex gap-4 justify-between">
        <CardTitle>Import a card list</CardTitle>
        <Button variant="cancel" title="Cancel" onClick={onCancel}>
          <RxCross2 />
        </Button>
      </div>
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
        <div className="flex gap-2">
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
              {commanderOptions?.map((option) => (
                <Button
                  key={option.name}
                  variant={
                    option.name === commander?.name
                      ? "darkFrostedActive"
                      : "darkFrosted"
                  }
                  className="mt-2 justify-start text-base"
                  size="sm"
                  onClick={() => handleSelectCommander(option.uuid)}
                >
                  {option.name}
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
