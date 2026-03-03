import { cn } from "@/lib/utils";
import React from "react";
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  bgColor: string;
}

const RaindropContainer = React.forwardRef<HTMLDivElement, ContainerProps>(
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
        className={cn(
          "absolute w-full h-full opacity-30 -translate-y-1 -translate-x-1 z-0 border-t-2 border-light/40",
          className,
        )}
      />
    </div>
  ),
);
RaindropContainer.displayName = "RaindropContainer";

export { RaindropContainer };
