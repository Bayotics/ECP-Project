"use client";

/* The club's approved membership application.
 *
 * Every question below is taken from "ECP Membership Application Aug 12",
 * the form the club signed off, in its order and with its wording. Where
 * that form spells something its own way, such as the Badagary division or
 * the Social Committe, the club's spelling is kept rather than corrected,
 * because the printed form is what applicants and the membership committee
 * both work from.
 *
 * The twenty questions are grouped into five steps plus a review, which is
 * presentation only; nothing is added to or dropped from the form. On
 * submission the applicant goes straight to the $100 non-refundable
 * application fee, which the form requires.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SocialProfileFields from "@/components/people/SocialProfileFields";
import { parseSocialProfiles, type SocialProfiles } from "@/lib/social-profiles";
import Recaptcha from "@/components/membership/Recaptcha";
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { useRouter } from "next/navigation";
import {
  APPLICATION_COMMITTEES,
  APPLICATION_FEE_USD,
  IBILE_FORM_DIVISIONS,
  LAGOS_ROOT_OPTIONS,
  MEMBERSHIP_CONTACT_EMAIL,
} from "@/lib/models/membership";
import { useToast } from "@/hooks/useToast";

const DRAFT_KEY = "ecp-membership-draft-v2";

const STEPS = ["Applicant", "Address", "Lagos roots", "About you", "Referrals", "Review"] as const;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MEMBERSHIP_EMAIL = MEMBERSHIP_CONTACT_EMAIL;

/** Where the Constitution is read. */
const CONSTITUTION_URL = "/membership/constitution";

/* What the club requires of an applicant, said before they start rather
   than discovered one step at a time. The fee in particular is
   non-refundable and only appears at the end, which is no way to meet it
   for the first time. */
