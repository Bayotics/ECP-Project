"use client";

/* Member dashboard.

   Every value on this page is read from the API and nothing is invented.
   Where a record exists but a field is empty, the page prints N/A rather
   than substituting a plausible looking default: the old version filled in
   "Lagos" for a missing Lagos origin, the current year for a missing
   join date, "TBD" for a missing event time and "Member" for a missing
   committee role, none of which the database actually said.

   Sources, all backend:
     currentUser            /api/auth/session   (AuthContext)
     events                 /api/events         (EventsContext)
     rsvps                  /api/rsvps          (RSVPContext)
     news                   /api/news           (NewsContext)
     application            /api/membership-applications (MembershipContext)
     committees             /api/committees     (CommitteesContext)
     users                  /api/users          (UsersContext)
     dues                   /api/dues           (fetched here) */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useEvents } from "@/context/EventsContext";
import { useNews } from "@/context/NewsContext";
import { useMembership } from "@/context/MembershipContext";
import { useUsers } from "@/context/UsersContext";
import { useCommittees } from "@/context/CommitteesContext";
import { useRSVP } from "@/context/RSVPContext";
import type { DuesPayment } from "@/lib/models";
import { EKO } from "@/lib/content/programs";
import { GhostButton, PageHeader, Panel, PanelHeading, Pill, PrimaryButton, StatTile } from "@/components/portal/ui";

/* Dates arrive as ISO strings and are formatted in UTC so the server and a
   reader in another timezone never disagree about the day. */
const dayFormat = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric", year: "numeric" });
const shortFormat = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" });
const monthFormat = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short" });
const dayNumFormat = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", day: "numeric" });

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

/** Renders a backend value, or N/A when the backend has nothing for it. */
function Value({ children, loading }: { children?: React.ReactNode; loading?: boolean }) {
  if (loading) return <span className="text-neutral-800">…</span>;
  const empty =
    children === null ||
    children === undefined ||
    children === "" ||
    (typeof children === "string" && children.trim() === "");
  if (empty) return <span className="text-neutral-800">N/A</span>;
  return <>{children}</>;
}

function Row({ label, children, loading }: { label: string; children?: React.ReactNode; loading?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-900">{label}</dt>
      <dd className="text-right text-sm font-normal text-neutral-900">
        <Value loading={loading}>{children}</Value>
      </dd>
    </div>
  );
}

const STATUS_TONE: Record<string, "green" | "yellow" | "blue" | "red" | "neutral"> = {
  approved: "green",
  pending: "yellow",
  "under-review": "blue",
  interview: "blue",
  rejected: "red",
};

const DUES_TONE: Record<DuesPayment["status"], "green" | "yellow" | "red" | "neutral"> = {
  paid: "green",
  pending: "yellow",
  overdue: "red",
  waived: "neutral",
};

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

