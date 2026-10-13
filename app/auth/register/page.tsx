"use client";

import { IBILE_DIVISIONS } from "@/lib/constants";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";


export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    lagosOrigin: "",
    password: "",
    confirmPassword: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  /* Set once the account exists, which switches the card over to the
     "check your inbox" panel rather than dropping the member straight into
     the portal with no idea an email is waiting. */
  const [registered, setRegistered] = useState<{ email: string; emailSent: boolean } | null>(null);
  const [resendState, setResendState] = useState<{ busy: boolean; message: string; error: string }>({
    busy: false, message: "", error: "",
  });

  useEffect(() => {
    /* Registration signs the member in, and without this guard that would
       immediately redirect them past the message telling them to go and
       confirm their address. */
    if (isAuthenticated && !registered) {
      router.replace("/member/dashboard");
    }
  }, [isAuthenticated, registered, router]);

  if (isAuthenticated && !registered) return null;

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setIsSubmitting(true);
    const result = await register({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      displayName: `${form.firstName.trim()} ${form.lastName.trim()}`,
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      lagosOrigin: form.lagosOrigin || undefined,
      password: form.password,
    });
    setIsSubmitting(false);
    if (result.success) {
      setRegistered({
        email: form.email.trim().toLowerCase(),
        emailSent: result.verificationEmailSent !== false,
      });
    } else {
      setError(result.error ?? "Registration failed. Please try again.");
    }
  }

  async function handleResend() {
    if (!registered) return;
    setResendState({ busy: true, message: "", error: "" });
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registered.email }),
      });
      const json = (await res.json()) as { ok: boolean; message?: string; error?: string };
      setResendState({
        busy: false,
        message: json.ok ? (json.message ?? "Sent.") : "",
        error: json.ok ? "" : (json.error ?? "Could not send the email."),
      });
    } catch {
      setResendState({ busy: false, message: "", error: "Could not reach the server. Try again." });
    }
  }

  if (registered) {
    return (
      <div className="w-full space-y-6 rounded-2xl border border-(--color-neutral-200) bg-white p-8 shadow-lg">
        <div className="text-center">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-(--color-green-600) text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-6 w-6" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </div>
          <h1 className="text-2xl font-medium tracking-[-0.02em] text-neutral-950">Check your inbox</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-700">
            {registered.emailSent ? (
              <>
                We sent a confirmation link to{" "}
                <span className="text-neutral-950">{registered.email}</span>. Open it to finish
                setting up your account. The link expires in 24 hours.
              </>
            ) : (
              <>
                Your account was created, but the confirmation email could not be sent just now.
                You can ask for it again below.
              </>
            )}
          </p>
        </div>

        {resendState.message && (
          <p className="rounded-lg border border-(--color-green-300) bg-green-50 px-4 py-3 text-sm text-green-800">
            {resendState.message}
          </p>
        )}
        {resendState.error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {resendState.error}
          </p>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendState.busy}
            className="w-full rounded-full border border-(--color-neutral-300) px-6 py-3 text-sm font-normal text-neutral-900 transition-colors hover:border-(--color-neutral-400) disabled:opacity-60"
          >
            {resendState.busy ? "Sending…" : "Send the link again"}
          </button>
          <Link
            href="/auth/login"
            className="block w-full rounded-full bg-(--color-green-600) px-6 py-3 text-center text-sm font-normal text-white transition-opacity hover:opacity-90"
          >
            Go to sign in
          </Link>
        </div>

        <p className="text-center text-xs leading-5 text-neutral-700">
          The portal opens once your address is confirmed. Nothing arrived? Check your spam
          folder. The message comes from Eko Club Philadelphia.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg border border-(--color-neutral-200) p-8 space-y-6">
      <div className="text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-(--color-green-600) text-white font-bold text-lg mb-4">
          ECP
        </div>
        <h1 className="text-2xl font-bold text-gray-500">Create your account</h1>
        <p className="mt-1 text-sm text-(--color-neutral-500)">
          Join the Eko Club Philadelphia community
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-500 mb-1.5">
              First name
            </label>
            <input
              id="firstName"
              type="text"
              required
              value={form.firstName}
              onChange={set("firstName")}
              placeholder="Tunde"
              className="w-full rounded-lg border border-(--color-neutral-300) bg-white px-3.5 py-2.5 text-sm text-gray-500 outline-none focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200) transition"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-500 mb-1.5">
              Last name
            </label>
            <input
              id="lastName"
              type="text"
              required
              value={form.lastName}
              onChange={set("lastName")}
              placeholder="Adeyemi"
              className="w-full rounded-lg border border-(--color-neutral-300) bg-white px-3.5 py-2.5 text-sm text-gray-500 outline-none focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200) transition"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-500 mb-1.5">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={set("email")}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-(--color-neutral-300) bg-white px-3.5 py-2.5 text-sm text-gray-500 outline-none focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200) transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-500 mb-1.5">
              Phone <span className="text-(--color-neutral-400)">(optional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              placeholder="08012345678"
              className="w-full rounded-lg border border-(--color-neutral-300) bg-white px-3.5 py-2.5 text-sm text-gray-500 outline-none focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200) transition"
            />
          </div>
          <div>
            <label htmlFor="lagosOrigin" className="block text-sm font-medium text-gray-500 mb-1.5">
              Lagos Origin <span className="text-(--color-neutral-400)">(optional)</span>
            </label>
            <select
              id="lagosOrigin"
              value={form.lagosOrigin}
              onChange={set("lagosOrigin")}
              className="w-full rounded-lg border border-(--color-neutral-300) bg-white px-3.5 py-2.5 text-sm text-gray-500 outline-none focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200) transition"
            >
              <option value="">Select…</option>
              {IBILE_DIVISIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-500 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPass ? "text" : "password"}
              autoComplete="new-password"
              required
              value={form.password}
              onChange={set("password")}
              placeholder="Min. 6 characters"
              className="w-full rounded-lg border border-(--color-neutral-300) bg-white px-3.5 py-2.5 pr-11 text-sm text-gray-500 outline-none focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200) transition"
            />
            <button
              type="button"
              onClick={() => setShowPass((p) => !p)}
              className="absolute inset-y-0 right-3 flex items-center text-(--color-neutral-400) hover:text-gray-500 transition"
              aria-label="Toggle password visibility"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-500 mb-1.5">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type={showPass ? "text" : "password"}
            autoComplete="new-password"
            required
            value={form.confirmPassword}
            onChange={set("confirmPassword")}
            placeholder="Repeat password"
            className="w-full rounded-lg border border-(--color-neutral-300) bg-white px-3.5 py-2.5 text-sm text-gray-500 outline-none focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200) transition"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-(--color-green-600) px-4 py-2.5 text-sm font-semibold text-white hover:bg-(--color-green-700) disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-(--color-neutral-500)">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-(--color-green-600) font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
