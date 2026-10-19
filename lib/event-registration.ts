import type { Event } from "@/lib/models/event";

type Registration = Pick<Event, "registrationRequired" | "registrationMode" | "registrationUrl">;

export function registrationMode(event: Registration): "link" | "form" | null {
  if (!event.registrationRequired) return null;
  if (event.registrationMode === "form") return "form";
  // Preserve existing external registrations. A missing mode never implies a form.
  if (event.registrationUrl?.trim() && (!event.registrationMode || event.registrationMode === "link")) return "link";
  return null;
}

export function validateRegistration(event: Registration): string | null {
  if (!event.registrationRequired) return null;
  if (event.registrationMode !== "link" && event.registrationMode !== "form") {
    return "Select a registration link or registration form for this event.";
  }
  if (event.registrationMode === "link" && !event.registrationUrl?.trim()) {
    return "A registration link is required when link registration is selected.";
  }
  return null;
}
