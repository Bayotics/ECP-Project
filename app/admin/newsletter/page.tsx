"use client";

import { useState, useEffect, useMemo } from "react";
import {
  AdminPageHeader, AdminFilters, FilterSelect,
  AdminTable, TR, TD, Badge, AdminModal,
  FormField, FormInput, FormSelect, Btn, SectionDivider,
} from "@/components/admin/AdminUI";
import type { NewsletterSubscriber, NewsletterSource } from "@/lib/models/newsletter";
import { apiRequest, apiDelete } from "@/lib/client/api";

const SOURCE_OPTIONS = ["all", "website", "footer", "admin", "rsvp", "import"];
const STATUS_OPTIONS = ["all", "active", "unsubscribed"];

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [selected, setSelected] = useState<NewsletterSubscriber | null>(null);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", name: "", phone: "", source: "admin" as NewsletterSource });
  const [addError, setAddError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setIsLoading(true);
    try {
      const data = await apiRequest<NewsletterSubscriber[]>("/api/newsletter");
      setSubscribers(data);
    } catch {
      setSubscribers([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

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
      const sub = await apiRequest<NewsletterSubscriber>("/api/newsletter", {
        method: "POST",
        body: JSON.stringify({ ...addForm, source: addForm.source }),
      });
      setSubscribers(prev => [sub, ...prev]);
      setAdding(false);
      setAddForm({ email: "", name: "", phone: "", source: "admin" });
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add subscriber");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(sub: NewsletterSubscriber) {
    const newStatus = sub.status === "active" ? "unsubscribed" : "active";
    try {
      const updated = await apiRequest<NewsletterSubscriber>(`/api/newsletter/${sub.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setSubscribers(prev => prev.map(s => s.id === updated.id ? updated : s));
      if (selected?.id === updated.id) setSelected(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update");
    }
  }

  async function handleDelete(sub: NewsletterSubscriber) {
    if (!confirm(`Permanently delete ${sub.email}? This cannot be undone.`)) return;
    await apiDelete(`/api/newsletter/${sub.id}`);
    setSubscribers(prev => prev.filter(s => s.id !== sub.id));
    setSelected(null);
  }

  function exportCSV() {
    const active = subscribers.filter(s => s.status === "active");
    const rows = [
      ["Email", "Name", "Phone", "Source", "Subscribed"],
      ...active.map(s => [s.email, s.name ?? "", s.phone ?? "", s.source, s.subscribedAt]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ecp-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const headers = ["Email", "Name", "Phone", "Source", "Tags", "Status", "Subscribed"];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Newsletter Subscribers"
        count={activeCount}
        subtitle={`${activeCount} active · ${unsubCount} unsubscribed`}
      >
        <Btn variant="secondary" size="sm" onClick={exportCSV}>Export CSV</Btn>
        <Btn variant="primary" size="sm" onClick={() => setAdding(true)}>+ Add Subscriber</Btn>
      </AdminPageHeader>

      <AdminFilters search={search} onSearchChange={setSearch} filters={
        <>
          <FilterSelect value={statusFilter} onChange={setStatusFilter}
            options={STATUS_OPTIONS.map(s => ({ value: s, label: s === "all" ? "All statuses" : s.replace(/\b\w/g, c => c.toUpperCase()) }))} />
          <FilterSelect value={sourceFilter} onChange={setSourceFilter}
            options={SOURCE_OPTIONS.map(s => ({ value: s, label: s === "all" ? "All sources" : s.replace(/\b\w/g, c => c.toUpperCase()) }))} />
        </>
      } />

      <AdminTable headers={headers} empty={isLoading ? "Loading…" : "No subscribers found."}>
        {filtered.map(sub => (
          <TR key={sub.id} onClick={() => setSelected(sub)}>
            <TD className="font-medium text-(--color-neutral-900)">{sub.email}</TD>
            <TD>{sub.name ?? <span className="text-(--color-neutral-400)">—</span>}</TD>
            <TD>{sub.phone ?? <span className="text-(--color-neutral-400)">—</span>}</TD>
            <TD><Badge value={sub.source} /></TD>
            <TD>
              {sub.tags.length > 0
                ? sub.tags.map(t => <span key={t} className="inline-block text-xs bg-(--color-neutral-100) px-2 py-0.5 rounded mr-1">{t}</span>)
                : <span className="text-(--color-neutral-400) text-xs">—</span>}
            </TD>
            <TD><Badge value={sub.status} /></TD>
            <TD className="text-(--color-neutral-400) text-xs">{new Date(sub.subscribedAt).toLocaleDateString()}</TD>
          </TR>
        ))}
      </AdminTable>

      {/* Add Modal */}
      {adding && (
        <AdminModal title="Add Subscriber" open={adding} onClose={() => { setAdding(false); setAddError(""); }}>
          <div className="space-y-4">
            <FormField label="Email *">
              <FormInput type="email" value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))} placeholder="subscriber@example.com" />
            </FormField>
            <FormField label="Name">
              <FormInput value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name (optional)" />
            </FormField>
            <FormField label="Phone">
              <FormInput value={addForm.phone} onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1... or 080..." />
            </FormField>
            <FormField label="Source">
              <FormSelect value={addForm.source} onChange={e => setAddForm(p => ({ ...p, source: e.target.value as NewsletterSource }))}>
                <option value="admin">Admin (manual)</option>
                <option value="import">Import</option>
                <option value="website">Website</option>
                <option value="footer">Footer form</option>
              </FormSelect>
            </FormField>
            {addError && <p className="text-sm text-red-600">{addError}</p>}
            <div className="flex justify-end gap-2 pt-2 border-t border-(--color-neutral-100)">
              <Btn variant="secondary" onClick={() => { setAdding(false); setAddError(""); }}>Cancel</Btn>
              <Btn variant="primary" onClick={handleAdd} disabled={saving}>{saving ? "Adding…" : "Add Subscriber"}</Btn>
            </div>
          </div>
        </AdminModal>
      )}

      {/* View/Edit Modal */}
      {selected && (
        <AdminModal title={selected.email} open={!!selected} onClose={() => setSelected(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-(--color-neutral-400)">Email</span><p className="font-medium mt-0.5">{selected.email}</p></div>
              <div><span className="text-(--color-neutral-400)">Name</span><p className="font-medium mt-0.5">{selected.name ?? "—"}</p></div>
              <div><span className="text-(--color-neutral-400)">Phone</span><p className="font-medium mt-0.5">{selected.phone ?? "—"}</p></div>
              <div><span className="text-(--color-neutral-400)">Source</span><p className="font-medium mt-0.5 capitalize">{selected.source}</p></div>
              <div><span className="text-(--color-neutral-400)">Status</span><div className="mt-0.5"><Badge value={selected.status} /></div></div>
              <div><span className="text-(--color-neutral-400)">Subscribed</span><p className="font-medium mt-0.5">{new Date(selected.subscribedAt).toLocaleDateString()}</p></div>
              {selected.unsubscribedAt && (
                <div className="col-span-2"><span className="text-(--color-neutral-400)">Unsubscribed</span><p className="font-medium mt-0.5">{new Date(selected.unsubscribedAt).toLocaleDateString()}</p></div>
              )}
            </div>
            <SectionDivider label="Actions" />
            <div className="flex flex-wrap gap-2">
              <Btn size="sm" variant={selected.status === "active" ? "warning" : "success"} onClick={() => handleToggleStatus(selected)}>
                {selected.status === "active" ? "Unsubscribe" : "Re-subscribe"}
              </Btn>
              <Btn size="sm" variant="danger" onClick={() => handleDelete(selected)}>Delete Permanently</Btn>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
