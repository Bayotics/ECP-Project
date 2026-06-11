export type EventType =
  | "town-hall"
  | "workshop"
  | "volunteer"
  | "meetup"
  | "seminar"
  | "press-conference"
  | "other";

export type EventStatus = "draft" | "published" | "cancelled" | "completed";

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  // Scheduling
  date: string; // ISO
  endDate?: string;
  time?: string;
  endTime?: string;
  // Location
  location: string;
  venue?: string;
  isOnline: boolean;
  meetingUrl?: string;
  // Meta
  type: EventType;
  status: EventStatus;
  imageUrl?: string;
  // Capacity
  maxAttendees?: number;
  registrationRequired: boolean;
  registrationDeadline?: string;
  // Organizer
  organizerId: string; // user id
  organizerName: string;
  // Tags & visibility
  tags: string[];
  isFeatured: boolean;
  isPublic: boolean;
  membersOnly: boolean;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export type CreateEventInput = Omit<Event, "id" | "createdAt" | "updatedAt">;
export type UpdateEventInput = Partial<Omit<Event, "id" | "createdAt">>;
