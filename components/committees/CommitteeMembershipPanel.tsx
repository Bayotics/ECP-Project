"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/client/api";
import Recaptcha from "@/components/membership/Recaptcha";
import type { PublicCommittee } from "@/lib/public-committees";

interface CommitteeOption { id: string; name: string; description: string; status: string; role: string; joined: boolean; joinedAt: string | null; type?: string; month?: string; mandate?: string; chairName?: string }
interface MembershipData {
  name: string;
  committees: CommitteeOption[];
  history: Array<{ id: string; committeeName: string; action: string; status: string; role: string; at: string }>;
}
const button = "rounded-full border border-green-800 px-5 py-2.5 text-sm font-semibold text-green-950 disabled:cursor-wait disabled:opacity-50";
export default function CommitteeMembershipPanel({ initialCommittees = [], accessToken = "", showHistory = true }: { initialCommittees?: PublicCommittee[]; accessToken?: string; showHistory?: boolean }) {
  const [data, setData] = useState<MembershipData | null>(null), [loading, setLoading] = useState(true);
  const [verifiedToken, setVerifiedToken] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [verify, setVerify] = useState<string | null>(null), [email, setEmail] = useState(""), [captcha, setCaptcha] = useState(""), [attempt, setAttempt] = useState(0);
  useEffect(() => { if (verify !== null) document.getElementById("committee-access-email")?.focus(); }, [verify]);
  useEffect(() => {
    let live = true;
    async function load() {
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const token = accessToken || fragment.get("token") || "";
      const join = accessToken ? "" : fragment.get("join") || "";
      try {
        if (token) {
          await apiRequest("/api/committees/access", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
          if (live) setVerifiedToken(token);
          if (!accessToken) window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        let current = await apiRequest<MembershipData | null>("/api/committees/mine", { headers });
        if (join && current) {
          current = await apiRequest<MembershipData>("/api/committees/mine", { method: "POST", headers, body: JSON.stringify({ committeeId: join, action: "join" }) });
          if (live) setNotice("Your email is confirmed and your committee membership has been saved. A confirmation email is queued for delivery.");
        }
        if (live) { setData(current); setError(""); }
      } catch (error) { if (live) setError(error instanceof Error ? error.message : "Could not load your committee memberships."); }
      finally { if (live) setLoading(false); }
    }
    const onHashChange = () => { void load(); };
    window.addEventListener("hashchange", onHashChange);
    void load();
    return () => { live = false; window.removeEventListener("hashchange", onHashChange); };
  }, [accessToken]);
  async function change(id: string, action: "join" | "leave") {
    if (!data) { setVerify(id); setNotice(""); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await apiRequest<MembershipData & { unchanged: boolean; emailQueued: boolean }>("/api/committees/mine", { method: "POST", ...(verifiedToken ? {headers:{Authorization:`Bearer ${verifiedToken}`}} : {}), body: JSON.stringify({ committeeId: id, action }) });
      setData(result); setNotice(result.unchanged ? "Your committee membership was already up to date." : `You have ${action === "join" ? "joined" : "left"} the committee. ${result.emailQueued ? "Email notifications are queued for delivery." : "Email notifications have been sent."}`);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not change committee membership."); }
    finally { setBusy(false); }
  }
  async function requestLink(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const result = await apiRequest<{ message: string }>("/api/committees/access/request", { method: "POST", body: JSON.stringify({ email, recaptchaToken: captcha, ...(verify ? { committeeId: verify } : {}) }) });
      setNotice(result.message);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not request committee access."); }
    finally { setBusy(false); setCaptcha(""); setAttempt(value => value+1); }
  }
  const committees: CommitteeOption[] = data?.committees ?? initialCommittees.map(committee => ({ ...committee, status: "active", role: "Volunteer", joined: false, joinedAt: null }));
  return <section className="space-y-5 text-neutral-900 [color-scheme:light]" aria-label="Committee memberships">
    <div><h2 className="text-2xl font-semibold text-neutral-950">Your committees</h2><p className="mt-3 text-sm text-neutral-700">Pick at least one. You can belong to several committees and join or leave whenever you need to.</p>{!data && !loading && <p className="mt-3 text-sm"><Link href="/auth/login" className="font-semibold text-green-900 underline">Members: sign in</Link>. Volunteers: verify your email once, then use these buttons on this browser. <Link href="/volunteer" className="text-green-900 underline">New volunteer? Sign up here.</Link></p>}</div>
    {loading && <p role="status">Loading your committee memberships…</p>}
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error} <button type="button" className="underline" onClick={()=>window.location.reload()}>Reload</button></p>}
    {notice && <p role="status" className="rounded-xl bg-green-50 p-4 text-green-950">{notice}</p>}
    {verify !== null && !data && <form onSubmit={requestLink} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5"><h3 className="text-lg font-semibold">Confirm your volunteer email</h3><p className="text-sm text-neutral-700">We’ll email a private confirmation link. Your committee choice is saved after you open it. No password or repeat registration form is needed.</p><label className="block text-sm font-semibold" htmlFor="committee-access-email">Volunteer email</label><input id="committee-access-email" type="email" required autoComplete="email" maxLength={254} value={email} onChange={event=>setEmail(event.target.value)} className="w-full rounded-xl border border-neutral-300 bg-white p-3 text-neutral-950" /><Recaptcha key={attempt} onChange={setCaptcha} /><div className="flex flex-wrap gap-3"><button disabled={busy||!captcha} className={button}>Email confirmation link</button><button type="button" onClick={()=>setVerify(null)} className={button}>Cancel</button></div></form>}
    <div className="grid gap-5 md:grid-cols-2">{committees.map(committee => <article key={committee.id} className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6"><div className="mb-3 flex flex-wrap gap-2 text-xs text-green-950">{committee.type&&<span className="rounded-full bg-green-50 px-3 py-1 capitalize">{committee.type.replace(/-/g," ")}</span>}{committee.month&&<span className="rounded-full bg-neutral-100 px-3 py-1">{committee.month}</span>}</div><h3 className="text-xl font-semibold text-neutral-950">{committee.name}</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">{committee.description}</p>{committee.mandate&&<p className="mt-3 text-sm text-neutral-700">{committee.mandate}</p>}{committee.chairName&&<p className="mt-3 text-sm"><strong>Chairperson:</strong> {committee.chairName}</p>}{committee.joined && <p className="mt-4 text-sm font-semibold text-green-900">Joined · {committee.role}{committee.joinedAt ? ` · ${new Date(committee.joinedAt).toLocaleDateString("en-US",{timeZone:"America/New_York"})}` : ""}</p>}{committee.status!=="active" && <p className="mt-3 text-sm text-neutral-700">This committee is {committee.status}.</p>}<div className="mt-auto pt-5"><button type="button" disabled={busy||loading||(!committee.joined&&committee.status!=="active")} onClick={()=>void change(committee.id,committee.joined?"leave":"join")} className={committee.joined?button:`${button} bg-green-800 text-white`} aria-label={`${committee.joined?"Leave":"Join"} ${committee.name}`}>{committee.joined?"Leave committee":"Join committee"}</button></div></article>)}</div>
    {!loading && !committees.length && <p>No committees are available at the moment.</p>}
    {data && <>{showHistory&&<details className="rounded-xl border border-neutral-200 bg-white p-5"><summary className="cursor-pointer font-semibold">Your committee history</summary>{data.history.length?<ul className="mt-4 space-y-3">{data.history.map(change=><li key={change.id} className="border-t border-neutral-200 pt-3 text-sm"><strong>{change.committeeName}</strong>: {change.status} · {change.role}<br /><time dateTime={change.at}>{new Date(change.at).toLocaleString("en-US",{timeZone:"America/New_York"})} (Philadelphia time)</time></li>)}</ul>:<p className="mt-3 text-sm">New joins and departures will be recorded here.</p>}</details>}{!accessToken&&<button type="button" className="text-sm text-green-900 underline" onClick={async()=>{try{await apiRequest("/api/committees/access",{method:"DELETE"});setVerifiedToken("");setNotice("Volunteer access forgotten on this browser. Members can sign out using the portal menu.");setData(await apiRequest<MembershipData|null>("/api/committees/mine"));}catch{setError("Could not forget volunteer access. Please try again.");}}}>Forget volunteer access on this browser</button>}</>}
  </section>;
}
