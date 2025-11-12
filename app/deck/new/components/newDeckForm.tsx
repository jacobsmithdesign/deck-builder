"use client";
import { CardDescription, CardTitle } from "@/app/components/ui/card";
import { useState } from "react";
import { Button } from "../../components/button";
import CommanderFormatForm from "./commanderFormatForm";
import { CardLine, parseDeckText } from "@/app/hooks/parseDeckText";
import { set } from "zod";
import ImportDeckForm from "./importDeckForm";

export default function NewDeckForm() {
  // The state that is stored for the selected format input options that display dynamically
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [deckText, setDeckText] = useState<string>("");
  const [importSuccess, setImportSuccess] = useState<boolean | null>(null);
  const [commanderSelection, setCommanderSelection] = useState<string[] | null>(
    null
  );
  const [commander, setCommander] = useState<string | null>(null);
  const [cardList, setCardList] = useState<CardLine[] | null>(null);

  const format = [
    { name: "Standard", enabled: false },
    { name: "Modern", enabled: false },
    { name: "Commander", enabled: true },
    { name: "Legacy", enabled: false },
    { name: "Vintage", enabled: false },
  ];

  const handleSelectFormat = (fmt: any) => {
    if (format.find((f) => f.name === fmt.name && f.enabled)) {
      setSelectedFormat(fmt.name);
      console.log("selected format:", fmt.name);
    }
  };

  const handleDeckImport = async () => {
    const result = await parseDeckText(deckText);
    if (result) {
      setImportSuccess(true);
      const cards: string[] = [];
      for (const card of result) {
        if (/Legendary\b(?:\s+[^\s]+)*\s+Creature\b/i.test(card.type))
          cards.push(card.name);
      }
      setCommanderSelection(cards);
      setCardList(result);
    } else {
      setImportSuccess(false);
    }
  };

  const handleCreateDeck = () => {};

  return (
    <div className="h-lvh flex flex-col justify-center text-dark pt-15 w-96 mx-auto">
      <CardTitle>Create a new deck</CardTitle>
      {/* {!importSuccess && (
        <>
          <CardTitle>Choose a format</CardTitle>
          <div className="flex gap-2 mt-4">
            {format.map((fmt) => (
              <Button
                variant={
                  fmt.enabled
                    ? fmt.name === selectedFormat
                      ? "selectionOptionActive"
                      : "selectionOption"
                    : "selectionOptionDisabled"
                }
                size="sm"
                disabled={!fmt.enabled}
                key={fmt.name}
                onClick={() => handleSelectFormat(fmt)}
              >
                <CardDescription>{fmt.name}</CardDescription>
              </Button>
            ))}
          </div>
        </>
      )}

      {selectedFormat === "Commander" && (
        <CommanderFormatForm onCancel={() => setSelectedFormat(null)} />
      )} */}
      <ImportDeckForm />
    </div>
  );
}
