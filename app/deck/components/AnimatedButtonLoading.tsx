import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CgSpinner } from "react-icons/cg";

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
        aiAnalyse:
          "flex font-bold bg-light md:hover:scale-105 shadow-md md:hover:shadow-lg shadow-purple-300/20 md:hover:shadow-purple-300 outline outline-purple-500/10 md:hover:outline-purple-500/50 text-purple-500 px-3 py-1 rounded-lg ease-in-out active:scale-95",
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
  loading?: boolean;
}

const AnimatedButtonLoading = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      title,
      variant,
      size,
      asChild = false,
      loading = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <AnimatePresence>
        <motion.button
          key="close"
          className={cn(
            buttonVariants({ variant, size, className }),
            `${loading && "pointer-events-none cursor-not-allowed"}`
          )}
          ref={ref}
        >
          <Comp
            className="cursor-pointer flex items-center"
            disabled={loading}
            {...props}
          >
            {title}
            <CgSpinner
              className={`transition-all duration-150 animate-spin ${
                loading ? "scale-100 w-4 h-4 ml-2" : "scale-0 w-0 h-0 ml-0"
              }`}
            />
          </Comp>
        </motion.button>
      </AnimatePresence>
    );
  }
);
AnimatedButtonLoading.displayName = "Button";

export { AnimatedButtonLoading, buttonVariants };