const REQUIREMENTS: { title: string; detail: React.ReactNode }[] = [
  {
    title: `A $${APPLICATION_FEE_USD} application fee`,
    detail: (
      <>
        Non-refundable, paid by Zelle or PayPal on the page straight after this form. Your
        application is not complete until it is settled.
      </>
    ),
  },
  {
    title: "Two referrals",
    detail: (
      <>
        The name and phone number of someone who can speak for you. A second referral is welcome
        but not required.
      </>
    ),
  },
  {
    title: "Two written references",
    detail: (
      <>
        Sent separately by email to{" "}
        <a href={`mailto:${MEMBERSHIP_CONTACT_EMAIL}`} className="text-green-700 underline">
          {MEMBERSHIP_CONTACT_EMAIL}
        </a>
        . They are not uploaded here.
      </>
    ),
  },
  {
    title: "Your roots in Lagos",
    detail: (
      <>
        Which of the five IBILE divisions you are from, whose line your root runs through, and your
        street or agbole.
      </>
    ),
  },
  {
    title: "Agreement to the Constitution",
    detail: (
      <>
        You accept the club&apos;s Constitution, House Rules and By-laws before submitting.{" "}
        <a
          href={CONSTITUTION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-700 underline"
        >
          Read it first
        </a>{" "}
        if you would like to.
      </>
    ),
  },
];

type Draft = SocialProfiles & {
  fullName: string;
  spouseName: string;
  email: string;
  streetAddress: string;
  city: string;
  stateProvince: string;
  zipPostal: string;
  phone: string;
  phoneCountry: CountryCode;
  birthMonth: string;
  birthDay: string;
  occupation: string;
  ibileDivisions: string[];
  ibileOther: string;
  lagosRoot: string;
  lagosRootOther: string;
  streetAgbole: string;
  reasonForJoining: string;
  otherOrganizations: string;
  committeeInterests: string[];
  committeeOther: string;
  referral1Name: string;
  referral1Phone: string;
  referral2Name: string;
  referral2Phone: string;
  agreedToConstitution: boolean;
};

const BLANK: Draft = {
  fullName: "", spouseName: "", email: "",
  streetAddress: "", city: "", stateProvince: "", zipPostal: "",
  phone: "", phoneCountry: "US", birthMonth: "", birthDay: "", occupation: "",
  ibileDivisions: [], ibileOther: "", lagosRoot: "", lagosRootOther: "",
  streetAgbole: "", reasonForJoining: "", otherOrganizations: "",
  committeeInterests: [], committeeOther: "",
  referral1Name: "", referral1Phone: "", referral2Name: "", referral2Phone: "",
  agreedToConstitution: false,
  linkedinUrl: "", instagramUrl: "", facebookUrl: "",
};

/* ─── Small field primitives ──────────────────────────────────────────── */

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200";

function Field({
  label, required, hint, error, children, id,
}: {
  label: string; required?: boolean; hint?: string; error?: string;
  children: React.ReactNode; id: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-normal text-neutral-900">
        {label} {required && <span className="text-red-600" aria-hidden="true">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs leading-5 text-neutral-700">{hint}</p>}
      {error && <p className="mt-1 text-xs leading-5 text-red-700">{error}</p>}
    </div>
  );
}

function CheckGroup({
  legend, hint, options, selected, onToggle, otherValue, onOtherChange, error,
}: {
  legend: string; hint?: string; options: readonly string[];
  selected: string[]; onToggle: (v: string) => void;
  otherValue: string; onOtherChange: (v: string) => void; error?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-normal text-neutral-900">{legend}</legend>
      {hint && <p className="mb-2 text-xs leading-5 text-neutral-700">{hint}</p>}
      <div className="space-y-2">
        {options.map((opt) => (
          <label key={opt} className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-neutral-900">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => onToggle(opt)}
              className="h-4 w-4 accent-green-600"
            />
            {opt}
          </label>
        ))}
        <div className="flex items-center gap-2.5">
          <label className="flex shrink-0 cursor-pointer select-none items-center gap-2.5 text-sm text-neutral-900">
            <input
              type="checkbox"
              checked={selected.includes("Other")}
              onChange={() => onToggle("Other")}
              className="h-4 w-4 accent-green-600"
            />
            Other:
          </label>
          <input
            value={otherValue}
            onChange={(e) => onOtherChange(e.target.value)}
            disabled={!selected.includes("Other")}
            className={`${inputClass} py-1.5 disabled:bg-neutral-50 disabled:text-neutral-500`}
            aria-label={`${legend}: other`}
          />
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs leading-5 text-red-700">{error}</p>}
    </fieldset>
  );
}

/* ─── Wizard ──────────────────────────────────────────────────────────── */

export default function ApplicationWizard() {
  const router = useRouter();
  const { error: errorToast } = useToast();
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaAttempt, setCaptchaAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [restored, setRestored] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  /* Restore any half-finished application. */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Draft & { step?: number };
        setDraft({ ...BLANK, ...parsed });
        setStep(Math.min(parsed.step ?? 0, STEPS.length - 1));
      }
    } catch {
      /* A corrupt draft is not worth failing over. */
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, step }));
    } catch {
      /* Private browsing, a full quota: the form still works. */
    }
  }, [draft, step, restored]);

  const set = useCallback(
    <K extends keyof Draft>(key: K) =>
      (value: Draft[K]) => {
        setDraft((d) => ({ ...d, [key]: value }));
        setErrors((e) => (e[key as string] ? { ...e, [key as string]: "" } : e));
      },
    [],
  );

  const toggleIn = useCallback(
    (key: "ibileDivisions" | "committeeInterests") => (value: string) => {
      setDraft((d) => {
        const list = d[key];
        return { ...d, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] };
      });
      setErrors((e) => (e[key] ? { ...e, [key]: "" } : e));
    },
    [],
  );

  /** Validates one step and returns whether it passed. */
  const validateStep = useCallback(
    (index: number): boolean => {
      const next: Record<string, string> = {};
      const need = (k: keyof Draft, msg: string) => {
        if (!String(draft[k] ?? "").trim()) next[k as string] = msg;
      };

      if (index === 0) {
        need("fullName", "Your full name is required.");
        need("email", "An email address is required.");
        if (draft.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
          next.email = "That does not look like an email address.";
        }
        const social = parseSocialProfiles(draft);
        if (!social.ok) next[social.field] = social.error;
        need("phone", "A cell phone number is required.");
        if (draft.phone.trim() && !parsePhoneNumberFromString(draft.phone, draft.phoneCountry)?.isValid()) {
          next.phone = "Enter a valid cell phone number for the selected country.";
        }
        if (!draft.birthMonth || !draft.birthDay.trim()) {
          next.birthMonth = "Your month and day of birth are required.";
        } else {
          const day = Number(draft.birthDay);
          if (!Number.isInteger(day) || day < 1 || day > 31) next.birthMonth = "Enter a day between 1 and 31.";
        }
      }
      if (index === 1) {
        need("city", "City is required.");
        need("stateProvince", "State is required.");
        need("zipPostal", "Zip code is required.");
        if (draft.zipPostal.trim() && !/^\d{5}(-\d{4})?$/.test(draft.zipPostal.trim())) {
          next.zipPostal = "Enter a valid US zip code, e.g. 19104.";
        }
      }
      if (index === 2) {
        need("occupation", "Your profession is required.");
        if (draft.ibileDivisions.length === 0) {
          next.ibileDivisions = "Choose at least one division.";
        } else if (draft.ibileDivisions.includes("Other") && !draft.ibileOther.trim()) {
          next.ibileDivisions = "Name the other division.";
        }
        if (!draft.lagosRoot) {
          next.lagosRoot = "Choose where your root in Lagos State comes from.";
        } else if (draft.lagosRoot === "Other" && !draft.lagosRootOther.trim()) {
          next.lagosRoot = "Say what your other root is.";
        }
      }
      if (index === 3) {
        need("reasonForJoining", "Please tell the club why you would like to join.");
        need("otherOrganizations", "Please answer, even if the answer is none.");
      }
      if (index === 4) {
        need("referral1Name", "A first referral is required.");
        need("referral1Phone", "The first referral's phone number is required.");
      }
      if (index === 5 && !draft.agreedToConstitution) {
        next.agreedToConstitution = "Please accept the declaration to submit.";
      }

      setErrors(next);
      return Object.keys(next).length === 0;
    },
    [draft],
  );

  const goTo = useCallback((index: number) => {
    setCaptchaToken("");
    setStep(index);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  function next() {
    if (!validateStep(step)) return;
    goTo(Math.min(step + 1, STEPS.length - 1));
  }

  async function handleSubmit() {
    /* Re-check every step, not just this one: a draft restored from an
       earlier session could have been left incomplete further back. */
    for (let i = 0; i < STEPS.length; i += 1) {
      if (!validateStep(i)) {
        goTo(i);
        return;
      }
    }

    const social = parseSocialProfiles(draft);
    if (!social.ok) { setErrors({ [social.field]: social.error }); goTo(0); return; }
    if (!captchaToken) {
      setErrors({ recaptcha: "Please complete the reCAPTCHA verification." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/membership-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...social.values,
          fullName: draft.fullName.trim(),
          spouseName: draft.spouseName.trim() || undefined,
          email: draft.email.trim().toLowerCase(),
          phone: parsePhoneNumberFromString(draft.phone, draft.phoneCountry)!.number,
          recaptchaToken: captchaToken,
          birthMonthDay: `${draft.birthMonth} ${draft.birthDay}`.trim(),
          country: "US",
          streetAddress: draft.streetAddress.trim() || undefined,
          city: draft.city.trim(),
          stateProvince: draft.stateProvince.trim(),
          zipPostal: draft.zipPostal.trim(),
          occupation: draft.occupation.trim(),
          ibileDivisions: draft.ibileDivisions,
          ibileOther: draft.ibileOther.trim() || undefined,
          lagosRoot: draft.lagosRoot,
          lagosRootOther: draft.lagosRootOther.trim() || undefined,
          streetAgbole: draft.streetAgbole.trim() || undefined,
          reasonForJoining: draft.reasonForJoining.trim(),
          otherOrganizations: draft.otherOrganizations.trim(),
          committeeInterests: draft.committeeInterests,
          committeeOther: draft.committeeOther.trim() || undefined,
          referral1Name: draft.referral1Name.trim(),
          referral1Phone: draft.referral1Phone.trim(),
          referral2Name: draft.referral2Name.trim() || undefined,
          referral2Phone: draft.referral2Phone.trim() || undefined,
          agreedToConstitution: true,
          /* Kept for the existing admin screens, which read these. */
          areasOfInterest: draft.committeeInterests,
          hasVolunteered: false,
          referredBy: draft.referral1Name.trim() || undefined,
          feeStatus: "unpaid",
        }),
      });
      const json = (await res.json()) as { ok: boolean; data?: { id: string }; error?: string };
      if (!json.ok || !json.data) throw new Error(json.error ?? "Could not submit your application.");

      localStorage.removeItem(DRAFT_KEY);
      /* Straight to the fee, which the form requires before review. */
      router.push(`/membership/payment?application=${encodeURIComponent(json.data.id)}`);
    } catch (caught) {
      setCaptchaToken("");
      setCaptchaAttempt((attempt) => attempt + 1);
      errorToast(
        caught instanceof Error ? caught.message : "Could not submit your application.",
        "Submission failed",
      );
      setSubmitting(false);
    }
  }

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  return (
    <div ref={topRef}>
      {step === 0 && (
        <>
          {/* What the club asks of an applicant, up front. */}
          <section className="mb-6 rounded-2xl border border-neutral-200 p-5">
            <h2 className="text-base font-medium tracking-[-0.01em] text-neutral-950">
              What membership asks of you
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-neutral-700">
              Six steps, about ten minutes. Have these ready before you start.
            </p>

            <ul className="mt-4 space-y-3">
              {REQUIREMENTS.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-1 h-3.5 w-3.5 shrink-0 text-green-600"
                    aria-hidden="true"
                  >
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  <p className="text-sm leading-6 text-neutral-800">
                    <span className="text-neutral-950">{item.title}.</span> {item.detail}
                  </p>
                </li>
              ))}
            </ul>

            <p className="mt-4 border-t border-neutral-200 pt-4 text-sm leading-6 text-neutral-700">
              Fill the application out in its entirety. Any omission or misinformation may result in
              automatic dismissal.
            </p>
          </section>

          {/* Declaration, verbatim from the head of the club's form. */}
          <p className="mb-6 rounded-xl bg-neutral-50 px-4 py-3 text-sm leading-6 text-neutral-800">
            I hereby apply for membership in Eko Club Philadelphia. If I should be accepted, I agree
            to comply with and observe the Constitution, House Rules and Regulations; and further
            agree that my membership will be subject to all By-laws, House Rules and Regulations now
            in force and those which may be legally adopted and for infraction thereof the Executive
            may terminate such membership.
          </p>
        </>
      )}

      {/* Progress */}
      <div className="mb-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-normal text-neutral-900">
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </p>
          <p className="text-xs text-neutral-700">Your progress is saved on this device.</p>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-green-600 transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-5">
        {/* ── 1. Applicant ───────────────────────────────────────────── */}
        {step === 0 && (
          <>
            <Field id="fullName" label="Full name of applicant" required error={errors.fullName}>
              <input id="fullName" value={draft.fullName} onChange={(e) => set("fullName")(e.target.value)} className={inputClass} autoComplete="name" />
            </Field>
            <Field id="spouseName" label="Name of spouse" hint="Only if applying jointly.">
              <input id="spouseName" value={draft.spouseName} onChange={(e) => set("spouseName")(e.target.value)} className={inputClass} />
            </Field>
            <Field id="email" label="Email" required error={errors.email}>
              <input id="email" type="email" value={draft.email} onChange={(e) => set("email")(e.target.value)} className={inputClass} autoComplete="email" />
            </Field>
            <Field id="phone" label="Cell phone" required error={errors.phone}>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select aria-label="Cell phone country code" value={draft.phoneCountry} onChange={(e) => { set("phoneCountry")(e.target.value as CountryCode); }} className={`${inputClass} sm:w-52`}>
                  {getCountries().map((country) => (
                    <option key={country} value={country}>{new Intl.DisplayNames(["en"], { type: "region" }).of(country)} (+{getCountryCallingCode(country)})</option>
                  ))}
                </select>
                <input id="phone" type="tel" value={draft.phone} onChange={(e) => set("phone")(e.target.value)} className={inputClass} autoComplete="tel-national" placeholder={`+${getCountryCallingCode(draft.phoneCountry)} phone number`} />
              </div>
            </Field>
            <Field id="birthMonth" label="Month and day of birth" required hint="For example: January 7." error={errors.birthMonth}>
              <div className="flex gap-3">
                <select id="birthMonth" value={draft.birthMonth} onChange={(e) => set("birthMonth")(e.target.value)} className={inputClass}>
                  <option value="">Month…</option>
                  {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <input
                  aria-label="Day of birth"
                  inputMode="numeric"
                  placeholder="Day"
                  value={draft.birthDay}
                  onChange={(e) => set("birthDay")(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  className={`${inputClass} w-28`}
                />
              </div>
            </Field>
            <SocialProfileFields values={draft} onChange={(key, value) => set(key)(value)} errors={errors} />
          </>
        )}

        {/* ── 2. Address ─────────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <Field id="streetAddress" label="Address">
              <input id="streetAddress" value={draft.streetAddress} onChange={(e) => set("streetAddress")(e.target.value)} className={inputClass} autoComplete="street-address" />
            </Field>
            <Field id="city" label="City" required error={errors.city}>
              <input id="city" value={draft.city} onChange={(e) => set("city")(e.target.value)} className={inputClass} autoComplete="address-level2" />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="stateProvince" label="State" required error={errors.stateProvince}>
                <input id="stateProvince" value={draft.stateProvince} onChange={(e) => set("stateProvince")(e.target.value)} className={inputClass} autoComplete="address-level1" />
              </Field>
              <Field id="zipPostal" label="Zip code" required error={errors.zipPostal}>
                <input id="zipPostal" value={draft.zipPostal} onChange={(e) => set("zipPostal")(e.target.value)} className={inputClass} autoComplete="postal-code" />
              </Field>
            </div>
          </>
        )}

        {/* ── 3. Lagos roots ─────────────────────────────────────────── */}
        {step === 2 && (
          <>
            <Field id="occupation" label="What is your profession?" required error={errors.occupation}>
              <input id="occupation" value={draft.occupation} onChange={(e) => set("occupation")(e.target.value)} className={inputClass} />
            </Field>

            <CheckGroup
              legend="Which of the 5 (IBILE) divisions are you from?"
              hint="Check all that apply."
              options={IBILE_FORM_DIVISIONS}
              selected={draft.ibileDivisions}
              onToggle={toggleIn("ibileDivisions")}
              otherValue={draft.ibileOther}
              onOtherChange={set("ibileOther")}
              error={errors.ibileDivisions}
            />

            <fieldset>
              <legend className="mb-1.5 text-sm font-normal text-neutral-900">
                What is your root in Lagos State? <span className="text-red-600" aria-hidden="true">*</span>
              </legend>
              <p className="mb-2 text-xs leading-5 text-neutral-700">Choose one.</p>
              <div className="space-y-2">
                {LAGOS_ROOT_OPTIONS.map((opt) => (
                  <label key={opt} className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-neutral-900">
                    <input type="radio" name="lagosRoot" checked={draft.lagosRoot === opt} onChange={() => set("lagosRoot")(opt)} className="h-4 w-4 accent-green-600" />
                    {opt}
                  </label>
                ))}
                <div className="flex items-center gap-2.5">
                  <label className="flex shrink-0 cursor-pointer select-none items-center gap-2.5 text-sm text-neutral-900">
                    <input type="radio" name="lagosRoot" checked={draft.lagosRoot === "Other"} onChange={() => set("lagosRoot")("Other")} className="h-4 w-4 accent-green-600" />
                    Other:
                  </label>
                  <input
                    value={draft.lagosRootOther}
                    onChange={(e) => set("lagosRootOther")(e.target.value)}
                    disabled={draft.lagosRoot !== "Other"}
                    className={`${inputClass} py-1.5 disabled:bg-neutral-50 disabled:text-neutral-500`}
                    aria-label="Other root in Lagos State"
                  />
                </div>
              </div>
              {errors.lagosRoot && <p className="mt-1.5 text-xs leading-5 text-red-700">{errors.lagosRoot}</p>}
            </fieldset>

            <Field id="streetAgbole" label="Name of your Street/Agbole (Compound)">
              <input id="streetAgbole" value={draft.streetAgbole} onChange={(e) => set("streetAgbole")(e.target.value)} className={inputClass} />
            </Field>
          </>
        )}

        {/* ── 4. About you ───────────────────────────────────────────── */}
        {step === 3 && (
          <>
            <Field id="reasonForJoining" label="What is your reason for wanting to become a member of Eko Club?" required error={errors.reasonForJoining}>
              <textarea id="reasonForJoining" rows={4} value={draft.reasonForJoining} onChange={(e) => set("reasonForJoining")(e.target.value)} className={inputClass} />
            </Field>
            <Field id="otherOrganizations" label="Do you belong to any other groups or organizations?" required hint="If none, write none." error={errors.otherOrganizations}>
              <textarea id="otherOrganizations" rows={3} value={draft.otherOrganizations} onChange={(e) => set("otherOrganizations")(e.target.value)} className={inputClass} />
            </Field>
            <CheckGroup
              legend="I would like to join one or more of the listed committees, with the goal of contributing to the growth and progress of Eko Club Philadelphia."
              hint="Check all that apply."
              options={APPLICATION_COMMITTEES}
              selected={draft.committeeInterests}
              onToggle={toggleIn("committeeInterests")}
              otherValue={draft.committeeOther}
              onOtherChange={set("committeeOther")}
            />
          </>
        )}

        {/* ── 5. Referrals ───────────────────────────────────────────── */}
        {step === 4 && (
          <>
            <p className="rounded-xl bg-neutral-50 px-4 py-3 text-sm leading-6 text-neutral-800">
              Two written references are also required. Send them to{" "}
              <a href={`mailto:${MEMBERSHIP_EMAIL}`} className="text-green-700 underline">{MEMBERSHIP_EMAIL}</a>.
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="referral1Name" label="Referral name (1)" required error={errors.referral1Name}>
                <input id="referral1Name" value={draft.referral1Name} onChange={(e) => set("referral1Name")(e.target.value)} className={inputClass} />
              </Field>
              <Field id="referral1Phone" label="Referral's phone number (1)" required error={errors.referral1Phone}>
                <input id="referral1Phone" type="tel" value={draft.referral1Phone} onChange={(e) => set("referral1Phone")(e.target.value)} className={inputClass} />
              </Field>
              <Field id="referral2Name" label="Referral name (2)">
                <input id="referral2Name" value={draft.referral2Name} onChange={(e) => set("referral2Name")(e.target.value)} className={inputClass} />
              </Field>
              <Field id="referral2Phone" label="Referral's phone number (2)">
                <input id="referral2Phone" type="tel" value={draft.referral2Phone} onChange={(e) => set("referral2Phone")(e.target.value)} className={inputClass} />
              </Field>
            </div>
          </>
        )}

        {/* ── 6. Review ──────────────────────────────────────────────── */}
        {step === 5 && (
          <>
            <Review draft={draft} onEdit={goTo} />

            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-4">
              <p className="text-sm font-normal text-amber-900">
                A ${APPLICATION_FEE_USD} membership application fee is required, and it is
                non-refundable.
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-900">
                You will be taken to the payment page as soon as you submit. Ensure you fill out
                the application in its entirety; any omission or misinformation may result in
                automatic dismissal.
              </p>
            </div>

            {/* The link sits outside the <label>: inside it, clicking to
                read the Constitution would also tick the box agreeing to
                it, which is precisely backwards. */}
            <div className="rounded-xl bg-neutral-50 px-4 py-3">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={draft.agreedToConstitution}
                  onChange={(e) => set("agreedToConstitution")(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-green-600"
                />
                <span className="text-sm leading-6 text-neutral-800">
                  I hereby apply for membership in Eko Club Philadelphia and agree to comply with the
                  Constitution, House Rules and Regulations, and all By-laws now in force or legally
                  adopted hereafter.
                </span>
              </label>
              <p className="mt-2 pl-7 text-sm leading-6 text-neutral-700">
                <a
                  href={CONSTITUTION_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-700 underline hover:no-underline"
                >
                  Read the Constitution
                </a>{" "}
                <span className="text-neutral-600">(opens in a new tab, your answers are kept)</span>
              </p>
            </div>
            <Recaptcha key={captchaAttempt} onChange={setCaptchaToken} />
            {errors.recaptcha && !captchaToken && <p role="alert" className="text-xs text-red-700">{errors.recaptcha}</p>}
            {errors.agreedToConstitution && (
              <p className="text-xs leading-5 text-red-700">{errors.agreedToConstitution}</p>
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between gap-3 border-t border-neutral-200 pt-5">
        <button
          type="button"
          onClick={() => goTo(Math.max(step - 1, 0))}
          disabled={step === 0 || submitting}
          className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-normal text-neutral-900 transition-colors hover:border-neutral-400 disabled:opacity-40"
        >
          Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={next}
            className="rounded-full bg-green-600 px-6 py-2.5 text-sm font-normal text-white transition-opacity hover:opacity-90"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !captchaToken}
            className="rounded-full bg-green-600 px-6 py-2.5 text-sm font-normal text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Submitting…" : `Submit and pay $${APPLICATION_FEE_USD}`}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Review ──────────────────────────────────────────────────────────── */

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 border-b border-neutral-100 py-2 last:border-0">
      <dt className="text-sm text-neutral-700">{label}</dt>
      <dd className="max-w-[60%] text-right text-sm text-neutral-950">
        {value?.trim() ? value : <span className="text-neutral-500">Not given</span>}
      </dd>
    </div>
  );
}

function Review({ draft, onEdit }: { draft: Draft; onEdit: (step: number) => void }) {
  const ibile = [
    ...draft.ibileDivisions.filter((d) => d !== "Other"),
    ...(draft.ibileDivisions.includes("Other") && draft.ibileOther ? [draft.ibileOther] : []),
  ].join(", ");
  const committees = [
    ...draft.committeeInterests.filter((d) => d !== "Other"),
    ...(draft.committeeInterests.includes("Other") && draft.committeeOther ? [draft.committeeOther] : []),
  ].join(", ");
  const root = draft.lagosRoot === "Other" ? draft.lagosRootOther : draft.lagosRoot;

  const sections: { title: string; step: number; rows: [string, string | undefined][] }[] = [
    { title: "Applicant", step: 0, rows: [
      ["Full name", draft.fullName],
      ["Spouse", draft.spouseName],
      ["Email", draft.email],
      ["Cell phone", parsePhoneNumberFromString(draft.phone, draft.phoneCountry)?.formatInternational() ?? draft.phone],
      ["Birthday", `${draft.birthMonth} ${draft.birthDay}`.trim()],
      ["LinkedIn", draft.linkedinUrl],
      ["Instagram", draft.instagramUrl],
      ["Facebook", draft.facebookUrl],
    ]},
    { title: "Address", step: 1, rows: [
      ["Address", draft.streetAddress],
      ["City", draft.city],
      ["State", draft.stateProvince],
      ["Zip code", draft.zipPostal],
    ]},
    { title: "Lagos roots", step: 2, rows: [
      ["Profession", draft.occupation],
      ["IBILE division", ibile],
      ["Root in Lagos State", root],
      ["Street / Agbole", draft.streetAgbole],
    ]},
    { title: "About you", step: 3, rows: [
      ["Reason for joining", draft.reasonForJoining],
      ["Other organizations", draft.otherOrganizations],
      ["Committees", committees],
    ]},
    { title: "Referrals", step: 4, rows: [
      ["Referral 1", [draft.referral1Name, draft.referral1Phone].filter(Boolean).join(" · ")],
      ["Referral 2", [draft.referral2Name, draft.referral2Phone].filter(Boolean).join(" · ")],
    ]},
  ];

  return (
    <div className="space-y-5">
      {sections.map((s) => (
        <section key={s.title} className="rounded-xl border border-neutral-200 p-4">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-normal uppercase tracking-[0.14em] text-neutral-900">{s.title}</h3>
            <button
              type="button"
              onClick={() => onEdit(s.step)}
              className="text-xs font-normal text-green-700 underline hover:no-underline"
            >
              Edit
            </button>
          </div>
          <dl>
            {s.rows.map(([label, value]) => <Row key={label} label={label} value={value} />)}
          </dl>
        </section>
      ))}
    </div>
  );
}
