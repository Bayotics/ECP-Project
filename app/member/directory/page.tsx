"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { useUsers } from "@/context/UsersContext";
import { useAuth } from "@/context/AuthContext";
import { useIsClient } from "@/components/gsap/useReveal";
import { cn } from "@/utils/cn";
import { EKO } from "@/lib/content/programs";
import {
  MEMBERS,
  MEMBER_FOCUS_Y,
  MEMBER_STATS,
  MEMBER_ZOOM,
  OFFICE_LABEL,
  byTenure,
  initials,
  type Member,
  type Office,
} from "@/lib/content/members";
import {
  Chip,
  EmptyPanel,
  GhostButton,
  PageHeader,
  Panel,
  PanelHeading,
  Pill,
  SearchInput,
  StatTile,
  Toolbar,
  selectClass,
} from "@/components/portal/ui";

type Group = "all" | Office | "member";

const GROUPS: { value: Group; label: string; color: string }[] = [
  { value: "all", label: "Everyone", color: "#0a0a0a" },
  { value: "exco", label: OFFICE_LABEL.exco, color: EKO.green },
  { value: "trustees", label: OFFICE_LABEL.trustees, color: EKO.blue },
  { value: "patron", label: OFFICE_LABEL.patron, color: EKO.yellow },
  { value: "member", label: "Members", color: EKO.red },
];

const OFFICE_COLOR: Record<Office, string> = {
  exco: EKO.green,
  trustees: EKO.blue,
  patron: EKO.yellow,
};

const colorFor = (m: Member) => (m.office ? OFFICE_COLOR[m.office] : EKO.red);

/* The badge artwork carries the member's name and role along its bottom
   edge, which is unreadable at card size, so the card crops into the
   portrait and sets the name as real text. The crop places the focus point
   (a percentage down the badge) at the centre of the square frame. */
function Portrait({ member, className }: { member: Member; className?: string }) {
  const focusY = member.focusY ?? MEMBER_FOCUS_Y;
  if (!member.photo) {
    return (
      <span
        className={cn("flex items-center justify-center rounded-2xl bg-neutral-100 text-2xl font-normal text-neutral-500", className)}
        aria-hidden="true"
      >
        {initials(member.name)}
      </span>
    );
  }
  return (
    <span className={cn("relative block overflow-hidden rounded-2xl bg-neutral-100", className)}>
      <span
        className="absolute block"
        style={{
          width: `${MEMBER_ZOOM * 100}%`,
          height: `${MEMBER_ZOOM * 100}%`,
          left: `${50 - MEMBER_ZOOM * 50}%`,
          top: `${50 - MEMBER_ZOOM * focusY}%`,
        }}
      >
        <Image src={member.photo} alt={member.name} fill sizes="320px" className="object-cover" />
      </span>
    </span>
  );
}

function MemberCard({ member, onOpen }: { member: Member; onOpen: () => void }) {
  const color = colorFor(member);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white text-left transition-colors hover:border-neutral-400"
    >
      <Portrait member={member} className="aspect-square w-full rounded-none" />
      <span className="flex flex-1 flex-col p-5">
        <span className="flex items-center gap-2 text-[11px] font-normal uppercase tracking-[0.16em] text-neutral-500">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />
          {member.role}
        </span>
        <span className="mt-2 block text-base font-normal leading-snug tracking-[-0.01em] text-neutral-950">{member.name}</span>
        <span className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600">
          {member.joined && <span>Member since {member.joined}</span>}
          {member.bio && <span className="text-green-700">Read bio</span>}
        </span>
      </span>
    </button>
  );
}

