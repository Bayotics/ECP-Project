import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageTransition from "@/components/layout/PageTransition";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach Eko Club Philadelphia about membership, events, volunteering or sponsorship. Every message goes to the club inbox and gets a reply.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main-content"><PageTransition>{children}</PageTransition></main>
      <Footer />
    </>
  );
}
