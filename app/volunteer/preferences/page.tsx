import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import VolunteerPreferences from "@/components/volunteers/VolunteerPreferences";
export const metadata: Metadata = { title: "Volunteer preferences", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function Page() { return <><Header /><main id="main-content" className="bg-neutral-50 px-4 py-14 sm:py-20"><VolunteerPreferences /></main><Footer /></>; }
