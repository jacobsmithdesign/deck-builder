import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/app/components/ui/card";
import { dummyData } from "./dummyData";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Board, BoardContent } from "../primitives/Board";
import { useCompactView } from "@/app/context/compactViewContext";
import CustomScrollArea from "@/app/components/ui/CustomScrollArea";
import { useCardList } from "@/app/context/CardListContext";
import DeckOverviewSection from "./DeckOverviewSection";
import ManaOverviewSection from "./ManaOverviewSection";
import ArchetypeOverview from "./ArchetypeOverview";
import PrimarySecondaryAxis from "./PrimarySecondaryAxist";
import CardSuggestions from "./CardSuggestions";
import { StrengthsWeaknessesPanel } from "./StrengthsWeaknessPanel";
import { PillarsPanel } from "./PillarsPanel";
import { SubtypeDrawProbabilityPanel } from "./SubtypeDrawProbabilityPanel";
import DeckCommentsSection from "./DeckCommentsSection";

export default function Details() {
  const { showBoard } = useCompactView();
  const { deck } = useCardList();
  return (
    <section id="#overview">
      <Board className="rounded-none ease-in-out px-1 pb-1 h-full max-w-[85rem] mx-auto mt-12">
        <BoardContent className="transition-all duration-700 justify-center items-center relative rounded-t-none  h-full">
          <div className="w-full h-full hide-scrollbar absolute px-2 ">
            <div className="pt-8 pr-1 flex flex-col">
              {/* New components go here */}
              <DeckOverviewSection />
              <div id="overview-archetype" className="scroll-mt-12">
                <ArchetypeOverview />
              </div>
              <div id="overview-strengths" className="scroll-mt-4">
                <StrengthsWeaknessesPanel />
              </div>
              <div id="overview-mana" className="scroll-mt-4 mt-8">
                <ManaOverviewSection />
              </div>
              <div id="overview-pillars" className="scroll-mt-4 mb-6">
                <PillarsPanel />
              </div>
              <div id="overview-subtype-probability" className="scroll-mt-4 mb-6">
                <SubtypeDrawProbabilityPanel />
              </div>
              <DeckCommentsSection />
              {/* <PrimarySecondaryAxis /> */}
              {/* <CardSuggestions /> */}
            </div>
          </div>
        </BoardContent>
      </Board>
    </section>
  );
}
