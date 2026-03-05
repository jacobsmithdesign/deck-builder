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
        navigation:
          "text-primary-foreground hover:bg-dark/20 bg-darksecondary/5",
        save: "bg-green-200/40 text-green-400 md:hover:bg-green-300/40 md:hover:text-green-600 transition-colors duration-150",
        raindrop:
          "relative overflow-hidden bg-gradient-to-t from-light/55 to-light/30 p-1 shadow-inner shadow-light/80 border-light backdrop-blur-md md:hover:bg-light/80",
        raindropDisabled:
          "relative overflow-hidden bg-gradient-to-t from-light/30 to-light/10 p-1 shadow-inner shadow-light/300 border-light backdrop-blur-md text-dark/30 cursor-default",
        secondaryBlue:
          "rounded-xl text-light hover:text-light/80 hover:bg-buttonBlue/80 bg-buttonBlue  hover:shadow-lg ease-in-out duration-100",
        cardGroup:
          "w-full rounded-xl bg-light/0 md:hover:bg-light md:hover:shadow-md shadow-darksecondary/5 ease-in-out duration-150 text-dark text-sm md:text-base font-bold ",

        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        delete:
          "bg-red-400/30 text-red-800 md:hover:bg-red-400/40 border-red-500/0 md:hover:border-red-500/40 border text-sm p-1 px-2 active:scale-95 disabled:opacity-50",
        cancel:
          "bg-dark/10 text-dark md:hover:text-red-800 md:hover:bg-red-400/40 border-dark/20 md:hover:border-red-500/40 border text-sm p-1 px-2 active:scale-95 disabled:opacity-50",
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
        default: "h-7 px-2 py-1 md:text-sm text-xs rounded-md flex gap-2",
        sm: "h-5 px-1.5 text-xs rounded-sm",
        cardGroup: "h-9 pl-6 md:hover:pl-7",
        lg: "h-10 px-4 w-fit rounded-lg",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, children, title, variant, size, asChild = false, ...props },
    ref,
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
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
