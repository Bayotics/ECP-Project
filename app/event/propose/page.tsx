import EventsLayout from "@/app/events/layout";
import EventProposalPage from "@/app/events/propose/page";
export { metadata } from "@/app/events/propose/page";

export default function Page() {
  return <EventsLayout><EventProposalPage /></EventsLayout>;
}
