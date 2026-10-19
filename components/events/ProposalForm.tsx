"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import Recaptcha from "@/components/membership/Recaptcha";
import { apiRequest } from "@/lib/client/api";
import { validateProposalInput } from "@/lib/proposal-input";
const field = "mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-950";
export default function ProposalForm() {
  const [values, setValues] = useState({ name: "", email: "", title: "", description: "", proposedDate: "", location: "", budget: "", notes: "" });
  const [captcha, setCaptcha] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<{reference: string; acknowledgementEmailSent: boolean} | null>(null);
  const submission = useRef("");
  const sentPayload = useRef("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError("");
    if (sentPayload.current !== JSON.stringify(values)) { submission.current = crypto.randomUUID(); sentPayload.current = JSON.stringify(values); }
    const input = validateProposalInput({ ...values, submissionId: submission.current });
    if ("error" in input) { setError(input.error); return; }
    if (!captcha) { setError("Please complete reCAPTCHA."); return; }
    setBusy(true);
    try { setReceipt(await apiRequest("/api/proposals", { method: "POST", body: JSON.stringify({ ...values, submissionId: submission.current, recaptchaToken: captcha }) })); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not submit your proposal."); }
    finally { setBusy(false); setCaptcha(""); setAttempt(value => value + 1); }
  }
  if (receipt) return <section role="status" className="rounded-3xl bg-green-50 p-8 text-green-950"><h2 className="text-2xl font-semibold">Your proposal has been received</h2><p className="mt-4">The club will review your proposal. This does not confirm an event.</p><p className="mt-4">{receipt.acknowledgementEmailSent ? "An acknowledgement has been emailed to you." : "Your acknowledgement email is queued for delivery. Please keep your reference."}</p><p className="mt-4 break-all">Reference: <strong>{receipt.reference}</strong></p><Link href="/events" className="mt-6 inline-block font-semibold underline">Browse club events</Link></section>;
  return <form onSubmit={submit} className="space-y-5 rounded-3xl border border-neutral-200 bg-white text-neutral-900 [color-scheme:light] p-6 shadow-sm sm:p-8" aria-label="Event proposal"><h2 className="text-2xl font-semibold">Tell us about your idea</h2><p className="text-sm text-neutral-700">Fields marked * are required. Budget and notes are optional.</p><fieldset disabled={busy} className="space-y-5"><legend className="sr-only">Proposal details</legend>
    {([{key: "name", label: "Name", type: "text", max: 150}, {key: "email", label: "Email", type: "email", max: 254}, {key: "title", label: "Event title", type: "text", max: 200}] as const).map(({key, label, type, max}) => <label key={key} className="block font-medium">{label} *<input required type={type} maxLength={max} className={field} value={values[key]} onChange={e => setValues({...values, [key]: e.target.value})} /></label>)}
    <label className="block font-medium">Description *<textarea aria-label="Description *" required rows={5} maxLength={10000} className={field} value={values.description} onChange={e => setValues({...values, description: e.target.value})} /></label>
    <label className="block font-medium">Proposed date *<input required type="date" className={field} value={values.proposedDate} onChange={e => setValues({...values, proposedDate: e.target.value})} /></label>
    <label className="block font-medium">Location *<input required maxLength={500} className={field} value={values.location} onChange={e => setValues({...values, location: e.target.value})} /></label>
    <label className="block font-medium">Estimated budget (USD, optional)<input type="number" min="0" max="99999999.99" step="0.01" className={field} value={values.budget} onChange={e => setValues({...values, budget: e.target.value})} /></label>
    <label className="block font-medium">Notes (optional)<textarea aria-label="Notes (optional)" rows={3} maxLength={3000} className={field} value={values.notes} onChange={e => setValues({...values, notes: e.target.value})} /></label>
    <Recaptcha key={attempt} onChange={setCaptcha} />
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
    <button disabled={busy} className="w-full rounded-full bg-green-800 px-6 py-3.5 font-semibold text-white disabled:opacity-50">{busy ? "Sending…" : "Submit proposal"}</button>
  </fieldset></form>;
}
