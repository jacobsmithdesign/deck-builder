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
        cardGroup:
          "w-full rounded-xl bg-light/0 md:hover:bg-light md:hover:shadow-md shadow-darksecondary/5 ease-in-out duration-150 text-dark text-sm md:text-base font-bold ",

        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-6 px-2 py-1 rounded-md md:text-sm text-xs",
        sm: "h-8 rounded-md px-3 text-xs",
        cardGroup: "h-9 pl-6 md:hover:pl-7",
        lg: "h-10 rounded-md px-8",
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
  ({ className, title, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {title}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
