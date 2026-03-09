"use client";

import { useCallback, useState } from "react";
import { extractCardReferenceNames, type CardPreview } from "@/lib/card-ref";

type ResolvedMap = Record<string, CardPreview>;

/**
 * Resolves [[Card Name]] references from one or more text strings via the API.
 * Call before render to avoid per-hover lookups. Returns a stable map keyed by
 * normalised name (lowercase) for use with CardReferenceText.
 */
export function useResolvedCardReferences() {
  const [resolved, setResolved] = useState<ResolvedMap>({});
  const [loading, setLoading] = useState(false);

  const resolve = useCallback(async (texts: string[]) => {
    const names = new Set<string>();
    for (const text of texts) {
      if (typeof text !== "string") continue;
      for (const n of extractCardReferenceNames(text)) {
        if (n.trim()) names.add(n.trim());
      }
    }
    const nameList = [...names];
    if (nameList.length === 0) {
      setResolved({});
      return {};
    }

    setLoading(true);
    try {
      const res = await fetch("/api/cards/resolve-references", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: nameList }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("resolve-references error:", data);
        setResolved({});
        return {};
      }
      const cards = (data.cards ?? {}) as ResolvedMap;
      setResolved(cards);
      return cards;
    } catch (e) {
      console.error("resolve-references fetch error:", e);
      setResolved({});
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  return { resolved, loading, resolve };
}

/**
 * Resolve references from a single text string. Convenience that returns
 * { resolved, loading, resolve } and resolve(text) merges into resolved.
 */
export function useResolvedCardReferencesFromText(text: string | undefined) {
  const { resolved, loading, resolve } = useResolvedCardReferences();
  const resolveThis = useCallback(() => {
    if (text) return resolve([text]);
    return Promise.resolve({});
  }, [text, resolve]);
  return { resolved, loading, resolve: resolveThis };
}
