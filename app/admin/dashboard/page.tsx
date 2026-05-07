"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useUsers } from "@/context/UsersContext";
import { useMembership } from "@/context/MembershipContext";
import { useEvents } from "@/context/EventsContext";
import { useNews } from "@/context/NewsContext";
import { useProducts } from "@/context/ProductsContext";
import { useOrders } from "@/context/OrdersContext";
import { useDonations } from "@/context/DonationsContext";
import { useDocuments } from "@/context/DocumentsContext";
import { AdminStat, Badge } from "@/components/admin/AdminUI";

export default function AdminDashboardPage() {
  const { users } = useUsers();
  const { applications } = useMembership();
  const { events } = useEvents();
  const { posts } = useNews();
  const { products } = useProducts();
  const { orders } = useOrders();
  const { donations, getTotalSuccessful } = useDonations();
  const { documents } = useDocuments();

  const members = useMemo(() => users.filter(u => ["member", "admin", "super-admin"].includes(u.role)), [users]);
  const pendingApps = useMemo(() => applications.filter(a => ["pending", "under-review", "interview"].includes(a.status)), [applications]);
  const publishedEvents = useMemo(() => events.filter(e => e.status === "published"), [events]);
  const activeProducts = useMemo(() => products.filter(p => p.status === "active"), [products]);
  const recentOrders = useMemo(() => [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6), [orders]);
  const recentApplications = useMemo(() => [...applications].sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)).slice(0, 6), [applications]);
  const totalDonated = getTotalSuccessful();

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold text-(--color-neutral-900)">Admin Dashboard</h1>
        <p className="text-sm text-(--color-neutral-500) mt-1">Live platform overview.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStat label="Total Members"    value={members.length}          sub="All roles"       color="green"  />
        <AdminStat label="Pending Apps"     value={pendingApps.length}      sub="Needs review"    color="yellow" />
        <AdminStat label="Active Events"    value={publishedEvents.length}  sub="Published"       color="blue"   />
        <AdminStat label="Total Donations"  value={`₦${totalDonated.toLocaleString("en-NG")}`} sub="All time" color="purple" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStat label="Active Products"  value={activeProducts.length}   sub="In store"               color="green"  />
        <AdminStat label="Total Orders"     value={orders.length}           sub="All time"               color="blue"   />
        <AdminStat label="Published Posts"  value={posts.filter(p => p.status === "published").length} sub="News & blogs" color="green" />
        <AdminStat label="Donation Records" value={donations.length}        sub="All records"            color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-(--color-neutral-200) overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-(--color-neutral-100)">
            <h2 className="font-bold text-(--color-neutral-800) text-sm">Recent Applications</h2>
            <Link href="/admin/applications" className="text-xs text-(--color-green-700) font-semibold hover:underline">View all</Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-(--color-neutral-50)">
                <th className="text-left px-4 py-2 text-xs font-bold text-(--color-neutral-500) uppercase">Name</th>
                <th className="text-left px-4 py-2 text-xs font-bold text-(--color-neutral-500) uppercase">LGA</th>
                <th className="text-left px-4 py-2 text-xs font-bold text-(--color-neutral-500) uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentApplications.map(app => (
                <tr key={app.id} className="border-t border-(--color-neutral-100) hover:bg-(--color-neutral-50)">
                  <td className="px-4 py-2.5 font-medium text-(--color-neutral-800)">{app.fullName}</td>
                  <td className="px-4 py-2.5 text-(--color-neutral-500)">{app.lga}</td>
                  <td className="px-4 py-2.5"><Badge value={app.status} /></td>
                </tr>
              ))}
              {recentApplications.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-(--color-neutral-400) text-sm">No applications yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-2xl border border-(--color-neutral-200) overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-(--color-neutral-100)">
            <h2 className="font-bold text-(--color-neutral-800) text-sm">Recent Orders</h2>
            <Link href="/admin/products" className="text-xs text-(--color-green-700) font-semibold hover:underline">Products</Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-(--color-neutral-50)">
                <th className="text-left px-4 py-2 text-xs font-bold text-(--color-neutral-500) uppercase">Order</th>
                <th className="text-left px-4 py-2 text-xs font-bold text-(--color-neutral-500) uppercase">Customer</th>
                <th className="text-right px-4 py-2 text-xs font-bold text-(--color-neutral-500) uppercase">Total</th>
                <th className="text-left px-4 py-2 text-xs font-bold text-(--color-neutral-500) uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(o => (
                <tr key={o.id} className="border-t border-(--color-neutral-100) hover:bg-(--color-neutral-50)">
                  <td className="px-4 py-2.5 font-mono text-xs text-(--color-neutral-600)">{o.orderNumber}</td>
                  <td className="px-4 py-2.5 font-medium text-(--color-neutral-800) max-w-30 truncate">{o.customerName}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-(--color-green-700)">₦{o.total.toLocaleString("en-NG")}</td>
                  <td className="px-4 py-2.5"><Badge value={o.status} /></td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-(--color-neutral-400) text-sm">No orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { href: "/admin/applications", label: "Applications", icon: "✦", count: pendingApps.length },
          { href: "/admin/members",      label: "Members",      icon: "◉", count: members.length },
          { href: "/admin/events",       label: "Events",       icon: "◈", count: events.length },
          { href: "/admin/news",         label: "News",         icon: "📰", count: posts.length },
          { href: "/admin/products",     label: "Products",     icon: "🛍️", count: products.length },
          { href: "/admin/documents",    label: "Documents",    icon: "◧", count: documents.length },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white border border-(--color-neutral-200) rounded-xl p-4 flex flex-col gap-1 hover:shadow-sm hover:border-(--color-green-300) transition-all group"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-sm font-bold text-(--color-neutral-800) group-hover:text-(--color-green-700) transition-colors">{item.label}</span>
            <span className="text-xl font-extrabold text-(--color-neutral-900)">{item.count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
