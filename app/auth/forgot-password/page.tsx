"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    await sendPasswordReset(email.trim());
    setIsSubmitting(false);
    setSent(true);
  }

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg border border-(--color-neutral-200) p-8 space-y-6">
      <div className="text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-(--color-green-600) text-white font-extrabold text-lg mb-4">
          ECP
        </div>
        <h1 className="text-2xl font-bold text-(--foreground)">Reset your password</h1>
        <p className="mt-1 text-sm text-(--color-neutral-500)">
          Enter your email and we&apos;ll send a reset link
        </p>
      </div>

      {sent ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-(--color-green-200) bg-(--color-green-50) px-5 py-4 text-center">
            <div className="text-3xl mb-2">✉️</div>
            <p className="font-semibold text-(--color-green-700) text-sm">Check your inbox</p>
            <p className="text-(--color-green-600) text-sm mt-1">
              If an account exists for <strong>{email}</strong>, a reset link has been sent.
            </p>
          </div>
          <p className="text-center text-sm text-(--color-neutral-500)">
            Didn&apos;t receive it?{" "}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-(--color-green-600) font-medium hover:underline"
            >
              Try again
            </button>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-(--foreground) mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-(--color-neutral-300) bg-white px-3.5 py-2.5 text-sm text-(--foreground) placeholder-neutral-400 outline-none focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200) transition"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-(--color-green-600) px-4 py-2.5 text-sm font-semibold text-white hover:bg-(--color-green-700) disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-(--color-neutral-500)">
        Remember it?{" "}
        <Link href="/login" className="text-(--color-green-600) font-medium hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
