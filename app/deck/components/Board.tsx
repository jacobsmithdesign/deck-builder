import * as React from "react";

import { cn } from "@/lib/utils";
const Board = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "w-full bg-dark/10 h-full rounded-xl bg-board text-board-foreground flex flex-col",
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
      "w-full h-10 flex justify-between items-center p-1 pl-3 rounded-xl",
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
      "font-semibold leading-none tracking-tight lg:text-2xl md:text-lg sm:text-sm text-xs",
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
      "w-full rounded-xl h-full flex flex-col bg-dark/5 border border-darksecondary/15 p-1 overfolw-y-scroll",
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
    className={cn("text-muted-foreground md:text-md text-sm", className)}
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
    className={cn(
      "p-3 pt-0 lg:text-xl md:text-lg sm:text-md text-sm",
      className
    )}
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
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
GroupHeader.displayName = "GroupHeader";

const GroupItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl bg-Board text-Board-foreground overflow-x-scroll cursor-pointer active:cursor-grabbing",
      className
    )}
    {...props}
  />
));
GroupItem.displayName = "GroupItem";

export {
  Board,
  BoardHeader,
  BoardTitle,
  BoardContent,
  Group,
  GroupItem,
  GroupHeader,
  GroupTitle,
};
