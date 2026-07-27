"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Homepage intro splash: a plain green screen with the club logo gently
 * flickering, which then lifts away to reveal the homepage.
 *
 * `introHasPlayed` lives at module scope: it survives client-side navigation
 * (the module isn't re-evaluated) but resets on a full page load/refresh. So
 * the splash plays on a real page load or hard refresh, and NEVER when the
 * user routes back to the homepage from another page within the app.
 */
let introHasPlayed = false;
const DURATION_MS = 2600;

export default function HomeIntro({ children }: { children: React.ReactNode }) {
  const [playing, setPlaying] = useState(!introHasPlayed);

  useEffect(() => {
    if (introHasPlayed) return; // client-side nav back to home — no splash
    introHasPlayed = true;

    document.body.style.overflow = "hidden";
    const t = setTimeout(() => {
      setPlaying(false);
      document.body.style.overflow = "";
    }, DURATION_MS);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <>
      {/* Green splash overlay */}
      <AnimatePresence>
        {playing && (
          <motion.div
            key="home-intro"
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#059669]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            aria-hidden="true"
          >
            <motion.div
              className="w-40 sm:w-52"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.55, 1, 0.65, 1] }}
              transition={{
                duration: DURATION_MS / 1000,
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

      {/* Homepage content. On a real page load it fades up after the splash;
          on client-side route-back (initial=false) it appears instantly. */}
      <motion.div
        initial={introHasPlayed && !playing ? false : { opacity: 0, y: 12 }}
        animate={playing ? { opacity: 0, y: 12 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </>
  );
}
