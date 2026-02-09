import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "flex items-center justify-center cursor-pointer transition-all duration-200",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:drop-shadow-sm bg-light/0 md:hover:bg-light/70 dropshadow-md border border-light/0 md:hover:border-light/60",
        secondary:
          "bg-primary text-primary-foreground hover:bg-primary/90 bg-buttonLight hover:bg-buttonHover",
        save: "bg-green-200/40 text-green-400 md:hover:bg-green-300/40 md:hover:text-green-600 transition-colors duration-150",
        secondaryBlue:
          "rounded-xl text-light hover:text-light/80 hover:bg-buttonBlue/80 bg-buttonBlue  hover:shadow-lg ease-in-out duration-100",
        cardGroup:
          "w-full rounded-xl bg-light/0 md:hover:bg-light md:hover:shadow-md shadow-darksecondary/5 ease-in-out duration-150 text-dark text-sm md:text-base font-bold ",

        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        frosted:
          "border shadow-inner h-7 rounded-sm px-2 backdrop-blur-sm cursor-pointer transition-all duration-150 text-dark/60 bg-light/40 md:hover:bg-light/80 border-light/60 md:hover:outline-light shadow-light/40",
        darkFrosted:
          "h-7 rounded-sm px-2 cursor-pointer transition-all duration-150 text-dark/60 bg-dark/10 md:hover:bg-light/60 border-dark/10 transition-all duration-150 outline outline-current/30",
        darkFrostedActive:
          "h-7 rounded-sm px-2 cursor-pointer transition-all duration-150 text-light/80 bg-dark/80 border-dark/10 transition-all duration-150 outline outline-current/30",
        selectionOption:
          "cursor-pointer bg-dark/5 outline outline-dark/15 md:hover:bg-dark/20 md:hover:outline-dark/25 rounded-full",
        selectionOptionActive: "cursor-pointer bg-dark text-light rounded-full",
        selectionOptionDisabled:
          "cursor-not-allowed bg-dark/20 text-dark/30 outline outline-dark/25 rounded-full",
      },
      size: {
        default: "h-6 px-2 py-1 md:text-sm text-xs",
        sm: "h-8 px-3 text-xs",
        cardGroup: "h-9 pl-6 md:hover:pl-7",
        lg: "h-10 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, children, title, variant, size, asChild = false, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
        {title}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
