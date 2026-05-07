import type { Metadata } from "next";
import ApplicationStatusClient from "@/components/membership/ApplicationStatusClient";

export const metadata: Metadata = {
  title: "Application Status",
  description: "Check the status of your Eko Club Philadelphia membership application.",
};

export default async function MembershipStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return <ApplicationStatusClient initialId={id} />;
}
