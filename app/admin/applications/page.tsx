"use client";

import { errorMessage } from "@/hooks/useAdminAction";
import { useState, useMemo } from "react";
import { useMembership } from "@/context/MembershipContext";
import { useAuth } from "@/context/AuthContext";
import {
  AdminPageHeader, AdminFilters, FilterSelect,
  AdminTable, TR, TD, Badge, AdminModal,
  FormField, FormTextarea, Btn, SectionDivider,
  ConfirmDialog, ModalToasts, useModalToasts,
} from "@/components/admin/AdminUI";
import ApproveApplicationDialog from "@/components/admin/ApproveApplicationDialog";
import InterviewInviteDialog from "@/components/admin/InterviewInviteDialog";
import { formatClubDateTime } from "@/lib/club-time";
import type { MembershipApplication } from "@/lib/models/membership";

const STATUS_OPTIONS = ["all", "pending", "under-review", "interview", "approved", "rejected"];

/* Moving an application on is not an edit that can be quietly undone: the
   applicant is emailed the moment it happens. So each of the four asks
   first, in words that say what the applicant will be told. */
type MoveStatus = "under-review" | "interview" | "approved" | "rejected";

const MOVES: Record<MoveStatus, {
  label: string;
  variant: "secondary" | "warning" | "success" | "danger";
  tone: "primary" | "warning" | "danger";
  confirmTitle: string;
  confirmLabel: string;
  question: (name: string) => string;
  detail?: string;
  done: string;
}> = {
  "under-review": {
    label: "Under review",
    variant: "secondary",
    tone: "primary",
    confirmTitle: "Mark as under review?",
    confirmLabel: "Mark under review",
    question: (name) =>
      `${name} will be emailed to say the membership committee has started reviewing their application.`,
    done: "Marked under review.",
  },
  /* Like Approve, this has a dialog of its own: an invitation has to name
     a date and a time. The fields below are only its button and its
     success line. */
  interview: {
    label: "Invite to interview",
    variant: "warning",
    tone: "warning",
    confirmTitle: "Invite to interview?",
    confirmLabel: "Send the invitation",
    question: (name) =>
      `${name} will be emailed to say the committee would like to meet them.`,
    done: "Invitation sent.",
  },
  /* Approve has a dialog of its own, because it asks for the interview
     confirmation and the membership number. The fields below are only its
     button and its success line. */
  approved: {
    label: "Approve",
    variant: "success",
    tone: "primary",
    confirmTitle: "Approve this application?",
    confirmLabel: "Approve",
    question: (name) => `${name} will be emailed to welcome them into the club.`,
    done: "Application approved.",
  },
  rejected: {
    label: "Decline",
    variant: "danger",
    tone: "danger",
    confirmTitle: "Decline this application?",
    confirmLabel: "Decline",
    question: (name) => `${name} will be emailed to say their application was not successful.`,
    detail: "Make sure the committee has decided. The email cannot be called back.",
    done: "Application declined.",
  },
};

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

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<MembershipApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [msgContent, setMsgContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  /* The move waiting on the administrator's yes, and the one in flight. */
  const [pendingMove, setPendingMove] = useState<MoveStatus | null>(null);
  const [movingTo, setMovingTo] = useState<MoveStatus | null>(null);
  /* Kept beside the approval dialog rather than in a toast, so a rejected
     membership number can be corrected without retyping the rest. */
  const [dialogError, setDialogError] = useState("");
  /* Toasts live inside the dialog, where the work is happening. */
  const { toasts, show, dismiss, clear } = useModalToasts();

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
    clear();
  }
  function closeModal() {
    setSelected(null);
    setPendingMove(null);
    clear();
  }

  async function saveNotes() {
    if (!selected) return;
    setSaving(true);
    try {
      await update(selected.id, { reviewNotes });
      show("success", "Internal notes saved.");
    } catch (caught) {
      show("error", errorMessage(caught), "Could not save the notes");
    } finally {
      setSaving(false);
    }
  }

  async function sendMessage() {
    if (!selected || !msgContent.trim()) return;
    const name = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Admin";
    setSending(true);
    try {
      const updated = await addAdminMessage(selected.id, name, msgContent.trim());
      /* The modal stays open: the message now shows in the thread above,
         which is the confirmation that matters. */
      if (updated) setSelected(updated);
      setMsgContent("");
      show("success", "Your message is on the applicant's status page.", "Message sent");
    } catch (caught) {
      show("error", errorMessage(caught), "Could not send the message");
    } finally {
      setSending(false);
    }
  }

  /** Reports the outcome of a move in the modal's own toast. */
  function reportMove(status: MoveStatus, name: string, emailed: boolean, extra = "") {
    const done = `${MOVES[status].done}${extra}`;
    /* Whether the applicant actually heard is reported, not assumed. An
       administrator who thinks an email went out when it did not will
       wait for a reply that is never coming. */
    if (emailed) show("success", `${done} ${name} has been emailed.`);
    else {
      show(
        "warning",
        `${done} The applicant could not be emailed, so tell them another way.`,
        "Saved, but not emailed",
      );
    }
  }

  /** Runs one of the two plain moves, once confirmed. */
  async function applyMove(status: "under-review" | "rejected") {
    if (!selected) return;

    const actions = { "under-review": setUnderReview, rejected: reject } as const;

    setMovingTo(status);
    try {
      const { application, applicantEmailed } = await actions[status](selected.id);
      setSelected(application);
      setPendingMove(null);
      reportMove(status, application.fullName, applicantEmailed);
    } catch (caught) {
      setPendingMove(null);
      show("error", errorMessage(caught), "Could not update the application");
    } finally {
      setMovingTo(null);
    }
  }

  /** The interview invitation, with the appointment the administrator set. */
  async function applyInterview(appointment: { date: string; time: string; location: string }) {
    if (!selected) return;

    setMovingTo("interview");
    setDialogError("");
    try {
      const { application, applicantEmailed } = await setInterview(selected.id, appointment);
      setSelected(application);
      setPendingMove(null);
      /* The time goes in the toast as well: if the email did not get
         through, this is where the administrator reads back what was
         saved. */
      reportMove(
        "interview",
        application.fullName,
        applicantEmailed,
        application.interviewAt ? ` ${formatClubDateTime(application.interviewAt)}.` : "",
      );
    } catch (caught) {
      /* Kept in the dialog: closing it would discard the date they set. */
      setDialogError(errorMessage(caught));
    } finally {
      setMovingTo(null);
    }
  }

  /** Approval: issues the membership number and opens their account. */
  async function applyApproval(membershipId: string) {
    if (!selected) return;

    setMovingTo("approved");
    setDialogError("");
    try {
      const { application, applicantEmailed, membership } = await approve(selected.id, {
        interviewed: true,
        membershipId,
      });
      setSelected(application);
      setPendingMove(null);
      /* The number and what happened to the account both go in the toast:
         if the email did not reach them, this is the only place the
         administrator can read the number back. */
      const account = membership?.accountCreated
        ? " A member account was created for them."
        : membership?.passwordSet === false
          ? " Their existing portal password was left as it is."
          : "";
      reportMove(
        "approved",
        application.fullName,
        applicantEmailed,
        ` Membership number ${membership?.membershipId ?? membershipId} issued.${account}`,
      );
    } catch (caught) {
      /* Kept inside the approval dialog: closing it would throw away the
         number the administrator typed, and a clash is theirs to fix. */
      setDialogError(errorMessage(caught));
    } finally {
      setMovingTo(null);
    }
  }

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
        <AdminModal
          title={selected.fullName}
          open={!!selected}
          onClose={closeModal}
          notice={<ModalToasts toasts={toasts} onDismiss={dismiss} />}
        >
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

            {/* Once an invitation is out, the appointment is the first
                thing an administrator opening this record wants to see. */}
            {selected.interviewAt && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
                <p className="text-[11px] font-normal uppercase tracking-[0.14em] text-amber-900">
                  Interview booked
                </p>
                <p className="mt-1 text-sm leading-6 text-amber-950">
                  {formatClubDateTime(selected.interviewAt)}
                  {selected.interviewLocation ? ` · ${selected.interviewLocation}` : ""}
                </p>
              </div>
            )}

            <SectionDivider label="Move the application on" />
            <p className="-mt-1 mb-3 text-xs leading-6 text-neutral-900">
              Submitted, then membership committee review, then Exco sign off. The applicant sees each move on their
              status page and is emailed.
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(MOVES) as MoveStatus[]).map((status) => {
                const move = MOVES[status];
                /* Already there: moving again would email the applicant the
                   same news twice. */
                const current = selected.status === status;
                return (
                  <Btn
                    key={status}
                    size="sm"
                    variant={move.variant}
                    disabled={current || movingTo !== null}
                    onClick={() => { setDialogError(""); setPendingMove(status); }}
                  >
                    {movingTo === status ? "Working…" : move.label}
                  </Btn>
                );
              })}
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
              <Btn size="sm" variant="primary" onClick={sendMessage} disabled={sending || !msgContent.trim()}>
                {sending ? "Sending…" : "Send Message"}
              </Btn>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Approval asks for more than a yes, so it has its own dialog. */}
      {selected && pendingMove === "approved" && (
        <ApproveApplicationDialog
          open
          applicantName={selected.fullName}
          applicantEmail={selected.email}
          busy={movingTo === "approved"}
          error={dialogError}
          onApprove={(membershipId) => void applyApproval(membershipId)}
          onCancel={() => { setPendingMove(null); setDialogError(""); }}
        />
      )}

      {/* So does the invitation: it has to name a date and a time. */}
      {selected && pendingMove === "interview" && (
        <InterviewInviteDialog
          open
          applicantName={selected.fullName}
          applicantEmail={selected.email}
          busy={movingTo === "interview"}
          error={dialogError}
          onInvite={(appointment) => void applyInterview(appointment)}
          onCancel={() => { setPendingMove(null); setDialogError(""); }}
        />
      )}

      {selected && pendingMove && pendingMove !== "approved" && pendingMove !== "interview" && (
        <ConfirmDialog
          open
          title={MOVES[pendingMove].confirmTitle}
          message={MOVES[pendingMove].question(selected.fullName)}
          detail={MOVES[pendingMove].detail}
          confirmLabel={MOVES[pendingMove].confirmLabel}
          tone={MOVES[pendingMove].tone}
          busy={movingTo !== null}
          onConfirm={() => void applyMove(pendingMove)}
          onCancel={() => setPendingMove(null)}
        />
      )}
    </div>
  );
}
