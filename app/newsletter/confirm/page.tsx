import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import NewsletterConfirm from "@/components/newsletter/NewsletterConfirm";
export const metadata: Metadata = { title: "Confirm your newsletter subscription", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function Page() {
  return <><Header /><main id="main-content" className="bg-[#f4f7f3] px-4 py-16 sm:py-24"><NewsletterConfirm /></main><Footer /></>;
}
