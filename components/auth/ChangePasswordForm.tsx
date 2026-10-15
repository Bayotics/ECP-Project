"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { PASSWORD_MIN_LENGTH, passwordProblem } from "@/lib/models/password";

/* Changing your own password.
 *
 * Used twice: on the profile page, where it is one tab among several, and
 * inside the prompt a new member sees the first time they sign in with
 * the membership number they were emailed. The two differ only in their
 * surroundings, so the form itself is shared and neither can drift.
 */

export default function ChangePasswordForm({
  /** Shown above the fields, for the first-sign-in case. */
  intro,
  submitLabel = "Change password",
  onDone,
  /** A secondary control, e.g. "Not now", rendered beside the button. */
  secondary,
}: {
  intro?: React.ReactNode;
  submitLabel?: string;
  onDone?: () => void;
  secondary?: React.ReactNode;
}) {
  const { currentUser, changePassword } = useAuth();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (next !== confirm) {
      setError("The two new passwords do not match.");
      return;
    }
    /* Checked here as well as on the server, so the member is told before
       the round trip. The membership number is rejected by name: it is
       what they were emailed, and keeping it would defeat the change. */
    const problem = passwordProblem(next, {
      rejecting: [current, currentUser?.membershipId],
    });
    if (problem) {
      setError(problem);
      return;
    }

    setBusy(true);
    const result = await changePassword(current, next);
    setBusy(false);

    if (!result.success) {
      setError(result.error ?? "Could not change your password.");
      return;
    }

    setCurrent("");
    setNext("");
    setConfirm("");
    setDone(true);
    onDone?.();
  }

  const field =
    "w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {intro}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {error}
        </p>
      )}
      {done && !error && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-800">
          Your password has been changed. Use it next time you sign in.
        </p>
      )}

      <div>
        <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium text-neutral-900">
          Current password
        </label>
        <input
          id="currentPassword"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className={field}
          placeholder={currentUser?.mustChangePassword ? "Your membership number" : "••••••••"}
        />
      </div>

      <div>
        <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-neutral-900">
          New password
        </label>
        <input
          id="newPassword"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          required
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className={field}
          placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-neutral-900">
          Repeat the new password
        </label>
        <input
          id="confirmPassword"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={field}
        />
      </div>

      <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={show}
          onChange={(e) => setShow(e.target.checked)}
          className="h-4 w-4 accent-green-600"
        />
        Show what I am typing
      </label>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={busy}
          className="cursor-pointer rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Saving…" : submitLabel}
        </button>
        {secondary}
      </div>
    </form>
  );
}
