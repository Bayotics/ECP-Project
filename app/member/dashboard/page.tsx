"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useEvents } from "@/context/EventsContext";
import { useNews } from "@/context/NewsContext";
import { useMembership } from "@/context/MembershipContext";
import { useUsers } from "@/context/UsersContext";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function DashboardCard({
  title,
  children,
  href,
  linkLabel = "View all",
}: {
  title: string;
  children: React.ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-(--color-neutral-200) bg-white p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-500">{title}</h2>
        {href && (
          <Link href={href} className="text-xs text-(--color-green-600) font-medium hover:underline">
            {linkLabel} →
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

export default function MemberDashboardPage() {
  const { currentUser } = useAuth();
  const { getUpcoming } = useEvents();
  const { getPublished } = useNews();
  const { getByEmail, getByUserId } = useMembership();
  const { users } = useUsers();

  const upcomingEvents = getUpcoming().slice(0, 3);
  const latestNews = getPublished().slice(0, 3);
  const application = currentUser
    ? (getByEmail(currentUser.email) ?? getByUserId(currentUser.id))
    : null;
  const members = users
    .filter((u) => u.role === "member" || u.role === "admin" || u.role === "super-admin")
    .slice(0, 6);

  const firstName = currentUser?.firstName ?? currentUser?.displayName?.split(" ")[0] ?? "Member";
  const joinYear = currentUser?.joinedAt
    ? new Date(currentUser.joinedAt).getFullYear()
    : new Date().getFullYear();

  const statusColors: Record<string, string> = {
    approved: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    "under-review": "bg-blue-100 text-blue-700",
    interview: "bg-purple-100 text-purple-700",
    rejected: "bg-red-100 text-red-700",
    draft: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-(--color-green-600) to-(--color-green-700) text-white px-6 py-8 flex items-center gap-5">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-white font-bold text-xl">
          {currentUser ? getInitials(currentUser.displayName) : "?"}
        </div>
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {firstName}!</h1>
          <p className="text-green-100 text-sm mt-1">
            ECP member since {joinYear} · Lagos State Chapter
          </p>
        </div>
        <div className="ml-auto hidden sm:flex flex-col items-end gap-1">
          <span className="text-xs text-green-200 uppercase tracking-wide font-medium">
            {currentUser?.role}
          </span>
          <span className="text-lg font-semibold">{currentUser?.lga ?? "Lagos"}</span>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="rounded-xl border border-(--color-gold-300) bg-(--color-gold-50) px-5 py-4 flex items-start gap-3">
        <span className="text-xl">📢</span>
        <div>
          <p className="font-semibold text-(--color-gold-700) text-sm">Community Alert</p>
          <p className="text-(--color-gold-600) text-sm mt-0.5">
            Annual General Meeting scheduled for Q1 2025. Watch this space for the date announcement.
          </p>
        </div>
      </div>

      {/* Main Grid: Events + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <DashboardCard title="Upcoming Events" href="/events" linkLabel="Browse all">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-(--color-neutral-400) text-center py-4">No upcoming events.</p>
            ) : (
              <ul className="space-y-1">
                {upcomingEvents.map((ev) => (
                  <li key={ev.id}>
                    <Link
                      href={`/events/${ev.slug}`}
                      className="flex items-start gap-3 rounded-lg p-3 hover:bg-(--color-neutral-50) transition group"
                    >
                      <div className="flex-shrink-0 w-11 text-center">
                        <p className="text-xs font-medium text-(--color-neutral-400) uppercase leading-none">
                          {new Date(ev.date).toLocaleString("en", { month: "short" })}
                        </p>
                        <p className="text-2xl font-bold text-(--color-green-600) leading-tight">
                          {new Date(ev.date).getDate()}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-500 group-hover:text-(--color-green-600) transition truncate">
                          {ev.title}
                        </p>
                        <p className="text-xs text-(--color-neutral-400) mt-0.5">
                          {ev.location} · {ev.time ?? "TBD"}
                        </p>
                      </div>
                      <span className="ml-auto flex-shrink-0 rounded-md px-2 py-0.5 text-xs font-medium capitalize bg-(--color-green-50) text-(--color-green-700)">
                        {ev.type.replace("-", " ")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </DashboardCard>
        </div>

        <div>
          <DashboardCard title="Membership Status" href="/membership/status" linkLabel="View details">
            {application ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-(--color-neutral-500)">Status</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColors[application.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {application.status.replace("-", " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-(--color-neutral-500)">Application ID</span>
                  <span className="font-mono text-xs text-gray-500">{application.id.slice(0, 12)}…</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-(--color-neutral-500)">Submitted</span>
                  <span className="text-xs text-gray-500">{formatDate(application.appliedAt)}</span>
                </div>
                {application.status === "approved" && (
                  <div className="rounded-lg bg-(--color-green-50) border border-(--color-green-200) p-3 text-center">
                    <p className="text-xs font-semibold text-(--color-green-700)">🎉 Member in Good Standing</p>
                    <p className="text-xs text-(--color-green-600) mt-0.5">Dues: Paid (2024–2025)</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 space-y-3">
                <p className="text-sm text-(--color-neutral-500)">No application found.</p>
                <Link
                  href="/membership/apply"
                  className="inline-block rounded-lg bg-(--color-green-600) px-4 py-2 text-xs font-semibold text-white hover:bg-(--color-green-700) transition"
                >
                  Apply for Membership
                </Link>
              </div>
            )}
          </DashboardCard>
        </div>
      </div>

      {/* Announcements & Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DashboardCard title="Latest Announcements" href="/news">
          {latestNews.length === 0 ? (
            <p className="text-sm text-(--color-neutral-400) text-center py-4">No announcements.</p>
          ) : (
            <ul className="space-y-3 divide-y divide-(--color-neutral-100)">
              {latestNews.map((post) => (
                <li key={post.id} className="pt-3 first:pt-0">
                  <p className="text-sm font-medium text-gray-500 line-clamp-2">{post.title}</p>
                  <p className="text-xs text-(--color-neutral-400) mt-0.5">
                    {formatDate(post.publishedAt ?? post.createdAt)} · <span className="capitalize">{post.category}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        <DashboardCard title="Member Directory" href="/members">
          {members.length === 0 ? (
            <p className="text-sm text-(--color-neutral-400) text-center py-4">No members found.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-(--color-neutral-50) transition">
                  {m.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.avatarUrl} alt={m.displayName} className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-(--color-green-100) text-(--color-green-700) text-xs font-semibold">
                      {getInitials(m.displayName)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-500 truncate">{m.displayName}</p>
                    <p className="text-xs text-(--color-neutral-400) capitalize truncate">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>
      </div>

      {/* Documents Preview */}
      <DashboardCard title="My Documents">
        {application?.documents && application.documents.length > 0 ? (
          <ul className="space-y-2">
            {application.documents.map((doc, i) => (
              <li key={i} className="flex items-center gap-3 rounded-lg border border-(--color-neutral-200) px-4 py-2.5">
                <span className="text-lg">📄</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-500 truncate">{doc.name}</p>
                  <p className="text-xs text-(--color-neutral-400)">{doc.simulatedSize ?? ""}</p>
                </div>
                <span className="ml-auto text-xs text-(--color-green-600) font-medium">Uploaded</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-6 space-y-2">
            <p className="text-sm text-(--color-neutral-400)">No documents uploaded yet.</p>
            {application && (
              <Link href="/membership/status" className="inline-block text-xs text-(--color-green-600) font-medium hover:underline">
                Upload via Application Status →
              </Link>
            )}
          </div>
        )}
      </DashboardCard>
    </div>
  );
}

