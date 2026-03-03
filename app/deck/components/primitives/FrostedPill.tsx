import { cn } from "@/lib/utils";
import React from "react";
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  bgColor: string;
}

const FrostedElement = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, bgColor, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        " bg-gradient-to-t from-light/65 to-light/40 backdrop-blur-sm p-1 border-light/40 shadow-inner shadow-light/60",
        className,
      )}
      {...props}
    >
      <div
        style={{ background: bgColor }}
        className="absolute w-full h-full opacity-30 -translate-y-1 -translate-x-1 rounded-full z-0 border-t-2 border-light/40"
      ></div>
    </div>
  ),
);
FrostedElement.displayName = "FrostedElement";

const FrostedElementColoured = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, color, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      `bg-gradient-to-t from-[${color}]/35  backdrop-blur-xs p-1 border-${color}/30 shadow-inner shadow-${color}/60`,
      className,
    )}
    {...props}
  />
));
FrostedElementColoured.displayName = "FrostedElementColoured";

export { FrostedElement, FrostedElementColoured };
