import { getCollection } from "@/lib/server/collections";
import type { Event } from "@/lib/models/event";

export function publicVolunteerEvent(event: Event, isAdmin: boolean): Event {
  if (isAdmin) return event;
  const { volunteerLeadIds: _leads, volunteerRevision: _revision, proposalId: _proposal, ...visible } = event;
  void _leads; void _revision; void _proposal;
  return visible;
}

export async function validateVolunteerLeads(value: unknown): Promise<string | null> {
  if (value === undefined) return null;
  if (!Array.isArray(value) || value.length > 30 || value.some(id => typeof id !== "string" || !id || id.length > 100) || new Set(value).size !== value.length) return "Select up to 30 different members as event leads.";
  if (!value.length) return null;
  const users = await getCollection("users");
  const eligible = await users.countDocuments({ id: { $in: value }, role: { $in: ["member", "admin", "super-admin"] }, status: "active" });
  return eligible === value.length ? null : "Each event lead must be an active member or administrator. Please update your selection.";
}
