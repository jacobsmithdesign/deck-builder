import React, { createContext, useContext, useState, ReactNode } from "react";

// Define context type
interface bgColorContextType {
  bgColor: string;
  setBgColor: (color: string) => void;
}

// Create the context
const bgColorContext = createContext<bgColorContextType | undefined>(undefined);

// Provider component
export const bgColorProvider = ({ children }: { children: ReactNode }) => {
  const [bgColor, setBgColor] = useState("");

  return (
    <bgColorContext.Provider value={{ bgColor, setBgColor }}>
      {children}
    </bgColorContext.Provider>
  );
};

// Hook to use the context
export const usebgColor = (): bgColorContextType => {
  const context = useContext(bgColorContext);
  if (context === undefined) {
    throw new Error("useBgColor must be used within a bgColorProvider");
  }
  return context;
};
