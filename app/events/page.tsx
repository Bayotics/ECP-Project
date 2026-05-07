import type { Metadata } from "next";
import EventsPageClient from "@/components/events/EventsPageClient";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Browse all Eko Club Philadelphia events — cultural galas, community gatherings, social welfare projects, and member meetups.",
};

export default function EventsPage() {
  return <EventsPageClient />;
}
