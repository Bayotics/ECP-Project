import type { Metadata } from "next";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import AdminGuard from "@/components/auth/AdminGuard";
import PortalScrollHandler from "@/components/layout/PortalScrollHandler";
import PasswordChangeGate from "@/components/auth/PasswordChangeGate";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server/session";

export const metadata: Metadata = {
  title: {
    default: "Admin Portal",
    template: "%s | ECP Admin",
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser({ cookies: await cookies() });
  if (!user) redirect("/auth/login");
  if (user.role !== "admin" && user.role !== "super-admin") redirect("/member/dashboard");
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
        {/* Here too: an administrator signing in on a given password
            should be asked to replace it for the same reason. */}
        <PasswordChangeGate />
      </PortalScrollHandler>
    </AdminGuard>
  );
}
