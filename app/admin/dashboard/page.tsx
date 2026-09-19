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
import { AdminPageHeader, AdminStat, Badge } from "@/components/admin/AdminUI";
import type { MembershipApplication } from "@/lib/models/membership";

/* Applications taken before the address rebuild only carry `lga`. */
function locationOf(app: MembershipApplication) {
  const parts = [app.city, app.stateProvince].filter(Boolean);
  return parts.length ? parts.join(", ") : app.lga ?? "—";
}

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

function MiniPanel({ title, href, hrefLabel, children }: { title: string; href: string; hrefLabel: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
        <h2 className="text-sm font-normal uppercase tracking-[0.16em] text-neutral-900">{title}</h2>
        <Link href={href} className="text-xs font-normal text-green-700 hover:underline">
          {hrefLabel}
        </Link>
      </div>
      {children}
    </div>
  );
}

const th = "px-5 py-3 text-left text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-900";
const td = "px-5 py-3 font-normal text-neutral-900";

export default function AdminDashboardPage() {
  const { users } = useUsers();
  const { applications } = useMembership();
  const { events } = useEvents();
  const { posts } = useNews();
  const { products } = useProducts();
  const { orders } = useOrders();
  const { donations, getTotalSuccessful } = useDonations();
  const { documents } = useDocuments();

  const members = useMemo(() => users.filter((u) => ["member", "admin", "super-admin"].includes(u.role)), [users]);
  const pendingApps = useMemo(
    () => applications.filter((a) => ["pending", "under-review", "interview"].includes(a.status)),
    [applications],
  );
  const publishedEvents = useMemo(() => events.filter((e) => e.status === "published"), [events]);
  const activeProducts = useMemo(() => products.filter((p) => p.status === "active"), [products]);
  const recentOrders = useMemo(() => [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6), [orders]);
  const recentApplications = useMemo(
    () => [...applications].sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)).slice(0, 6),
    [applications],
  );
  const totalDonated = getTotalSuccessful();

  const shortcuts = [
    { href: "/admin/applications", label: "Applications", count: pendingApps.length, note: "awaiting a decision" },
    { href: "/admin/members", label: "Members", count: members.length, note: "with portal accounts" },
    { href: "/admin/events", label: "Events", count: events.length, note: "on the calendar" },
    { href: "/admin/news", label: "News", count: posts.length, note: "stories filed" },
    { href: "/admin/products", label: "Products", count: products.length, note: "in the store" },
    { href: "/admin/documents", label: "Documents", count: documents.length, note: "in the library" },
  ];

  return (
    <div className="space-y-8 pb-10">
      <AdminPageHeader
        title="Admin dashboard"
        subtitle="What the club looks like right now, straight from the database."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminStat label="Members" value={members.length} sub="All portal roles" color="green" />
        <AdminStat label="Applications waiting" value={pendingApps.length} sub="Pending, in review or at interview" color="yellow" />
        <AdminStat label="Published events" value={publishedEvents.length} sub="Live on the events hub" color="blue" />
        <AdminStat label="Donations received" value={money(totalDonated)} sub="All time, successful only" color="purple" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminStat label="Active products" value={activeProducts.length} sub="On sale in the store" color="green" />
        <AdminStat label="Orders" value={orders.length} sub="All time" color="blue" />
        <AdminStat label="Published stories" value={posts.filter((p) => p.status === "published").length} sub="News and blog" color="green" />
        <AdminStat label="Donation records" value={donations.length} sub="Every attempt, all statuses" color="purple" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <MiniPanel title="Recent applications" href="/admin/applications" hrefLabel="Review all">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50">
                <th className={th}>Name</th>
                <th className={th}>Location</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentApplications.map((app) => (
                <tr key={app.id} className="border-t border-neutral-100 transition-colors hover:bg-neutral-50">
                  <td className={`${td} text-neutral-950`}>{app.fullName}</td>
                  <td className={td}>{locationOf(app)}</td>
                  <td className="px-5 py-3">
                    <Badge value={app.status} />
                  </td>
                </tr>
              ))}
              {recentApplications.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-sm text-neutral-900">
                    No applications have come in yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </MiniPanel>

        <MiniPanel title="Recent orders" href="/admin/products" hrefLabel="Products">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50">
                <th className={th}>Order</th>
                <th className={th}>Customer</th>
                <th className={`${th} text-right`}>Total</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-t border-neutral-100 transition-colors hover:bg-neutral-50">
                  <td className={`${td} font-mono text-xs`}>{o.orderNumber}</td>
                  <td className={`${td} max-w-32 truncate text-neutral-950`}>{o.customerName}</td>
                  <td className={`${td} text-right`}>{money(o.total)}</td>
                  <td className="px-5 py-3">
                    <Badge value={o.status} />
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-neutral-900">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </MiniPanel>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {shortcuts.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-[1.25rem] border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-400"
          >
            <span className="block text-2xl font-normal tracking-[-0.04em] text-neutral-950">{item.count}</span>
            <span className="mt-1 block text-sm font-normal text-neutral-900 transition-colors group-hover:text-green-700">
              {item.label}
            </span>
            <span className="mt-1 block text-xs leading-5 text-neutral-900">{item.note}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
