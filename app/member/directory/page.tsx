"use client";

/* Member directory.
 *
 * Reads the users collection through /api/users, which is the same source
 * the dashboard counts, so the two can no longer disagree. The roster was
 * seeded from the club's own spreadsheet and badge artwork by
 * scripts/seed-members.mjs.
 *
 * Contact details come back in the API response because this is a members
 * only endpoint, but the page deliberately does not render them. */

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { useUsers } from "@/context/UsersContext";
import { useAuth } from "@/context/AuthContext";
import { useIsClient } from "@/components/gsap/useReveal";
import { cn } from "@/utils/cn";
import { EKO } from "@/lib/content/programs";
import type { User, UserOffice } from "@/lib/models/user";
import {
  Chip,
  EmptyPanel,
  GhostButton,
  PageHeader,
  Pill,
  SearchInput,
  StatTile,
  Toolbar,
  selectClass,
} from "@/components/portal/ui";

type Group = "all" | UserOffice | "member";

const OFFICE_LABEL: Record<UserOffice, string> = {
  exco: "Executive Council",
  trustees: "Board of Trustees",
  patron: "Matrons and patrons",
};

const OFFICE_COLOR: Record<UserOffice, string> = {
  exco: EKO.green,
  trustees: EKO.blue,
  patron: EKO.yellow,
};

const GROUPS: { value: Group; label: string; color: string }[] = [
  { value: "all", label: "Everyone", color: "#0a0a0a" },
  { value: "exco", label: OFFICE_LABEL.exco, color: EKO.green },
  { value: "trustees", label: OFFICE_LABEL.trustees, color: EKO.blue },
  { value: "patron", label: OFFICE_LABEL.patron, color: EKO.yellow },
  { value: "member", label: "Members", color: EKO.red },
];

const groupOf = (u: User): Group => u.office ?? "member";
const colorFor = (u: User) => (u.office ? OFFICE_COLOR[u.office] : EKO.red);

/* The club's spotlight badges are square artwork with the person's name and
   role printed across the bottom, which is a smudge at card size. Avatars
   still served from /public get cropped into the portrait here and the name
   is set as real text. Anything else, including images already cropped on
   upload, is shown as it comes. */
const BADGE_PREFIX = "/gallery/members/";
const BADGE_ZOOM = 2.3;
const BADGE_FOCUS_Y = 34;
const isBadge = (url?: string) => Boolean(url?.startsWith(BADGE_PREFIX));

