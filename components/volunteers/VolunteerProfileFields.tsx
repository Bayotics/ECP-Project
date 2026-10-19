"use client";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/client/api";
import type { PublicCommittee } from "@/lib/public-committees";
export interface VolunteerProfileValues {
  firstName: string; lastName: string; email: string; phone: string; city: string; zip: string;
  committeeIds: string[]; interestAreas: string[]; interests: string; availability: string; heardAbout: string;
}
export const volunteerField = "mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-950 placeholder:text-neutral-700 focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-200";
export function usePublicCommittees() {
  const [committees, setCommittees] = useState<PublicCommittee[] | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    apiRequest<PublicCommittee[]>("/api/committees/public", {signal: controller.signal}).then(rows => {setCommittees(rows); setError("");}).catch(error => {if (!controller.signal.aborted) setError(error.message);});
    return () => controller.abort();
  }, [attempt]);
  return {committees, error, retry: () => setAttempt(value => value + 1)};
}
export default function VolunteerProfileFields({value,onChange,prefix,showCommitteeInterests=true}: {value: VolunteerProfileValues; onChange: (patch: Partial<VolunteerProfileValues>) => void; prefix: string; showCommitteeInterests?: boolean}) {
  const {committees,error,retry} = usePublicCommittees();
  const [area, setArea] = useState("");
  function addArea() { const text = area.trim(); if (text && text.length <= 80 && value.interestAreas.length < 15 && !value.interestAreas.includes(text)) onChange({interestAreas: [...value.interestAreas,text]}); setArea(""); }
  return <div className="space-y-5 text-neutral-900 [color-scheme:light]">
    <div className="grid gap-5 sm:grid-cols-2">{([{key:"firstName",label:"First name",max:75,autocomplete:"given-name"},{key:"lastName",label:"Last name",max:75,autocomplete:"family-name"}] as const).map(item => <div key={item.key}><label htmlFor={`${prefix}-${item.key}`} className="text-sm font-semibold">{item.label} *</label><input id={`${prefix}-${item.key}`} required maxLength={item.max} autoComplete={item.autocomplete} className={volunteerField} value={value[item.key]} onChange={e => onChange({[item.key]:e.target.value})} /></div>)}</div>
    <div><label htmlFor={`${prefix}-email`} className="text-sm font-semibold">Email *</label><input id={`${prefix}-email`} type="email" required maxLength={254} autoComplete="email" className={volunteerField} value={value.email} onChange={e => onChange({email:e.target.value})} /></div>
    <div><label htmlFor={`${prefix}-phone`} className="text-sm font-semibold">Phone (optional)</label><input id={`${prefix}-phone`} type="tel" maxLength={40} autoComplete="tel" className={volunteerField} value={value.phone} onChange={e => onChange({phone:e.target.value})} /></div>
    <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor={`${prefix}-city`} className="text-sm font-semibold">City (optional)</label><input id={`${prefix}-city`} maxLength={100} autoComplete="address-level2" className={volunteerField} value={value.city} onChange={e => onChange({city:e.target.value})} /></div><div><label htmlFor={`${prefix}-zip`} className="text-sm font-semibold">ZIP / postal code (optional)</label><input id={`${prefix}-zip`} maxLength={20} autoComplete="postal-code" className={volunteerField} value={value.zip} onChange={e => onChange({zip:e.target.value})} /></div></div>
    {showCommitteeInterests && <fieldset className="rounded-xl border border-neutral-200 p-4"><legend className="px-1 text-sm font-semibold">Committees of interest (select any)</legend><p className="mb-3 text-sm text-neutral-700">Choose the committees you would like to help. The club will follow up about getting involved.</p>{error ? <p role="alert" className="text-sm text-red-800">{error} <button type="button" className="underline" onClick={retry}>Retry</button></p> : !committees ? <p className="text-sm">Loading committees…</p> : committees.length ? <div className="grid gap-3 sm:grid-cols-2">{committees.map(committee => <label key={committee.id} className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-green-800" checked={value.committeeIds.includes(committee.id)} onChange={e => onChange({committeeIds:e.target.checked?[...value.committeeIds,committee.id]:value.committeeIds.filter(id=>id!==committee.id)})} /><span>{committee.name}</span></label>)}</div> : <p className="text-sm">No active committees are listed at the moment.</p>}{value.committeeIds.filter(id => committees && !committees.some(c=>c.id===id)).map(id => <label key={id} className="mt-3 flex gap-2 text-sm"><input type="checkbox" checked onChange={()=>onChange({committeeIds:value.committeeIds.filter(item=>item!==id)})} />Previously selected committee (no longer open)</label>)}</fieldset>}
    <div><label htmlFor={`${prefix}-area`} className="text-sm font-semibold">Other areas of interest (optional, select multiple)</label><div className="flex items-end gap-2"><input id={`${prefix}-area`} maxLength={80} className={volunteerField} value={area} onChange={e=>setArea(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addArea();}}} /><button type="button" className="shrink-0 rounded-xl border border-green-800 px-4 py-3 text-sm font-semibold text-green-900" disabled={!area.trim()||value.interestAreas.length>=15} onClick={addArea}>Add area</button></div><p className="mt-2 text-xs text-neutral-700">Add up to 15 areas. Press Add area or Enter for each choice.</p><ul className="mt-3 flex flex-wrap gap-2">{value.interestAreas.map(item=><li key={item} className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-sm text-green-950">{item}<button type="button" aria-label={`Remove interest ${item}`} onClick={()=>onChange({interestAreas:value.interestAreas.filter(area=>area!==item)})}>×</button></li>)}</ul></div>
    {value.interests && <div><label htmlFor={`${prefix}-legacy-interests`} className="text-sm font-semibold">Previously recorded interests</label><textarea id={`${prefix}-legacy-interests`} rows={2} maxLength={500} className={volunteerField} value={value.interests} onChange={e=>onChange({interests:e.target.value})} /></div>}
    <div><label htmlFor={`${prefix}-availability`} className="text-sm font-semibold">Availability (optional)</label><textarea id={`${prefix}-availability`} rows={3} maxLength={500} className={volunteerField} value={value.availability} onChange={e=>onChange({availability:e.target.value})} /><p className="mt-2 text-xs text-neutral-700">Tell us the days or times you can usually help.</p></div>
    <div><label htmlFor={`${prefix}-heard`} className="text-sm font-semibold">How did you hear about us? (optional)</label><input id={`${prefix}-heard`} maxLength={150} className={volunteerField} value={value.heardAbout} onChange={e=>onChange({heardAbout:e.target.value})} /></div>
  </div>;
}
