"use client";

import { useEffect, useLayoutEffect, useSyncExternalStore, type CSSProperties, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* ── Scroll reveals ───────────────────────────────────────────────────────
   GSAP + ScrollTrigger, matching the home page: each reveal plays once per
   page load, when its element's top reaches 85% of the viewport.

   Every element a reveal animates is rendered with `data-reveal` and an
   inline `opacity: 0` (HIDDEN), so the server HTML is already in its
   starting state. Hiding it from an effect instead would let anything
   already on screen at load — a hero, or a section after a reload
   mid-page — flash visible, vanish, then animate back in. */
export const HIDDEN: CSSProperties = { opacity: 0 };
export const SHIFT = 48;
export const EASE = "power3.out";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** False on the server and during hydration, true afterwards — for markup
    (like a portal into document.body) that can only exist in the browser. */
const noopSubscribe = () => () => {};
export function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export type RevealKit = {
  /** A paused timeline plus a promise for its completion. (GSAP's own
      `timeline.then()` holds a single pending promise, so a second caller
      would silently orphan the first — completion is tracked here instead.) */
  timeline: () => { tl: gsap.core.Timeline; done: Promise<void> };
  /** Resolves once `el`'s top reaches 85% of the viewport (straight away if it already has). */
  entered: (el: Element | null) => Promise<void>;
  /** Runs `play` once every gate has resolved, unless the section has since unmounted. */
  after: (gates: Promise<unknown>[], play: () => void) => void;
  /**
   * Reveals `items` strictly one after another and resolves once the last
   * one lands. Nothing starts before `gate` resolves, and each item also
   * waits until it is itself on screen — so on a phone, where a grid stacks
   * into one long column, the lower items still animate where they can be
   * seen rather than off the bottom of the screen.
   */
  queue: (items: Element[], from: gsap.TweenVars, gate: Promise<unknown>, speed?: number) => Promise<void>;
};

export function useReveal(scope: RefObject<HTMLElement | null>, build: (kit: RevealKit) => void) {
  useIsoLayoutEffect(() => {
    const root = scope.current;
    if (!root) return;
    gsap.registerPlugin(ScrollTrigger);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(root.querySelectorAll("[data-reveal]"), { opacity: 1 });
      return;
    }

    let alive = true;
    const ctx = gsap.context(() => {}, root);

    const kit: RevealKit = {
      timeline: () => {
        let resolve!: () => void;
        const done = new Promise<void>((r) => (resolve = r));
        const tl = ctx.add(() => gsap.timeline({ paused: true, onComplete: resolve })) as gsap.core.Timeline;
        return { tl, done };
      },
      entered: (el) =>
        new Promise<void>((resolve) => {
          if (!el) return resolve();
          ctx.add(() => {
            const st = ScrollTrigger.create({
              trigger: el,
              start: "top 85%",
              once: true,
              onEnter: () => resolve(),
            });
            // Already scrolled past on creation (a reload mid-page, or an
            // anchor link further down) — don't wait for an onEnter that
            // may never be needed.
            if (st.progress > 0) resolve();
          });
        }),
      after: (gates, play) => {
        Promise.all(gates).then(() => {
          if (alive) ctx.add(play);
        });
      },
      queue: (items, from, gate, speed = 1) => {
        if (!items.length) return gate.then(() => undefined);
        let chain: Promise<unknown> = gate;
        let landed = 0;
        let resolveAll!: () => void;
        const all = new Promise<void>((r) => (resolveAll = r));
        ctx.add(() => {
          gsap.set(items, from);
          ScrollTrigger.batch(items, {
            start: "top 85%",
            once: true,
            onEnter: (batch) => {
              chain = chain.then(
                () =>
                  new Promise<void>((next) => {
                    if (!alive) return;
                    ctx.add(() => {
                      gsap.to(batch, {
                        opacity: 1,
                        x: 0,
                        y: 0,
                        duration: 0.6 / speed,
                        ease: EASE,
                        stagger: 0.22 / speed,
                        onComplete: () => {
                          landed += batch.length;
                          if (landed >= items.length) resolveAll();
                          next();
                        },
                      });
                    });
                  }),
              );
            },
          });
        });
        return all;
      },
    };

    ctx.add(() => build(kit));

    return () => {
      alive = false;
      ctx.revert();
    };
    // Built once per mount by design; `build` closes over refs, not state.
  }, []);
}
