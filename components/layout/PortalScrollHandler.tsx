"use client";

import { useEffect, useRef } from "react";

/**
 * Wheel scrolling for the portal's nested scroll container.
 *
 * Lenis runs site wide and swallows wheel events at the window level, so the
 * portal's `#main-content` never scrolls on its own. This forwards the wheel
 * to it by hand.
 *
 * The important part is knowing when NOT to. Forwarding unconditionally
 * meant that scrolling inside a modal scrolled the page behind it instead,
 * so before hijacking anything this looks at what is actually under the
 * pointer: an open dialog, or any nearer scrollable element that still has
 * room to move, is left to the browser.
 */

/** Closest ancestor that scrolls and can still move in this direction. */
function nearestScrollable(start: Element | null, deltaY: number): Element | null {
  let el: Element | null = start;
  while (el && el !== document.body && el !== document.documentElement) {
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    const scrolls = (overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight + 1;
    if (scrolls) {
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      const stuck = (deltaY < 0 && atTop) || (deltaY > 0 && atBottom);
      if (!stuck) return el;
    }
    el = el.parentElement;
  }
  return null;
}

export default function MemberScrollHandler({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const main = document.getElementById("main-content");
      if (!main) return;

      const target = e.target instanceof Element ? e.target : null;

      /* Anything that opted out of smooth scrolling, and any open dialog,
         handles its own wheel. Modals are portalled to <body> so they are
         not inside this container anyway, but a dialog rendered in place
         would otherwise scroll the page behind it. */
      if (target?.closest("[data-lenis-prevent], [role='dialog']")) return;

      /* A nearer scrollable element that can still move wins. */
      const scroller = nearestScrollable(target, e.deltaY);
      if (scroller && scroller !== main) return;

      if (main.scrollHeight <= main.clientHeight) return;

      e.preventDefault();
      main.scrollBy({ top: e.deltaY, behavior: "auto" });
    };

    const container = containerRef.current;
    container?.addEventListener("wheel", handleWheel, { passive: false });
    return () => container?.removeEventListener("wheel", handleWheel);
  }, []);

  return <div ref={containerRef}>{children}</div>;
}
