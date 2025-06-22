import CommanderDeckList from "../Decks/CommanderDeckList";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContainer,
} from "./card";
import Image from "next/image";

export const CardSuggestions = () => {
  return (
    <CardContainer className="w-full h-64 md:max-h-96 max-w-7xl md:rounded-3xl rounded-xl flex flex-col text-dark/90 relative overflow-clip mt-2 bg-darksecondary/10">
      <CardHeader className="p-3 md:px-6">
        <CardTitle>Top Cards</CardTitle>
      </CardHeader>
      <Card></Card>
    </CardContainer>
  );
};
