"use client";
import { useState } from "react";
import Link from "next/link";
import { useEvents } from "@/context/EventsContext";
import { apiRequest } from "@/lib/client/api";
import { type CsvMapping, type VolunteerCsvRow } from "@/lib/volunteer-csv";
import { VOLUNTEER_SOURCES, VOLUNTEER_SOURCE_LABELS, type VolunteerSource } from "@/lib/volunteer-sources";
import { AdminPageHeader, Btn } from "@/components/admin/AdminUI";
const field = "mt-2 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 placeholder:text-neutral-700";
const columns: Array<[keyof CsvMapping, string]> = [["name", "Full name"], ["firstName", "First name (if no full name)"], ["lastName", "Last name"], ["email", "Email (required)"], ["phone", "Phone"], ["interests", "Interests"], ["notes", "Notes"], ["externalId", "External registration ID"]];
type Result = {row: number; status?: string; duplicate?: boolean; error?: string; emailDeferred?: boolean};
export default function VolunteerImportPage() {
  const { events } = useEvents();
  const [csv, setCsv] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<CsvMapping>({email: ""});
  const [source, setSource] = useState<VolunteerSource>("other");
  const [eventId, setEventId] = useState("");
  const [preview, setPreview] = useState<{rows: VolunteerCsvRow[]; valid: number; total: number} | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const locked = busy || offset > 0;
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true); setError(""); setPreview(null); setResults([]); setOffset(0); setCsv(""); setHeaders([]);
    try {
      if (file.size > 2_000_000) throw Error("Choose a CSV file smaller than 2 MB.");
      const content = await file.text();
      const result = await apiRequest<{headers: string[]; mapping: CsvMapping}>("/api/admin/volunteers/import", {method: "POST", body: JSON.stringify({action: "columns", csv: content, source})});
      setCsv(content); setHeaders(result.headers); setMapping(result.mapping); setFileName(file.name);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not read CSV."); }
    finally { setBusy(false); }
  }
  async function showPreview() {
    setBusy(true); setError("");
    try { setPreview(await apiRequest("/api/admin/volunteers/import", {method: "POST", body: JSON.stringify({action: "preview", csv, mapping, source, eventId})})); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not preview CSV."); }
    finally { setBusy(false); }
  }
  async function runImport() {
    if (!preview) return;
    setBusy(true); setError(""); let next = offset;
    try {
      while (next < preview.total) {
        const batch = await apiRequest<{results: Result[]; nextOffset: number}>("/api/admin/volunteers/import", {method: "POST", body: JSON.stringify({action: "import", csv, mapping, source, eventId, offset: next})});
        setResults(rows => [...rows, ...batch.results]); next = batch.nextOffset; setOffset(next);
      }
    } catch (error) { setError(`${error instanceof Error ? error.message : "Import interrupted."} Use Continue import to resume. Rows already saved will not reserve duplicate places.`); }
    finally { setBusy(false); }
  }
  return <div className="space-y-6"><AdminPageHeader title="Import volunteers" subtitle="Preview a CSV, match by email and apply event capacity and waitlist rules."><Link href="/admin/volunteers" className="text-sm text-green-800 underline">Back to volunteers</Link></AdminPageHeader>
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 text-sm leading-relaxed"><p>Import only people who signed up to volunteer. Attendee exports can contain ordinary guests. A real name and email are required; rows without them are reported and skipped. Existing contact details and email preferences are preserved. New imports start with opportunity emails off and receive a welcome email with a private preference link.</p><p className="mt-3">For Partiful, export your guest list as CSV and check whether emails are included. If needed, collect emails through the guest questionnaire before importing.</p><a className="mt-3 inline-block text-green-800 underline" href="data:text/csv;charset=utf-8,Name%2CEmail%2CPhone%2CInterests%2CNotes%2CExternal%20ID%0AJane%20Doe%2Cjane%40example.org%2C%2CFood%20drives%2C%2C" download="volunteer-import-template.csv">Download CSV template</a></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    <section className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6"><fieldset disabled={locked} className="grid gap-4 sm:grid-cols-2"><legend className="sr-only">Import settings</legend><label className="text-sm">Source<select aria-label="Source" className={field} value={source} onChange={e => {setSource(e.target.value as VolunteerSource); setPreview(null);}}>{VOLUNTEER_SOURCES.map(value => <option key={value} value={value}>{VOLUNTEER_SOURCE_LABELS[value]}</option>)}</select></label><label className="text-sm">Volunteer list<select aria-label="Volunteer list" className={field} value={eventId} onChange={e => {setEventId(e.target.value); setPreview(null);}}><option value="">General interest list</option>{events.filter(event => event.status === "published").map(event => <option key={event.id} value={event.id}>{event.title}</option>)}</select></label></fieldset>
      <label className="block text-sm">CSV file (up to 1,000 rows, 2 MB)<input type="file" accept=".csv,text/csv" disabled={busy} className={field} onChange={e => void upload(e.target.files?.[0])} /></label>
      {headers.length > 0 && <><p className="text-sm font-medium">Map columns from {fileName}</p><fieldset disabled={locked} className="grid gap-4 sm:grid-cols-2"><legend className="sr-only">CSV column mapping</legend>{columns.map(([key, label]) => <label className="text-sm" key={key}>{label}<select aria-label={label} className={field} value={mapping[key] || ""} onChange={e => {setMapping({...mapping, [key]: e.target.value}); setPreview(null);}}><option value="">Not mapped</option>{headers.map(header => <option key={header}>{header}</option>)}</select></label>)}</fieldset><Btn variant="secondary" disabled={locked} onClick={() => void showPreview()}>Preview import</Btn></>}
    </section>
    {preview && <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6"><h2 className="text-xl font-medium">Review before importing</h2><p className="text-sm">{preview.valid} valid rows out of {preview.total}. Invalid or repeated emails in this file are skipped. Event places are allocated when each row is saved.</p><div className="max-h-96 overflow-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-2">Row</th><th className="p-2">Volunteer</th><th className="p-2">Preview</th></tr></thead><tbody>{preview.rows.map(row => <tr key={row.row} className="border-b"><td className="p-2">{row.row}</td><td className="p-2">{row.value?.name}<span className="block break-all">{row.value?.email}</span></td><td className={`p-2 ${row.error ? "text-red-800" : "text-green-800"}`}>{row.error || "Ready"}</td></tr>)}</tbody></table></div><Btn disabled={busy || !preview.valid || offset === preview.total} onClick={() => void runImport()}>{busy ? `Importing ${offset} / ${preview.total}…` : offset === preview.total ? "Import finished" : offset > 0 ? "Continue import" : "Import valid rows"}</Btn></section>}
    {results.length > 0 && <section aria-live="polite" className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6"><h2 className="text-xl font-medium">Import results · {offset} / {preview?.total}</h2><p className="text-sm">{results.filter(row => row.status).length} saved; {results.filter(row => row.error && !row.duplicate).length} failed; {results.filter(row => row.error && row.duplicate).length} duplicate file rows skipped.</p><ul className="max-h-80 space-y-2 overflow-auto text-sm">{results.map(row => <li key={row.row} className={row.error ? "text-red-800" : "text-green-800"}>Row {row.row}: {row.error || `${row.duplicate ? "Already registered" : "Saved"} (${row.status})`}{row.emailDeferred ? "; email queued" : ""}</li>)}</ul><p className="text-sm text-neutral-700">To retry failed rows after correcting them, upload a corrected file. Reimporting a saved person will match their existing email.</p></section>}
  </div>;
}
