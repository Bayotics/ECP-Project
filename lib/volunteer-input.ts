export interface VolunteerInput {
  name: string;
  email: string;
  phone: string;
  interests: string;
  notes: string;
  eventId?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  zip?: string;
  committeeIds?: string[];
  interestAreas?: string[];
  availability?: string;
  heardAbout?: string;
  opportunityEmails?: boolean;
}

export function validateVolunteerInput(input: unknown, requireNames = false): { value: VolunteerInput } | { error: string } {
  if (!input || typeof input !== "object") return { error: "Send a valid volunteer form." };
  const body = input as Record<string, unknown>;
  const split = requireNames || body.firstName !== undefined || body.lastName !== undefined;
  if (split && (typeof body.firstName !== "string" || !body.firstName.trim() || body.firstName.length > 75 || typeof body.lastName !== "string" || !body.lastName.trim() || body.lastName.length > 75)) return { error: "Enter your first and last name (up to 75 characters each)." };
  const name = split ? `${(body.firstName as string).trim()} ${(body.lastName as string).trim()}` : body.name;
  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 150) return { error: "Enter your name (2–150 characters)." };
  if (typeof body.email !== "string" || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) return { error: "Enter a valid email address." };
  const value: VolunteerInput = { name: name.trim(), email: body.email.trim().toLowerCase(), phone: "", interests: "", notes: "" };
  for (const [key, limit] of [["phone", 40], ["interests", 500], ["notes", 1000]] as const) {
    if (body[key] !== undefined && (typeof body[key] !== "string" || body[key].length > limit)) return { error: `${key.charAt(0).toUpperCase() + key.slice(1)} must contain at most ${limit} characters.` };
    value[key] = (body[key] as string | undefined)?.trim() ?? "";
  }
  if (split) { value.firstName = (body.firstName as string).trim(); value.lastName = (body.lastName as string).trim(); }
  for (const [key, limit] of [["city", 100], ["zip", 20], ["availability", 500], ["heardAbout", 150]] as const) {
    if (body[key] !== undefined) {
      if (typeof body[key] !== "string" || body[key].length > limit) return { error: `${key} must be at most ${limit} characters.` };
      value[key] = body[key].trim();
    }
  }
  for (const [key, limit, itemLimit] of [["committeeIds", 30, 100], ["interestAreas", 15, 80]] as const) {
    if (body[key] !== undefined) {
      if (!Array.isArray(body[key]) || body[key].length > limit || body[key].some(item => typeof item !== "string" || !item.trim() || item.length > itemLimit)) return { error: `Choose valid ${key === "committeeIds" ? "committees" : "areas of interest"}.` };
      value[key] = [...new Set(body[key].map(item => item.trim()))];
    }
  }
  if (body.opportunityEmails !== undefined) {
    if (typeof body.opportunityEmails !== "boolean") return { error: "Choose your email consent preference." };
    value.opportunityEmails = body.opportunityEmails;
  }
  if (body.eventId !== undefined && (typeof body.eventId !== "string" || body.eventId.length > 100)) return { error: "Choose a valid event." };
  if (typeof body.eventId === "string" && body.eventId.trim()) value.eventId = body.eventId.trim();
  return { value };
}
