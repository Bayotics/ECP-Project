"use client";

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

  const filtered = useMemo(() => {
    let list = applications;
    if (statusFilter !== "all") list = list.filter(a => a.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.fullName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.lga ?? a.city ?? "").toLowerCase().includes(q)
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
    try {
      await update(selected.id, { reviewNotes });
    } finally {
      setSaving(false);
    }
  }

  async function sendMessage() {
    if (!selected || !msgContent.trim()) return;
    const name = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Admin";
    try {
      await addAdminMessage(selected.id, name, msgContent.trim());
      closeModal();
      success("Message sent to applicant successfully.", "Message Sent");
    } catch {
      error("Failed to send message. Please try again.", "Send Failed");
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

    await actions[status](selected.id, reviewedBy);
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
        headers={["Name", "Email", "LGA", "Occupation", "Status", "Applied"]}
        empty="No applications match your search."
      >
        {filtered.map(app => (
          <TR key={app.id} onClick={() => openModal(app)}>
            <TD className="font-medium text-(--color-neutral-900)">{app.fullName}</TD>
            <TD>{app.email}</TD>
            <TD>{app.lga}</TD>
            <TD>{app.occupation}</TD>
            <TD><Badge value={app.status} /></TD>
            <TD>{new Date(app.appliedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</TD>
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
                { label: "LGA",        value: selected.lga },
                { label: "Occupation", value: selected.occupation },
                { label: "Applied",    value: new Date(selected.appliedAt).toLocaleDateString("en-NG") },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-xs font-bold text-(--color-neutral-500) uppercase mb-0.5">{f.label}</p>
                  <p className="text-(--color-neutral-800)">{f.value}</p>
                </div>
              ))}
              <div>
                <p className="text-xs font-bold text-(--color-neutral-500) uppercase mb-0.5">Status</p>
                <Badge value={selected.status} />
              </div>
            </div>

            {selected.reasonForJoining && (
              <>
                <SectionDivider label="Reason for Joining" />
                <p className="text-sm text-(--color-neutral-700)">{selected.reasonForJoining}</p>
              </>
            )}

            {selected.areasOfInterest && selected.areasOfInterest.length > 0 && (
              <>
                <SectionDivider label="Areas of Interest" />
                <div className="flex flex-wrap gap-2 mt-1">
                  {selected.areasOfInterest.map((a: string) => (
                    <span key={a} className="bg-(--color-green-50) text-(--color-green-700) text-xs font-semibold px-2.5 py-1 rounded-full">{a}</span>
                  ))}
                </div>
              </>
            )}

            <SectionDivider label="Update Status" />
            <div className="flex flex-wrap gap-2">
              <Btn size="sm" variant="secondary" onClick={() => void updateStatus("under-review")}>Under Review</Btn>
              <Btn size="sm" variant="warning"   onClick={() => void updateStatus("interview")}>Interview</Btn>
              <Btn size="sm" variant="success"   onClick={() => void updateStatus("approved")}>Approve</Btn>
              <Btn size="sm" variant="danger"    onClick={() => void updateStatus("rejected")}>Reject</Btn>
            </div>

            <SectionDivider label="Review Notes" />
            <FormField label="Notes">
              <FormTextarea rows={3} value={reviewNotes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReviewNotes(e.target.value)} placeholder="Internal notes…" />
            </FormField>
            <div className="flex justify-end">
              <Btn size="sm" variant="primary" onClick={saveNotes} disabled={saving}>{saving ? "Saving…" : "Save Notes"}</Btn>
            </div>

            <SectionDivider label="Messages to Applicant" />
            {selected.adminMessages && selected.adminMessages.length > 0 && (
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {selected.adminMessages.map((m: { id: string; fromName: string; sentAt: string; content: string }) => (
                  <div key={m.id} className="bg-(--color-neutral-50) rounded-lg p-2.5 text-sm">
                    <p className="font-bold text-(--color-neutral-700) text-xs">{m.fromName} · {new Date(m.sentAt).toLocaleDateString("en-NG")}</p>
                    <p className="text-(--color-neutral-700) mt-0.5">{m.content}</p>
                  </div>
                ))}
              </div>
            )}
            <FormField label="New Message">
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
