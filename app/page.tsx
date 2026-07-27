import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HomeIntro from "@/components/layout/HomeIntro";
import HomePageClient from "@/components/HomePageClient";

export const metadata: Metadata = {
  title: "Eko Club Philadelphia — Home",
  description: "Welcome to Eko Club Philadelphia, a chapter of Eko Club International for Lagosians in the diaspora.",
};

export default function HomePage() {
  return (
    <>
      <Header />
      <main id="main-content">
        <HomeIntro>
          <HomePageClient />
        </HomeIntro>
      </main>
      <Footer />
    </>
  );
}
