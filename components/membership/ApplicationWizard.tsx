"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMembership } from "@/context";
import Button from "@/components/ui/Button";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/formatters";

/* ─── Constants ───────────────────────────────────────── */
const DRAFT_KEY = "ecp_membership_draft";

const LAGOS_LGAS = [
  "Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa",
  "Badagry", "Epe", "Eti-Osa", "Ibeju-Lekki", "Ifako-Ijaiye",
  "Ikeja", "Ikorodu", "Kosofe", "Lagos Island", "Lagos Mainland",
  "Mushin", "Ojo", "Oshodi-Isolo", "Shomolu", "Surulere",
];

const EDUCATION_OPTIONS = [
  "WAEC / SSCE", "OND", "HND", "B.Sc / B.A / B.Ed", "PGD",
  "M.Sc / M.A / MBA", "PhD", "Other",
];

const INTEREST_OPTIONS = [
  { value: "civic-education", label: "Civic Education" },
  { value: "digital-governance", label: "Digital Governance" },
  { value: "electoral-law", label: "Electoral Law & Rights" },
  { value: "youth-empowerment", label: "Youth Empowerment" },
  { value: "women-leadership", label: "Women in Leadership" },
  { value: "community-organizing", label: "Community Organizing" },
  { value: "advocacy", label: "Policy Advocacy" },
  { value: "anti-corruption", label: "Anti-Corruption" },
  { value: "healthcare", label: "Healthcare Access" },
  { value: "education", label: "Education Reform" },
  { value: "environment", label: "Environmental Action" },
  { value: "economic-empowerment", label: "Economic Empowerment" },
  { value: "media", label: "Media & Communications" },
  { value: "tech-for-good", label: "Tech for Good" },
];

const DOC_LABELS = [
  "National ID Card / NIN Slip",
  "Passport Photograph",
  "Proof of Address (Utility Bill)",
  "Recommendation Letter (Optional)",
  "CV / Resume (Optional)",
];

const STEPS = ["Applicant Info", "Background", "Documents", "Review & Consent"];

/* ─── Types ───────────────────────────────────────────── */
interface SimulatedDoc {
  label: string;
  name: string;
  size: string;
}

interface WizardDraft {
  step: number;
  // Step 1
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  lga: string;
  ward: string;
  address: string;
  // Step 2
  occupation: string;
  employer: string;
  highestEducation: string;
  reasonForJoining: string;
  areasOfInterest: string[];
  hasVolunteered: boolean;
  referredBy: string;
  // Step 3
  documents: SimulatedDoc[];
}

const EMPTY_DRAFT: WizardDraft = {
  step: 0,
  fullName: "", email: "", phone: "", dateOfBirth: "", gender: "", lga: "", ward: "", address: "",
  occupation: "", employer: "", highestEducation: "", reasonForJoining: "",
  areasOfInterest: [], hasVolunteered: false, referredBy: "",
  documents: [],
};

/* ─── Validation ──────────────────────────────────────── */
type StepErrors = Record<string, string>;

function validateStep1(d: WizardDraft): StepErrors {
  const e: StepErrors = {};
  if (!d.fullName.trim()) e.fullName = "Full name is required.";
  else if (d.fullName.trim().length < 3) e.fullName = "Name must be at least 3 characters.";
  if (!d.email.trim()) e.email = "Email address is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) e.email = "Enter a valid email.";
  if (!d.phone.trim()) e.phone = "Phone number is required.";
  else if (!/^[0-9+\-\s()]{7,15}$/.test(d.phone.trim())) e.phone = "Enter a valid phone number.";
  if (!d.lga) e.lga = "Local Government Area is required.";
  return e;
}

function validateStep2(d: WizardDraft): StepErrors {
  const e: StepErrors = {};
  if (!d.occupation.trim()) e.occupation = "Occupation is required.";
  if (!d.highestEducation) e.highestEducation = "Please select your highest qualification.";
  if (!d.reasonForJoining.trim()) e.reasonForJoining = "Please tell us why you want to join.";
  else if (d.reasonForJoining.trim().length < 30)
    e.reasonForJoining = "Please provide at least 30 characters.";
  if (d.areasOfInterest.length === 0)
    e.areasOfInterest = "Please select at least one area of interest.";
  return e;
}

function validateStep3(_d: WizardDraft): StepErrors {
  return {}; // documents are optional
}

