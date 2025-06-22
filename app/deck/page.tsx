"use client";

import { useState } from "react";
import { CommanderProvider, useCommander } from "../context/CommanderContext";

export default function Deck() {
  return (
    <CommanderProvider>
      <div className="flex flex-col items-center min-h-screen px-4 bg-light text-dark"></div>
    </CommanderProvider>
  );
}
