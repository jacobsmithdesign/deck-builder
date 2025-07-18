import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva("flex items-center justify-center cursor-pointer", {
  variants: {
    variant: {
      default:
        "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-lg bg-light/0 md:hover:bg-light md:hover:dropshadow-md",
      ai: "rounded-xl text-purple-400 hover:text-light hover:bg-purple-400 shadow-purple-300 hover:shadow-lg ease-in-out duration-150",
      destructive:
        "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
      outline:
        "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
      secondary:
        "bg-secondary text-secondary-foreground border border-secondary shadow-sm hover:bg-secondary/80",

      login:
        "bg-green-400/30 text-green-700 md:hover:bg-green-400/40 md:hover:text-green-800 border-green-500/0 md:hover:border-green-500/20 border text-sm",
      delete:
        "bg-red-400/30 text-red-800 md:hover:bg-red-400/40 border-red-500/0 md:hover:border-red-500/40 border text-sm p-1 px-2 active:scale-95 disabled:opacity-50",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
    },
    size: {
      default: "h-8 px-2 py-1 rounded-md",
      sm: "h-8 rounded-md px-3",
      lg: "h-10 rounded-md px-8",
      icon: "h-9 w-9",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
