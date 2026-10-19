"use client";

import { Btn, FormField, FormInput } from "@/components/admin/AdminUI";
import type { EventListingForm } from "@/lib/event-platform-links";

export default function EventPlatformFields({ value, onChange }: {
  value: EventListingForm;
  onChange: (patch: Partial<EventListingForm>) => void;
}) {
  function edit(index: number, patch: Partial<EventListingForm["otherPlatformLinks"][number]>) {
    onChange({ otherPlatformLinks: value.otherPlatformLinks.map((link, position) => position === index ? { ...link, ...patch } : link) });
  }
  return <fieldset className="min-w-0 space-y-4 rounded-2xl border border-neutral-200 p-4">
    <legend className="px-2 text-sm font-semibold text-neutral-950">Also listed on (optional)</legend>
    <p className="text-sm leading-relaxed text-neutral-700">Show additional event listings on the event page. Leave unused links blank.</p>
    <FormField label="Eventbrite link"><FormInput aria-label="Eventbrite link" type="url" maxLength={2048} value={value.eventbriteUrl} onChange={event => onChange({ eventbriteUrl: event.target.value })} placeholder="https://www.eventbrite.com/…" /></FormField>
    <FormField label="Partiful link"><FormInput aria-label="Partiful link" type="url" maxLength={2048} value={value.partifulUrl} onChange={event => onChange({ partifulUrl: event.target.value })} placeholder="https://partiful.com/e/…" /></FormField>
    {value.otherPlatformLinks.map((link, index) => <div key={index} className="space-y-3 rounded-xl border border-neutral-200 p-3">
      <FormField label="Platform name"><FormInput aria-label={`Other platform ${index + 1} name`} maxLength={60} value={link.name} onChange={event => edit(index, { name: event.target.value })} placeholder="e.g. Meetup" /></FormField>
      <FormField label="Platform link"><FormInput aria-label={`Other platform ${index + 1} link`} type="url" maxLength={2048} value={link.url} onChange={event => edit(index, { url: event.target.value })} placeholder="https://…" /></FormField>
      <button type="button" aria-label={`Remove other platform ${index + 1}`} className="min-h-9 text-sm text-red-800 underline" onClick={() => onChange({ otherPlatformLinks: value.otherPlatformLinks.filter((_, position) => position !== index) })}>Remove platform</button>
    </div>)}
    <Btn variant="secondary" disabled={value.otherPlatformLinks.length >= 8} onClick={() => onChange({ otherPlatformLinks: [...value.otherPlatformLinks, { name: "", url: "" }] })}>Add another platform</Btn>
  </fieldset>;
}
