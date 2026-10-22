"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/client/api";

export default function NewsletterConfirm() {
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false), [done, setDone] = useState(false), [error, setError] = useState("");
  useEffect(() => {
    const read = () => { setToken(new URLSearchParams(window.location.hash.slice(1)).get("token") ?? ""); setDone(false); setError(""); };
    const frame = requestAnimationFrame(read);
    window.addEventListener("hashchange", read);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("hashchange", read); };
  }, []);
  async function confirm() {
    setBusy(true); setError("");
    try {
      await apiRequest("/api/newsletter/confirm", { method: "POST", body: JSON.stringify({ token }) });
      setDone(true); window.history.replaceState(null, "", window.location.pathname);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not confirm your subscription. Please try again."); }
    finally { setBusy(false); }
  }
  const valid = token !== null && /^[a-f0-9]{64}$/.test(token);
  return <section className="mx-auto max-w-xl rounded-3xl border border-neutral-200 bg-white p-6 text-neutral-900 shadow-sm [color-scheme:light] sm:p-9">
    <h1 className="text-3xl font-semibold text-neutral-950">{done ? "Your subscription is confirmed" : "Confirm your newsletter subscription"}</h1>
    {done ? <p role="status" className="mt-5 leading-relaxed">You’re subscribed to Eko Club Philadelphia news and event updates. Your email includes a private unsubscribe link for whenever you need it.</p> : <>
      <p className="mt-5 leading-relaxed text-neutral-700">Confirm below to start receiving club news. You don’t need to sign in. This link expires 48 hours after it was requested.</p>
      {token === null ? <p className="mt-5">Opening your confirmation link…</p> : valid ? <button type="button" disabled={busy} onClick={()=>void confirm()} className="mt-6 rounded-full bg-green-800 px-6 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Confirming…" : "Confirm my subscription"}</button> : <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-800">Open the private confirmation link in your newsletter email, or subscribe again on the homepage to request a new link.</p>}
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
    </>}
    <Link href="/" className="mt-7 inline-block font-semibold text-green-900 underline">Return to the homepage</Link>
  </section>;
}