/** The signed-in member's dues records, straight from /api/dues. */
function useMyDues() {
  const [dues, setDues] = useState<DuesPayment[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/dues");
        const json = (await res.json()) as { ok: boolean; data?: DuesPayment[] };
        if (!active) return;
        setDues(json.ok && json.data ? json.data : []);
      } catch {
        if (active) setDues([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  return { dues, loading };
}

export default function MemberDashboardPage() {
  const { currentUser } = useAuth();
  const { events, isLoading: eventsLoading, getUpcoming } = useEvents();
  const { isLoading: newsLoading, getPublished } = useNews();
  const { isLoading: membershipLoading, getByEmail, getByUserId } = useMembership();
  const { users, isLoading: usersLoading } = useUsers();
  const { isLoading: committeesLoading, getActive: getActiveCommittees } = useCommittees();
  const { rsvps, isLoading: rsvpsLoading } = useRSVP();
  const { dues, loading: duesLoading } = useMyDues();

  const upcomingEvents = getUpcoming().slice(0, 4);
  const upcomingCount = getUpcoming().length;
  const allCommittees = getActiveCommittees();
  const myCommittees = allCommittees.filter((c) => c.members.some((m) => m.userId === currentUser?.id));
  const latestNews = getPublished().slice(0, 3);
  const application = currentUser ? getByEmail(currentUser.email) ?? getByUserId(currentUser.id) : null;
  const directory = users.filter((u) => u.role === "member" || u.role === "admin" || u.role === "super-admin");
  const myRsvps = currentUser ? rsvps.filter((r) => r.userId === currentUser.id && r.status !== "cancelled") : [];

  /* Dues for the year the club is currently collecting, taken as the most
     recent year the backend holds a record for rather than assumed from the
     clock. */
  const latestDues = dues && dues.length > 0 ? [...dues].sort((a, b) => b.year - a.year)[0] : null;

  const firstName = currentUser?.firstName?.trim() || currentUser?.displayName?.split(" ")[0]?.trim() || "";
  const joinYear = currentUser?.joinedAt ? new Date(currentUser.joinedAt).getUTCFullYear() : null;
  const lastLogin = currentUser?.lastLoginAt ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <PageHeader
        eyebrow="Member portal"
        title={firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        lede=""
        actions={
          <>
            <GhostButton href="/member/profile">Edit my profile</GhostButton>
            <GhostButton href="/member/directory">Member directory</GhostButton>
          </>
        }
      />

      {/* ─── Who the database says you are ─── */}
      <Panel>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-normal text-white"
            style={{ background: EKO.green }}
            aria-hidden="true"
          >
            {currentUser ? initialsOf(currentUser.displayName) : "?"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-normal tracking-[-0.02em] text-neutral-950">
              <Value>{currentUser?.displayName}</Value>
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {currentUser?.role && <Pill tone="blue">{currentUser.role.replace("-", " ")}</Pill>}
              {currentUser?.status && <Pill tone={currentUser.status === "active" ? "green" : "neutral"}>{currentUser.status}</Pill>}
            </div>
            <dl className="mt-5 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              <Row label="Member since">{joinYear}</Row>
              <Row label="Occupation">{currentUser?.occupation}</Row>
              <Row label="Lagos origin">{currentUser?.lagosOrigin}</Row>
              <Row label="Phone">{currentUser?.phone}</Row>
              <Row label="Email">{currentUser?.email}</Row>
              <Row label="Last signed in">{lastLogin ? dayFormat.format(new Date(lastLogin)) : undefined}</Row>
            </dl>
          </div>
        </div>
      </Panel>

      {/* ─── Counts, all derived from records ─── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          value={eventsLoading ? "…" : upcomingCount}
          label="Upcoming events"
          color={EKO.green}
          note={eventsLoading ? undefined : `${events.length} in the calendar`}
        />
        <StatTile
          value={rsvpsLoading ? "…" : myRsvps.length}
          label="My RSVPs"
          color={EKO.blue}
          note={rsvpsLoading ? undefined : "Not cancelled"}
        />
        <StatTile
          value={committeesLoading ? "…" : myCommittees.length}
          label="My committees"
          color={EKO.yellow}
          note={committeesLoading ? undefined : `${allCommittees.length} active in the club`}
        />
        <StatTile
          value={duesLoading ? "…" : latestDues ? latestDues.year : "N/A"}
          label="Latest dues year"
          color={EKO.red}
          note={duesLoading ? undefined : latestDues ? `${money(latestDues.amount)} ${latestDues.status}` : "No dues records"}
        />
      </div>

      {/* ─── Events + membership ─── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel>
            <PanelHeading
              title="Upcoming events"
              note="Published events dated from today onward."
              action={
                <Link href="/member/events" className="text-sm font-normal text-green-700 hover:underline">
                  Browse all
                </Link>
              }
            />
            {eventsLoading ? (
              <ul className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <li key={i} className="h-16 animate-pulse rounded-2xl bg-neutral-100" />
                ))}
              </ul>
            ) : upcomingEvents.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-900">No upcoming events are in the calendar.</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {upcomingEvents.map((ev) => (
                  <li key={ev.id}>
                    <Link href={`/events/${ev.slug}`} className="group flex items-start gap-4 rounded-2xl px-2 py-3 transition-colors hover:bg-neutral-50">
                      <span className="w-12 shrink-0 text-center">
                        <span className="block text-[11px] font-normal uppercase tracking-[0.12em] text-neutral-900">
                          {monthFormat.format(new Date(ev.date))}
                        </span>
                        <span className="block text-2xl font-normal leading-tight tracking-[-0.03em]" style={{ color: EKO.green }}>
                          {dayNumFormat.format(new Date(ev.date))}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-normal text-neutral-950 transition-colors group-hover:text-green-700">
                          {ev.title}
                        </span>
                        <span className="mt-1 block text-xs text-neutral-900">
                          <Value>{ev.isOnline ? ev.location || "Online" : ev.location}</Value>
                          {" · "}
                          <Value>{ev.time}</Value>
                        </span>
                      </span>
                      <span className="shrink-0">
                        <Pill tone="green">{ev.type.replace("-", " ")}</Pill>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <Panel>
          <PanelHeading
            title="Membership"
            action={
              <Link href="/membership/status" className="text-sm font-normal text-green-700 hover:underline">
                Details
              </Link>
            }
          />
          {membershipLoading ? (
            <div className="h-32 animate-pulse rounded-2xl bg-neutral-100" />
          ) : application ? (
            <dl className="divide-y divide-neutral-100">
              <div className="flex items-baseline justify-between gap-4 py-2">
                <dt className="text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-900">Status</dt>
                <dd>
                  <Pill tone={STATUS_TONE[application.status] ?? "neutral"}>{application.status.replace("-", " ")}</Pill>
                </dd>
              </div>
              <Row label="Reference">{application.id}</Row>
              <Row label="Submitted">{shortFormat.format(new Date(application.appliedAt))}</Row>
              <Row label="Last reviewed">
                {application.reviewedAt ? shortFormat.format(new Date(application.reviewedAt)) : undefined}
              </Row>
            </dl>
          ) : (
            <div className="space-y-4 py-4 text-center">
              <p className="text-sm text-neutral-900">No application is on file for this account.</p>
              <PrimaryButton href="/membership/apply">Apply for membership</PrimaryButton>
            </div>
          )}

          {/* Dues, from /api/dues rather than a fixed line of copy. */}
          <div className="mt-6 border-t border-neutral-200 pt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-[11px] font-normal uppercase tracking-[0.16em] text-neutral-900">Dues</h3>
              <Link href="/member/dues" className="text-xs font-normal text-green-700 hover:underline">
                Manage
              </Link>
            </div>
            {duesLoading ? (
              <div className="h-16 animate-pulse rounded-2xl bg-neutral-100" />
            ) : latestDues ? (
              <dl className="divide-y divide-neutral-100">
                <div className="flex items-baseline justify-between gap-4 py-2">
                  <dt className="text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-900">{latestDues.year}</dt>
                  <dd>
                    <Pill tone={DUES_TONE[latestDues.status]}>{latestDues.status}</Pill>
                  </dd>
                </div>
                <Row label="Amount">{money(latestDues.amount)}</Row>
                <Row label="Due">{latestDues.dueDate ? shortFormat.format(new Date(latestDues.dueDate)) : undefined}</Row>
                <Row label="Paid">{latestDues.paidDate ? shortFormat.format(new Date(latestDues.paidDate)) : undefined}</Row>
                <Row label="Reference">{latestDues.reference}</Row>
              </dl>
            ) : (
              <p className="py-2 text-sm text-neutral-900">
                No dues records. <span className="text-neutral-800">N/A</span>
              </p>
            )}
          </div>
        </Panel>
      </div>

      {/* ─── News + directory ─── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeading
            title="Latest from the newsroom"
            action={
              <Link href="/news" className="text-sm font-normal text-green-700 hover:underline">
                View all
              </Link>
            }
          />
          {newsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-2xl bg-neutral-100" />
              ))}
            </div>
          ) : latestNews.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-900">Nothing has been published yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {latestNews.map((post) => (
                <li key={post.id} className="py-3 first:pt-0 last:pb-0">
                  <Link href={`/news/${post.slug}`} className="group block">
                    <p className="line-clamp-2 text-sm font-normal text-neutral-950 transition-colors group-hover:text-green-700">
                      {post.title}
                    </p>
                    <p className="mt-1 text-xs text-neutral-900">
                      <Value>{post.publishedAt ? shortFormat.format(new Date(post.publishedAt)) : undefined}</Value>
                      {" · "}
                      <span className="capitalize">{post.category.replace("-", " ")}</span>
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <PanelHeading
            title="Member directory"
            note={usersLoading ? undefined : `${directory.length} account${directory.length === 1 ? "" : "s"} in the portal`}
            action={
              <Link href="/member/directory" className="text-sm font-normal text-green-700 hover:underline">
                View all
              </Link>
            }
          />
          {usersLoading ? (
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-2xl bg-neutral-100" />
              ))}
            </div>
          ) : directory.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-900">No portal accounts yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {directory.slice(0, 6).map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-2xl p-2">
                  {m.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-normal text-neutral-900">
                      {initialsOf(m.displayName)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-normal text-neutral-950">{m.displayName}</p>
                    <p className="truncate text-xs capitalize text-neutral-900">{m.role.replace("-", " ")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* ─── Committees ─── */}
      <Panel>
        <PanelHeading
          title="My committees"
          note={committeesLoading ? undefined : `${allCommittees.length} active committee${allCommittees.length === 1 ? "" : "s"} in the club`}
          action={
            <Link href="/member/committees" className="text-sm font-normal text-green-700 hover:underline">
              View all
            </Link>
          }
        />
        {committeesLoading ? (
          <div className="h-20 animate-pulse rounded-2xl bg-neutral-100" />
        ) : myCommittees.length === 0 ? (
          <div className="space-y-4 py-4 text-center">
            <p className="text-sm text-neutral-900">You are not on any committee yet.</p>
            <PrimaryButton href="/member/committees">Browse committees</PrimaryButton>
          </div>
        ) : (
          <ul className="space-y-2">
            {myCommittees.map((c) => {
              const mine = c.members.find((m) => m.userId === currentUser?.id);
              const chair = c.members.find((m) => m.isChairperson);
              return (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-normal text-neutral-950">{c.name}</p>
                    <p className="mt-0.5 text-xs text-neutral-900">
                      My role: <Value>{mine?.role}</Value>
                      {" · "}
                      Chair: <Value>{chair?.name}</Value>
                    </p>
                  </div>
                  <Pill tone="green">{c.type.replace(/-/g, " ")}</Pill>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {/* ─── Documents filed with the application ─── */}
      {/* <Panel>
        <PanelHeading
          title="My documents"
          note="Files attached to your membership application."
          action={
            <Link href="/member/documents" className="text-sm font-normal text-green-700 hover:underline">
              Club library
            </Link>
          }
        />
        {membershipLoading ? (
          <div className="h-16 animate-pulse rounded-2xl bg-neutral-100" />
        ) : application?.documents && application.documents.length > 0 ? (
          <ul className="space-y-2">
            {application.documents.map((doc, i) => (
              <li key={doc.id || `${doc.name}-${i}`} className="flex flex-wrap items-center gap-4 rounded-2xl border border-neutral-200 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-normal text-neutral-950">
                    <Value>{doc.name}</Value>
                  </span>
                  <span className="mt-0.5 block text-xs text-neutral-900">
                    <Value>{doc.label}</Value>
                    {" · "}
                    <Value>{doc.simulatedSize}</Value>
                    {" · "}
                    <Value>{doc.uploadedAt ? shortFormat.format(new Date(doc.uploadedAt)) : undefined}</Value>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-3 py-4 text-center">
            <p className="text-sm text-neutral-900">No documents are attached to your application.</p>
            {application && <GhostButton href="/membership/status">Upload from your application</GhostButton>}
          </div>
        )}
      </Panel> */}
    </div>
  );
}
