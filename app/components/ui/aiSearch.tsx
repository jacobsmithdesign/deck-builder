"use client";

import { useState } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { Commander, commanderSchema, commanderSlugSchema } from "@/lib/schemas";
import { set, z } from "zod";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";
import { useCommander } from "@/app/context/CommanderContext";
import { getAverageColorFromImage } from "@/lib/getAverageColour";
import { fetchEDHREC, fetchScryfall } from "@/lib/cardDataRequests";

async function getTopCards(commanderName: string) {
  const res = await fetch(`api/edhrec/${commanderName}.json`);
  const data = await res.json();
  return data;
}

type commanderData = {
  image: string | null;
};

export default function AISearch() {
  const {
    setDeckDetails,
    setCommanderCardImage,
    setArtwork,
    setArtworkColor,
    setFlavorText,
    setOracleText,
    setError,
  } = useCommander();
  const [userInput, setUserInput] = useState<string | null>(null);
  const [commanderOverview, setCommanderOverview] = useState<z.infer<
    typeof commanderSchema
  > | null>(null);

  // Insert EDHREC data from ResolveCommander into DeckSuggestions
  const {
    submit: submitDeckSuggestions,
    object: deckSuggestions,
    isLoading: isLoadingDeckSuggestions,
  } = useObject({
    api: "/api/generate-commander-overview",
    schema: commanderSchema,
    initialValue: undefined,
    onError: (error) => {
      toast.error("Failed to generate commander overview. Please try again.");
    },
    onFinish: ({ object }) => {
      if (object?.name === "Unknown") {
        toast.error("Commander not found. Please try again.");
        return;
      }
      if (object) {
        setCommanderOverview(object);
        setDeckDetails(object);
      }
      console.log("Commander Overview:", object);
    },
  });
  // Submit the commander name to resolve its slug and fetch EDHREC data
  const {
    submit: submitResolveCommander,
    object: commanderData,
    isLoading: isLoadingCommander,
  } = useObject({
    api: "/api/resolve-commander",
    schema: commanderSlugSchema,
    initialValue: undefined,
    onError: (error) => {
      toast.error("Failed to resolve commander. Please try again.");
    },

    // onFinish is async for edhrec data
    onFinish: async ({ object }) => {
      if (object?.commanderName === "Unknown") {
        toast.error("Commander not found. Please try again.");
        return;
      }
      if (object) {
        setDeckDetails(null);
        console.log("Commander Data:", object);
        // Wait for the Scryfall and EDHREC data to be fetched and update context
        const scryfallData = await fetchScryfall({
          commanderName: object?.commanderName,
        });
        const edhrecData = await fetchEDHREC({ slug: object.slug });
        console.log("EDHREC Data:", edhrecData);
        // If the ehdrec commander search returns an error (aka halucination)
        if (edhrecData.error) {
          setError(true);
          return;
        }
        // If the data has no error
        if (!edhrecData.error) {
          setError(false);
          // Get the average color from the image
          const averageColor = await getAverageColorFromImage(
            edhrecData.data.container.json_dict.card.image_uris[0].art_crop
          );
          // Isolate the cardLists array from the EDHREC data
          const cardList = await edhrecData.data.container.json_dict.cardlists;
          const mana_cost = scryfallData.mana_cost;
          if (scryfallData.mana_cost) {
            console.log("Mana Cost:", scryfallData.mana_cost);
          }
          // Set Scryfall oracle context values
          if (scryfallData.oracleText) {
            setOracleText(scryfallData.oracleText);
          } else setOracleText(null);
          if (scryfallData.flavorText) {
            setFlavorText(scryfallData.flavorText);
          } else setFlavorText(null);
          setArtworkColor(averageColor);
          setArtwork(
            edhrecData.data.container.json_dict.card.image_uris[0].art_crop
          );
          setCommanderCardImage(
            edhrecData.data.container.json_dict.card.image_uris[0].normal
          );
          // Submit with the commander name and EDHREC data
          submitDeckSuggestions({
            commanderName: object?.slug,
            edhrecData: edhrecData,
            cardList: cardList,
            mana_cost: mana_cost,
          });
        }
      }
    },
  });

  const isLoading = isLoadingCommander || isLoadingDeckSuggestions;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userInput) return;
    setDeckDetails(null);
    submitResolveCommander({ input: { userInput: userInput } });
  };

  return (
    <CardContent>
      <form
        onSubmit={handleSubmit}
        className="h-full flex md:flex-row flex-col relative items-center"
      >
        <input
          placeholder="Describe your deck or commander"
          value={userInput || ""}
          onChange={(e) => setUserInput(e.target.value)}
          className="p-2 rounded-md w-full bg-light/60 shadow-inner resize-none md:mr-4 mb-2 md:mb-0"
          onInput={(e) => {
            const element = e.target as HTMLTextAreaElement;
            element.style.height = "auto"; // Reset height
            element.style.height = element.scrollHeight + "px"; // Set to scroll height
          }}
        />
        <Button
          type="submit"
          disabled={isLoading}
          variant={"default"}
          className="ml-auto rounded-xl right-0 cursor-pointer bg-light/40 hover:bg-light/90 transition-all duration-200 ease-in-out bottom-6"
        >
          {isLoading ? "Loading..." : "AI Search"}
        </Button>
      </form>
    </CardContent>
  );
}
