import { cn } from "@/lib/utils";
import React from "react";
export interface ContainerProps extends React.AllHTMLAttributes<HTMLDivElement> {
  bgColor?: string;
  innerClassName?: string;
  childClassName?: string;
}

const RaindropContainer = React.forwardRef<HTMLDivElement, ContainerProps>(
  (
    { className, innerClassName, children, bgColor, childClassName, ...props },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden bg-gradient-to-t from-light/75 to-light/40 backdrop-blur-sm p-1 shadow-inner shadow-light/80",
        className,
      )}
      {...props}
    >
      <div
        style={{ background: bgColor }}
        className={cn(
          "absolute w-full h-full opacity-35 z-0 border-light outline-light",
          innerClassName,
        )}
      />
      <div className={cn("z-20 relative", childClassName)}>{children}</div>
    </div>
  ),
);
RaindropContainer.displayName = "RaindropContainer";

export { RaindropContainer };
