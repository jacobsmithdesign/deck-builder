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
import ArchetypeOverview from "./ArchetypeOverview";
import PrimarySecondaryAxis from "./PrimarySecondaryAxist";
import CardSuggestions from "./CardSuggestions";
import { StrengthsWeaknessesPanel } from "./StrengthsWeaknessPanel";
export default function Details() {
  const { showBoard } = useCompactView();
  const { deck } = useCardList();
  return (
    <section id="#overview">
      <Board className="rounded-none ease-in-out px-1 pb-1 h-full">
        <BoardContent className="transition-all duration-700 justify-center items-center relative rounded-t-none  h-full ">
          <div className="w-full h-full hide-scrollbar absolute px-2 ">
            <div className="pt-8 pr-1 flex flex-col">
              {/* New components go here */}
              <ArchetypeOverview />
              <StrengthsWeaknessesPanel />
              {/* <PrimarySecondaryAxis /> */}
              {/* <CardSuggestions /> */}
              {/* In the future, when components have been built, replace this map with each component. it should fit the height properly  */}
              <h1 className="text-center w-fit text-lg font-bold mt-8 mx-auto px-2 flex bg-orange-300/40 rounded-md outline outline-orange-300/40 text-orange-500/40">
                /// PLACEHOLDER ANALYSIS ///
              </h1>
              {dummyData.map((item, index) => (
                <Card className="" key={index}>
                  <CardContent className="border-b border-dark/20">
                    <CardTitle className="my-5 text-dark/90">
                      {item.title}
                    </CardTitle>
                    {/* Full Markdown support, including bullet lists, numbered lists, line breaks, tables, etc. */}
                    <CardDescription className="max-w-none px-4 text-dark/80">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {item.description}
                        </ReactMarkdown>
                      </div>
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </BoardContent>
      </Board>
    </section>
  );
}
