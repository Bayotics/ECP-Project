"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const LAGOS_LGAS = [
  "Agege","Ajeromi-Ifelodun","Alimosho","Amuwo-Odofin","Apapa",
  "Badagry","Epe","Eti-Osa","Ibeju-Lekki","Ifako-Ijaiye",
  "Ikeja","Ikorodu","Kosofe","Lagos Island","Lagos Mainland",
  "Mushin","Ojo","Oshodi-Isolo","Shomolu","Surulere",
];

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    lga: "",
    password: "",
    confirmPassword: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    router.replace("/member/dashboard");
    return null;
  }

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
      lga: form.lga || undefined,
      password: form.password,
    });
    setIsSubmitting(false);
    if (result.success) {
      router.push("/member/dashboard");
    } else {
      setError(result.error ?? "Registration failed. Please try again.");
    }
  }

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg border border-(--color-neutral-200) p-8 space-y-6">
      <div className="text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-(--color-green-600) text-white font-extrabold text-lg mb-4">
          ECP
        </div>
        <h1 className="text-2xl font-bold text-(--foreground)">Create your account</h1>
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
            <label htmlFor="firstName" className="block text-sm font-medium text-(--foreground) mb-1.5">
              First name
            </label>
            <input
              id="firstName"
              type="text"
              required
              value={form.firstName}
              onChange={set("firstName")}
              placeholder="Tunde"
              className="w-full rounded-lg border border-(--color-neutral-300) bg-white px-3.5 py-2.5 text-sm text-(--foreground) outline-none focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200) transition"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-(--foreground) mb-1.5">
              Last name
            </label>
            <input
              id="lastName"
              type="text"
              required
              value={form.lastName}
              onChange={set("lastName")}
              placeholder="Adeyemi"
              className="w-full rounded-lg border border-(--color-neutral-300) bg-white px-3.5 py-2.5 text-sm text-(--foreground) outline-none focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200) transition"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-(--foreground) mb-1.5">
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
            className="w-full rounded-lg border border-(--color-neutral-300) bg-white px-3.5 py-2.5 text-sm text-(--foreground) outline-none focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200) transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-(--foreground) mb-1.5">
              Phone <span className="text-(--color-neutral-400)">(optional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              placeholder="08012345678"
              className="w-full rounded-lg border border-(--color-neutral-300) bg-white px-3.5 py-2.5 text-sm text-(--foreground) outline-none focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200) transition"
            />
          </div>
          <div>
            <label htmlFor="lga" className="block text-sm font-medium text-(--foreground) mb-1.5">
              LGA <span className="text-(--color-neutral-400)">(optional)</span>
            </label>
            <select
              id="lga"
              value={form.lga}
              onChange={set("lga")}
              className="w-full rounded-lg border border-(--color-neutral-300) bg-white px-3.5 py-2.5 text-sm text-(--foreground) outline-none focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200) transition"
            >
              <option value="">Select…</option>
              {LAGOS_LGAS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-(--foreground) mb-1.5">
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
              className="w-full rounded-lg border border-(--color-neutral-300) bg-white px-3.5 py-2.5 pr-11 text-sm text-(--foreground) outline-none focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200) transition"
            />
            <button
              type="button"
              onClick={() => setShowPass((p) => !p)}
              className="absolute inset-y-0 right-3 flex items-center text-(--color-neutral-400) hover:text-(--foreground) transition"
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
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-(--foreground) mb-1.5">
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
            className="w-full rounded-lg border border-(--color-neutral-300) bg-white px-3.5 py-2.5 text-sm text-(--foreground) outline-none focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200) transition"
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
        <Link href="/login" className="text-(--color-green-600) font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
