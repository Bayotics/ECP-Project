export type EventType =
  | "town-hall"
  | "workshop"
  | "volunteer"
  | "meetup"
  | "seminar"
  | "press-conference"
  | "other";

export type EventStatus = "draft" | "published" | "cancelled" | "completed";

export interface EventPlatformLink {
  name: string;
  url: string;
}

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
  /** Separate from attendee capacity; null or absent means unlimited volunteers. */
  volunteerCap?: number | null;
  volunteerLeadIds?: string[];
  /** Serializes capacity decisions in volunteer transactions. */
  volunteerRevision?: number;
  proposalId?: string;
  registrationRequired: boolean;
  /** Only an explicit form selection enables on-site registration. */
  registrationMode?: "link" | "form";
  registrationDeadline?: string;
  /** Where registration happens, when it is handled off site. */
  registrationUrl?: string;
  /** Additional listings, independent of the event's registration method. */
  eventbriteUrl?: string;
  partifulUrl?: string;
  otherPlatformLinks?: EventPlatformLink[];
  /** Alt text for `imageUrl`, so the picture is not invisible to a screen reader. */
  imageAlt?: string;
  /** The programme this event is an occurrence of, where there is one. */
  programId?: string;
  /** True when the club gave the month but not the day. */
  dayIsProvisional?: boolean;
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
