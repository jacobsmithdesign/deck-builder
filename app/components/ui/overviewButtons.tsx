import * as React from "react";

import { cn } from "@/lib/utils";

const Spell = React.forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex justify-between items-center px-4 bg-zinc-500/15 rounded-xl py-2 cursor-pointer hover:bg-zinc-500/30 transition-all duration-200 ease-in-out lg:text-lg md:text-md text-sm text-dark/70",
      className
    )}
    {...props}
  />
));
Spell.displayName = "Spell";

const SpellType = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-bold lg:text-lg md:text-md text-sm", className)}
    {...props}
  />
));
SpellType.displayName = "SpellType";

const SpellCount = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("lg:text-lg md:text-md text-sm", className)}
    {...props}
  />
));
SpellCount.displayName = "SpellCount";

const Strength = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex justify-between items-center px-4 bg-green-500/20 md:pt-0 py-1 rounded-lg text-center lg:text-lg md:text-md text-sm text-green-900",
      className
    )}
    {...props}
  />
));
Strength.displayName = "Strength";
const Weakeness = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "justify-between items-center px-4 bg-red-600/25 md:pt-0 py-1 rounded-lg text-center lg:text-lg md:text-md text-sm text-red-900",
      className
    )}
    {...props}
  />
));
Weakeness.displayName = "Weakeness";

export { Spell, SpellType, SpellCount, Strength, Weakeness };
