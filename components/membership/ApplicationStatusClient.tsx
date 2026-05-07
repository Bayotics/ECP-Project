"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMembership } from "@/context";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import type { MembershipApplication, ApplicationStatus, StatusTimelineEvent } from "@/lib/models";
import { formatDate } from "@/utils/formatters";
import { cn } from "@/utils/cn";

/* ─── Status config ───────────────────────────────────── */
const STATUS_STEPS: { status: ApplicationStatus; label: string; description: string }[] = [
  { status: "pending",      label: "Submitted",    description: "Your application has been received." },
  { status: "under-review", label: "Under Review", description: "The ECP team is reviewing your application." },
  { status: "interview",    label: "Interview",    description: "You have been invited for an interview." },
  { status: "approved",     label: "Approved",     description: "Welcome to Eko Club Philadelphia! Your membership is active." },
];

const STATUS_ORDER: ApplicationStatus[] = ["pending", "under-review", "interview", "approved", "rejected"];

function getStepIndex(status: ApplicationStatus): number {
  if (status === "rejected") return -1;
  return STATUS_STEPS.findIndex((s) => s.status === status);
}

const STATUS_BADGE: Record<ApplicationStatus, { label: string; color: "green" | "gold" | "info" | "neutral" | "danger" }> = {
  "pending":      { label: "Submitted",    color: "info" },
  "under-review": { label: "Under Review", color: "gold" },
  "interview":    { label: "Interview",    color: "info" },
  "approved":     { label: "Approved",     color: "green" },
  "rejected":     { label: "Rejected",     color: "danger" },
};

const DOC_LABELS_UPLOAD = [
  "Additional ID Document",
  "Interview Confirmation",
  "Supplementary Letter",
  "Other Document",
];

