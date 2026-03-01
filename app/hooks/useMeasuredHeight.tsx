import { useLayoutEffect, useRef, useState } from "react";

export function useMeasuredHeight<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T | null>(null);
  const [h, setH] = useState(0);

  useLayoutEffect(() => {
    if (!active) return;

    const el = ref.current;
    if (!el) return;

    const measure = () => setH(el.getBoundingClientRect().height);

    measure();

    // Keep height correct if content changes (validation errors, async data, etc.)
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    return () => ro.disconnect();
  }, [active]);

  return { ref, h };
}
