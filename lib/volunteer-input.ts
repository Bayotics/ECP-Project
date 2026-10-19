export interface VolunteerInput {
  name: string;
  email: string;
  phone: string;
  interests: string;
  notes: string;
  eventId?: string;
}

export function validateVolunteerInput(input: unknown): { value: VolunteerInput } | { error: string } {
  if (!input || typeof input !== "object") return { error: "Send a valid volunteer form." };
  const body = input as Record<string, unknown>;
  if (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 150) return { error: "Enter your name (2–150 characters)." };
  if (typeof body.email !== "string" || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) return { error: "Enter a valid email address." };
  const value: VolunteerInput = { name: body.name.trim(), email: body.email.trim().toLowerCase(), phone: "", interests: "", notes: "" };
  for (const [key, limit] of [["phone", 40], ["interests", 500], ["notes", 1000]] as const) {
    if (body[key] !== undefined && (typeof body[key] !== "string" || body[key].length > limit)) return { error: `${key.charAt(0).toUpperCase() + key.slice(1)} must contain at most ${limit} characters.` };
    value[key] = (body[key] as string | undefined)?.trim() ?? "";
  }
  if (body.eventId !== undefined && (typeof body.eventId !== "string" || body.eventId.length > 100)) return { error: "Choose a valid event." };
  if (typeof body.eventId === "string" && body.eventId.trim()) value.eventId = body.eventId.trim();
  return { value };
}
