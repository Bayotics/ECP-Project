import type { Metadata } from "next";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

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
    <div className="flex h-screen overflow-hidden bg-(--color-neutral-100)">
      <Sidebar role="admin" />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar isAdmin />
        <main id="main-content" className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
