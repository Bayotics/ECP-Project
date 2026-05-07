import type { Metadata } from "next";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: {
    default: "Member Portal",
    template: "%s | ECP Member",
  },
};

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-(--color-neutral-50)">
        <Sidebar role="member" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Navbar />
          <main id="main-content" className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

