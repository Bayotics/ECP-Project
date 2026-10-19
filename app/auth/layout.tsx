import type { Metadata } from "next";
import Header from "@/components/layout/Header";

export const metadata: Metadata = {
  title: {
    default: "Auth",
    template: "%s | ECP Auth",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-(--color-green-50)">
      <Header />
      <div className="flex min-h-[calc(100dvh-6rem)] items-center justify-center px-4 py-8 sm:min-h-[calc(100dvh-7rem)] lg:min-h-[calc(100dvh-10.5rem)]">
        <main id="main-content" className="w-full max-w-md">{children}</main>
      </div>
    </div>
  );
}
