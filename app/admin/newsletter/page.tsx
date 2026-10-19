"use client";

import { errorMessage } from "@/hooks/useAdminAction";
import { useState, useEffect, useMemo } from "react";
import {
  AdminPageHeader, AdminFilters, FilterSelect,
  AdminTable, TR, TD, Badge, AdminModal,
  FormField, FormInput, FormSelect, Btn, SectionDivider,
} from "@/components/admin/AdminUI";
import type { NewsletterAdminRow, NewsletterSource } from "@/lib/models/newsletter";
import { csvLine as csvRow } from "@/lib/volunteer-export";
import { apiRequest, apiDelete } from "@/lib/client/api";

const SOURCE_OPTIONS = ["all", "website", "footer", "admin", "rsvp", "import"];
const STATUS_OPTIONS = ["all", "active", "unsubscribed"];

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<NewsletterAdminRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [selected, setSelected] = useState<NewsletterAdminRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", name: "", phone: "", source: "admin" as NewsletterSource });
  const [addError, setAddError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    try {
      const data = await apiRequest<NewsletterAdminRow[]>("/api/newsletter");
      setSubscribers(data);
    } catch (caught) {
      /* An empty list and a failed request look identical on screen, so say
         which one this is rather than implying nobody has subscribed. */
      setSubscribers([]);
      setLoadError(errorMessage(caught));
    } finally {
      setIsLoading(false);
    }
  }

  function refresh() { setIsLoading(true); setLoadError(""); void load(); }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => { void load(); });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const filtered = useMemo(() => {
    let list = subscribers;
    if (sourceFilter !== "all") list = list.filter(s => s.source === sourceFilter);
    if (statusFilter !== "all") list = list.filter(s => s.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.email.toLowerCase().includes(q) ||
        (s.name ?? "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => b.subscribedAt.localeCompare(a.subscribedAt));
  }, [subscribers, search, sourceFilter, statusFilter]);

  const activeCount = subscribers.filter(s => s.status === "active").length;
  const unsubCount = subscribers.filter(s => s.status === "unsubscribed").length;

  async function handleAdd() {
    if (!addForm.email.trim()) { setAddError("Email is required"); return; }
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(addForm.email.trim())) { setAddError("Invalid email address"); return; }
    setSaving(true);
    setAddError("");
    try {
      const sub = await apiRequest<NewsletterAdminRow>("/api/newsletter", {
        method: "POST",
        body: JSON.stringify({ ...addForm, source: addForm.source }),
      });
      setSubscribers(prev => [sub, ...prev.filter(row=>row.id!==sub.id)]);
      setNotice(sub.confirmationStatus==="sent"?"Subscriber saved and confirmation emailed.":"Subscriber saved. The confirmation email is queued; check its delivery status.");
      setAdding(false);
      setAddForm({ email: "", name: "", phone: "", source: "admin" });
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add subscriber");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(sub: NewsletterAdminRow) {
    if(sub.status === "unsubscribed" && !confirm(`Re-subscribe ${sub.email}? Only continue if they have requested newsletter emails. A confirmation with a new unsubscribe link will be emailed.`))return;
    setActionBusy(true);setActionError("");
    try {
      const updated = await apiRequest<NewsletterAdminRow>(`/api/newsletter/${sub.id}`, { method: "PATCH", body: JSON.stringify({ status: sub.status === "active" ? "unsubscribed" : "active" }) });
      setSubscribers(prev=>prev.map(row=>row.id===updated.id?updated:row));setSelected(updated);
      setNotice(updated.status==="unsubscribed"?"Newsletter subscription stopped.":updated.confirmationStatus==="sent"?"Subscription reactivated and confirmation emailed.":"Subscription reactivated. Confirmation email queued for delivery.");
    }catch(error){setActionError(errorMessage(error));}finally{setActionBusy(false);}
  }
  async function handleConfirmation(sub: NewsletterAdminRow) {
    setActionBusy(true);setActionError("");
    try {
      const updated=await apiRequest<NewsletterAdminRow>(`/api/newsletter/${sub.id}/confirmation`,{method:"POST"});
      setSubscribers(prev=>prev.map(row=>row.id===updated.id?updated:row));setSelected(updated);
      setNotice(updated.confirmationStatus==="sent"?"Subscription confirmation sent.":"Confirmation is queued. Check delivery details or retry later.");
    }catch(error){setActionError(errorMessage(error));}finally{setActionBusy(false);}
  }
  async function handleDelete(sub: NewsletterAdminRow) {
    if(!confirm(`Permanently delete ${sub.email} and their stored newsletter confirmation emails? This cannot be undone.`))return;
    setActionBusy(true);setActionError("");
    try{await apiDelete(`/api/newsletter/${sub.id}`);setSubscribers(prev=>prev.filter(row=>row.id!==sub.id));setSelected(null);setNotice("Newsletter subscriber deleted.");}
    catch(error){setActionError(errorMessage(error));}finally{setActionBusy(false);}
  }
  function exportCSV() {
    const csv=[csvRow(["Email","Name","Phone","Source","Status","Subscribed","Unsubscribed","Confirmation"]),...filtered.map(sub=>csvRow([sub.email,sub.name??"",sub.phone??"",sub.source,sub.status,sub.subscribedAt,sub.unsubscribedAt??"",sub.confirmationStatus]))].join("");
    const url=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"})),a=document.createElement("a");a.href=url;a.download=`ecp-newsletter-${new Date().toISOString().slice(0,10)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  const headers = ["Email", "Name", "Phone", "Source", "Tags", "Status", "Confirmation", "Subscribed"];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Newsletter Subscribers"
        count={activeCount}
        subtitle={`${activeCount} active · ${unsubCount} unsubscribed`}
      >
        <Btn variant="secondary" size="sm" onClick={refresh} disabled={isLoading}>Refresh</Btn>
        <Btn variant="secondary" size="sm" onClick={exportCSV}>Export filtered CSV</Btn>
        <Btn variant="primary" size="sm" className="bg-green-800!" onClick={() => setAdding(true)}>+ Add Subscriber</Btn>
      </AdminPageHeader>

      {!selected&&notice&&<p role="status" className="rounded-xl bg-green-50 p-4 text-sm text-green-950">{notice}</p>}
      <AdminFilters search={search} onSearchChange={setSearch} filters={
        <>
          <FilterSelect aria-label="Subscription status" value={statusFilter} onChange={setStatusFilter}
            options={STATUS_OPTIONS.map(s => ({ value: s, label: s === "all" ? "All statuses" : s.replace(/\b\w/g, c => c.toUpperCase()) }))} />
          <FilterSelect aria-label="Subscription source" value={sourceFilter} onChange={setSourceFilter}
            options={SOURCE_OPTIONS.map(s => ({ value: s, label: s === "all" ? "All sources" : s.replace(/\b\w/g, c => c.toUpperCase()) }))} />
        </>
      } />

      {loadError && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm text-red-800">
            The subscriber list could not be loaded. {loadError}
          </p>
          <button
            type="button"
            onClick={refresh}
            className="rounded-full border border-red-300 px-4 py-1.5 text-sm font-normal text-red-800 transition-colors hover:bg-red-100"
          >
            Try again
          </button>
        </div>
      )}

      <AdminTable
        headers={headers}
        empty={isLoading ? "Loading…" : loadError ? "Could not load subscribers." : "No subscribers found."}
      >
        {filtered.map(sub => (
          <TR key={sub.id} onClick={() => {setSelected(sub);setActionError("");setNotice("");}}>
            <TD className="font-medium text-(--color-neutral-900)">{sub.email}</TD>
            <TD>{sub.name ?? <span className="text-(--color-neutral-800)">—</span>}</TD>
            <TD>{sub.phone ?? <span className="text-(--color-neutral-800)">—</span>}</TD>
            <TD><Badge value={sub.source} /></TD>
            <TD>
              {(sub.tags??[]).length > 0
                ? sub.tags.map(t => <span key={t} className="inline-block text-xs bg-(--color-neutral-100) px-2 py-0.5 rounded mr-1">{t}</span>)
                : <span className="text-(--color-neutral-800) text-xs">—</span>}
            </TD>
            <TD><Badge value={sub.status} /></TD>
            <TD className="text-xs capitalize">{sub.confirmationStatus==="not-recorded"?"Not recorded":sub.confirmationStatus}</TD>
            <TD className="text-(--color-neutral-800) text-xs">{new Date(sub.subscribedAt).toLocaleDateString()}</TD>
          </TR>
        ))}
      </AdminTable>

      {/* Add Modal */}
      {adding && (
        <AdminModal title="Add Subscriber" open={adding} onClose={() => { setAdding(false); setAddError(""); }}>
          <div className="space-y-4">
            <p className="text-sm text-neutral-700">Only add people who have requested newsletter emails. A confirmation with an unsubscribe link will be emailed.</p>
            <FormField label="Email *">
              <FormInput aria-label="Subscriber email" type="email" required maxLength={254} value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))} placeholder="subscriber@example.com" />
            </FormField>
            <FormField label="Name">
              <FormInput aria-label="Subscriber name" maxLength={150} value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name (optional)" />
            </FormField>
            <FormField label="Phone">
              <FormInput aria-label="Subscriber phone" maxLength={40} value={addForm.phone} onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1... or 080..." />
            </FormField>
            <FormField label="Source">
              <FormSelect aria-label="Subscriber source" value={addForm.source} onChange={e => setAddForm(p => ({ ...p, source: e.target.value as NewsletterSource }))}>
                <option value="admin">Admin (manual)</option>
                <option value="import">Import</option>
                <option value="website">Website</option>
                <option value="footer">Footer form</option>
              </FormSelect>
            </FormField>
            {addError && <p className="text-sm text-red-600">{addError}</p>}
            <div className="flex justify-end gap-2 pt-2 border-t border-(--color-neutral-100)">
              <Btn variant="secondary" onClick={() => { setAdding(false); setAddError(""); }}>Cancel</Btn>
              <Btn variant="primary" className="bg-green-800!" onClick={handleAdd} disabled={saving}>{saving ? "Adding…" : "Add Subscriber"}</Btn>
            </div>
          </div>
        </AdminModal>
      )}

      {/* View/Edit Modal */}
      {selected && (
        <AdminModal title={selected.email} open={!!selected} onClose={() => {if(!actionBusy)setSelected(null);}}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-(--color-neutral-800)">Email</span><p className="font-medium mt-0.5">{selected.email}</p></div>
              <div><span className="text-(--color-neutral-800)">Name</span><p className="font-medium mt-0.5">{selected.name ?? "—"}</p></div>
              <div><span className="text-(--color-neutral-800)">Phone</span><p className="font-medium mt-0.5">{selected.phone ?? "—"}</p></div>
              <div><span className="text-(--color-neutral-800)">Source</span><p className="font-medium mt-0.5 capitalize">{selected.source}</p></div>
              <div><span className="text-(--color-neutral-800)">Status</span><div className="mt-0.5"><Badge value={selected.status} /></div></div>
              <div><span className="text-(--color-neutral-800)">Subscribed</span><p className="font-medium mt-0.5">{new Date(selected.subscribedAt).toLocaleDateString()}</p></div>
              {selected.unsubscribedAt && (
                <div className="col-span-2"><span className="text-(--color-neutral-800)">Unsubscribed</span><p className="font-medium mt-0.5">{new Date(selected.unsubscribedAt).toLocaleDateString()}</p></div>
              )}
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm"><p><strong>Confirmation:</strong> {selected.confirmationStatus==="not-recorded"?"Not recorded for this existing subscriber":selected.confirmationStatus}</p>{selected.confirmationSentAt&&<p className="mt-2">Sent {new Date(selected.confirmationSentAt).toLocaleString()}</p>}{selected.confirmationError&&<p className="mt-2 text-red-800">{selected.confirmationError}</p>}</div>
            {actionError&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{actionError}</p>}{notice&&<p role="status" className="rounded-xl bg-green-50 p-4 text-sm text-green-950">{notice}</p>}
            <SectionDivider label="Actions" />
            <div className="flex flex-wrap gap-2">
              <Btn size="sm" variant={selected.status === "active" ? "warning" : "success"} className={selected.status === "active" ? "bg-amber-800!" : "bg-green-800!"} disabled={actionBusy} onClick={() => handleToggleStatus(selected)}>
                {selected.status === "active" ? "Unsubscribe" : "Re-subscribe"}
              </Btn>
              {selected.status==="active"&&!["sent","superseded"].includes(selected.confirmationStatus)&&<Btn size="sm" variant="secondary" disabled={actionBusy} onClick={()=>void handleConfirmation(selected)}>{selected.confirmationStatus==="not-recorded"?"Send confirmation":"Retry confirmation"}</Btn>}
              <Btn size="sm" variant="danger" disabled={actionBusy} onClick={() => handleDelete(selected)}>Delete Permanently</Btn>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
