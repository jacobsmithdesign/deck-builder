"use client";

import { useEffect } from "react";

export default function SuppressKeyWarning() {
  useEffect(() => {
    const originalError = console.error;

    console.error = (...args) => {
      const msg = args[0];
      if (
        typeof msg === "string" &&
        msg.includes("Encountered two children with the same key")
      ) {
        // Silently skip this warning
        return;
      }

      originalError(...args);
    };

    return () => {
      console.error = originalError; // cleanup
    };
  }, []);

  return null;
}
