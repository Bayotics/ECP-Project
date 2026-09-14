"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Site-wide smooth/inertial scrolling. Without this, GSAP ScrollTrigger
 * animations track the browser's native (instant) scroll position, which
 * reads as "no drag" — the scrollbar and content just snap 1:1 with the
 * wheel. Lenis intercepts wheel/touch input and eases the actual scroll
 * position toward the target over time, producing the weighted, slightly
 * lagging "reluctance" feel, and every ScrollTrigger-based animation in the
 * app inherits it for free since they all read the same scroll position.
 */
export default function SmoothScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });

    lenis.on("scroll", ScrollTrigger.update);

    function raf(time: number) {
      lenis.raf(time * 1000);
    }
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    /* Lenis caches how far the page is allowed to scroll when it starts, and
       this component mounts once for the whole app. After an App Router
       client-side navigation it therefore still holds the PREVIOUS page's
       limit and silently refuses to wheel-scroll past it — e.g. going from
       the home page (max scroll ~3990px) to /about (~7570px) left the wheel
       dead from ~3990px down, while dragging the native scrollbar still
       worked because that bypasses Lenis and resyncs it.

       <body> is what we watch rather than <html>: html's box stays
       viewport-sized no matter how tall the content gets, so it never
       reports a resize, whereas body's height tracks the content. That
       covers route changes, late-loading images and font swaps alike.
       ScrollTrigger's start/end positions go stale for exactly the same
       reason, so it's refreshed too — debounced, so a section animating its
       height open doesn't trigger a refresh every frame. */
    let refreshTimer: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver(() => {
      lenis.resize();
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 150);
    });
    observer.observe(document.body);

    return () => {
      clearTimeout(refreshTimer);
      observer.disconnect();
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
