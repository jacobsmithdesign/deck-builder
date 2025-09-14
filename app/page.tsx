import { CommanderProvider } from "./context/CommanderContext";
import CommanderDeckList from "./components/decks/CommanderDeckList";

export type commanderData = {
  image: string | null;
};

export default function DeckBuilder() {
  return (
    <CommanderProvider>
      <div className="flex flex-col h-lvh overflow-scroll hide-scrollbar items-center max-h-lvh  bg-light text-dark pt-15">
        <CommanderDeckList />
      </div>
    </CommanderProvider>
  );
}
