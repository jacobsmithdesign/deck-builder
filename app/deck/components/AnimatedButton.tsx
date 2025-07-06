import { motion, AnimatePresence } from "framer-motion";

export const AnimatedButton = ({ children }: { children: React.ReactNode }) => {
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
        whileTap={{ scale: 0.85 }}
        transition={{ type: "spring", damping: 17, stiffness: 450 }}
        className=""
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
