"use client";

import { useState } from "react";

export default function Decklist() {
  const [decklist, setDecklist] = useState<string>("");

  const handleDecklistChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setDecklist(event.target.value);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Decklist</h2>
      <textarea
        value={decklist}
        onChange={handleDecklistChange}
        className="w-full h-64 p-2 border rounded"
        placeholder="Paste your decklist here..."
      />
    </div>
  );
}
