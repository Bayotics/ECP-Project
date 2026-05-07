export type RSVPStatus = "confirmed" | "waitlisted" | "cancelled";

export interface RSVP {
  id: string;
  eventId: string;
  userId?: string; // null for guest RSVPs
  // Contact (denormalized for guest RSVPs)
  name: string;
  email: string;
  phone?: string;
  // Status
  status: RSVPStatus;
  guestCount?: number; // additional guests
  notes?: string;
  // Timestamps
  registeredAt: string;
  cancelledAt?: string;
  checkedInAt?: string;
}

export type CreateRSVPInput = Omit<RSVP, "id" | "registeredAt" | "status">;
export type UpdateRSVPInput = Partial<Omit<RSVP, "id" | "registeredAt">>;