/* ─── StatusTimeline ──────────────────────────────────── */
function StatusTimeline({ application }: { application: MembershipApplication }) {
  const currentStatus = application.status;
  const isRejected = currentStatus === "rejected";
  const currentIdx = getStepIndex(currentStatus);

  // Build ordered history map for tooltip messages
  const historyMap = new Map<ApplicationStatus, StatusTimelineEvent>(
    (application.statusHistory ?? []).map((e) => [e.status, e])
  );

  return (
    <div className="rounded-xl border border-(--color-neutral-200) bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-(--color-neutral-100) flex items-center justify-between">
        <h3 className="font-bold text-(--color-neutral-800)">Application Status</h3>
        <Badge color={STATUS_BADGE[currentStatus].color}>
          {STATUS_BADGE[currentStatus].label}
        </Badge>
      </div>

      <div className="p-5">
        {/* Timeline steps */}
        {!isRejected ? (
          <div className="space-y-0">
            {STATUS_STEPS.map((step, i) => {
              const isDone = i <= currentIdx;
              const isCurrent = i === currentIdx;
              const event = historyMap.get(step.status);
              return (
                <div key={step.status} className="flex gap-4">
                  {/* left column: dot + connector */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10",
                        isDone
                          ? "bg-(--color-green-600) border-(--color-green-600)"
                          : "bg-white border-(--color-neutral-300)"
                      )}
                    >
                      {i < currentIdx ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="h-4 w-4" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : isCurrent ? (
                        <span className={cn(
                          "h-3 w-3 rounded-full",
                          isDone ? "bg-white" : "bg-(--color-neutral-300)"
                        )} />
                      ) : (
                        <span className="h-3 w-3 rounded-full bg-(--color-neutral-200)" />
                      )}
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={cn(
                        "w-0.5 flex-1 min-h-6 transition-all",
                        i < currentIdx ? "bg-(--color-green-400)" : "bg-(--color-neutral-200)"
                      )} />
                    )}
                  </div>

                  {/* right content */}
                  <div className={cn("pb-6", i === STATUS_STEPS.length - 1 && "pb-0")}>
                    <p className={cn(
                      "text-sm font-semibold leading-none mb-1",
                      isCurrent ? "text-(--color-green-700)" : isDone ? "text-(--color-neutral-800)" : "text-(--color-neutral-400)"
                    )}>
                      {step.label}
                      {isCurrent && (
                        <span className="ml-2 text-xs font-normal text-(--color-green-600) bg-(--color-green-50) rounded-full px-2 py-0.5">
                          Current
                        </span>
                      )}
                    </p>
                    {event ? (
                      <>
                        {event.message && (
                          <p className="text-xs text-(--color-neutral-600) mt-0.5 leading-relaxed">{event.message}</p>
                        )}
                        <p className="text-xs text-(--color-neutral-400) mt-1">{formatDate(event.date)}</p>
                      </>
                    ) : (
                      <p className="text-xs text-(--color-neutral-400)">{step.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Rejected state */
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 rounded-full border-2 border-red-400 bg-red-400 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="h-4 w-4" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-red-700">Application Not Successful</p>
              {application.reviewNotes && (
                <p className="text-xs text-(--color-neutral-600) mt-1 leading-relaxed">{application.reviewNotes}</p>
              )}
              {application.reviewedAt && (
                <p className="text-xs text-(--color-neutral-400) mt-1">{formatDate(application.reviewedAt)}</p>
              )}
              <p className="text-xs text-(--color-neutral-500) mt-2">
                You may reapply after 6 months or contact Eko Club Philadelphia at <strong>info@ekoclubphiladelphia.org</strong> for more information.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── AdminMessages ───────────────────────────────────── */
function AdminMessages({ application }: { application: MembershipApplication }) {
  const messages = application.adminMessages ?? [];

  if (messages.length === 0) {
    return (
      <div className="rounded-xl border border-(--color-neutral-200) bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-(--color-neutral-100)">
          <h3 className="font-bold text-(--color-neutral-800)">Messages from ECP</h3>
        </div>
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-(--color-neutral-400)">No messages yet. We&apos;ll reach out here when needed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-(--color-neutral-200) bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-(--color-neutral-100) flex items-center justify-between">
        <h3 className="font-bold text-(--color-neutral-800)">Messages from ECP</h3>
        <span className="text-xs font-semibold text-white bg-(--color-green-600) rounded-full px-2 py-0.5">
          {messages.length}
        </span>
      </div>
      <div className="divide-y divide-(--color-neutral-100)">
        {messages.map((msg) => (
          <div key={msg.id} className="px-5 py-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-(--color-green-700)">{msg.fromName}</span>
              <span className="text-xs text-(--color-neutral-400)">· {formatDate(msg.sentAt)}</span>
            </div>
            <p className="text-sm text-(--color-neutral-700) leading-relaxed">{msg.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── DocumentUpload ──────────────────────────────────── */
function DocumentUpload({ application, onUpload }: {
  application: MembershipApplication;
  onUpload: (label: string, name: string, size: string) => void;
}) {
  return (
    <div className="rounded-xl border border-(--color-neutral-200) bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-(--color-neutral-100)">
        <h3 className="font-bold text-(--color-neutral-800)">Upload Additional Documents</h3>
        <p className="text-xs text-(--color-neutral-500) mt-0.5">You can upload further documents requested by the ECP team.</p>
      </div>
      <div className="p-5 space-y-3">
        {/* Existing docs */}
        {(application.documents ?? []).length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-(--color-neutral-500) uppercase tracking-wide mb-2">Uploaded Documents</p>
            <ul className="space-y-1.5">
              {(application.documents ?? []).map((d) => (
                <li key={d.id} className="flex items-center gap-2 text-sm">
                  <span className="text-green-600" aria-hidden="true">📄</span>
                  <span className="font-medium text-(--color-neutral-700)">{d.label}</span>
                  <span className="text-(--color-neutral-400) text-xs">— {d.name} {d.simulatedSize && `(${d.simulatedSize})`}</span>
                  <span className="ml-auto text-xs text-(--color-neutral-400)">{formatDate(d.uploadedAt)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upload new */}
        <p className="text-xs font-semibold text-(--color-neutral-500) uppercase tracking-wide mb-2">Add New Document</p>
        {DOC_LABELS_UPLOAD.map((label) => (
          <div key={label}
            className="flex items-center justify-between rounded-lg border border-(--color-neutral-200) bg-(--color-neutral-50) px-4 py-3 gap-4">
            <span className="text-sm text-(--color-neutral-700)">📎 {label}</span>
            <label className="text-xs font-semibold text-(--color-green-700) cursor-pointer bg-(--color-green-50) hover:bg-(--color-green-100) border border-(--color-green-200) rounded-lg px-3 py-1.5 transition-colors shrink-0">
              Upload
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const size = file.size < 1024 * 1024
                    ? `${(file.size / 1024).toFixed(0)} KB`
                    : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
                  onUpload(label, file.name, size);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── ApplicationStatusClient ─────────────────────────── */
export default function ApplicationStatusClient({ initialId }: { initialId?: string }) {
  const { getById, getByEmail, addDocument, refresh, applications } = useMembership();

  const [query, setQuery] = useState(initialId ?? "");
  const [searched, setSearched] = useState(!!initialId);
  const [application, setApplication] = useState<MembershipApplication | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");

  // Lookup on mount if initialId provided
  useEffect(() => {
    if (initialId) doLookup(initialId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId]);

  // Refresh application data when context updates
  useEffect(() => {
    if (application) {
      const updated = getById(application.id);
      if (updated) setApplication(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applications]);

  function doLookup(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setSearched(true);
    setNotFound(false);
    setApplication(null);

    // Try by ID first, then by email
    let found = getById(trimmed) ?? getByEmail(trimmed);
    if (found) {
      setApplication(found);
    } else {
      setNotFound(true);
    }
  }

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    doLookup(query);
  }

  function handleUpload(label: string, name: string, size: string) {
    if (!application) return;
    addDocument(application.id, { name, label, simulatedSize: size });
    setUploadSuccess(`"${name}" uploaded successfully.`);
    setTimeout(() => setUploadSuccess(""), 3000);
  }

  /* ─── Render ──────────────────────────────────────── */
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-(--color-neutral-900) font-display mb-2">
          Application Status
        </h1>
        <p className="text-sm text-(--color-neutral-500)">
          Enter your application ID or registered email address to check your status.
        </p>
      </div>

      {/* Lookup form */}
      <form onSubmit={handleLookup} className="flex gap-2 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Application ID or email address…"
          className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-(--color-neutral-300) focus:outline-none focus:ring-2 focus:ring-(--color-green-300) focus:border-(--color-green-500)"
        />
        <Button type="submit" variant="primary" size="md">
          Check Status
        </Button>
      </form>

      <AnimatePresence mode="wait">
        {/* Not found */}
        {searched && notFound && (
          <motion.div
            key="notfound"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-(--color-neutral-200) p-8 text-center"
          >
            <p className="text-3xl mb-3" aria-hidden="true">🔍</p>
            <p className="font-bold text-(--color-neutral-800) mb-1">No application found</p>
            <p className="text-sm text-(--color-neutral-500)">
              We couldn&apos;t find an application matching <strong>{query}</strong>.
              Check your ID or email and try again.
            </p>
            <div className="mt-4">
              <a href="/membership/apply"
                className="text-sm text-(--color-green-600) font-semibold hover:underline">
                Submit a new application →
              </a>
            </div>
          </motion.div>
        )}

        {/* Found */}
        {application && (
          <motion.div
            key={application.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {/* Summary card */}
            <div className="rounded-xl border border-(--color-neutral-200) bg-white p-5">
              <div className="flex justify-between items-start flex-wrap gap-3">
                <div>
                  <p className="text-xs text-(--color-neutral-500) mb-0.5">Applicant</p>
                  <p className="font-bold text-(--color-neutral-800)">{application.fullName}</p>
                  <p className="text-sm text-(--color-neutral-500)">{application.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-(--color-neutral-500) mb-0.5">Application ID</p>
                  <p className="font-mono text-sm font-bold text-(--color-green-700)">{application.id}</p>
                  <p className="text-xs text-(--color-neutral-400) mt-0.5">Submitted {formatDate(application.appliedAt)}</p>
                </div>
              </div>
            </div>

            {/* Upload success toast */}
            <AnimatePresence>
              {uploadSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-lg bg-(--color-green-50) border border-(--color-green-200) px-4 py-3 text-sm text-(--color-green-700) font-medium"
                >
                  ✅ {uploadSuccess}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Timeline */}
            <StatusTimeline application={application} />

            {/* Admin messages */}
            <AdminMessages application={application} />

            {/* Document upload (only if not rejected) */}
            {application.status !== "rejected" && (
              <DocumentUpload application={application} onUpload={handleUpload} />
            )}

            {/* Approved CTA */}
            {application.status === "approved" && (
              <div className="rounded-xl border border-(--color-green-300) bg-(--color-green-50) p-5 text-center">
                <p className="text-lg font-bold text-(--color-green-800) mb-1">🎉 Congratulations!</p>
                <p className="text-sm text-(--color-green-700) mb-4">
                  Your membership is active. Welcome to the Eko Club Philadelphia family!
                </p>
                <a href="/"
                  className="inline-flex items-center px-5 py-2.5 rounded-lg bg-(--color-green-600) text-white text-sm font-semibold hover:bg-(--color-green-700) transition-colors">
                  Explore Eko Club Philadelphia →
                </a>
              </div>
            )}

            {/* Apply again link */}
            {application.status === "rejected" && (
              <div className="text-center">
                <a href="/membership/apply"
                  className="text-sm text-(--color-neutral-500) hover:text-(--color-green-600)">
                  Apply again
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Initial state */}
      {!searched && (
        <div className="rounded-xl border border-(--color-neutral-200) p-8 text-center bg-(--color-neutral-50)">
          <p className="text-3xl mb-3" aria-hidden="true">📋</p>
          <p className="font-bold text-(--color-neutral-700) mb-1">Track Your Application</p>
          <p className="text-sm text-(--color-neutral-500) max-w-xs mx-auto">
            Enter your application ID (shown after submission) or your registered email to see your current status.
          </p>
          <p className="text-xs text-(--color-neutral-400) mt-4">
            Don&apos;t have an application yet?{" "}
            <a href="/membership/apply" className="text-(--color-green-600) font-semibold hover:underline">
              Apply now
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
