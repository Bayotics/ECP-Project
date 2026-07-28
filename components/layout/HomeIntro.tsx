"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Homepage intro splash: a plain green screen with the club logo gently
 * flickering, which then closes like a camera iris — the circular window
 * shrinks in on itself, revealing the homepage underneath — rather than a
 * plain fade/slide.
 *
 * `introHasPlayed` lives at module scope: it survives client-side navigation
 * (the module isn't re-evaluated) but resets on a full page load/refresh. So
 * the splash plays on a real page load or hard refresh, and NEVER when the
 * user routes back to the homepage from another page within the app.
 */
let introHasPlayed = false;
const FLICKER_MS = 3800;
const IRIS_MS = 2500;
// The explicit total: flicker, THEN the iris fully closes, THEN reveal.
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
  const [playing, setPlaying] = useState(!introHasPlayed);
  // `revealed` only flips once the iris has actually finished closing on
  // screen — NOT the moment `playing` becomes false (that only STARTS the
  // exit animation; the visual close still takes IRIS_MS more). Gating hero
  // text on `playing` alone made it animate in *while the overlay was still
  // shrinking on top of it*, so by the time the green circle vanished the
  // text had already finished moving — nothing left to see.
  //
  // Gated on an explicit calculated total (FLICKER_MS + IRIS_MS = the exact
  // moment the iris reaches 0%) via a plain timer, rather than an
  // animation-completion callback — a callback tied to animation-frame
  // progress can stall indefinitely if the tab loses focus mid-splash
  // (browsers pause rAF for hidden tabs), whereas a plain timer keeps firing.
  const [revealed, setRevealed] = useState(introHasPlayed);

  useEffect(() => {
    if (introHasPlayed) return; // client-side nav back to home — no splash
    introHasPlayed = true;

    document.body.style.overflow = "hidden";
    const closeTimer = setTimeout(() => {
      setPlaying(false);
    }, FLICKER_MS);
    const revealTimer = setTimeout(() => {
      setRevealed(true);
      document.body.style.overflow = "";
    }, TOTAL_INTRO_MS);
    return () => {
      clearTimeout(closeTimer);
      clearTimeout(revealTimer);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <>
      {/* Green splash overlay — closes via a circular iris wipe */}
      <AnimatePresence>
        {playing && (
          <motion.div
            key="home-intro"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#059669]"
            style={{ clipPath: "circle(150% at 50% 50%)" }}
            exit={{
              clipPath: "circle(0% at 50% 50%)",
              transition: { duration: IRIS_MS / 1000, ease: [0.76, 0, 0.24, 1] },
            }}
            aria-hidden="true"
          >
            {/* Rim glow — traces just inside the shrinking edge for polish */}
            <motion.div
              className="pointer-events-none absolute inset-0"
              style={{ boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.18)" }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
            />

            <motion.div
              className="w-40 sm:w-52"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.55, 1, 0.65, 1] }}
              exit={{ scale: 0.85, transition: { duration: IRIS_MS / 1000, ease: [0.76, 0, 0.24, 1] } }}
              transition={{
                duration: FLICKER_MS / 1000,
                ease: "easeInOut",
                times: [0, 0.18, 0.4, 0.6, 0.8, 1],
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Homepage content — scales up into view as the iris closes.
          On client-side route-back (introHasPlayed already true) it's
          simply present with no entrance animation. */}
      <motion.div
        initial={introHasPlayed && !playing ? false : { opacity: 0, scale: 1.04 }}
        animate={playing ? { opacity: 0, scale: 1.04 } : { opacity: 1, scale: 1 }}
        transition={{ duration: IRIS_MS / 1000, ease: [0.16, 1, 0.3, 1] }}
      >
        <IntroDoneContext.Provider value={revealed}>
          {children}
        </IntroDoneContext.Provider>
      </motion.div>
    </>
  );
}
