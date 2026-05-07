"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRSVP } from "@/context";
import Button from "@/components/ui/Button";
import type { Event } from "@/lib/models";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/formatters";

/* ─── Types ───────────────────────────────────────────── */
interface FormValues {
  name: string;
  email: string;
  phone: string;
  guestCount: number;
  notes: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  guestCount?: string;
  notes?: string;
}

type SubmitState = "idle" | "submitting" | "success" | "error";

interface RSVPFormProps {
  event: Event;
  confirmedCount: number;
}

/* ─── Validation ──────────────────────────────────────── */
function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.name.trim()) errors.name = "Your name is required.";
  else if (values.name.trim().length < 2) errors.name = "Name must be at least 2 characters.";

  if (!values.email.trim()) errors.email = "Email address is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = "Please enter a valid email address.";

  if (values.phone && !/^[0-9+\-\s()]{7,15}$/.test(values.phone.trim()))
    errors.phone = "Enter a valid phone number.";

  if (values.guestCount < 0) errors.guestCount = "Guest count cannot be negative.";
  if (values.guestCount > 9) errors.guestCount = "Maximum 9 additional guests.";

  if (values.notes.length > 500) errors.notes = "Notes must be under 500 characters.";

  return errors;
}

/* ─── RSVPForm ────────────────────────────────────────── */
export default function RSVPForm({ event, confirmedCount }: RSVPFormProps) {
  const { add } = useRSVP();

  const [values, setValues] = useState<FormValues>({
    name: "",
    email: "",
    phone: "",
    guestCount: 0,
    notes: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [confirmationId, setConfirmationId] = useState<string>("");
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});

  const now = new Date();
  const eventDate = new Date(event.date);
  const isEventPast = eventDate < now;
  const isDeadlinePassed = event.registrationDeadline
    ? new Date(event.registrationDeadline) < now
    : false;
  const spotsLeft =
    event.maxAttendees != null ? event.maxAttendees - confirmedCount : null;
  const isFull = spotsLeft != null && spotsLeft <= 0;
  const isUnavailable = isEventPast || isDeadlinePassed || isFull || event.status === "cancelled";

  function handleBlur(field: keyof FormValues) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errs = validate(values);
    setErrors(errs);
  }

  function handleChange(
    field: keyof FormValues,
    value: string | number
  ) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const errs = validate({ ...values, [field]: value });
      setErrors((prev) => ({ ...prev, [field]: errs[field] }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const allTouched = Object.fromEntries(
      (Object.keys(values) as (keyof FormValues)[]).map((k) => [k, true])
    ) as Record<keyof FormValues, boolean>;
    setTouched(allTouched);

    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitState("submitting");
    try {
      // Simulate a short async delay (localStorage is sync, but UX polish)
      await new Promise((r) => setTimeout(r, 800));

      const rsvp = add({
        eventId: event.id,
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim() || undefined,
        guestCount: values.guestCount,
        notes: values.notes.trim() || undefined,
      });

      setConfirmationId(rsvp.id);
      setSubmitState("success");
    } catch {
      setSubmitState("error");
    }
  }

  function handleReset() {
    setValues({ name: "", email: "", phone: "", guestCount: 0, notes: "" });
    setErrors({});
    setTouched({});
    setSubmitState("idle");
    setConfirmationId("");
  }

  /* ─── Blocked states ────────────────────────────────── */
  if (isEventPast) {
    return (
      <div className="rounded-xl border border-(--color-neutral-200) p-5 bg-(--color-neutral-50) text-center">
        <p className="text-sm text-(--color-neutral-500) font-medium">This event has already taken place.</p>
      </div>
    );
  }

  if (isDeadlinePassed) {
    return (
      <div className="rounded-xl border border-(--color-neutral-200) p-5 bg-(--color-neutral-50) text-center">
        <p className="text-sm text-red-600 font-medium">Registration deadline has passed.</p>
        <p className="text-xs text-(--color-neutral-400) mt-1">
          Closed on {formatDate(event.registrationDeadline!)}
        </p>
      </div>
    );
  }

  if (isFull) {
    return (
      <div className="rounded-xl border border-orange-200 p-5 bg-orange-50 text-center">
        <p className="text-sm text-orange-700 font-medium">This event is fully booked.</p>
        <p className="text-xs text-orange-500 mt-1">All {event.maxAttendees} spots have been filled.</p>
      </div>
    );
  }

  if (event.status === "cancelled") {
    return (
      <div className="rounded-xl border border-red-200 p-5 bg-red-50 text-center">
        <p className="text-sm text-red-700 font-medium">This event has been cancelled.</p>
      </div>
    );
  }

  /* ─── Success state ──────────────────────────────────── */
  if (submitState === "success") {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-(--color-green-200) bg-(--color-green-50) p-6"
        >
          <div className="flex flex-col items-center text-center gap-3">
            <span className="text-4xl" aria-hidden="true">🎉</span>
            <h3 className="text-lg font-bold text-(--color-green-800)">You&apos;re registered!</h3>
            <p className="text-sm text-(--color-green-700)">
              We&apos;ve confirmed your spot for <strong>{event.title}</strong>.
            </p>
            <div className="w-full bg-white rounded-lg border border-(--color-green-200) p-4 text-left text-sm space-y-1 mt-1">
              <p><span className="text-(--color-neutral-500)">Name:</span> <span className="font-medium">{values.name}</span></p>
              <p><span className="text-(--color-neutral-500)">Email:</span> <span className="font-medium">{values.email}</span></p>
              {values.guestCount > 0 && (
                <p><span className="text-(--color-neutral-500)">Additional guests:</span> <span className="font-medium">{values.guestCount}</span></p>
              )}
              <p className="text-xs text-(--color-neutral-400) pt-1 border-t border-(--color-neutral-100)">
                Confirmation ID: <span className="font-mono">{confirmationId}</span>
              </p>
            </div>
            <p className="text-xs text-(--color-neutral-500)">
              A confirmation has been saved. Please check your email for further updates.
            </p>
            <button
              onClick={handleReset}
              className="text-sm text-(--color-green-600) underline hover:no-underline mt-1"
            >
              Register another person
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  /* ─── Form ───────────────────────────────────────────── */
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {spotsLeft != null && spotsLeft <= 20 && spotsLeft > 0 && (
        <p className="text-xs font-semibold text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
          ⚡ Only {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} remaining!
        </p>
      )}

      {/* Name */}
      <div className="space-y-1">
        <label htmlFor="rsvp-name" className="block text-sm font-semibold text-(--color-neutral-700)">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          id="rsvp-name"
          type="text"
          value={values.name}
          onChange={(e) => handleChange("name", e.target.value)}
          onBlur={() => handleBlur("name")}
          placeholder="e.g. Ade Bayo"
          className={cn(
            "w-full px-3 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors",
            errors.name && touched.name
              ? "border-red-400 focus:ring-red-200 bg-red-50"
              : "border-(--color-neutral-300) focus:ring-(--color-green-200) focus:border-(--color-green-500)"
          )}
        />
        {errors.name && touched.name && (
          <p className="text-xs text-red-600">{errors.name}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-1">
        <label htmlFor="rsvp-email" className="block text-sm font-semibold text-(--color-neutral-700)">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          id="rsvp-email"
          type="email"
          value={values.email}
          onChange={(e) => handleChange("email", e.target.value)}
          onBlur={() => handleBlur("email")}
          placeholder="you@email.com"
          className={cn(
            "w-full px-3 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors",
            errors.email && touched.email
              ? "border-red-400 focus:ring-red-200 bg-red-50"
              : "border-(--color-neutral-300) focus:ring-(--color-green-200) focus:border-(--color-green-500)"
          )}
        />
        {errors.email && touched.email && (
          <p className="text-xs text-red-600">{errors.email}</p>
        )}
      </div>

      {/* Phone (optional) */}
      <div className="space-y-1">
        <label htmlFor="rsvp-phone" className="block text-sm font-semibold text-(--color-neutral-700)">
          Phone Number <span className="text-(--color-neutral-400) font-normal text-xs">(optional)</span>
        </label>
        <input
          id="rsvp-phone"
          type="tel"
          value={values.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          onBlur={() => handleBlur("phone")}
          placeholder="e.g. 08012345678"
          className={cn(
            "w-full px-3 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors",
            errors.phone && touched.phone
              ? "border-red-400 focus:ring-red-200 bg-red-50"
              : "border-(--color-neutral-300) focus:ring-(--color-green-200) focus:border-(--color-green-500)"
          )}
        />
        {errors.phone && touched.phone && (
          <p className="text-xs text-red-600">{errors.phone}</p>
        )}
      </div>

      {/* Additional guests */}
      <div className="space-y-1">
        <label htmlFor="rsvp-guests" className="block text-sm font-semibold text-(--color-neutral-700)">
          Additional Attendees <span className="text-(--color-neutral-400) font-normal text-xs">(besides you)</span>
        </label>
        <select
          id="rsvp-guests"
          value={values.guestCount}
          onChange={(e) => handleChange("guestCount", parseInt(e.target.value))}
          className="w-full px-3 py-2.5 text-sm rounded-lg border border-(--color-neutral-300) focus:outline-none focus:ring-2 focus:ring-(--color-green-200) focus:border-(--color-green-500) bg-white"
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <option key={i} value={i}>
              {i === 0 ? "Just me" : `+${i} guest${i > 1 ? "s" : ""}`}
            </option>
          ))}
        </select>
        {errors.guestCount && (
          <p className="text-xs text-red-600">{errors.guestCount}</p>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label htmlFor="rsvp-notes" className="block text-sm font-semibold text-(--color-neutral-700)">
          Notes <span className="text-(--color-neutral-400) font-normal text-xs">(optional)</span>
        </label>
        <textarea
          id="rsvp-notes"
          rows={3}
          value={values.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          onBlur={() => handleBlur("notes")}
          placeholder="Dietary requirements, accessibility needs, questions…"
          className={cn(
            "w-full px-3 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 resize-none transition-colors",
            errors.notes && touched.notes
              ? "border-red-400 focus:ring-red-200 bg-red-50"
              : "border-(--color-neutral-300) focus:ring-(--color-green-200) focus:border-(--color-green-500)"
          )}
        />
        <div className="flex justify-between">
          {errors.notes && touched.notes ? (
            <p className="text-xs text-red-600">{errors.notes}</p>
          ) : <span />}
          <p className="text-xs text-(--color-neutral-400) text-right">{values.notes.length}/500</p>
        </div>
      </div>

      {/* Error banner */}
      {submitState === "error" && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Something went wrong. Please try again.
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={submitState === "submitting"}
      >
        Confirm Registration
      </Button>

      <p className="text-xs text-(--color-neutral-400) text-center">
        Your data is stored locally and used only for this event.
      </p>
    </form>
  );
}
