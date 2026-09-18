import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageTransition from "@/components/layout/PageTransition";

export const metadata: Metadata = {
  title: "Store",
  description:
    "Club apparel, accessories and publications from Eko Club Philadelphia. Every order goes back into the programs.",
};

export default function StoreLayout({
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
