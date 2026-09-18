import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageTransition from "@/components/layout/PageTransition";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Photographs and film from Eko Club Philadelphia: the roadside cleanups, scholarship nights, the Thanksgiving giveaway, the parade route, and Lagos itself.",
};

export default function GalleryLayout({
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
