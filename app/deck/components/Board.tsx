import * as React from "react";

import { cn } from "@/lib/utils";
const Board = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "w-full h-full bg-dark/10 rounded-xl bg-board text-board-foreground flex flex-col",
      className
    )}
    {...props}
  />
));
Board.displayName = "Board";

const BoardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "w-full h-8 flex gap-1 items-center p-1 rounded-xl",
      className
    )}
    {...props}
  />
));
BoardHeader.displayName = "BoardHeader";

const BoardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "font-semibold leading-none tracking-tight lg:text-2xl md:text-base sm:text-sm text-xs",
      className
    )}
    {...props}
  />
));
BoardTitle.displayName = "BoardTitle";

const BoardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "w-full rounded-xl h-full flex flex-col overflow-y-scroll",
      className
    )}
    {...props}
  />
));
BoardContent.displayName = "BoardContent";

const Group = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-muted-foreground md:text-base text-sm ", className)}
    {...props}
  />
));
Group.displayName = "Group";

const GroupTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(" lg:text-base md:text-base sm:text-sm font-bold", className)}
    {...props}
  />
));
GroupTitle.displayName = "GroupTitle";

const GroupHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center py-3 border-t border-darksecondary/15 justify-between",
      className
    )}
    {...props}
  />
));
GroupHeader.displayName = "GroupHeader";

const GroupItems = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-wrap mb-1", className)} {...props} />
));
GroupItems.displayName = "GroupItems";

export {
  Board,
  BoardHeader,
  BoardTitle,
  BoardContent,
  Group,
  GroupItems,
  GroupHeader,
  GroupTitle,
};
