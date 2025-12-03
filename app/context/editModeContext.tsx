"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

// Define context type
interface EditModeContextType {
  editMode: boolean;
  toggleEditMode: () => void;
  setEditMode: (value: React.SetStateAction<boolean>) => void;
}

// Create the context
const EditModeContext = createContext<EditModeContextType | undefined>(
  undefined
);

// Provider component
export const EditModeProvider = ({ children }: { children: ReactNode }) => {
  const [editMode, setEditMode] = useState(false);

  const toggleEditMode = () => {
    setEditMode((prev) => !prev);
  };

  return (
    <EditModeContext.Provider
      value={{
        editMode,
        toggleEditMode,
        setEditMode,
      }}
    >
      {children}
    </EditModeContext.Provider>
  );
};

// Hook to use the context
export const useEditMode = (): EditModeContextType => {
  const context = useContext(EditModeContext);
  if (context === undefined) {
    throw new Error(
      "useEditMode must be used within a EditModeContext Provider"
    );
  }
  return context;
};
