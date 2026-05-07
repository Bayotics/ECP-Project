"use client";

import { useState, useMemo } from "react";
import { useEvents } from "@/context/EventsContext";
import {
  AdminPageHeader, AdminFilters, FilterSelect,
  AdminTable, TR, TD, Badge, AdminModal,
  FormField, FormInput, FormSelect, FormTextarea, Btn, SectionDivider, EmptyState,
} from "@/components/admin/AdminUI";
import type { Event } from "@/lib/models/event";

const EVENT_TYPES = ["all", "town-hall", "workshop", "volunteer", "meetup", "seminar", "press-conference", "other"];
const EVENT_STATUSES = ["all", "draft", "published", "cancelled", "completed"];

export default function AdminEventsPage() {
  const { events, update, publish, cancel, remove } = useEvents();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Event | null>(null);
  const [form, setForm] = useState({
    title: "", type: "", date: "", time: "", location: "", venue: "",
    status: "", maxAttendees: "", isFeatured: false, isPublic: false,
    description: "", organizerName: "",
  });
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    let list = events;
    if (typeFilter !== "all") list = list.filter(e => e.type === typeFilter);
    if (statusFilter !== "all") list = list.filter(e => e.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => e.title.toLowerCase().includes(q) || (e.location ?? "").toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }, [events, search, typeFilter, statusFilter]);

  function openModal(ev: Event) {
    setSelected(ev);
    setForm({
      title: ev.title,
      type: ev.type,
      date: ev.date,
      time: ev.time ?? "",
      location: ev.location ?? "",
      venue: ev.venue ?? "",
      status: ev.status,
      maxAttendees: ev.maxAttendees != null ? String(ev.maxAttendees) : "",
      isFeatured: ev.isFeatured ?? false,
      isPublic: ev.isPublic ?? true,
      description: ev.description ?? "",
      organizerName: ev.organizerName ?? "",
    });
  }

  function closeModal() { setSelected(null); }

  async function saveChanges() {
    if (!selected) return;
    setSaving(true);
    update(selected.id, {
      title: form.title,
      type: form.type as Event["type"],
      date: form.date,
      time: form.time || undefined,
      location: form.location || undefined,
      venue: form.venue || undefined,
      status: form.status as Event["status"],
      maxAttendees: form.maxAttendees ? Number(form.maxAttendees) : undefined,
      isFeatured: form.isFeatured,
      isPublic: form.isPublic,
      description: form.description || undefined,
      organizerName: form.organizerName || undefined,
    });
    setSaving(false);
    closeModal();
  }

  function handlePublish() {
    if (!selected) return;
    publish(selected.id);
    setSelected(prev => prev ? { ...prev, status: "published" } : prev);
    setForm(prev => ({ ...prev, status: "published" }));
  }

  function handleCancel() {
    if (!selected) return;
    cancel(selected.id);
    setSelected(prev => prev ? { ...prev, status: "cancelled" } : prev);
    setForm(prev => ({ ...prev, status: "cancelled" }));
  }

  function handleRemove() {
    if (!selected) return;
    if (!confirm(`Delete "${selected.title}"? This cannot be undone.`)) return;
    remove(selected.id);
    closeModal();
  }

  const headers = ["Title", "Type", "Date", "Location", "Status", "Featured"];

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Events" count={filtered.length} subtitle="Manage all events on the platform." />

      <AdminFilters search={search} onSearchChange={setSearch} filters={
        <>
          <FilterSelect value={typeFilter} onChange={setTypeFilter} options={EVENT_TYPES.map(t => ({ value: t, label: t === "all" ? "All types" : t.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase()) }))} />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={EVENT_STATUSES.map(s => ({ value: s, label: s === "all" ? "All statuses" : s.replace(/\b\w/g, c => c.toUpperCase()) }))} />
        </>
      } />

      <AdminTable headers={headers} empty="No events match your search.">
        {filtered.map(ev => (
          <TR key={ev.id} onClick={() => openModal(ev)}>
            <TD className="font-medium text-(--color-neutral-900)">{ev.title}</TD>
            <TD><Badge value={ev.type} /></TD>
            <TD>{new Date(ev.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</TD>
            <TD>{ev.location ?? "—"}</TD>
            <TD><Badge value={ev.status} /></TD>
            <TD>{ev.isFeatured ? <span className="text-(--color-green-600) font-bold text-xs">Yes</span> : <span className="text-(--color-neutral-400) text-xs">No</span>}</TD>
          </TR>
        ))}
      </AdminTable>

      {selected && (
        <AdminModal title={selected.title} open={!!selected} onClose={closeModal}>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><FormField label="Title">
                <FormInput value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </FormField></div>
              <FormField label="Type">
                <FormSelect value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  {EVENT_TYPES.filter(t => t !== "all").map(t => (
                    <option key={t} value={t}>{t.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
                  ))}
                </FormSelect>
              </FormField>
              <FormField label="Status">
                <FormSelect value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  {EVENT_STATUSES.filter(s => s !== "all").map(s => (
                    <option key={s} value={s}>{s.replace(/\b\w/g, c => c.toUpperCase())}</option>
                  ))}
                </FormSelect>
              </FormField>
              <FormField label="Date">
                <FormInput type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </FormField>
              <FormField label="Time">
                <FormInput type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} />
              </FormField>
              <FormField label="Location">
                <FormInput value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
              </FormField>
              <FormField label="Venue">
                <FormInput value={form.venue} onChange={e => setForm(p => ({ ...p, venue: e.target.value }))} />
              </FormField>
              <FormField label="Organizer">
                <FormInput value={form.organizerName} onChange={e => setForm(p => ({ ...p, organizerName: e.target.value }))} />
              </FormField>
              <FormField label="Max Attendees">
                <FormInput type="number" min="0" value={form.maxAttendees} onChange={e => setForm(p => ({ ...p, maxAttendees: e.target.value }))} />
              </FormField>
            </div>

            <div className="flex gap-5 text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(p => ({ ...p, isFeatured: e.target.checked }))} className="accent-(--color-green-600)" />
                <span className="font-medium text-(--color-neutral-700)">Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.isPublic} onChange={e => setForm(p => ({ ...p, isPublic: e.target.checked }))} className="accent-(--color-green-600)" />
                <span className="font-medium text-(--color-neutral-700)">Public</span>
              </label>
            </div>

            <FormField label="Description">
              <FormTextarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </FormField>

            <div>
              <SectionDivider label="Quick Actions" />
              <div className="flex flex-wrap gap-2 mt-2">
                {form.status !== "published"  && <Btn size="sm" variant="success" onClick={handlePublish}>Publish</Btn>}
                {form.status === "published"  && <Btn size="sm" variant="warning" onClick={handleCancel}>Cancel Event</Btn>}
                <Btn size="sm" variant="danger" onClick={handleRemove}>Delete</Btn>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-(--color-neutral-100)">
              <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
              <Btn variant="primary" onClick={saveChanges} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Btn>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
