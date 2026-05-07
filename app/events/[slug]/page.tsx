import type { Metadata } from "next";
import EventDetailClient from "@/components/events/EventDetailClient";

export const metadata: Metadata = {
  title: "Event",
  description: "Full details, RSVP, and more for this Eko Club Philadelphia event.",
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <EventDetailClient slug={slug} />;
}

