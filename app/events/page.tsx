import type { Metadata } from "next";
import EventsPageClient from "@/components/events/EventsPageClient";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Every Eko Club Philadelphia event in one calendar: cultural nights, community gatherings, volunteer days, town halls and member meetups.",
};

export default function EventsPage() {
  return <EventsPageClient />;
}