function MemberDrawer({ member, onClose }: { member: Member; onClose: () => void }) {
  const isClient = useIsClient();
  const color = colorFor(member);

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
    member.joined && { label: "Member since", value: member.joinedNote ?? String(member.joined) },
    member.profession && { label: "Profession", value: member.profession },
    member.from && { label: "Lagos connection", value: member.from },
  ].filter(Boolean) as { label: string; value: string }[];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={member.name}
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
            <p className="flex items-center gap-2 text-[11px] font-normal uppercase tracking-[0.18em] text-neutral-500">
              <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />
              {member.role}
            </p>
            <h2 className="mt-2 text-2xl font-normal tracking-[-0.02em] text-neutral-950 sm:text-3xl">{member.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="grid gap-7 px-6 py-7 sm:px-8 lg:grid-cols-[minmax(0,17rem)_1fr]">
          <div>
            {member.photo ? (
              /* The whole badge, as the club drew it, name and all. */
              <Image
                src={member.photo}
                alt={`${member.name}, ${member.role}`}
                width={1100}
                height={1100}
                sizes="(max-width: 1024px) 80vw, 272px"
                className="w-full rounded-2xl"
              />
            ) : (
              <Portrait member={member} className="aspect-square w-full" />
            )}
          </div>

          <div>
            {facts.length > 0 && (
              <dl className="grid gap-3 sm:grid-cols-2">
                {facts.map((f) => (
                  <div key={f.label} className="rounded-2xl border border-neutral-200 p-4">
                    <dt className="text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-500">{f.label}</dt>
                    <dd className="mt-1 text-sm leading-6 text-neutral-900">{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {member.bio ? (
              <div className="mt-6 space-y-4">
                {member.bio.map((p) => (
                  <p key={p.slice(0, 32)} className="text-sm leading-7 text-black">
                    {p}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm leading-7 text-neutral-600">
                No biography has been supplied yet. Members can send theirs to the Secretary using the bio and photo
                template, and it will appear here.
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
  const { users } = useUsers();
  const { currentUser } = useAuth();

  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<Group>("all");
  const [sort, setSort] = useState<"tenure" | "name" | "newest">("tenure");
  const [selected, setSelected] = useState<Member | null>(null);

  const counts = useMemo(() => {
    const map = new Map<Group, number>();
    for (const m of MEMBERS) {
      const key: Group = m.office ?? "member";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = MEMBERS.filter((m) => {
      if (group !== "all") {
        const key: Group = m.office ?? "member";
        if (key !== group) return false;
      }
      if (!q) return true;
      return [m.name, m.role, m.profession ?? "", m.from ?? "", String(m.joined ?? "")]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    list = [...list];
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "newest") list.sort((a, b) => (b.joined ?? 0) - (a.joined ?? 0) || a.name.localeCompare(b.name));
    else list.sort(byTenure);
    return list;
  }, [search, group, sort]);

  /* Accounts that exist in the portal but are not on the club's roster
     file: newly approved members, and the admin accounts. Listed apart so
     the roster itself stays exactly what the club supplied. */
  const extraAccounts = useMemo(() => {
    const known = new Set(
      MEMBERS.map((m) => m.name.toLowerCase().replace(/^(hon\.|chief|dr\.?|otunba|alhaja|alhaji|elder|\(dr\)|\(dr\.\))\s*/gi, "").trim()),
    );
    return users
      .filter((u) => u.role !== "guest")
      .filter((u) => !known.has(u.displayName.toLowerCase().trim()))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [users]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <PageHeader
        eyebrow="Member portal"
        title="Member directory"
        lede="Everyone on the club roster, longest serving first. Open a card for the full spotlight badge and, where one has been supplied, a biography."
        actions={
          <>
            <GhostButton href="/member/committees">Committees</GhostButton>
            <GhostButton href="/about#exco">Public Exco page</GhostButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile value={MEMBER_STATS.total} label="On the roster" color={EKO.green} />
        <StatTile value={MEMBER_STATS.exco + MEMBER_STATS.trustees} label="Exco and trustees" color={EKO.blue} />
        <StatTile value={MEMBER_STATS.patrons} label="Matrons and patrons" color={EKO.yellow} />
        <StatTile value={MEMBER_STATS.earliest} label="Longest serving since" color={EKO.red} note="Hon. Bola and Hon. Olabisi Okoya" />
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
        <span className="ml-auto text-sm text-neutral-600">
          {visible.length} of {MEMBER_STATS.total}
        </span>
      </Toolbar>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter the directory">
        {GROUPS.map((g) => (
          <Chip
            key={g.value}
            active={g.value === group}
            color={g.color}
            onClick={() => setGroup(g.value)}
            count={g.value === "all" ? MEMBER_STATS.total : counts.get(g.value)}
          >
            {g.label}
          </Chip>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyPanel
          title="Nobody matches that search."
          body="Try a different name, role or year."
          action={
            <GhostButton
              onClick={() => {
                setSearch("");
                setGroup("all");
              }}
            >
              Show everyone
            </GhostButton>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((m) => (
            <MemberCard key={m.slug} member={m} onOpen={() => setSelected(m)} />
          ))}
        </div>
      )}

      {extraAccounts.length > 0 && (
        <Panel>
          <PanelHeading
            title="Portal accounts"
            note="Signed-up accounts that are not on the roster file yet. The Secretary adds them to the roster once their spotlight badge is ready."
          />
          <ul className="divide-y divide-neutral-100">
            {extraAccounts.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-normal text-neutral-600">
                  {u.displayName
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-normal text-neutral-950">
                    {u.displayName}
                    {u.id === currentUser?.id && <span className="ml-2 text-xs text-neutral-500">(you)</span>}
                  </span>
                  {u.occupation && <span className="block text-xs text-neutral-600">{u.occupation}</span>}
                </span>
                <Pill tone={u.role === "member" ? "green" : "blue"}>{u.role.replace("-", " ")}</Pill>
                <span className="text-xs text-neutral-500">Joined {new Date(u.joinedAt).getFullYear()}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <p className="text-xs leading-6 text-neutral-500">
        Phone numbers, email addresses and home addresses are held in the club database and are deliberately not
        published here. Ask the Secretary if you need to reach a member directly.
      </p>

      {selected && <MemberDrawer member={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
