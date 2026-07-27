import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageTransition from "@/components/layout/PageTransition";

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main-content"><PageTransition>{children}</PageTransition></main>
      <Footer />
    </>
  );
}
