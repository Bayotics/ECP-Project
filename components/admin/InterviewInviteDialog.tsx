"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useIsClient } from "@/components/gsap/useReveal";
import { Btn } from "@/components/admin/AdminUI";
import { clubWallTimeToInstant, formatClubDateTime, instantToClubWallTime } from "@/lib/club-time";
import { EKO } from "@/lib/content/programs";

/* Inviting an applicant to meet the committee.
 *
 * The invitation names a time, so the dialog asks for one. What the
 * administrator types is read as Philadelphia time, whatever timezone
 * their own machine is set to, and the preview under the fields shows
 * exactly the sentence the applicant will receive — including the zone,
 * because these invitations are read in Lagos and London as well as here.
 */

export default function InterviewInviteDialog({
  open,
  applicantName,
  applicantEmail,
  initialInterviewAt,
  initialLocation,
  busy = false,
  error,
  onCancel,
  onInvite,
}: {
  open: boolean;
  applicantName: string;
  applicantEmail: string;
  initialInterviewAt?: string;
  initialLocation?: string;
  busy?: boolean;
  error?: string;
  onCancel: () => void;
  onInvite: (appointment: { date: string; time: string; location: string }) => void;
}) {
  const isClient = useIsClient();

  const initial = instantToClubWallTime(initialInterviewAt);
  const rescheduling = Boolean(initialInterviewAt);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [location, setLocation] = useState(initialLocation ?? "");
  const [touched, setTouched] = useState(false);
  /* Whether the chosen time has already gone is decided when the
     administrator presses the button, not while rendering: the dialog may
     sit open for a while, and reading the clock during a render makes the
     output depend on when React happened to run. */
  const [stale, setStale] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        if (!busy) onCancel();
      }
    };
    /* Capture, so the application modal underneath does not close too. */
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, busy, onCancel]);

  if (!open || !isClient) return null;

  const instant = clubWallTimeToInstant(date, time);
  const problem = !date
    ? "Choose the date of the interview."
    : !time
      ? "Choose the time of the interview."
      : !instant
        ? "That date and time could not be read."
        : stale
          ? "That time has already passed. Choose one still to come."
          : "";

  const preview = instant ? formatClubDateTime(instant.toISOString()) : "";
  const ready = !problem && !busy;

  function submit() {
    setTouched(true);
    if (!instant) return;
    if (instant.getTime() <= Date.now()) {
      setStale(true);
      return;
    }
    setStale(false);
    if (!ready) return;
    onInvite({ date, time, location: location.trim() });
  }

  const field =
    "w-full rounded-xl border px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:ring-2 focus:ring-green-200 disabled:bg-neutral-50";
  const fieldTone = (bad: boolean) =>
    `${field} ${bad ? "border-red-400 bg-red-50" : "border-neutral-300 bg-white"}`;

  /* Today, in club time, as the earliest date the picker will offer. */
  const todayInClubTime = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return createPortal(
    <div
      data-lenis-prevent
      className="fixed inset-0 z-[10000] flex items-start justify-center overflow-y-auto bg-neutral-950/50 p-4 backdrop-blur-sm [animation:viewer-in_160ms_ease-out] sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="interview-title"
        className="my-8 w-full max-w-md overflow-hidden rounded-[1.25rem] bg-white shadow-2xl"
      >
        <div className="h-1 w-full" style={{ background: EKO.yellow }} aria-hidden="true" />

        <div className="space-y-4 px-6 py-5">
          <div>
            <h3 id="interview-title" className="text-base font-normal tracking-[-0.01em] text-neutral-950">
              {rescheduling ? `Reschedule the interview for ${applicantName}?` : `Invite ${applicantName} to interview?`}
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-neutral-700">
              They are emailed the date and time you set here, and it appears on their application
              status page.
            </p>
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="interviewDate"
                className="mb-1.5 block text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-900"
              >
                Date
              </label>
              <input
                id="interviewDate"
                type="date"
                value={date}
                min={todayInClubTime}
                /* Editing clears the "already passed" complaint, so it
                   does not linger over a time they have just corrected. */
                onChange={(e) => { setDate(e.target.value); setStale(false); }}
                disabled={busy}
                className={fieldTone(touched && (!date || stale))}
              />
            </div>
            <div>
              <label
                htmlFor="interviewTime"
                className="mb-1.5 block text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-900"
              >
                Time
              </label>
              <input
                id="interviewTime"
                type="time"
                value={time}
                onChange={(e) => { setTime(e.target.value); setStale(false); }}
                disabled={busy}
                className={fieldTone(touched && (!time || stale))}
              />
            </div>
          </div>

          {/* What the applicant will actually read. */}
          <p className="text-xs leading-5">
            {touched && problem ? (
              <span className="text-red-700">{problem}</span>
            ) : preview ? (
              <span className="text-neutral-700">
                They will be told: <span className="text-neutral-950">{preview}</span>
              </span>
            ) : (
              <span className="text-neutral-600">
                Philadelphia time. The email says which zone, so it reads the same anywhere.
              </span>
            )}
          </p>

          <div>
            <label
              htmlFor="interviewLocation"
              className="mb-1.5 block text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-900"
            >
              Where or how <span className="normal-case tracking-normal text-neutral-600">(optional)</span>
            </label>
            <input
              id="interviewLocation"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={busy}
              placeholder="A room, an address, or a video link"
              className={`${field} border-neutral-300 bg-white`}
            />
            <p className="mt-1.5 text-xs leading-5 text-neutral-600">
              Left blank, the email gives the time only and invites them to reply.
            </p>
          </div>

          <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-900">
            {rescheduling ? "The updated appointment" : "The invitation"} goes to {applicantEmail} as soon as you send it.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-neutral-200 bg-neutral-50 px-6 py-4">
          <Btn size="sm" variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Btn>
          <Btn size="sm" variant="warning" onClick={submit} disabled={!ready}>
            {busy ? "Sending…" : rescheduling ? "Reschedule and notify" : "Send the invitation"}
          </Btn>
        </div>
      </div>
    </div>,
    document.body,
  );
}
