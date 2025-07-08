"use client";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";
import AISearch from "./aiSearch";
import CommanderSearch from "./commanderSearch";
import { Button } from "./button";
import { useCommander } from "@/app/context/CommanderContext";
import { fetchEDHREC, fetchScryfall } from "@/lib/cardDataRequests";
import { toast } from "sonner";
import { getAverageColorFromImage } from "@/lib/getAverageColour";
import { commanderToSlug } from "@/lib/slug";

// This component is the main search box for the Commander Builder
export default function SearchBox() {
  // Importing the context methods to set the deck details
  const {
    setDeckDetails,
    setCommanderCardImage,
    setArtwork,
    setArtworkColor,
    setFlavorText,
    settext,
    setError,
  } = useCommander();

  const [searchOption, setSearchOption] = useState<boolean>(true);

  const handleSearchOptionChange = (option: boolean) => {
    setSearchOption(option);
  };
  // This function will be called when a commander is selected from the search
  // It fetches the EDHREC and Scryfall data for the selected commander
  const handleCommanderSelect = async (commanderName: string) => {
    try {
      setDeckDetails(null);
      const slug = commanderToSlug(commanderName);
      const edhrecData = await fetchEDHREC({ slug });
      const scryfallData = await fetchScryfall({ commanderName });

      console.log("Scryfall Data:", scryfallData);
      if (edhrecData) {
        console.log("EDHREC Data:", edhrecData);
      }
      if (edhrecData.error) {
        setError(true);
        toast.error("Commander not found on EDHREC.");
        return;
      }
      setError(false);
      const imageUris = edhrecData.data.container.json_dict.card.image_uris;
      const deckStats = edhrecData.data;
      const archetype = edhrecData.data.container.json_dict.archetype;
      const averageColor = await getAverageColorFromImage(
        imageUris[0].art_crop
      );
      // These are the values that will be set in the context
      setArtworkColor(averageColor);
      setArtwork(imageUris[0].art_crop);
      setCommanderCardImage(imageUris[0].normal);
      settext(scryfallData.data.oracle_text);
      setFlavorText(scryfallData.data.flavor_text);

      // This is the whole deck details object that will be set in the context
      setDeckDetails({
        name: commanderName,
        type: scryfallData.data.type_line,
        manaCost: { mana: scryfallData.data.mana_cost },
        colorIdentity: scryfallData.color_identity,
        artifact: deckStats.artifact,
        enchantment: deckStats.enchantment,
        creature: deckStats.creature,
        planeswalker: deckStats.planeswalker,
        land: deckStats.land,
        sorcery: deckStats.sorcery,
        instant: deckStats.instant,
        strengths: [], // You can fill this manually or heuristically if needed
        weaknesses: [],
        archetype: archetype ?? "Unknown",
        playstyleDescription: "", // Optional: add your own heuristics
        manaCurve: deckStats.mana_curve,
      });
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    }
  };

  return (
    <Card className="w-full max-w-5xl bg-darksecondary/20 text-dark mt-10">
      <CardHeader className="p-3 md:px-6">
        <CardTitle className="lg:text-4xl md:text-3xl sm:text-2xl text-xl">
          Commander Builder
        </CardTitle>
        <CardDescription className="md:px-2">
          Type an existing commander / deck name, or describe a deck you wish to
          build and Commander Builder will search the web for the best upgrades
          or deck suggestions.
        </CardDescription>
        <div className="flex my-4">
          <Button
            variant={"ai"}
            className={`${
              !searchOption && "bg-purple-400/20 text-purple-400"
            } flex w-28 h-8 mr-2`}
            onClick={() => handleSearchOptionChange(false)}
          >
            Search with AI
          </Button>
          <Button
            className={`${
              searchOption && "bg-darksecondary/10"
            } flex w-38 h-8 rounded-xl hover:bg-darksecondary/15 shadow-none hover:shadow-none`}
            onClick={() => handleSearchOptionChange(true)}
          >
            Commander Search
          </Button>
        </div>
        {searchOption ? (
          <CommanderSearch onSelect={handleCommanderSelect} />
        ) : (
          <AISearch />
        )}
      </CardHeader>
    </Card>
  );
}
