import type { Volunteer, VolunteerMessage } from "@/lib/models/volunteer";
export function volunteerStatus(person: Pick<Volunteer,"status">) { return person.status ?? "active"; }
export function volunteerCanReceive(person: Volunteer, kind: VolunteerMessage["kind"]) {
  if (kind === "management" || kind === "access" || kind === "cancellation") return true;
  if (volunteerStatus(person) === "inactive") return false;
  if (kind === "opportunity") return volunteerStatus(person) === "active" && person.opportunityEmails === true;
  return true;
}
