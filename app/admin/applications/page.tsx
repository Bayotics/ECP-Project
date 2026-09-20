"use client";

import { useAdminAction, errorMessage } from "@/hooks/useAdminAction";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/useToast";
import { useMembership } from "@/context/MembershipContext";
import { useAuth } from "@/context/AuthContext";
import {
  AdminPageHeader, AdminFilters, FilterSelect,
  AdminTable, TR, TD, Badge, AdminModal,
  FormField, FormTextarea, Btn, SectionDivider,
} from "@/components/admin/AdminUI";
import type { MembershipApplication } from "@/lib/models/membership";

const STATUS_OPTIONS = ["all", "pending", "under-review", "interview", "approved", "rejected"];

/* Applications taken before the address rebuild (§7) only carry `lga`;
   everything since carries country, city, state and ZIP. Both read here. */
function locationOf(app: MembershipApplication) {
  const parts = [app.city, app.stateProvince].filter(Boolean);
  if (parts.length) return parts.join(", ");
  return app.lga ?? "—";
}

function fullAddressOf(app: MembershipApplication) {
  const parts = [app.streetAddress, app.aptUnit, app.city, app.stateProvince, app.zipPostal, app.country].filter(Boolean);
  return parts.length ? parts.join(", ") : app.address ?? "—";
}

export default function AdminApplicationsPage() {
  const { applications, update, setUnderReview, setInterview, approve, reject, addAdminMessage } = useMembership();
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<MembershipApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [msgContent, setMsgContent] = useState("");
  const [saving, setSaving] = useState(false);
  const { run } = useAdminAction();

  const filtered = useMemo(() => {
    let list = applications;
    if (statusFilter !== "all") list = list.filter(a => a.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.fullName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        locationOf(a).toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
  }, [applications, search, statusFilter]);

  function openModal(app: MembershipApplication) {
    setSelected(app);
    setReviewNotes(app.reviewNotes ?? "");
    setMsgContent("");
  }
  function closeModal() { setSelected(null); }

  async function saveNotes() {
    if (!selected) return;
    setSaving(true);
    await run(() => update(selected.id, { reviewNotes }), {
      success: "Notes saved.",
      errorTitle: "Could not save the notes",
    });
    setSaving(false);
  }

  async function sendMessage() {
    if (!selected || !msgContent.trim()) return;
    const name = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Admin";
    try {
      await addAdminMessage(selected.id, name, msgContent.trim());
      closeModal();
      success("Message sent to applicant successfully.", "Message Sent");
    } catch (caught) {
      error(errorMessage(caught), "Could not send the message");
    }
  }

  async function updateStatus(status: "under-review" | "interview" | "approved" | "rejected") {
    if (!selected) return;

    const actions = {
      "under-review": setUnderReview,
      interview: setInterview,
      approved: approve,
      rejected: reject,
    } as const;

    const result = await run(() => actions[status](selected.id, reviewedBy), {
      success: `Application marked ${status.replace("-", " ")}.`,
      errorTitle: "Could not update the application",
    });
    if (!result.ok) return;
    setSelected((prev) => prev ? { ...prev, status } as MembershipApplication : null);
  }

  const reviewedBy = currentUser?.id ?? "admin";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Applications"
        count={filtered.length}
        subtitle="Review and manage membership applications."
      />

      <AdminFilters
        search={search}
        onSearchChange={setSearch}
        filters={
          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS.map(s => ({ value: s, label: s === "all" ? "All statuses" : s.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) }))}
          />
        }
      />

      <AdminTable
        headers={["Name", "Email", "Location", "Occupation", "Status", "Applied"]}
        empty="No applications match your search."
      >
        {filtered.map(app => (
          <TR key={app.id} onClick={() => openModal(app)}>
            <TD className="text-neutral-950">{app.fullName}</TD>
            <TD>{app.email}</TD>
            <TD>{locationOf(app)}</TD>
            <TD>{app.occupation}</TD>
            <TD><Badge value={app.status} /></TD>
            <TD>{new Date(app.appliedAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</TD>
          </TR>
        ))}
      </AdminTable>

      {selected && (
        <AdminModal title={selected.fullName} open={!!selected} onClose={closeModal}>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Email",      value: selected.email },
                { label: "Phone",      value: selected.phone },
                { label: "Occupation", value: selected.occupation },
                { label: "Employer",   value: selected.employer ?? "—" },
                { label: "Address",    value: fullAddressOf(selected) },
                { label: "Applied",    value: new Date(selected.appliedAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) },
              ].map(f => (
                <div key={f.label}>
                  <p className="mb-1 text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-900">{f.label}</p>
                  <p className="leading-6 text-neutral-900">{f.value}</p>
                </div>
              ))}
              <div>
                <p className="mb-1 text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-900">Status</p>
                <Badge value={selected.status} />
              </div>
            </div>

            {selected.reasonForJoining && (
              <>
                <SectionDivider label="Reason for joining" />
                <p className="text-sm leading-7 text-neutral-800">{selected.reasonForJoining}</p>
              </>
            )}

            {selected.areasOfInterest && selected.areasOfInterest.length > 0 && (
              <>
                <SectionDivider label="Areas of interest" />
                <div className="mt-1 flex flex-wrap gap-2">
                  {selected.areasOfInterest.map((a: string) => (
                    <span key={a} className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-normal text-green-800">{a}</span>
                  ))}
                </div>
              </>
            )}

            <SectionDivider label="Move the application on" />
            <p className="-mt-1 mb-3 text-xs leading-6 text-neutral-900">
              Submitted, then membership committee review, then Exco sign off. The applicant sees each move on their
              status page and is emailed.
            </p>
            <div className="flex flex-wrap gap-2">
              <Btn size="sm" variant="secondary" onClick={() => void updateStatus("under-review")}>Under review</Btn>
              <Btn size="sm" variant="warning"   onClick={() => void updateStatus("interview")}>Invite to interview</Btn>
              <Btn size="sm" variant="success"   onClick={() => void updateStatus("approved")}>Approve</Btn>
              <Btn size="sm" variant="danger"    onClick={() => void updateStatus("rejected")}>Decline</Btn>
            </div>

            <SectionDivider label="Review notes" />
            <FormField label="Internal notes">
              <FormTextarea rows={3} value={reviewNotes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReviewNotes(e.target.value)} placeholder="Internal notes…" />
            </FormField>
            <div className="flex justify-end">
              <Btn size="sm" variant="primary" onClick={saveNotes} disabled={saving}>{saving ? "Saving…" : "Save Notes"}</Btn>
            </div>

            <SectionDivider label="Messages to the applicant" />
            {selected.adminMessages && selected.adminMessages.length > 0 && (
              <div className="max-h-40 space-y-2 overflow-y-auto">
                {selected.adminMessages.map((m: { id: string; fromName: string; sentAt: string; content: string }) => (
                  <div key={m.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm">
                    <p className="text-xs text-neutral-900">{m.fromName} · {new Date(m.sentAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</p>
                    <p className="mt-1 leading-6 text-neutral-800">{m.content}</p>
                  </div>
                ))}
              </div>
            )}
            <FormField label="New message">
              <FormTextarea rows={2} value={msgContent} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMsgContent(e.target.value)} placeholder="Type a message…" />
            </FormField>
            <div className="flex justify-end">
              <Btn size="sm" variant="primary" onClick={sendMessage} disabled={!msgContent.trim()}>Send Message</Btn>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
