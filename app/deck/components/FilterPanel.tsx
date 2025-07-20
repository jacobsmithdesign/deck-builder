import { cn } from "@/lib/utils";
import { useState } from "react";

export const FilterPanel = ({
  label,
  options,
  selected,
  onChange,
  isSingle = false,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (updated: string[]) => void;
  isSingle: boolean;
}) => {
  const toggleOption = (option: string) => {
    if (isSingle) {
      if (selected.includes(option)) {
        onChange([]); // unselect if already selected
      } else {
        onChange([option]); // set the new selection
      }
    } else {
      const next = selected.includes(option)
        ? selected.filter((o) => o !== option)
        : [...selected, option];
      onChange(next);
    }
  };

  return (
    <div className="mb-3 mx-1 p-1 bg-light/40 rounded-lg">
      <p className="font-semibold text-sm mb-1 pl-2">{label}</p>
      <div className="flex gap-1 flex-wrap">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => toggleOption(option)}
            className={cn(
              "px-2 py-1 text-xs rounded-md transition cursor-pointer",
              selected.includes(option)
                ? "bg-darksecondary/80 text-white border-blue-600"
                : "bg-light/60 text-dark border-dark/20"
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};
