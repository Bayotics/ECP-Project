"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/context/AuthContext";
import { useIsClient } from "@/components/gsap/useReveal";
import ChangePasswordForm from "@/components/auth/ChangePasswordForm";

/* The prompt a new member meets the moment they first sign in.
 *
 * Their first password is their membership number, which reached them by
 * email in the clear, so the portal asks for a replacement straight away.
 * `mustChangePassword` on the account is what raises this, and setting a
 * new password is what clears it, so it cannot be escaped by reloading.
 *
 * It can be put off once, for the member who signed in to do one urgent
 * thing: dismissing lasts for this tab only and the prompt is back at the
 * next sign-in. What it will not do is close on a stray click outside or
 * an Escape keypress, which is how a prompt like this gets dismissed
 * without being read.
 */

export default function PasswordChangeGate() {
  const { currentUser } = useAuth();
  const isClient = useIsClient();
  /* Whose prompt was put off, rather than a plain flag. Someone else
     signing in on the same tab gets their own prompt without any resetting
     to do, and nothing is stored, so it never outlives the tab. */
  const [putOffFor, setPutOffFor] = useState<string | null>(null);

  const needed = Boolean(currentUser?.mustChangePassword);
  const putOff = currentUser != null && putOffFor === currentUser.id;

  if (!isClient || !needed || putOff) return null;

  return createPortal(
    <div
      data-lenis-prevent
      className="fixed inset-0 z-[10001] flex items-start justify-center overflow-y-auto bg-neutral-950/70 p-4 backdrop-blur-sm [animation:viewer-in_200ms_ease-out] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="password-gate-title"
    >
      <div className="my-8 w-full max-w-md overflow-hidden rounded-[1.5rem] bg-white shadow-2xl">
        <div className="flex h-1 w-full" aria-hidden="true">
          {["#188d1a", "#cb3e31", "#0b1f8c", "#f9f756"].map((c) => (
            <div key={c} className="flex-1" style={{ background: c }} />
          ))}
        </div>

        <div className="px-6 py-6 sm:px-8">
          <h2
            id="password-gate-title"
            className="text-xl font-medium tracking-[-0.02em] text-neutral-950"
          >
            Choose your own password
          </h2>

          <ChangePasswordForm
            submitLabel="Save my new password"
            intro={
              <div className="mb-1 space-y-3">
                <p className="text-sm leading-6 text-neutral-700">
                  You are signed in with your membership number
                  {currentUser?.membershipId ? (
                    <>
                      ,{" "}
                      <span className="font-mono text-neutral-950">{currentUser.membershipId}</span>
                    </>
                  ) : null}
                  . It was sent to you by email, so it is not a secret worth keeping. Set a password
                  only you know.
                </p>
                <p className="rounded-xl bg-neutral-50 px-4 py-3 text-sm leading-6 text-neutral-700">
                  Enter your membership number as the current password, then pick a new one.
                </p>
              </div>
            }
            secondary={
              <button
                type="button"
                onClick={() => setPutOffFor(currentUser?.id ?? null)}
                className="cursor-pointer text-sm text-neutral-600 underline transition-colors hover:text-neutral-900"
              >
                Not right now
              </button>
            }
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
