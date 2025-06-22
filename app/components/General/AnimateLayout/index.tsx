"use client";
import { AnimatePresence, motion } from "framer-motion";
import { FC, ReactNode } from "react";
import { usePageTransitionContext } from "../../../context/PageTransitionContext";

const AnimateLayout: FC<{
  children: ReactNode;
}> = ({ children }) => {
  const { pending } = usePageTransitionContext();

  return (
    <AnimatePresence onExitComplete={() => window.scrollTo(0, 0)}>
      {!pending && (
        <motion.main
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          transition={{
            ease: "linear",
            duration: 0.3,
          }}
        >
          {children}
        </motion.main>
      )}
    </AnimatePresence>
  );
};

export default AnimateLayout;
