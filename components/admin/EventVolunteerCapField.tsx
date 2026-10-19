"use client";

import { FormField, FormInput } from "@/components/admin/AdminUI";

export default function EventVolunteerCapField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <FormField label="Volunteer cap (optional)">
    <FormInput aria-label="Volunteer cap" type="number" min={0} max={100000} step={1} value={value} onChange={event => onChange(event.target.value)} placeholder="Unlimited" />
    <p className="mt-1 text-xs text-neutral-700">Leave blank for unlimited volunteer places. When the cap is reached, new volunteers join the waitlist. This is separate from attendee capacity.</p>
  </FormField>;
}
