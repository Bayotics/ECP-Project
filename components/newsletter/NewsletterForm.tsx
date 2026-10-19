"use client";
import { useId, useState } from "react";
export default function NewsletterForm() {
  const id = useId();
  const [email, setEmail] = useState(""), [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false), [done, setDone] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  async function subscribe(event: React.FormEvent) {
    event.preventDefault(); setError("");
    if (email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Enter a valid email address."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim().toLowerCase(), source: "footer", website }) });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) throw new Error(payload?.error ?? "We couldn’t save your subscription. Please try again.");
      setNotice(payload.data?.message ?? (payload.data?.confirmationStatus === "sent" ? "You’re subscribed! Check your inbox for your confirmation and unsubscribe link." : "You’re subscribed. Your confirmation email and unsubscribe link are queued for delivery."));
      setDone(true); setEmail("");
    } catch (error) { setError(error instanceof Error ? error.message : "We couldn’t reach the newsletter service. Please try again."); }
    finally { setBusy(false); }
  }
  if (done) return <div className="max-w-md space-y-3 text-sm text-white"><p role="status">{notice}</p><button type="button" className="font-semibold text-white underline" onClick={()=>{setDone(false);setError("");}}>Subscribe another email</button></div>;
  return <form onSubmit={subscribe} noValidate aria-label="Newsletter signup form" className="w-full max-w-md text-white [color-scheme:dark]">
    <div className="flex gap-2"><div className="min-w-0 flex-1"><label htmlFor={id} className="sr-only">Email address</label><input id={id} type="email" required maxLength={254} autoComplete="email" disabled={busy} placeholder="Your email address" value={email} onChange={event=>{setEmail(event.target.value);setError("");}} aria-invalid={Boolean(error)} aria-describedby={error?`${id}-error`:`${id}-help`} className="w-full min-w-0 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm text-white outline-none placeholder:text-white/70 focus:border-white focus:ring-2 focus:ring-white/40 disabled:opacity-60" /></div><button type="submit" disabled={busy} className="shrink-0 rounded-full bg-white px-5 py-3 text-sm font-semibold text-neutral-950 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-white disabled:cursor-wait disabled:opacity-60">{busy?"Subscribing…":"Subscribe"}</button></div>
    <div hidden aria-hidden="true"><label htmlFor={`${id}-website`}>Leave this field blank</label><input id={`${id}-website`} type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={event=>setWebsite(event.target.value)} /></div>
    <p id={`${id}-help`} className="mt-3 text-xs leading-relaxed text-white/80">By subscribing, you agree to receive club news and event updates. You can unsubscribe using the link in your confirmation email.</p>
    {error&&<p id={`${id}-error`} role="alert" className="mt-3 text-sm text-red-200">{error}</p>}
  </form>;
}
