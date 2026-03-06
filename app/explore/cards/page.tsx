import { CardListProvider } from "@/app/context/CardListContext";
import SearchBoard from "./SearchBoard";

export default function ExploreCards() {
  return (
    <div className="w-full h-lvh bg-light pt-12">
      <CardListProvider>
        <SearchBoard />
      </CardListProvider>
    </div>
  );
}
