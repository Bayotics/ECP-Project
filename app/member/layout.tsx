import type { Metadata } from "next";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PortalScrollHandler from "@/components/layout/PortalScrollHandler";
import PasswordChangeGate from "@/components/auth/PasswordChangeGate";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server/session";

export const metadata: Metadata = {
  title: {
    default: "Member Portal",
    template: "%s | ECP Member",
  },
};

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!await getSessionUser({ cookies: await cookies() })) redirect("/auth/login");
  return (
    <ProtectedRoute>
      <PortalScrollHandler>
        <div className="flex h-screen overflow-hidden bg-(--color-neutral-50)">
          <Sidebar role="member" />
          <div className="flex flex-col flex-1 overflow-hidden min-h-0">
            <Navbar />
            <main id="main-content" className="flex-1 overflow-y-auto p-6 min-h-0">{children}</main>
          </div>
        </div>
        {/* Raised for a member still on the membership number they were
            emailed; renders nothing for everybody else. */}
        <PasswordChangeGate />
      </PortalScrollHandler>
    </ProtectedRoute>
  );
}

