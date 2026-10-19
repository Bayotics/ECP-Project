"use client";

import { FormField, FormInput, FormSelect } from "@/components/admin/AdminUI";

export default function EventRegistrationFields({ value, onChange }: {
  value: { registrationMode: string; registrationUrl: string };
  onChange: (patch: Partial<typeof value>) => void;
}) {
  return <div className="space-y-3">
    <FormField label="Registration method *">
      <FormSelect aria-label="Registration method" value={value.registrationMode} onChange={e => onChange({ registrationMode: e.target.value })}>
        <option value="">Select a registration method</option>
        <option value="link">Registration link</option>
        <option value="form">Registration form</option>
      </FormSelect>
    </FormField>
    {value.registrationMode === "link" && <FormField label="Registration link *">
      <FormInput aria-label="Registration link" type="url" value={value.registrationUrl} onChange={e => onChange({ registrationUrl: e.target.value })} placeholder="https://…" />
      <p className="mt-1 text-xs text-neutral-700">Visitors register on this external page. The event will not show an on-site form.</p>
    </FormField>}
    {value.registrationMode === "form" && <p className="text-sm text-neutral-700">Show the club&apos;s registration form with name, email, phone, guests, notes and reCAPTCHA verification.</p>}
  </div>;
}
