import * as React from "react";

import { cn } from "@/lib/utils";
const Panel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "min-w-72 h-full flex flex-col rounded-2xl bg-dark/10 border border-dark/10 text-dark overflow-y-scroll p-1",
      className
    )}
    {...props}
  />
));
Panel.displayName = "Panel";

const PanelHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "w-full h-20 bg-darksecondary/20 flex flex-col px-3",
      className
    )}
    {...props}
  />
));
PanelHeader.displayName = "PanelHeader";

const PanelTitle = React.forwardRef<
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
PanelTitle.displayName = "PanelTitle";

const PanelContent = React.forwardRef<
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
PanelContent.displayName = "PanelContent";

export { Panel, PanelHeader, PanelTitle, PanelContent };
