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

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