/* ─── Input components ────────────────────────────────── */
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-600 mt-1">{msg}</p>;
}

function Label({ htmlFor, children, optional }: { htmlFor: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-(--color-neutral-700) mb-1">
      {children}
      {optional && <span className="font-normal text-(--color-neutral-400) text-xs ml-1">(optional)</span>}
    </label>
  );
}

function inputCls(hasError: boolean) {
  return cn(
    "w-full px-3 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors",
    hasError
      ? "border-red-400 focus:ring-red-200 bg-red-50"
      : "border-(--color-neutral-300) focus:ring-(--color-green-200) focus:border-(--color-green-500)"
  );
}

/* ─── Progress bar ────────────────────────────────────── */
function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        {STEPS.map((label, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                i < current
                  ? "bg-(--color-green-600) border-(--color-green-600) text-white"
                  : i === current
                  ? "bg-white border-(--color-green-600) text-(--color-green-700)"
                  : "bg-white border-(--color-neutral-300) text-(--color-neutral-400)"
              )}
            >
              {i < current ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span
              className={cn(
                "text-xs font-medium hidden sm:block text-center",
                i === current
                  ? "text-(--color-green-700)"
                  : i < current
                  ? "text-(--color-green-600)"
                  : "text-(--color-neutral-400)"
              )}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
      {/* connector line */}
      <div className="relative h-1.5 rounded-full bg-(--color-neutral-200) mx-4">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-(--color-green-500)"
          animate={{ width: `${(current / (total - 1)) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
      <p className="text-xs text-(--color-neutral-500) text-right mt-2">
        Step {current + 1} of {total}
      </p>
    </div>
  );
}

/* ─── Step 1: Applicant Info ──────────────────────────── */
function Step1({ draft, onChange, errors }: {
  draft: WizardDraft;
  onChange: (key: keyof WizardDraft, val: string | string[] | boolean) => void;
  errors: StepErrors;
}) {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-(--color-neutral-800)">Personal Information</h2>
      <p className="text-sm text-(--color-neutral-500)">Tell us about yourself. Fields marked * are required.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <input id="fullName" type="text" placeholder="e.g. Chidi Okonkwo"
            value={draft.fullName}
            onChange={(e) => onChange("fullName", e.target.value)}
            className={inputCls(!!errors.fullName)} />
          <FieldError msg={errors.fullName} />
        </div>

        <div>
          <Label htmlFor="email">Email Address *</Label>
          <input id="email" type="email" placeholder="you@email.com"
            value={draft.email}
            onChange={(e) => onChange("email", e.target.value)}
            className={inputCls(!!errors.email)} />
          <FieldError msg={errors.email} />
        </div>

        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <input id="phone" type="tel" placeholder="e.g. 08012345678"
            value={draft.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            className={inputCls(!!errors.phone)} />
          <FieldError msg={errors.phone} />
        </div>

        <div>
          <Label htmlFor="dateOfBirth" optional>Date of Birth</Label>
          <input id="dateOfBirth" type="date"
            value={draft.dateOfBirth}
            onChange={(e) => onChange("dateOfBirth", e.target.value)}
            className={inputCls(false)} />
        </div>

        <div>
          <Label htmlFor="gender" optional>Gender</Label>
          <select id="gender" value={draft.gender}
            onChange={(e) => onChange("gender", e.target.value)}
            className={inputCls(false)}>
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>

        <div>
          <Label htmlFor="lga">Local Government Area (LGA) *</Label>
          <select id="lga" value={draft.lga}
            onChange={(e) => onChange("lga", e.target.value)}
            className={inputCls(!!errors.lga)}>
            <option value="">Select LGA…</option>
            {LAGOS_LGAS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <FieldError msg={errors.lga} />
        </div>

        <div>
          <Label htmlFor="ward" optional>Ward</Label>
          <input id="ward" type="text" placeholder="e.g. Alausa Ward"
            value={draft.ward}
            onChange={(e) => onChange("ward", e.target.value)}
            className={inputCls(false)} />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="address" optional>Residential Address</Label>
          <textarea id="address" rows={2} placeholder="House number, street, local area…"
            value={draft.address}
            onChange={(e) => onChange("address", e.target.value)}
            className={cn(inputCls(false), "resize-none")} />
        </div>
      </div>
    </div>
  );
}

/* ─── Step 2: Background ──────────────────────────────── */
function Step2({ draft, onChange, errors }: {
  draft: WizardDraft;
  onChange: (key: keyof WizardDraft, val: string | string[] | boolean) => void;
  errors: StepErrors;
}) {
  function toggleInterest(val: string) {
    const current = draft.areasOfInterest;
    onChange("areasOfInterest",
      current.includes(val) ? current.filter((v) => v !== val) : [...current, val]
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-(--color-neutral-800)">Background & Experience</h2>
      <p className="text-sm text-(--color-neutral-500)">Tell us about your professional background and civic interests.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="occupation">Occupation *</Label>
          <input id="occupation" type="text" placeholder="e.g. Software Engineer"
            value={draft.occupation}
            onChange={(e) => onChange("occupation", e.target.value)}
            className={inputCls(!!errors.occupation)} />
          <FieldError msg={errors.occupation} />
        </div>

        <div>
          <Label htmlFor="employer" optional>Employer / Organisation</Label>
          <input id="employer" type="text" placeholder="e.g. Tech Company Ltd"
            value={draft.employer}
            onChange={(e) => onChange("employer", e.target.value)}
            className={inputCls(false)} />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="highestEducation">Highest Education *</Label>
          <select id="highestEducation" value={draft.highestEducation}
            onChange={(e) => onChange("highestEducation", e.target.value)}
            className={inputCls(!!errors.highestEducation)}>
            <option value="">Select qualification…</option>
            {EDUCATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <FieldError msg={errors.highestEducation} />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="reasonForJoining">Why do you want to join Eko Club Philadelphia? *</Label>
          <textarea id="reasonForJoining" rows={4}
            placeholder="Describe your motivation and how you plan to contribute to civic development in Lagos…"
            value={draft.reasonForJoining}
            onChange={(e) => onChange("reasonForJoining", e.target.value)}
            className={cn(inputCls(!!errors.reasonForJoining), "resize-none")} />
          <div className="flex justify-between">
            <FieldError msg={errors.reasonForJoining} />
            <span className="text-xs text-(--color-neutral-400) ml-auto mt-1">{draft.reasonForJoining.length} chars</span>
          </div>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="areasOfInterest">Areas of Interest *</Label>
          <p className="text-xs text-(--color-neutral-500) mb-2">Select all that apply.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {INTEREST_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleInterest(opt.value)}
                className={cn(
                  "text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                  draft.areasOfInterest.includes(opt.value)
                    ? "bg-(--color-green-600) border-(--color-green-600) text-white"
                    : "bg-white border-(--color-neutral-300) text-(--color-neutral-700) hover:border-(--color-green-400)"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <FieldError msg={errors.areasOfInterest} />
        </div>

        <div className="sm:col-span-2">
          <div className="flex items-center gap-3 p-4 rounded-lg border border-(--color-neutral-200) bg-(--color-neutral-50)">
            <input
              id="hasVolunteered" type="checkbox"
              checked={draft.hasVolunteered}
              onChange={(e) => onChange("hasVolunteered", e.target.checked)}
              className="h-4 w-4 rounded border-(--color-neutral-400) accent-(--color-green-600)"
            />
            <label htmlFor="hasVolunteered" className="text-sm text-(--color-neutral-700) cursor-pointer">
              I have previously volunteered with a civic, NGO, or community organisation.
            </label>
          </div>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="referredBy" optional>Referred by (ECP Member)</Label>
          <input id="referredBy" type="text" placeholder="Full name of the member who referred you"
            value={draft.referredBy}
            onChange={(e) => onChange("referredBy", e.target.value)}
            className={inputCls(false)} />
        </div>
      </div>
    </div>
  );
}

/* ─── Step 3: Documents ───────────────────────────────── */
function Step3({ draft, onChange }: {
  draft: WizardDraft;
  onChange: (key: keyof WizardDraft, val: SimulatedDoc[]) => void;
}) {
  function simulateUpload(label: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const existing = draft.documents.filter((d) => d.label !== label);
    const size = file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(0)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    onChange("documents", [
      ...existing,
      { label, name: file.name, size },
    ]);
    // Reset input value so same file can be re-selected
    e.target.value = "";
  }

  function removeDoc(label: string) {
    onChange("documents", draft.documents.filter((d) => d.label !== label));
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-(--color-neutral-800)">Document Upload</h2>
      <p className="text-sm text-(--color-neutral-500)">
        Upload supporting documents. The first two are recommended; the rest are optional.
        Files are simulated — no data is sent to any server.
      </p>

      <div className="space-y-3">
        {DOC_LABELS.map((label, i) => {
          const uploaded = draft.documents.find((d) => d.label === label);
          const isOptional = i >= 2;
          return (
            <div
              key={label}
              className={cn(
                "rounded-xl border px-4 py-3 flex items-center gap-4 transition-colors",
                uploaded
                  ? "border-(--color-green-300) bg-(--color-green-50)"
                  : "border-(--color-neutral-200) bg-white hover:border-(--color-neutral-300)"
              )}
            >
              <span className="text-xl shrink-0" aria-hidden="true">
                {uploaded ? "✅" : isOptional ? "📄" : "📋"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-(--color-neutral-800)">
                  {label}
                  {isOptional && (
                    <span className="ml-1.5 text-xs text-(--color-neutral-400) font-normal">Optional</span>
                  )}
                </p>
                {uploaded ? (
                  <p className="text-xs text-(--color-green-700) truncate">
                    {uploaded.name} · {uploaded.size}
                  </p>
                ) : (
                  <p className="text-xs text-(--color-neutral-400)">No file selected</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {uploaded ? (
                  <button
                    type="button"
                    onClick={() => removeDoc(label)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                ) : (
                  <label className="text-xs font-semibold text-(--color-green-700) cursor-pointer bg-(--color-green-50) hover:bg-(--color-green-100) border border-(--color-green-200) rounded-lg px-3 py-1.5 transition-colors">
                    Choose File
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      className="sr-only"
                      onChange={(e) => simulateUpload(label, e)}
                    />
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg bg-(--color-neutral-50) border border-(--color-neutral-200) p-4 text-sm text-(--color-neutral-600)">
        <p className="font-semibold mb-1 text-(--color-neutral-700)">📎 Accepted formats</p>
        <p>PDF, JPG, PNG, DOC, DOCX — max 5 MB per file</p>
        <p className="text-xs text-(--color-neutral-400) mt-1">
          Files are stored locally in your browser for demo purposes.
        </p>
      </div>
    </div>
  );
}

/* ─── Step 4: Review & Consent ────────────────────────── */
function Step4({ draft, consentChecked, onConsentChange }: {
  draft: WizardDraft;
  consentChecked: boolean;
  onConsentChange: (v: boolean) => void;
}) {
  const rows: [string, string][] = [
    ["Full Name", draft.fullName],
    ["Email", draft.email],
    ["Phone", draft.phone],
    ["Date of Birth", draft.dateOfBirth ? formatDate(draft.dateOfBirth) : "—"],
    ["Gender", draft.gender || "—"],
    ["LGA", draft.lga],
    ["Ward", draft.ward || "—"],
    ["Address", draft.address || "—"],
    ["Occupation", draft.occupation],
    ["Employer", draft.employer || "—"],
    ["Education", draft.highestEducation],
    ["Volunteered before", draft.hasVolunteered ? "Yes" : "No"],
    ["Referred by", draft.referredBy || "—"],
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-(--color-neutral-800)">Review Your Application</h2>
      <p className="text-sm text-(--color-neutral-500)">Please review all details before submitting. Go back to edit anything.</p>

      {/* Personal / Professional */}
      <div className="rounded-xl border border-(--color-neutral-200) overflow-hidden">
        <div className="bg-(--color-neutral-50) px-4 py-2.5 border-b border-(--color-neutral-200)">
          <p className="text-xs font-semibold text-(--color-neutral-600) uppercase tracking-wide">Application Details</p>
        </div>
        <div className="divide-y divide-(--color-neutral-100)">
          {rows.map(([label, value]) => (
            <div key={label} className="flex px-4 py-2.5 gap-4">
              <span className="text-xs text-(--color-neutral-500) w-36 shrink-0">{label}</span>
              <span className="text-xs font-medium text-(--color-neutral-800) break-words">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reason */}
      <div className="rounded-xl border border-(--color-neutral-200) p-4">
        <p className="text-xs font-semibold text-(--color-neutral-500) uppercase tracking-wide mb-2">Reason for Joining</p>
        <p className="text-sm text-(--color-neutral-700) leading-relaxed whitespace-pre-wrap">{draft.reasonForJoining}</p>
      </div>

      {/* Interests */}
      <div className="rounded-xl border border-(--color-neutral-200) p-4">
        <p className="text-xs font-semibold text-(--color-neutral-500) uppercase tracking-wide mb-2">Areas of Interest</p>
        <div className="flex flex-wrap gap-2">
          {draft.areasOfInterest.map((v) => (
            <span key={v} className="text-xs bg-(--color-green-50) text-(--color-green-700) border border-(--color-green-200) rounded-full px-2.5 py-1 font-medium">
              {INTEREST_OPTIONS.find((o) => o.value === v)?.label ?? v}
            </span>
          ))}
        </div>
      </div>

      {/* Docs */}
      {draft.documents.length > 0 && (
        <div className="rounded-xl border border-(--color-neutral-200) p-4">
          <p className="text-xs font-semibold text-(--color-neutral-500) uppercase tracking-wide mb-2">Documents</p>
          <ul className="space-y-1.5">
            {draft.documents.map((d) => (
              <li key={d.label} className="flex items-center gap-2 text-sm">
                <span className="text-green-600 text-base" aria-hidden="true">✅</span>
                <span className="font-medium">{d.label}</span>
                <span className="text-(--color-neutral-400) text-xs">— {d.name} ({d.size})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Consent */}
      <div className="rounded-xl border border-(--color-green-200) bg-(--color-green-50) p-5 space-y-3">
        <p className="text-sm font-bold text-(--color-green-900)">Declaration & Consent</p>
        <p className="text-sm text-(--color-green-800) leading-relaxed">
          By submitting this application, I confirm that the information provided is true and accurate. I agree to abide by the Constitution, Code of Conduct, and Membership Rules of the Empowerment Community Platform (ECP) Lagos. I understand that providing false information may result in rejection or revocation of membership.
        </p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consentChecked}
            onChange={(e) => onConsentChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded accent-(--color-green-600)"
          />
          <span className="text-sm text-(--color-green-900) font-medium">
            I have read and agree to the above declaration and consent to Eko Club Philadelphia processing my application data.
          </span>
        </label>
      </div>
    </div>
  );
}

/* ─── Success screen ──────────────────────────────────── */
function SuccessScreen({ applicationId, email }: { applicationId: string; email: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8 space-y-5"
    >
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-(--color-green-100) text-4xl mx-auto">
        🎉
      </div>
      <div>
        <h2 className="text-2xl font-bold text-(--color-green-800) mb-2">Application Submitted!</h2>
        <p className="text-(--color-neutral-600) text-sm max-w-md mx-auto">
          Your membership application has been received. You will be notified at <strong>{email}</strong> as your application progresses.
        </p>
      </div>
      <div className="inline-block rounded-xl bg-white border border-(--color-green-200) px-6 py-4 text-left">
        <p className="text-xs text-(--color-neutral-500) mb-1">Application ID</p>
        <p className="text-lg font-mono font-bold text-(--color-green-700)">{applicationId}</p>
        <p className="text-xs text-(--color-neutral-400) mt-1">Save this ID to check your application status.</p>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <a
          href={`/membership/status?id=${applicationId}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-(--color-green-600) text-white text-sm font-semibold hover:bg-(--color-green-700) transition-colors"
        >
          Track Application Status →
        </a>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-(--color-neutral-300) text-(--color-neutral-700) text-sm font-semibold hover:bg-(--color-neutral-50) transition-colors"
        >
          Back to Home
        </a>
      </div>
    </motion.div>
  );
}

/* ─── ApplicationWizard ───────────────────────────────── */
export default function ApplicationWizard() {
  const { add, getByEmail } = useMembership();

  const [draft, setDraft] = useState<WizardDraft>(EMPTY_DRAFT);
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<StepErrors>({});
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  /* Load draft on mount */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed: WizardDraft = JSON.parse(saved);
        // Check it has real data
        if (parsed.email || parsed.fullName) {
          setHasDraft(true);
          setShowDraftBanner(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  /* Auto-save draft on every change */
  const saveDraft = useCallback((d: WizardDraft, step: number) => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, step }));
    } catch { /* ignore */ }
  }, []);

  function loadDraft() {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed: WizardDraft = JSON.parse(saved);
        setDraft(parsed);
        setCurrentStep(parsed.step ?? 0);
      }
    } catch { /* ignore */ }
    setShowDraftBanner(false);
  }

  function discardDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
    setShowDraftBanner(false);
  }

  function onChange(key: keyof WizardDraft, val: string | string[] | boolean | SimulatedDoc[]) {
    setDraft((prev) => {
      const next = { ...prev, [key]: val };
      saveDraft(next, currentStep);
      return next;
    });
    // Clear error for this field if any
    if (typeof key === "string" && errors[key]) {
      setErrors((prev) => { const e = { ...prev }; delete e[key as string]; return e; });
    }
  }

  function validateCurrent(): boolean {
    let errs: StepErrors = {};
    if (currentStep === 0) errs = validateStep1(draft);
    if (currentStep === 1) errs = validateStep2(draft);
    if (currentStep === 2) errs = validateStep3(draft);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (!validateCurrent()) {
      // Scroll to top of form
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const next = currentStep + 1;
    setCurrentStep(next);
    saveDraft(draft, next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    const prev = currentStep - 1;
    setCurrentStep(prev);
    saveDraft(draft, prev);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    if (!consentChecked) {
      setConsentError(true);
      return;
    }
    setConsentError(false);

    // Check if email already has application
    const existing = getByEmail(draft.email.trim());
    if (existing) {
      setSubmitError("An application with this email already exists. Visit the status page to check your application.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      await new Promise((r) => setTimeout(r, 900)); // UX delay

      const app = add({
        fullName: draft.fullName.trim(),
        email: draft.email.trim().toLowerCase(),
        phone: draft.phone.trim(),
        dateOfBirth: draft.dateOfBirth || undefined,
        gender: (draft.gender as "male" | "female" | "other" | "prefer-not-to-say") || undefined,
        lga: draft.lga,
        ward: draft.ward.trim() || undefined,
        address: draft.address.trim() || undefined,
        occupation: draft.occupation.trim(),
        employer: draft.employer.trim() || undefined,
        highestEducation: draft.highestEducation || undefined,
        reasonForJoining: draft.reasonForJoining.trim(),
        areasOfInterest: draft.areasOfInterest,
        hasVolunteered: draft.hasVolunteered,
        referredBy: draft.referredBy.trim() || undefined,
        documents: draft.documents.length > 0
          ? draft.documents.map((d) => ({
              id: "",
              name: d.name,
              label: d.label,
              uploadedAt: new Date().toISOString(),
              simulatedSize: d.size,
            }))
          : undefined,
      });

      // Clear draft
      localStorage.removeItem(DRAFT_KEY);
      setSubmittedId(app.id);
    } catch {
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ─── Render ──────────────────────────────────────── */
  if (submittedId) {
    return <SuccessScreen applicationId={submittedId} email={draft.email} />;
  }

  return (
    <div>
      {/* Draft restore banner */}
      <AnimatePresence>
        {showDraftBanner && hasDraft && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 rounded-xl border border-(--color-gold-300) bg-amber-50 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
          >
            <span className="text-xl" aria-hidden="true">💾</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Saved draft found</p>
              <p className="text-xs text-amber-700">You have an unfinished application. Would you like to continue where you left off?</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={loadDraft}
                className="px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700">
                Resume
              </button>
              <button onClick={discardDraft}
                className="px-3 py-1.5 text-xs font-semibold border border-amber-400 text-amber-700 rounded-lg hover:bg-amber-100">
                Start fresh
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProgressBar current={currentStep} total={STEPS.length} />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {currentStep === 0 && <Step1 draft={draft} onChange={onChange} errors={errors} />}
          {currentStep === 1 && <Step2 draft={draft} onChange={onChange} errors={errors} />}
          {currentStep === 2 && <Step3 draft={draft} onChange={(k, v) => onChange(k, v as SimulatedDoc[])} />}
          {currentStep === 3 && (
            <>
              <Step4
                draft={draft}
                consentChecked={consentChecked}
                onConsentChange={(v) => { setConsentChecked(v); if (v) setConsentError(false); }}
              />
              {consentError && (
                <p className="text-sm text-red-600 mt-3 font-medium">
                  ⚠️ You must agree to the declaration before submitting.
                </p>
              )}
              {submitError && (
                <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-(--color-neutral-100)">
        <Button
          variant="outline"
          size="md"
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          ← Back
        </Button>

        <div className="flex items-center gap-3">
          {/* Auto-save indicator */}
          <span className="text-xs text-(--color-neutral-400) hidden sm:block">
            💾 Draft saved automatically
          </span>
          {currentStep < STEPS.length - 1 ? (
            <Button variant="primary" size="md" onClick={handleNext}>
              Next Step →
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              onClick={handleSubmit}
            >
              Submit Application
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
