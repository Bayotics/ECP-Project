import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageTransition from "@/components/layout/PageTransition";

export const metadata: Metadata = {
  title: "News",
  description:
    "Announcements, reports from the field, press releases and member writing from Eko Club Philadelphia.",
};

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main id="main-content"><PageTransition>{children}</PageTransition></main>
      <Footer />
    </>
  );
}
