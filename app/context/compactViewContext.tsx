"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// Define context type
interface CompactViewContextType {
  compactView: boolean;
  toggleCompactView: () => void;
  bgColor: string;
  setBgColor: (color: string) => void;
  showBoard: boolean;
  toggleShowBoard: () => void;
}

// Create the context
const CompactViewContext = createContext<CompactViewContextType | undefined>(
  undefined
);

// Provider component
export const CompactViewProvider = ({ children }: { children: ReactNode }) => {
  const [compactView, setCompactView] = useState(false);
  const [showBoard, setShowBoard] = useState(true);
  const [bgColor, setBgColor] = useState("");

  const toggleCompactView = () => {
    setCompactView((prev) => !prev);
  };

  const toggleShowBoard = () => {
    if (!showBoard) {
      setCompactView(true);
      if (compactView) {
        setShowBoard((prev) => (prev = !prev));
      } else {
        setTimeout(() => {
          setShowBoard((prev) => (prev = !prev));
        }, 450);
      }
    } else {
      setShowBoard((prev) => (prev = !prev));
    }
  };
  return (
    <CompactViewContext.Provider
      value={{
        compactView,
        toggleCompactView,
        bgColor,
        setBgColor,
        showBoard,
        toggleShowBoard,
      }}
    >
      {children}
    </CompactViewContext.Provider>
  );
};

// Hook to use the context
export const useCompactView = (): CompactViewContextType => {
  const context = useContext(CompactViewContext);
  if (context === undefined) {
    throw new Error("useCompactView must be used within a CompactViewProvider");
  }
  return context;
};
