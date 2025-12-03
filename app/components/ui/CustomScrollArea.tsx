"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * CustomScrollArea — fully custom vertical scrollbar with drag + track click + auto-hide.
 *
 * Usage:
 * <CustomScrollArea className="h-96 w-full" trackClassName="bg-black/10" thumbClassName="bg-neutral-500/70 hover:bg-neutral-500" thickness={8}>
 *   ...long content...
 * </CustomScrollArea>
 */

type Props = {
  children: React.ReactNode;
  scrollAreaClassName?: string;
  className?: string;
  /** Width of the custom scrollbar (px). */
  thickness?: number; // default 8
  /** Minimum thumb size (px). */
  thumbMinSize?: number; // default 24
  /** Extra classes for the track (Tailwind). */
  trackClassName?: string;
  /** Extra classes for the thumb (Tailwind). */
  thumbClassName?: string;
  /** If true, scrollbar fades when idle. */
  autoHide?: boolean; // default true
  /** Hide the native scrollbar (adds .no-scrollbar). */
  hideNativeScrollbar?: boolean; // default true
  hideCustomScrollbar?: boolean; // default false
};

export default function CustomScrollArea({
  children,
  className,
  scrollAreaClassName,
  thickness = 8,
  thumbMinSize = 24,
  trackClassName = "bg-neutral-800/10 dark:bg-white/10",
  thumbClassName = "bg-neutral-500/70 hover:bg-neutral-400 active:bg-neutral-300",
  autoHide = true,
  hideNativeScrollbar = true,
  hideCustomScrollbar = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const [thumbHeight, setThumbHeight] = useState(0);
  const [thumbTop, setThumbTop] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartScrollTop = useRef(0);
  const [hovering, setHovering] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const hideTimer = useRef<number | null>(null);

  const trackPadding = 2; // px padding inside track (visual breathing room)

  const recompute = () => {
    const el = containerRef.current;
    if (!el) return;

    const { clientHeight, scrollHeight, scrollTop } = el;
    // Thumb size proportional to viewport, but clamp to thumbMinSize
    let tHeight = Math.max(
      thumbMinSize,
      (clientHeight / Math.max(scrollHeight, 1)) *
        (clientHeight - trackPadding * 2)
    );
    // Prevent NaN/Infinity for small content
    tHeight = Math.min(
      tHeight,
      Math.max(clientHeight - trackPadding * 2, thumbMinSize)
    );

    const maxThumbTop = Math.max(clientHeight - trackPadding * 2 - tHeight, 0);
    const maxScrollTop = Math.max(scrollHeight - clientHeight, 1);
    const ratio = maxThumbTop / maxScrollTop;
    const tTop = Math.min(Math.max(scrollTop * ratio, 0), maxThumbTop);

    setThumbHeight(Math.round(tHeight));
    setThumbTop(Math.round(tTop));
  };

  const onScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    recompute();
    if (autoHide) {
      setScrolling(true);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setScrolling(false), 700);
    }
  };

  const onTrackClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    // Ignore clicks that originate on the thumb itself
    const target = e.target as HTMLElement;
    if (target && target.closest('[data-role="thumb"]')) return;

    const track = e.currentTarget.getBoundingClientRect();
    const el = containerRef.current;
    if (!el) return;

    const clickY = e.clientY - track.top - trackPadding;
    const maxThumbTop = Math.max(
      el.clientHeight - trackPadding * 2 - thumbHeight,
      0
    );
    const targetThumbTop = Math.min(
      Math.max(clickY - thumbHeight / 2, 0),
      maxThumbTop
    );

    const maxScrollTop = Math.max(el.scrollHeight - el.clientHeight, 1);
    const ratio = maxScrollTop / Math.max(maxThumbTop, 1);

    el.scrollTop = targetThumbTop * ratio;
  };

  const onThumbMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    // Prevent the track's mousedown from firing when grabbing the thumb
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    dragStartY.current = e.clientY;
    dragStartScrollTop.current = containerRef.current?.scrollTop ?? 0;
  };

  // Global listeners for drag
  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const dy = e.clientY - dragStartY.current;

      const maxThumbTop = Math.max(
        el.clientHeight - trackPadding * 2 - thumbHeight,
        0
      );
      const maxScrollTop = Math.max(el.scrollHeight - el.clientHeight, 1);
      const ratio = maxScrollTop / Math.max(maxThumbTop, 1);

      el.scrollTop = dragStartScrollTop.current + dy * ratio;
    };

    const onUp = () => setDragging(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, thumbHeight]);

  // Recompute on mount, resize, and content size changes
  useEffect(() => {
    recompute();
    const el = containerRef.current;
    const content = contentRef.current;

    const ro = new ResizeObserver(() => recompute());
    if (el) ro.observe(el);
    if (content) ro.observe(content);

    const onResize = () => recompute();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, []);

  // Recompute on font load/layout shifts
  useEffect(() => {
    const id = window.setInterval(recompute, 250);
    return () => window.clearInterval(id);
  }, []);

  const trackStyles = useMemo<React.CSSProperties>(
    () => ({
      right: 0,
      top: 0,
      bottom: 0,
    }),
    [thickness]
  );

  const thumbStyles = useMemo<React.CSSProperties>(
    () => ({
      height: thumbHeight,
      transform: `translateY(${thumbTop}px)`,
    }),
    [thumbHeight, thumbTop, thickness]
  );

  // Visibility (auto hide when not hovering/scrolling)
  const visible = !autoHide || hovering || scrolling || dragging;

  return (
    <div className={`relative ${className || ""}`}>
      {/* Scroll container */}
      <div
        ref={containerRef}
        className={`${
          hideNativeScrollbar ? "hide-scrollbar " : ""
        }  h-full w-full overflow-y-auto overflow-hidden outline-none ${
          hideCustomScrollbar ? "pr-0" : "pr-3"
        }`}
        tabIndex={0}
        onScroll={onScroll}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <div
          ref={contentRef}
          className={`${scrollAreaClassName || ""} rounded-t-md`}
        >
          {children}
        </div>
      </div>

      {/* Track + Thumb */}
      {!hideCustomScrollbar && (
        <div
          className={`pointer-events-auto absolute z-10 select-none overflow-clip ${trackClassName}`}
          style={trackStyles}
          onMouseDown={onTrackClick}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          aria-hidden
        >
          <div
            className={`absolute left-0 right-0 cursor-pointer ${thumbClassName}`}
            style={thumbStyles}
            onMouseDown={onThumbMouseDown}
            data-role="thumb"
            aria-label="Scroll thumb"
          />
        </div>
      )}

      {/* Fade wrapper for auto-hide */}
      <style jsx>{`
        div[aria-hidden] {
          opacity: ${visible ? 1 : 0};
          transition: opacity 180ms ease-out;
        }
      `}</style>
    </div>
  );
}

// Add this CSS to your global CSS once (Tailwind-safe):
// .no-scrollbar::-webkit-scrollbar { display: none; }
// .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
