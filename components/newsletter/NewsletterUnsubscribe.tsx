"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/client/api";
export default function NewsletterUnsubscribe() {
  const [token, setToken] = useState<string | null>(null), [busy, setBusy] = useState(false), [done, setDone] = useState(false), [error, setError] = useState("");
  useEffect(() => {
    const read = () => { setToken(new URLSearchParams(window.location.hash.slice(1)).get("token") ?? ""); setDone(false); setError(""); };
    const frame = window.requestAnimationFrame(read);
    window.addEventListener("hashchange", read);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("hashchange", read); };
  }, []);
  async function unsubscribe() {
    setBusy(true); setError("");
    try { await apiRequest("/api/newsletter/unsubscribe", { method: "POST", body: JSON.stringify({ token }) }); setDone(true); window.history.replaceState(null, "", window.location.pathname); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not unsubscribe. Please try again."); }
    finally { setBusy(false); }
  }
  const valid = token !== null && /^[a-f0-9]{64}$/.test(token);
  return <section className="mx-auto max-w-xl rounded-3xl border border-neutral-200 bg-white p-6 text-neutral-900 shadow-sm [color-scheme:light] sm:p-9"><h1 className="text-3xl font-semibold text-neutral-950">{done ? "You’re unsubscribed" : "Unsubscribe from the newsletter"}</h1>{done ? <p role="status" className="mt-5 leading-relaxed">Your newsletter subscription has been stopped. Your membership and volunteer preferences remain unchanged.</p> : <><p className="mt-5 leading-relaxed text-neutral-700">Choose Unsubscribe below to stop Eko Club Philadelphia newsletter emails. You don’t need to sign in.</p>{token === null ? <p className="mt-5">Opening your unsubscribe link…</p> : valid ? <button type="button" onClick={()=>void unsubscribe()} disabled={busy} className="mt-6 rounded-full bg-green-800 px-6 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Unsubscribing…" : "Unsubscribe from newsletter"}</button> : <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-800">Open the unsubscribe link from your newsletter email. This page needs your private link to find your subscription.</p>}{error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}</>}<Link href="/" className="mt-7 inline-block font-semibold text-green-900 underline">Return to the homepage</Link></section>;
}
