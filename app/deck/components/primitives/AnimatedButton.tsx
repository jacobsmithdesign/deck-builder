import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
          "font-bold bg-purple-500 md:hover:bg-light md:hover:text-purple-500 md:hover:shadow-lg shadow-xs shadow-light md:hover:shadow-purple-200 outline outline-purple-500/0 transition-all duration-300 md:hover:outline-purple-500/0 text-light px-3 py-1 rounded-lg ease-in-out cursor-pointer",
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

const AnimatedButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, title, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <AnimatePresence>
        <motion.div
          key="close"
          initial={{
            opacity: 0,
            scale: 1,
            shadow: "12px 12px rgba(0, 0, 0, 0.2)",
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            scale: 0.0,
          }}
          whileTap={{ scale: 0.93 }}
          whileHover={{ scale: 1.07 }}
          transition={{ type: "spring", damping: 17, stiffness: 450 }}
        >
          <Comp
            className={cn(buttonVariants({ variant, size, className }))}
            ref={ref}
            {...props}
          >
            {title}
          </Comp>
        </motion.div>
      </AnimatePresence>
    );
  }
);
AnimatedButton.displayName = "Button";

export { AnimatedButton, buttonVariants };
