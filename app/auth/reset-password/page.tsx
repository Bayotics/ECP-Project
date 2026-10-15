"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PASSWORD_MIN_LENGTH, passwordProblem } from "@/lib/models/password";

/* Setting a new password from the emailed link.
 *
 * The link is checked before the form is shown, so somebody with a stale
 * link is told straight away rather than after typing a password twice.
 * Checking does not spend the token; only submitting does.
 */

type Phase = "checking" | "ready" | "bad" | "done";

function ResetPasswordInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [phase, setPhase] = useState<Phase>("checking");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  /* Checking the link does not spend it; only submitting does. A missing
     token needs no request at all, so that case is decided while
     rendering and the effect is left to do nothing but the fetch. */
  useEffect(() => {
    if (!token) return;
    let live = true;

    void (async () => {
      try {
        const res = await fetch(
          `/api/auth/password-reset/confirm?token=${encodeURIComponent(token)}`,
          { cache: "no-store" },
        );
        const json = (await res.json()) as { ok: boolean; data?: { email: string }; error?: string };
        if (!live) return;
        if (!json.ok) {
          setMessage(json.error ?? "That link cannot be used. Ask for a new one.");
          setPhase("bad");
          return;
        }
        setEmail(json.data?.email ?? "");
        setPhase("ready");
      } catch {
        if (!live) return;
        setMessage("We could not reach the server. Try the link again in a moment.");
        setPhase("bad");
      }
    })();

    return () => {
      live = false;
    };
  }, [token]);

  const shown: Phase = token ? phase : "bad";
  const shownMessage = token
    ? message
    : "This page needs the link from your email. Ask for a new one below.";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    const problem = passwordProblem(password);
    if (problem) {
      setError(problem);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) {
        setError(json.error ?? "Could not set that password.");
        return;
      }
      setPhase("done");
      /* Straight to sign-in after a moment, with the new password fresh in
         mind rather than after hunting for the link again. */
      setTimeout(() => router.push("/auth/login"), 2500);
    } catch {
      setError("We could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-lg border border-(--color-neutral-300) bg-white px-3.5 py-2.5 text-sm text-gray-700 outline-none transition focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200)";

  return (
    <div className="w-full space-y-6 rounded-2xl border border-(--color-neutral-200) bg-white p-8 shadow-lg">
      <div className="text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-(--color-green-600) text-lg font-bold text-white">
          ECP
        </div>
        <h1 className="text-2xl font-bold text-gray-500">
          {shown === "done" ? "Password changed" : "Set a new password"}
        </h1>
        {shown === "ready" && email && (
          <p className="mt-1 text-sm text-(--color-neutral-500)">
            For <span className="font-medium text-gray-700">{email}</span>
          </p>
        )}
      </div>

      {shown === "checking" && (
        <p className="text-center text-sm text-(--color-neutral-500)">Checking your link…</p>
      )}

      {shown === "bad" && (
        <div className="space-y-4">
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
            {shownMessage}
          </p>
          <Link
            href="/auth/forgot-password"
            className="block w-full rounded-lg bg-(--color-green-600) px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-(--color-green-700)"
          >
            Send me a new link
          </Link>
        </div>
      )}

      {shown === "done" && (
        <div className="space-y-4">
          <p className="rounded-lg border border-(--color-green-200) bg-(--color-green-50) px-4 py-3 text-sm leading-6 text-(--color-green-800)">
            Your password has been changed. Taking you to the sign-in page…
          </p>
          <Link
            href="/auth/login"
            className="block w-full rounded-lg bg-(--color-green-600) px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-(--color-green-700)"
          >
            Sign in now
          </Link>
        </div>
      )}

      {shown === "ready" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-500">
              New password
            </label>
            <input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
              className={field}
            />
          </div>

          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-gray-500">
              Repeat it
            </label>
            <input
              id="confirm"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={field}
            />
          </div>

          <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-(--color-neutral-500)">
            <input
              type="checkbox"
              checked={show}
              onChange={(e) => setShow(e.target.checked)}
              className="h-4 w-4 accent-green-600"
            />
            Show what I am typing
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full cursor-pointer rounded-lg bg-(--color-green-600) px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-(--color-green-700) disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save my new password"}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-(--color-neutral-500)">
        <Link href="/auth/login" className="font-medium text-(--color-green-600) hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  /* useSearchParams needs a Suspense boundary, or the whole route opts out
     of static rendering and the build says so. */
  return (
    <Suspense
      fallback={
        <div className="w-full rounded-2xl border border-(--color-neutral-200) bg-white p-8 text-center text-sm text-(--color-neutral-500) shadow-lg">
          Checking your link…
        </div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
