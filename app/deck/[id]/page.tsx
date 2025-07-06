import { notFound } from "next/navigation";
import { DeckOverview } from "../DeckOverview";
import { CardListProvider } from "@/app/context/CardListContext";
import { fetchDeckById } from "@/lib/db/fetchDeck";
import InitialiseDeck from "../components/InitialiseDeck";

export default async function DeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  // Try fetch the deck by ID
  let deck = null;
  try {
    deck = await fetchDeckById(resolvedParams.id);
  } catch (error) {
    console.error("Error fetching deck:", error);
    notFound();
  }
  console.log("Deck fetched:", deck);
  if (!deck) {
    return <div className="text-center text-lg">Deck not found</div>;
  } else
    return (
      <CardListProvider>
        <InitialiseDeck deck={deck.deck} />
        <div className="w-screen h-lvh flex gap-2 items-center p-2 bg-light text-dark pt-14">
          <DeckOverview />
        </div>
      </CardListProvider>
    );
}
