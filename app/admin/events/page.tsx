"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useEvents } from "@/context/EventsContext";
import { useAuth } from "@/context/AuthContext";
import {
  AdminPageHeader, AdminFilters, FilterSelect,
  AdminTable, TR, TD, Badge, AdminModal,
  FormField, FormInput, FormSelect, FormTextarea, Btn, SectionDivider,
} from "@/components/admin/AdminUI";
import type { Event } from "@/lib/models/event";
import type { RSVP } from "@/lib/models/rsvp";
import { apiRequest } from "@/lib/client/api";

const EVENT_TYPES = ["all", "town-hall", "workshop", "volunteer", "meetup", "seminar", "press-conference", "other"];
const EVENT_STATUSES = ["all", "draft", "published", "cancelled", "completed"];

type NotifyType = "announcement" | "reminder" | "cancellation";
type NotifyAudience = "all" | "members" | "newsletter" | "rsvps";
type NotifyChannel = "email" | "sms" | "both";

interface NotifyResult {
  emailSent: number;
  emailFailed: number;
  smsSent: number;
  smsFailed: number;
  recipientCount: number;
}

export default function AdminEventsPage() {
  const { events, add, update, publish, cancel, remove } = useEvents();
  const { currentUser } = useAuth();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Event | null>(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "", type: "meetup", date: "", time: "", location: "", description: "",
    membersOnly: false, registrationRequired: false,
  });
  const [form, setForm] = useState({
    title: "", type: "", date: "", time: "", location: "", venue: "",
    status: "", maxAttendees: "", isFeatured: false, isPublic: false,
    membersOnly: false, registrationRequired: false,
    description: "", organizerName: "",
  });
  const [saving, setSaving] = useState(false);

  // RSVPs for selected event
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [rsvpsLoading, setRsvpsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "rsvps" | "notify">("details");

  // Notification state
  const [notifyType, setNotifyType] = useState<NotifyType>("announcement");
  const [notifyAudience, setNotifyAudience] = useState<NotifyAudience>("all");
  const [notifyChannel, setNotifyChannel] = useState<NotifyChannel>("email");
  const [notifying, setNotifying] = useState(false);
  const [notifyResult, setNotifyResult] = useState<NotifyResult | null>(null);
  const [notifyError, setNotifyError] = useState<string | null>(null);

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

  const loadRsvps = useCallback(async (eventId: string) => {
    setRsvpsLoading(true);
    try {
      const data = await apiRequest<RSVP[]>(`/api/rsvps?eventId=${eventId}`);
      setRsvps(data);
    } catch {
      setRsvps([]);
    } finally {
      setRsvpsLoading(false);
    }
  }, []);

  function openModal(ev: Event) {
    setSelected(ev);
    setActiveTab("details");
    setNotifyResult(null);
    setNotifyError(null);
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
      membersOnly: ev.membersOnly ?? false,
      registrationRequired: ev.registrationRequired ?? false,
      description: ev.description ?? "",
      organizerName: ev.organizerName ?? "",
    });
    loadRsvps(ev.id);
  }

  function closeModal() {
    setSelected(null);
    setRsvps([]);
    setNotifyResult(null);
    setNotifyError(null);
  }

  async function saveChanges() {
    if (!selected) return;
    setSaving(true);
    try {
      await update(selected.id, {
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
        membersOnly: form.membersOnly,
        registrationRequired: form.registrationRequired,
        description: form.description || undefined,
        organizerName: form.organizerName || undefined,
      });
      closeModal();
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!selected) return;
    await publish(selected.id);
    setSelected(prev => prev ? { ...prev, status: "published" } : prev);
    setForm(prev => ({ ...prev, status: "published" }));
  }

  async function handleCancel() {
    if (!selected) return;
    await cancel(selected.id);
    setSelected(prev => prev ? { ...prev, status: "cancelled" } : prev);
    setForm(prev => ({ ...prev, status: "cancelled" }));
  }

  async function handleRemove() {
    if (!selected) return;
    if (!confirm(`Delete "${selected.title}"? This cannot be undone.`)) return;
    await remove(selected.id);
    closeModal();
  }

  async function handleSendNotification() {
    if (!selected) return;
    setNotifying(true);
    setNotifyResult(null);
    setNotifyError(null);
    try {
      const data = await apiRequest<NotifyResult>(`/api/events/${selected.id}/notify`, {
        method: "POST",
        body: JSON.stringify({ type: notifyType, channel: notifyChannel, targetAudience: notifyAudience }),
      });
      setNotifyResult(data);
    } catch (err) {
      setNotifyError(err instanceof Error ? err.message : "Failed to send notifications");
    } finally {
      setNotifying(false);
    }
  }

  function slugify(str: string) { return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").trim(); }

  async function handleCreate() {
    if (!createForm.title.trim() || !createForm.date) return;
    await add({
      title: createForm.title.trim(),
      slug: slugify(createForm.title),
      description: createForm.description || createForm.title,
      date: createForm.date,
      time: createForm.time || undefined,
      location: createForm.location || "TBD",
      type: createForm.type as Event["type"],
      status: "draft",
      organizerId: currentUser?.id ?? "admin",
      organizerName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Admin",
      tags: [],
      isFeatured: false,
      isPublic: !createForm.membersOnly,
      membersOnly: createForm.membersOnly,
      registrationRequired: createForm.registrationRequired,
      isOnline: false,
    });
    setCreating(false);
    setCreateForm({ title: "", type: "meetup", date: "", time: "", location: "", description: "", membersOnly: false, registrationRequired: false });
  }

  const confirmedCount = rsvps.filter(r => r.status === "confirmed").length;
  const headers = ["Title", "Type", "Date", "Audience", "Status", "Featured"];

  const tabClass = (tab: typeof activeTab) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
      activeTab === tab
        ? "border-(--color-gold-500) text-(--color-gold-700) bg-(--color-gold-50)"
        : "border-transparent text-(--color-neutral-500) hover:text-(--color-neutral-800)"
    }`;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Events" count={filtered.length} subtitle="Manage all events. Control access and send notifications.">
        <Btn variant="primary" size="sm" onClick={() => setCreating(true)}>+ New Event</Btn>
      </AdminPageHeader>

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
            <TD>
              {ev.membersOnly
                ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">🔒 Members Only</span>
                : <span className="text-xs text-(--color-neutral-500)">Public</span>}
            </TD>
            <TD><Badge value={ev.status} /></TD>
            <TD>{ev.isFeatured ? <span className="text-(--color-green-600) font-bold text-xs">Yes</span> : <span className="text-(--color-neutral-400) text-xs">No</span>}</TD>
          </TR>
        ))}
      </AdminTable>

      {/* Create Modal */}
      {creating && (
        <AdminModal title="New Event" open={creating} onClose={() => setCreating(false)}>
          <div className="space-y-4">
            <FormField label="Title *">
              <FormInput value={createForm.title} onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))} placeholder="Event title" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Type">
                <FormSelect value={createForm.type} onChange={e => setCreateForm(p => ({ ...p, type: e.target.value }))}>
                  {EVENT_TYPES.filter(t => t !== "all").map(t => <option key={t} value={t}>{t.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                </FormSelect>
              </FormField>
              <FormField label="Date *">
                <FormInput type="date" value={createForm.date} onChange={e => setCreateForm(p => ({ ...p, date: e.target.value }))} />
              </FormField>
              <FormField label="Time">
                <FormInput type="time" value={createForm.time} onChange={e => setCreateForm(p => ({ ...p, time: e.target.value }))} />
              </FormField>
              <FormField label="Location">
                <FormInput value={createForm.location} onChange={e => setCreateForm(p => ({ ...p, location: e.target.value }))} placeholder="Venue / Online" />
              </FormField>
            </div>
            <FormField label="Description">
              <FormTextarea rows={3} value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} />
            </FormField>
            <div className="flex gap-5 text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={createForm.membersOnly} onChange={e => setCreateForm(p => ({ ...p, membersOnly: e.target.checked }))} className="accent-purple-600" />
                <span className="font-medium text-(--color-neutral-700)">🔒 Members Only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={createForm.registrationRequired} onChange={e => setCreateForm(p => ({ ...p, registrationRequired: e.target.checked }))} className="accent-(--color-green-600)" />
                <span className="font-medium text-(--color-neutral-700)">Registration Required</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-(--color-neutral-100)">
              <Btn variant="secondary" onClick={() => setCreating(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={handleCreate} disabled={!createForm.title.trim() || !createForm.date}>Create Event</Btn>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Edit / Notify Modal */}
      {selected && (
        <AdminModal title={selected.title} open={!!selected} onClose={closeModal} size="lg">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-(--color-neutral-200) mb-5 -mt-1">
            <button className={tabClass("details")} onClick={() => setActiveTab("details")}>Details</button>
            <button className={tabClass("rsvps")} onClick={() => setActiveTab("rsvps")}>
              RSVPs {confirmedCount > 0 && <span className="ml-1 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full">{confirmedCount}</span>}
            </button>
            <button className={tabClass("notify")} onClick={() => setActiveTab("notify")}>Send Notification</button>
          </div>

          {/* ── Details Tab ── */}
          {activeTab === "details" && (
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

              <div className="flex flex-wrap gap-5 text-sm">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(p => ({ ...p, isFeatured: e.target.checked }))} className="accent-(--color-green-600)" />
                  <span className="font-medium text-(--color-neutral-700)">Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.isPublic} onChange={e => setForm(p => ({ ...p, isPublic: e.target.checked, membersOnly: e.target.checked ? false : form.membersOnly }))} className="accent-(--color-green-600)" />
                  <span className="font-medium text-(--color-neutral-700)">Publicly Visible</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.membersOnly} onChange={e => setForm(p => ({ ...p, membersOnly: e.target.checked }))} className="accent-purple-600" />
                  <span className="font-medium text-purple-700">🔒 Members Only Registration</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.registrationRequired} onChange={e => setForm(p => ({ ...p, registrationRequired: e.target.checked }))} className="accent-(--color-green-600)" />
                  <span className="font-medium text-(--color-neutral-700)">Registration Required</span>
                </label>
              </div>

              {form.membersOnly && (
                <div className="rounded-lg bg-purple-50 border border-purple-200 px-4 py-3 text-sm text-purple-700">
                  🔒 <strong>Members Only:</strong> Only authenticated members can register for this event. Non-members will see the event but cannot RSVP.
                </div>
              )}

              <FormField label="Description">
                <FormTextarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </FormField>

              <div>
                <SectionDivider label="Quick Actions" />
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.status !== "published" && <Btn size="sm" variant="success" onClick={handlePublish}>Publish</Btn>}
                  {form.status === "published" && <Btn size="sm" variant="warning" onClick={handleCancel}>Cancel Event</Btn>}
                  <Btn size="sm" variant="danger" onClick={handleRemove}>Delete</Btn>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-(--color-neutral-100)">
                <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
                <Btn variant="primary" onClick={saveChanges} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Btn>
              </div>
            </div>
          )}

          {/* ── RSVPs Tab ── */}
          {activeTab === "rsvps" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-(--color-neutral-500)">
                  {rsvpsLoading ? "Loading RSVPs…" : `${confirmedCount} confirmed registrant${confirmedCount !== 1 ? "s" : ""}`}
                </p>
                <Btn size="sm" variant="secondary" onClick={() => loadRsvps(selected.id)}>Refresh</Btn>
              </div>

              {rsvpsLoading ? (
                <div className="py-8 text-center text-(--color-neutral-400) text-sm">Loading…</div>
              ) : rsvps.length === 0 ? (
                <div className="py-8 text-center text-(--color-neutral-400) text-sm">No registrations yet.</div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-(--color-neutral-200)">
                  <table className="w-full text-sm">
                    <thead className="bg-(--color-neutral-50) text-(--color-neutral-500) text-xs">
                      <tr>
                        <th className="text-left px-3 py-2">Name</th>
                        <th className="text-left px-3 py-2">Email</th>
                        <th className="text-left px-3 py-2">Phone</th>
                        <th className="text-left px-3 py-2">Guests</th>
                        <th className="text-left px-3 py-2">Status</th>
                        <th className="text-left px-3 py-2">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-(--color-neutral-100)">
                      {rsvps.map(r => (
                        <tr key={r.id} className="hover:bg-(--color-neutral-50)">
                          <td className="px-3 py-2 font-medium">{r.name}</td>
                          <td className="px-3 py-2 text-(--color-neutral-500)">{r.email}</td>
                          <td className="px-3 py-2 text-(--color-neutral-500)">{r.phone ?? "—"}</td>
                          <td className="px-3 py-2 text-center">{(r.guestCount ?? 0) + 1}</td>
                          <td className="px-3 py-2"><Badge value={r.status} /></td>
                          <td className="px-3 py-2 text-(--color-neutral-400) text-xs">{new Date(r.registeredAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Notify Tab ── */}
          {activeTab === "notify" && (
            <div className="space-y-4">
              <p className="text-sm text-(--color-neutral-500)">
                Send email/SMS notifications about this event to your members and subscribers.
              </p>

              <div className="grid grid-cols-1 gap-3">
                <FormField label="Notification Type">
                  <FormSelect value={notifyType} onChange={e => setNotifyType(e.target.value as NotifyType)}>
                    <option value="announcement">📣 Announcement (new event)</option>
                    <option value="reminder">⏰ Reminder (event is coming up)</option>
                    <option value="cancellation">❌ Cancellation</option>
                  </FormSelect>
                </FormField>

                <FormField label="Target Audience">
                  <FormSelect value={notifyAudience} onChange={e => setNotifyAudience(e.target.value as NotifyAudience)}>
                    <option value="all">Everyone (members + newsletter subscribers + RSVPs)</option>
                    <option value="members">Members only</option>
                    <option value="newsletter">Newsletter subscribers only</option>
                    <option value="rsvps">Registered attendees only</option>
                  </FormSelect>
                </FormField>

                <FormField label="Channel">
                  <FormSelect value={notifyChannel} onChange={e => setNotifyChannel(e.target.value as NotifyChannel)}>
                    <option value="email">📧 Email only</option>
                    <option value="sms">📱 SMS only</option>
                    <option value="both">📧📱 Email + SMS</option>
                  </FormSelect>
                </FormField>
              </div>

              {notifyResult && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm space-y-1">
                  <p className="font-semibold text-green-800">✅ Notification sent!</p>
                  <p className="text-green-700">Recipients: <strong>{notifyResult.recipientCount}</strong></p>
                  {notifyResult.emailSent > 0 && <p className="text-green-700">Emails sent: <strong>{notifyResult.emailSent}</strong></p>}
                  {notifyResult.emailFailed > 0 && <p className="text-red-600">Email failures: <strong>{notifyResult.emailFailed}</strong></p>}
                  {notifyResult.smsSent > 0 && <p className="text-green-700">SMS sent: <strong>{notifyResult.smsSent}</strong></p>}
                  {notifyResult.smsFailed > 0 && <p className="text-red-600">SMS failures: <strong>{notifyResult.smsFailed}</strong></p>}
                </div>
              )}

              {notifyError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {notifyError}
                </div>
              )}

              <div className="bg-(--color-neutral-50) rounded-lg p-3 text-xs text-(--color-neutral-500)">
                <p className="font-medium mb-1">What happens when you send:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li><strong>Announcement</strong> — tells people about this event and links to registration</li>
                  <li><strong>Reminder</strong> — reminds people the event is coming up soon</li>
                  <li><strong>Cancellation</strong> — informs everyone the event has been cancelled</li>
                </ul>
              </div>

              <Btn
                variant="primary"
                onClick={handleSendNotification}
                disabled={notifying}
              >
                {notifying ? "Sending…" : "Send Notification"}
              </Btn>
            </div>
          )}
        </AdminModal>
      )}
    </div>
  );
}
