import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppProvider";
import AIChatWidget from "@/components/ai/AIChatWidget";

/* ─── Fonts ─────────────────────────────────────────── */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

/* ─── Metadata ──────────────────────────────────────── */
export const metadata: Metadata = {
  title: {
    default: "Eko Club Philadelphia",
    template: "%s | Eko Club Philadelphia",
  },
  description:
    "Eko Club Philadelphia is a chapter of Eko Club International — uniting Lagosians in the diaspora through culture, community, and the development of Lagos State.",
  keywords: ["Eko Club", "Philadelphia", "Lagos", "diaspora", "Nigerian community", "Lagosians", "ECP"],
  authors: [{ name: "Eko Club Philadelphia" }],
  creator: "Eko Club Philadelphia",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Eko Club Philadelphia",
    title: "Eko Club Philadelphia",
    description:
      "Uniting Lagosians in the diaspora through cultural celebration, community development, and the advancement of Lagos State.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eko Club Philadelphia",
    description:
      "Uniting Lagosians in the diaspora — culture, community, and Lagos development.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#1a9e1e",
  width: "device-width",
  initialScale: 1,
};

/* ─── Root Layout ───────────────────────────────────── */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakarta.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-(--background) text-(--foreground)">
        {/* Skip navigation for keyboard/screen-reader users */}
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <AppProvider>
          {children}
          <AIChatWidget />
        </AppProvider>
      </body>
    </html>
  );
}
