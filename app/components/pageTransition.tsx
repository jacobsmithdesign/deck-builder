"use client";
import React, { useState, useEffect, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";

const TransitionContext = createContext({
  startTransition: () => {},
});

export const useTransition = () => useContext(TransitionContext);

const PageTransitionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pathname = usePathname();

  const startTransition = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 1000); // Adjust duration to match the animation duration
  };

  useEffect(() => {
    if (pathname) {
      startTransition();
    }
  }, [pathname]);

  return (
    <TransitionContext.Provider value={{ startTransition }}>
      {children}
      {isTransitioning && (
        <div className="fixed inset-0 bg-raw-silk transition-opacity duration-1000 opacity-100 pointer-events-none">
          {/* Optionally, add some content here like a loading spinner */}
        </div>
      )}
    </TransitionContext.Provider>
  );
};

export default PageTransitionProvider;
