import { CardListProvider } from "@/app/context/CardListContext";
import { CommanderProvider } from "@/app/context/CommanderContext";
import { CompactViewProvider } from "@/app/context/compactViewContext";
import NewDeckForm from "./components/newDeckForm";

export default async function NewDeckPage() {
  return (
    <CardListProvider>
      <CommanderProvider>
        <CompactViewProvider>
          <div className="w-full h-lvh bg-light">
            <NewDeckForm />
          </div>
        </CompactViewProvider>
      </CommanderProvider>
    </CardListProvider>
  );
}
