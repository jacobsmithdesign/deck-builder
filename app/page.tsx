import { CommanderProvider } from "./context/CommanderContext";
import CommanderDeckList from "./components/Decks/CommanderDeckList";

export type commanderData = {
  image: string | null;
};

export default function DeckBuilder() {
  return (
    <CommanderProvider>
      <div className="flex flex-col h-lvh overflow-scroll hide-scrollbar items-center max-h-lvh px-2 pb-2 bg-light text-dark pt-15">
        <CommanderDeckList />
      </div>
    </CommanderProvider>
  );
}
