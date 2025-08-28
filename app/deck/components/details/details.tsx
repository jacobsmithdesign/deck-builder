import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/app/components/ui/card";
import { dummyData } from "./dummyData";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Board, BoardContent } from "../card/Board";
import { useCompactView } from "@/app/context/compactViewContext";
import CustomScrollArea from "@/app/components/ui/CustomScrollArea";
import { Button } from "../button";
import { AnimatedButtonLoading } from "../AnimatedButtonLoading";
import { useAnalyseArchetypeProgress } from "@/app/hooks/useAnalyseArchetypeProgress";
import { useCardList } from "@/app/context/CardListContext";
import ArchetypeOverview from "./ArchetypeOverview";

import { getArchetypeOverview } from "@/lib/db/archetypeOverview";
export default function Details() {
  const { showBoard } = useCompactView();
  const { deck } = useCardList();
  return (
    <Board className="h-full relative z-10 overflow-y-scroll hide-scrollbar rounded-none ease-in-out px-1 pb-1">
      <div
        className={`h-full transition-all ${
          showBoard
            ? "opacity-0 duration-200 pointer-events-none"
            : "opacity-100 duration-150"
        }`}
      >
        <BoardContent className="hide-scrollbar transition-all duration-700 justify-center items-center relative rounded-t-none  h-full ">
          <div className="w-full h-full overflow-y-scroll hide-scrollbar absolute px-2 ">
            <CustomScrollArea
              className="h-full w-full"
              trackClassName="bg-dark/20 rounded-xs rounded-br-sm outline outline-dark/20 w-2 mt-11 mb-2"
              thumbClassName="bg-light/60 rounded-xs"
              autoHide={true}
            >
              <div className="pt-8 pr-1">
                <ArchetypeOverview />
                {/* In the future, when components have been built, replace this map with each component. it should fit the height properly  */}
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
            </CustomScrollArea>
          </div>
        </BoardContent>
      </div>
    </Board>
  );
}