function initialsOf(name: string) {
  const parts = name
    .replace(/^(Hon\.|Chief|Dr\.?|Otunba|Alhaja|Alhaji|Elder|\(Dr\)|\(Dr\.\))\s*/gi, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

const joinYearOf = (u: User) => {
  if (!u.joinedAt) return null;
  const year = new Date(u.joinedAt).getUTCFullYear();
  return Number.isNaN(year) ? null : year;
};

/** Longest serving first, then alphabetical; unknown join dates last. */
function byTenure(a: User, b: User) {
  const ya = joinYearOf(a);
  const yb = joinYearOf(b);
  if (ya && yb && ya !== yb) return ya - yb;
  if (ya && !yb) return -1;
  if (!ya && yb) return 1;
  return a.displayName.localeCompare(b.displayName);
}

function Portrait({ user, className }: { user: User; className?: string }) {
  if (!user.avatarUrl) {
    return (
      <span
        className={cn("flex items-center justify-center bg-neutral-100 text-2xl font-normal text-neutral-900", className)}
        aria-hidden="true"
      >
        {initialsOf(user.displayName)}
      </span>
    );
  }
  if (!isBadge(user.avatarUrl)) {
    return (
      <span className={cn("relative block overflow-hidden bg-neutral-100", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
      </span>
    );
  }
  return (
    <span className={cn("relative block overflow-hidden bg-neutral-100", className)}>
      <span
        className="absolute block"
        style={{
          width: `${BADGE_ZOOM * 100}%`,
          height: `${BADGE_ZOOM * 100}%`,
          left: `${50 - BADGE_ZOOM * 50}%`,
          top: `${50 - BADGE_ZOOM * BADGE_FOCUS_Y}%`,
        }}
      >
        <Image src={user.avatarUrl} alt={user.displayName} fill sizes="320px" className="object-cover" />
      </span>
    </span>
  );
}

function MemberCard({ user, onOpen }: { user: User; onOpen: () => void }) {
  const color = colorFor(user);
  const year = joinYearOf(user);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white text-left transition-colors hover:border-neutral-400"
    >
      <Portrait user={user} className="aspect-square w-full" />
      <span className="flex flex-1 flex-col p-5">
        <span className="flex items-center gap-2 text-[11px] font-normal uppercase tracking-[0.16em] text-neutral-900">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />
          {user.title ?? <span className="text-neutral-800">N/A</span>}
        </span>
        <span className="mt-2 block text-base font-normal leading-snug tracking-[-0.01em] text-neutral-950">
          {user.displayName}
        </span>
        <span className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-900">
          <span>{year ? `Member since ${year}` : <span className="text-neutral-800">Joined N/A</span>}</span>
          {user.bio && <span className="text-green-700">Read bio</span>}
        </span>
      </span>
    </button>
  );
}

function MemberDrawer({ user, onClose }: { user: User; onClose: () => void }) {
  const isClient = useIsClient();
  const color = colorFor(user);
  const year = joinYearOf(user);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!isClient) return null;

  const facts = [
    { label: "Member since", value: year ? String(year) : null },
    { label: "Profession", value: user.occupation ?? null },
    { label: "Lagos origin", value: user.lagosOrigin ?? null },
    { label: "Portal role", value: user.role.replace("-", " ") },
  ];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={user.displayName}
      data-lenis-prevent
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 [animation:viewer-in_220ms_ease-out]"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-neutral-950/70 backdrop-blur-sm" />
      <div
        className="relative max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[1.75rem] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-1.5 w-full" aria-hidden="true">
          {[EKO.green, EKO.red, EKO.blue, EKO.yellow].map((c) => (
            <div key={c} className="flex-1" style={{ background: c }} />
          ))}
        </div>

        <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-8">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-normal uppercase tracking-[0.18em] text-neutral-900">
              <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />
              {user.title ?? "N/A"}
            </p>
            <h2 className="mt-2 text-2xl font-normal tracking-[-0.02em] text-neutral-950 sm:text-3xl">{user.displayName}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-900 transition-colors hover:bg-neutral-200"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="grid gap-7 px-6 py-7 sm:px-8 lg:grid-cols-[minmax(0,17rem)_1fr]">
          <div>
            {user.avatarUrl ? (
              /* The whole badge, as the club drew it, name and all. */
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={`${user.displayName}, ${user.title ?? user.role}`} className="w-full rounded-2xl" />
            ) : (
              <Portrait user={user} className="aspect-square w-full rounded-2xl" />
            )}
          </div>

          <div>
            <dl className="grid gap-3 sm:grid-cols-2">
              {facts.map((f) => (
                <div key={f.label} className="rounded-2xl border border-neutral-200 p-4">
                  <dt className="text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-900">{f.label}</dt>
                  <dd className="mt-1 text-sm capitalize leading-6 text-neutral-900">
                    {f.value ?? <span className="text-neutral-800">N/A</span>}
                  </dd>
                </div>
              ))}
            </dl>

            {user.bio ? (
              <div className="mt-6 space-y-4">
                {user.bio.split("\n\n").map((p) => (
                  <p key={p.slice(0, 32)} className="text-sm leading-7 text-black">
                    {p}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm leading-7 text-neutral-900">
                No biography is on file. Members can send theirs to the Secretary using the bio and photo template and
                it will appear here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function DirectoryPage() {
  const { users, isLoading } = useUsers();
  const { currentUser } = useAuth();

  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<Group>("all");
  const [sort, setSort] = useState<"tenure" | "name" | "newest">("tenure");
  const [selected, setSelected] = useState<User | null>(null);

  /* Applicants and guests are not on the roster. */
  const roster = useMemo(
    () => users.filter((u) => u.role === "member" || u.role === "admin" || u.role === "super-admin"),
    [users],
  );

  const counts = useMemo(() => {
    const map = new Map<Group, number>();
    for (const u of roster) {
      const key = groupOf(u);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [roster]);

  const officers = (counts.get("exco") ?? 0) + (counts.get("trustees") ?? 0);
  const earliest = useMemo(() => {
    const years = roster.map(joinYearOf).filter((y): y is number => y !== null);
    return years.length ? Math.min(...years) : null;
  }, [roster]);
  const founders = useMemo(
    () => (earliest ? roster.filter((u) => joinYearOf(u) === earliest).map((u) => u.displayName) : []),
    [roster, earliest],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = roster.filter((u) => {
      if (group !== "all" && groupOf(u) !== group) return false;
      if (!q) return true;
      return [u.displayName, u.title ?? "", u.occupation ?? "", u.lagosOrigin ?? "", String(joinYearOf(u) ?? "")]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    const sorted = [...list];
    if (sort === "name") sorted.sort((a, b) => a.displayName.localeCompare(b.displayName));
    else if (sort === "newest") sorted.sort((a, b) => (joinYearOf(b) ?? 0) - (joinYearOf(a) ?? 0) || a.displayName.localeCompare(b.displayName));
    else sorted.sort(byTenure);
    return sorted;
  }, [roster, search, group, sort]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <PageHeader
        eyebrow="Member portal"
        title="Member directory"
        lede="Everyone on the club roster, longest serving first, read live from the club database. Open a card for the full spotlight badge and, where one has been supplied, a biography."
        actions={
          <>
            <GhostButton href="/member/committees">Committees</GhostButton>
            <GhostButton href="/about#patrons">Public Exco page</GhostButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile value={isLoading ? "…" : roster.length} label="On the roster" color={EKO.green} />
        <StatTile value={isLoading ? "…" : officers} label="Exco and trustees" color={EKO.blue} />
        <StatTile value={isLoading ? "…" : counts.get("patron") ?? 0} label="Matrons and patrons" color={EKO.yellow} />
        <StatTile
          value={isLoading ? "…" : earliest ?? "N/A"}
          label="Longest serving since"
          color={EKO.red}
          note={founders.length ? founders.join(" and ") : undefined}
        />
      </div>

      <Toolbar>
        <SearchInput
          id="directory-search"
          label="Search the directory"
          value={search}
          onChange={setSearch}
          placeholder="Search by name, role or profession"
          className="w-full max-w-sm flex-1"
        />
        <label htmlFor="directory-sort" className="sr-only">
          Sort
        </label>
        <select id="directory-sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={selectClass}>
          <option value="tenure">Longest serving first</option>
          <option value="newest">Newest first</option>
          <option value="name">Name, A to Z</option>
        </select>
        <span className="ml-auto text-sm text-neutral-900">
          {isLoading ? "Loading…" : `${visible.length} of ${roster.length}`}
        </span>
      </Toolbar>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter the directory">
        {GROUPS.map((g) => (
          <Chip
            key={g.value}
            active={g.value === group}
            color={g.color}
            onClick={() => setGroup(g.value)}
            count={g.value === "all" ? roster.length : counts.get(g.value)}
          >
            {g.label}
          </Chip>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-[1.5rem] bg-neutral-100" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyPanel
          title={roster.length === 0 ? "The roster is empty." : "Nobody matches that search."}
          body={
            roster.length === 0
              ? "No member accounts are in the database yet."
              : "Try a different name, role or year."
          }
          action={
            roster.length > 0 ? (
              <GhostButton
                onClick={() => {
                  setSearch("");
                  setGroup("all");
                }}
              >
                Show everyone
              </GhostButton>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((u) => (
            <MemberCard key={u.id} user={u} onOpen={() => setSelected(u)} />
          ))}
        </div>
      )}

      <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs leading-6 text-neutral-900">
        <Pill tone="neutral">{currentUser?.displayName ?? "Signed in"}</Pill>
        Email addresses, phone numbers and home addresses are held in the club database and are deliberately not shown
        here. Ask the Secretary if you need to reach a member directly.
      </p>

      {selected && <MemberDrawer user={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
