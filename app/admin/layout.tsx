import type { Metadata } from "next";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import AdminGuard from "@/components/auth/AdminGuard";
import PortalScrollHandler from "@/components/layout/PortalScrollHandler";

export const metadata: Metadata = {
  title: {
    default: "Admin Portal",
    template: "%s | ECP Admin",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <PortalScrollHandler>
        <div className="flex h-screen overflow-hidden bg-(--color-neutral-100)">
          <Sidebar role="admin" />
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <Navbar isAdmin />
            <main id="main-content" className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </PortalScrollHandler>
    </AdminGuard>
  );
}
