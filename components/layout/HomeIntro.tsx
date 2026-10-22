"use client";

import { createContext, useContext, useState, useEffect } from "react";

/**
 * Homepage intro splash: a plain green screen with the club logo gently
 * flickering, which then closes like a camera iris — the circular window
 * shrinks in on itself, revealing the homepage underneath.
 *
 * `introHasPlayed` lives at module scope: it survives client-side navigation
 * (the module isn't re-evaluated) but resets on a full page load/refresh. So
 * the splash plays on a real page load or hard refresh, and NEVER when the
 * user routes back to the homepage from another page within the app.
 *
 * Nothing here uses framer-motion, and that is the point. The splash covers
 * the entire page, so if whatever removes it fails to run the site is simply
 * unusable. framer-motion drives animation from requestAnimationFrame, which
 * browsers pause for hidden or backgrounded tabs: an `AnimatePresence` exit
 * started while the tab was in the background never progressed, so the
 * overlay was never unmounted and the splash sat there permanently with a
 * frozen logo. Everything below is driven by plain timers and CSS, which keep
 * running when the tab is hidden. The animation is decoration; the timers are
 * what guarantee the splash goes away.
 */
let introHasPlayed = false;
const FLICKER_MS = 950;
const IRIS_MS = 625;
/** The explicit total: flicker, THEN the iris fully closes, THEN reveal. */
const TOTAL_INTRO_MS = FLICKER_MS + IRIS_MS;

/**
 * Lets descendants (e.g. the hero's own text) know once the splash has
 * finished, so they can play their own entrance animation timed to that
 * moment instead of animating in immediately on mount (while still hidden
 * behind the splash). Defaults to `true` so any component using this hook
 * outside of HomeIntro just renders in its "settled" state.
 */
const IntroDoneContext = createContext(true);
export function useIntroDone() {
  return useContext(IntroDoneContext);
}

export default function HomeIntro({ children }: { children: React.ReactNode }) {
  /** Drives the iris: true holds it open, false closes it. */
  const [playing, setPlaying] = useState(!introHasPlayed);
  /**
   * The splash is unmounted on this alone, from a plain timer. It is never
   * gated on an animation finishing, because an animation that never runs
   * would leave the overlay covering the page for good.
   */
  const [revealed, setRevealed] = useState(introHasPlayed);

  /**
   * Whether THIS mount is the one that plays the splash, decided on the first
   * render and held in state.
   *
   * It deliberately does not re-read `introHasPlayed` inside the effect.
   * React Strict Mode mounts a component, runs its effects, unmounts it and
   * mounts it again in development; the first pass would set the flag and arm
   * the timers, the unmount would clear them, and a flag-based guard would
   * then take an early return on the second pass, leaving nothing to close
   * the splash. The initial state survives that effect replay with its original value.
   */
  const [shouldPlay] = useState(() => !introHasPlayed);

  useEffect(() => {
    // Client-side navigation back to the homepage: nothing to play.
    if (!shouldPlay) return;
    introHasPlayed = true;

    document.body.style.overflow = "hidden";
    const closeTimer = setTimeout(() => setPlaying(false), FLICKER_MS);
    const revealTimer = setTimeout(() => {
      setRevealed(true);
      document.body.style.overflow = "";
    }, TOTAL_INTRO_MS);

    return () => {
      clearTimeout(closeTimer);
      clearTimeout(revealTimer);
      document.body.style.overflow = "";
    };
  }, [shouldPlay]);

  return (
    <>
      {/* Green splash overlay, closing via a circular iris wipe.
          Mounted on `revealed` rather than `playing`: `playing` only starts
          the close, while `revealed` is the timer that guarantees the end. */}
      {!revealed && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#059669]"
          style={{
            clipPath: playing ? "circle(150% at 50% 50%)" : "circle(0% at 50% 50%)",
            transition: `clip-path ${IRIS_MS}ms cubic-bezier(0.76, 0, 0.24, 1)`,
          }}
          aria-hidden="true"
        >
          {/* Rim glow, tracing just inside the shrinking edge for polish. */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.18)" }}
          />

          <div
            className="w-40 sm:w-52"
            style={{
              animation: `ecp-intro-flicker ${FLICKER_MS}ms ease-in-out both`,
              transform: playing ? "scale(1)" : "scale(0.85)",
              transition: `transform ${IRIS_MS}ms cubic-bezier(0.76, 0, 0.24, 1)`,
            }}
          >
            {/* Plain <img> on purpose: served directly from /public with no
                image-optimizer round-trip, so the logo is guaranteed to be
                visible within the splash's short lifetime. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/new-logo.png"
              alt="Eko Club Philadelphia"
              width={420}
              height={420}
              className="h-auto w-full drop-shadow-[0_0_28px_rgba(0,0,0,0.25)]"
            />
          </div>
        </div>
      )}

      {/* Homepage content, scaling up into view as the iris closes. On a
          client-side route back it is simply present, with no entrance. */}
      <div
        style={
          shouldPlay
            ? {
                opacity: playing ? 0 : 1,
                transform: playing ? "scale(1.04)" : "scale(1)",
                transition: `opacity ${IRIS_MS}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${IRIS_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
              }
            : undefined
        }
      >
        <IntroDoneContext.Provider value={revealed}>
          {children}
        </IntroDoneContext.Provider>
      </div>
    </>
  );
}
