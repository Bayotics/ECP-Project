import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import VolunteerForm from "@/components/volunteers/VolunteerForm";

export const metadata: Metadata = { title: "Volunteer", description: "Volunteer with Eko Club Philadelphia. Join our general interest list or help at a specific event." };
export default async function VolunteerPage({ searchParams }: { searchParams: Promise<{ event?: string | string[] }> }) {
  const params = await searchParams;
  return <><Header /><main id="main-content" className="bg-[#f4f7f3] px-4 py-14 sm:px-6 sm:py-20">
    <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="lg:sticky lg:top-32"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-800">Get involved</p><h1 className="mt-5 text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl">Volunteer with us</h1><p className="mt-6 text-lg leading-relaxed text-neutral-700">Share your time and skills with the community. Join our general volunteer interest list, or choose an event where you’d like to help.</p><p className="mt-5 leading-relaxed text-neutral-700">You’ll receive a confirmation email. If an event’s volunteer places are full, you can join its waitlist. Places are confirmed in sign-up order when they become available.</p></section>
      <VolunteerForm initialEventId={typeof params.event === "string" ? params.event : ""} />
    </div>
  </main><Footer /></>;
}
