"use client";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/client/api";
import Recaptcha from "@/components/membership/Recaptcha";
interface Preferences {name: string; email: string; phone: string; interests: string; opportunityEmails: boolean}
const field = "mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-950";
export default function VolunteerPreferences() {
  const [token, setToken] = useState("");
  const [data, setData] = useState<Preferences | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [requestEmail, setRequestEmail] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let live = true;
    async function load() {
      const access = new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
      if (!access) { if (live) setLoaded(true); return; }
      try {
        const values = await apiRequest<Preferences>("/api/volunteers/preferences", { headers: { Authorization: `Bearer ${access}` } });
        if (live) { setData(values); setToken(access); }
      } catch (error) { if (live) setError(error instanceof Error ? error.message : "Could not open your preferences."); }
      finally { if (live) setLoaded(true); }
    }
    void load(); return () => { live = false; };
  }, []);
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const result = await apiRequest<{preferences: Preferences; emailChanged: boolean; emailSent: boolean}>("/api/volunteers/preferences", { method: "PATCH", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
      if (result.emailChanged) {
        setData(null); setToken(""); window.history.replaceState(null, "", window.location.pathname);
        setNotice(`Preferences saved. Your old private links have been retired. ${result.emailSent ? "A fresh link has been emailed to your new address." : "Your new link is queued for email delivery. Contact the club if it does not arrive."}`);
      } else { setData(result.preferences); setNotice("Your volunteer preferences have been saved."); }
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save your preferences."); }
    finally { setBusy(false); }
  }
  async function requestLink(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try { const result = await apiRequest<{message: string}>("/api/volunteers/preferences/request", { method: "POST", body: JSON.stringify({ email: requestEmail, recaptchaToken: captcha }) }); setNotice(result.message); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not request a link."); }
    finally { setBusy(false); setCaptcha(""); setAttempt(value => value + 1); }
  }
  return <section className="mx-auto max-w-xl rounded-3xl border border-neutral-200 bg-white text-neutral-900 [color-scheme:light] p-6 shadow-sm sm:p-9">
    <h1 className="text-3xl font-semibold text-neutral-950">Volunteer preferences</h1>
    <p className="mt-4 text-neutral-700">Update your contact details, interests and volunteer opportunity emails.</p>
    {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
    {notice && <p role="status" className="mt-5 rounded-xl bg-green-50 p-4 text-green-900">{notice}</p>}
    {!loaded ? <p className="mt-6">Opening your preferences…</p> : data ? <form onSubmit={save} className="mt-6 space-y-5"><fieldset disabled={busy} className="space-y-5"><legend className="sr-only">Contact and email preferences</legend>
      <label className="block">Name *<input required maxLength={150} autoComplete="name" className={field} value={data.name} onChange={e => setData({...data, name: e.target.value})} /></label>
      <label className="block">Email *<input required type="email" maxLength={254} autoComplete="email" className={field} value={data.email} onChange={e => setData({...data, email: e.target.value})} /></label>
      <label className="block">Phone<input type="tel" maxLength={40} autoComplete="tel" className={field} value={data.phone} onChange={e => setData({...data, phone: e.target.value})} /></label>
      <label className="block">Interests<textarea aria-label="Interests" rows={4} maxLength={500} className={field} value={data.interests} onChange={e => setData({...data, interests: e.target.value})} /></label>
      <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5 accent-green-800" checked={data.opportunityEmails} onChange={e => setData({...data, opportunityEmails: e.target.checked})} /><span>Email me about volunteer opportunities. Event confirmations and changes to my existing sign-ups will still be sent.</span></label>
      <p className="text-sm text-neutral-700">Changing your email retires existing private links and sends a fresh link to your new address.</p>
      <button disabled={busy} className="rounded-full bg-green-800 px-6 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save preferences"}</button>
    </fieldset></form> : <form onSubmit={requestLink} className="mt-6 space-y-5"><h2 className="text-xl font-semibold text-gray-700">Request a private link</h2><label className="block text-gray-600">Your volunteer email<input required type="email" autoComplete="email" maxLength={254} className={field} value={requestEmail} onChange={e => setRequestEmail(e.target.value)} /></label><Recaptcha key={attempt} onChange={setCaptcha} /><button disabled={busy || !captcha} className="rounded-full bg-green-800 px-6 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Sending…" : "Email my preference link"}</button></form>}
  </section>;
}
