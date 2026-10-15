"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useIsClient } from "@/components/gsap/useReveal";
import { Btn } from "@/components/admin/AdminUI";
import { MEMBERSHIP_ID_PATTERN, normalizeMembershipId } from "@/lib/models/user";
import { EKO } from "@/lib/content/programs";

/* Approving an application.
 *
 * Approval is the one review step that makes somebody a member, so it asks
 * for two things the other steps do not: confirmation that the committee
 * has actually met the applicant, and the membership number to issue them.
 * Neither can be skipped, because the number is also the password the new
 * member signs in with, and approving without one would leave them with an
 * account they cannot open.
 *
 * The number is suggested, not imposed: the club may have its own series,
 * and the field stays editable. It is checked against the register while
 * the administrator types, so a clash is caught here rather than after
 * they press the button.
 */

/** What the register said about one particular number. */
type Probe = { value: string; state: "checking" | "free" | "taken" | "unknown" };

export default function ApproveApplicationDialog({
  open,
  applicantName,
  applicantEmail,
  busy = false,
  error,
  onCancel,
  onApprove,
}: {
  open: boolean;
  applicantName: string;
  applicantEmail: string;
  busy?: boolean;
  /** A failure from the server, shown without closing the dialog. */
  error?: string;
  onCancel: () => void;
  onApprove: (membershipId: string) => void;
}) {
  const isClient = useIsClient();

  /* The parent mounts this dialog only while it is open, so every approval
     starts on a fresh component. That is what keeps the previous
     applicant's number out of the field, with no resetting to do. */
  const [interviewed, setInterviewed] = useState(false);
  const [membershipId, setMembershipId] = useState("");
  const [suggesting, setSuggesting] = useState(true);
  const [probe, setProbe] = useState<Probe | null>(null);
  const [touched, setTouched] = useState(false);

  /** True until the component goes away, so a late reply is not applied. */
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  /* The suggestion, fetched once on open. */
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/membership-ids/suggest", { cache: "no-store" });
        const json = (await res.json()) as { ok: boolean; data?: { suggested: string } };
        if (!live.current) return;
        if (json.ok && json.data?.suggested) setMembershipId(json.data.suggested);
      } catch {
        /* No suggestion is survivable: the field is typed in by hand. */
      } finally {
        if (live.current) setSuggesting(false);
      }
    })();
  }, []);

  /* Format is decided while rendering; only the register's answer needs
     state, and it is recorded against the value it was asked about so a
     stale reply can never describe what is now in the field. */
  const value = normalizeMembershipId(membershipId);
  const format: "empty" | "malformed" | "ok" = !value
    ? "empty"
    : MEMBERSHIP_ID_PATTERN.test(value)
      ? "ok"
      : "malformed";

  useEffect(() => {
    if (format !== "ok") return;

    /* Debounced, and nothing is reserved by asking. */
    const timer = setTimeout(async () => {
      if (!live.current) return;
      setProbe({ value, state: "checking" });
      try {
        const res = await fetch(`/api/membership-ids/suggest?check=${encodeURIComponent(value)}`, {
          cache: "no-store",
        });
        const json = (await res.json()) as {
          ok: boolean;
          data?: { available: boolean; problem: string | null };
        };
        if (!live.current) return;
        setProbe({ value, state: json.ok && json.data?.available ? "free" : "taken" });
      } catch {
        /* Unreachable server: say nothing rather than something wrong. The
           approval itself checks again, for real. */
        if (live.current) setProbe({ value, state: "unknown" });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [format, value]);

  /* Only an answer about the value currently in the field counts. */
  const availability = probe?.value === value ? probe.state : format === "ok" ? "checking" : "unknown";

  const close = useCallback(() => {
    if (!busy) onCancel();
  }, [busy, onCancel]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    /* Capture, so the application modal underneath does not also close. */
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, close]);

  if (!open || !isClient) return null;

  const idProblem =
    format === "empty"
      ? "A membership number is required."
      : format === "malformed"
        ? "Use 4 to 32 letters, numbers or hyphens."
        : availability === "taken"
          ? "Another member already holds that number."
          : "";

  /* "unknown" is allowed through: the server checks the number again when
     the approval is saved, and a check that could not be made is no reason
     to block an administrator who knows the number is free. */
  const ready = interviewed && !idProblem && availability !== "checking";

  function submit() {
    setTouched(true);
    if (!ready || busy) return;
    onApprove(value);
  }

  return createPortal(
    <div
      data-lenis-prevent
      className="fixed inset-0 z-[10000] flex items-start justify-center overflow-y-auto bg-neutral-950/50 p-4 backdrop-blur-sm [animation:viewer-in_160ms_ease-out] sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="approve-title"
        className="my-8 w-full max-w-md overflow-hidden rounded-[1.25rem] bg-white shadow-2xl"
      >
        <div className="h-1 w-full" style={{ background: EKO.green }} aria-hidden="true" />

        <div className="space-y-4 px-6 py-5">
          <div>
            <h3 id="approve-title" className="text-base font-normal tracking-[-0.01em] text-neutral-950">
              Approve {applicantName}?
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-neutral-700">
              This makes them a member. They are emailed their membership number and can sign in to
              the portal with it straight away.
            </p>
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
              {error}
            </p>
          )}

          {/* The interview. */}
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-neutral-50 px-4 py-3">
            <input
              type="checkbox"
              checked={interviewed}
              onChange={(e) => setInterviewed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-green-600"
            />
            <span className="text-sm leading-6 text-neutral-800">
              I confirm the membership committee has interviewed {applicantName}.
            </span>
          </label>
          {touched && !interviewed && (
            <p className="-mt-2 text-xs leading-5 text-red-700">
              Confirm the interview before approving.
            </p>
          )}

          {/* The number. */}
          <div>
            <label
              htmlFor="membershipId"
              className="mb-1.5 block text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-900"
            >
              Membership number
            </label>
            <input
              id="membershipId"
              value={membershipId}
              onChange={(e) => setMembershipId(e.target.value)}
              onBlur={() => setMembershipId((v) => normalizeMembershipId(v))}
              placeholder={suggesting ? "Finding the next number…" : "ECP-0000"}
              disabled={busy}
              autoComplete="off"
              spellCheck={false}
              className={`w-full rounded-xl border px-4 py-2.5 font-mono text-sm uppercase tracking-[0.04em] text-neutral-900 outline-none transition focus:ring-2 focus:ring-green-200 disabled:bg-neutral-50 ${
                touched && idProblem ? "border-red-400 bg-red-50" : "border-neutral-300 bg-white"
              }`}
            />
            <p className="mt-1.5 text-xs leading-5">
              {touched && idProblem ? (
                <span className="text-red-700">{idProblem}</span>
              ) : availability === "checking" ? (
                <span className="text-neutral-600">Checking the register…</span>
              ) : availability === "free" ? (
                <span className="text-green-700">{value} is free.</span>
              ) : availability === "taken" ? (
                <span className="text-red-700">Another member already holds that number.</span>
              ) : (
                <span className="text-neutral-600">
                  Suggested from the club&apos;s register. Change it if your series differs.
                </span>
              )}
            </p>
          </div>

          <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-900">
            The number is emailed to {applicantEmail} and is their first password. They are asked to
            replace it as soon as they sign in.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-neutral-200 bg-neutral-50 px-6 py-4">
          <Btn size="sm" variant="secondary" onClick={close} disabled={busy}>
            Cancel
          </Btn>
          <Btn size="sm" variant="success" onClick={submit} disabled={busy || !ready}>
            {busy ? "Approving…" : "Approve and issue"}
          </Btn>
        </div>
      </div>
    </div>,
    document.body,
  );
}
