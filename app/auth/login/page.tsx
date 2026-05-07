"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { loginWithEmail, isAuthenticated } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/member/dashboard");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    const result = await loginWithEmail(email, password);
    setIsSubmitting(false);
    if (result.success) {
      router.push("/member/dashboard");
    } else {
      setError(result.error ?? "Login failed. Please try again.");
    }
  }

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg border border-(--color-neutral-200) p-8 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-(--color-green-600) text-white font-extrabold text-lg mb-4">
          ECP
        </div>
        <h1 className="text-2xl font-bold text-gray-500">Welcome back</h1>
        <p className="mt-1 text-sm text-(--color-neutral-500)">
          Sign in to your ECP member account
        </p>
      </div>

      {/* Demo hint */}
      <div className="rounded-lg border border-(--color-green-200) bg-(--color-green-50) px-4 py-3 text-sm text-(--color-green-700)">
        <span className="font-semibold">Demo:</span>{" "}
        <span className="font-mono">tunde.adeyemi@email.com</span>{" "}
        /{" "}
        <span className="font-mono">ecp2024</span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-500 mb-1.5">
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
            className="w-full rounded-lg border border-(--color-neutral-300) bg-white px-3.5 py-2.5 text-sm text-gray-500 placeholder-neutral-400 outline-none focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200) transition"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-gray-500">
              Password
            </label>
            <Link href="/auth/forgot-password" className="text-xs text-(--color-green-600) hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-(--color-neutral-300) bg-white px-3.5 py-2.5 pr-11 text-sm text-gray-500 placeholder-neutral-400 outline-none focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200) transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute inset-y-0 right-3 flex items-center text-(--color-neutral-400) hover:text-gray-500 transition"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-(--color-green-600) px-4 py-2.5 text-sm font-semibold text-white hover:bg-(--color-green-700) disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-center text-sm text-(--color-neutral-500)">
        Don&apos;t have an account?{" "}
        <Link href="/auth/register" className="text-(--color-green-600) font-medium hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}

