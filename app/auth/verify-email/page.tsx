"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

/* Where the link in the confirmation email lands.
 *
 * The page reads the token from the URL and posts it to the API, rather than
 * the link hitting a GET endpoint directly: mail clients and corporate
 * security scanners follow links in messages to check them, and a
 * single-use token spent by a scanner would be dead before the member ever
 * clicked it.
 */

type Phase = "working" | "done" | "already" | "failed";

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get("token");

  const [phase, setPhase] = useState<Phase>("working");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [resend, setResend] = useState<{ busy: boolean; note: string; error: string }>({
    busy: false, note: "", error: "",
  });

  /* React runs effects twice in development, and the second run would spend
     a token the first one already consumed, reporting "already used" to a
     member who clicked exactly once. */
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    if (!token) {
      setPhase("failed");
      setMessage("That link is missing its confirmation code. Please open the link from your email again.");
      return;
    }

    void (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const json = (await res.json()) as {
          ok: boolean;
          alreadyVerified?: boolean;
          error?: string;
        };
        if (json.ok) {
          setPhase(json.alreadyVerified ? "already" : "done");
        } else {
          setPhase("failed");
          setMessage(json.error ?? "That confirmation link could not be used.");
        }
      } catch {
        setPhase("failed");
        setMessage("We could not reach the server. Check your connection and try again.");
      }
    })();
  }, [token]);

  const handleResend = useCallback(async () => {
    if (!email.trim()) {
      setResend({ busy: false, note: "", error: "Enter the address you registered with." });
      return;
    }
    setResend({ busy: true, note: "", error: "" });
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = (await res.json()) as { ok: boolean; message?: string; error?: string };
      setResend({
        busy: false,
        note: json.ok ? (json.message ?? "Sent.") : "",
        error: json.ok ? "" : (json.error ?? "Could not send the email."),
      });
    } catch {
      setResend({ busy: false, note: "", error: "Could not reach the server. Try again." });
    }
  }, [email]);

  return (
    <div className="w-full space-y-6 rounded-2xl border border-(--color-neutral-200) bg-white p-8 shadow-lg">
      {phase === "working" && (
        <div className="py-6 text-center">
          <p className="text-sm text-neutral-700">Confirming your email…</p>
        </div>
      )}

      {(phase === "done" || phase === "already") && (
        <>
          <div className="text-center">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-(--color-green-600) text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6" aria-hidden="true">
                <path d="m5 13 4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-medium tracking-[-0.02em] text-neutral-950">
              {phase === "already" ? "Already confirmed" : "Email confirmed"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-neutral-700">
              {phase === "already"
                ? "This address was confirmed already. You can sign in and carry on."
                : "Thank you. Your address is confirmed and your account is active."}
            </p>
          </div>
          <div className="space-y-3">
            <Link
              href="/member/dashboard"
              className="block w-full rounded-full bg-(--color-green-600) px-6 py-3 text-center text-sm font-normal text-white transition-opacity hover:opacity-90"
            >
              Go to the member portal
            </Link>
            <Link
              href="/auth/login"
              className="block w-full rounded-full border border-(--color-neutral-300) px-6 py-3 text-center text-sm font-normal text-neutral-900 transition-colors hover:border-(--color-neutral-400)"
            >
              Sign in
            </Link>
          </div>
        </>
      )}

      {phase === "failed" && (
        <>
          <div className="text-center">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6" aria-hidden="true">
                <path d="M12 8v5M12 16.5v.5" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
            <h1 className="text-2xl font-medium tracking-[-0.02em] text-neutral-950">
              That link did not work
            </h1>
            <p className="mt-2 text-sm leading-6 text-neutral-700">{message}</p>
          </div>

          <div className="space-y-3 border-t border-(--color-neutral-200) pt-5">
            <label htmlFor="resend-email" className="block text-sm font-normal text-neutral-900">
              Send a new link
            </label>
            <input
              id="resend-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-(--color-neutral-300) px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200)"
            />
            {resend.note && (
              <p className="rounded-lg border border-(--color-green-300) bg-green-50 px-4 py-3 text-sm text-green-800">
                {resend.note}
              </p>
            )}
            {resend.error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {resend.error}
              </p>
            )}
            <button
              type="button"
              onClick={handleResend}
              disabled={resend.busy}
              className="w-full rounded-full bg-(--color-green-600) px-6 py-3 text-sm font-normal text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {resend.busy ? "Sending…" : "Send a new link"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  /* useSearchParams needs a Suspense boundary, or the whole route opts out
     of static rendering at build time. */
  return (
    <Suspense
      fallback={
        <div className="w-full rounded-2xl border border-(--color-neutral-200) bg-white p-8 text-center shadow-lg">
          <p className="text-sm text-neutral-700">Loading…</p>
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
