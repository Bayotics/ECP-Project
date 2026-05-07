"use client";

import { useState, useMemo } from "react";
import { useUsers } from "@/context/UsersContext";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@/lib/models/user";

const LAGOS_LGAS = [
  "Agege","Ajeromi-Ifelodun","Alimosho","Amuwo-Odofin","Apapa",
  "Badagry","Epe","Eti-Osa","Ibeju-Lekki","Ifako-Ijaiye",
  "Ikeja","Ikorodu","Kosofe","Lagos Island","Lagos Mainland",
  "Mushin","Ojo","Oshodi-Isolo","Shomolu","Surulere",
];

const ROLE_OPTIONS = ["member", "admin", "super-admin"] as const;

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function Avatar({ user, size = "md" }: { user: User; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-16 w-16 text-xl" : size === "sm" ? "h-8 w-8 text-xs" : "h-11 w-11 text-sm";
  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={user.avatarUrl} alt={user.displayName}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0`} />
    );
  }
  return (
    <span className={`${sizeClass} flex flex-shrink-0 items-center justify-center rounded-full bg-(--color-green-100) text-(--color-green-700) font-semibold`}>
      {getInitials(user.displayName)}
    </span>
  );
}

function ProfileModal({ user, onClose, onContact }: { user: User; onClose: () => void; onContact: (u: User) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-(--color-green-600) to-(--color-green-700) px-6 pt-8 pb-14 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition text-xl">✕</button>
        </div>
        {/* Avatar overlap */}
        <div className="px-6 -mt-10 pb-5">
          <div className="flex items-end gap-4 mb-4">
            <div className="ring-4 ring-white rounded-full">
              <Avatar user={user} size="lg" />
            </div>
            <div className="pb-1">
              <p className="text-xl font-bold text-(--foreground)">{user.displayName}</p>
              <span className="inline-block rounded-full bg-(--color-green-100) text-(--color-green-700) px-2 py-0.5 text-xs font-medium capitalize">
                {user.role}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {user.occupation && (
              <Row label="Occupation" value={user.occupation} />
            )}
            {user.lga && (
              <Row label="LGA" value={user.lga} />
            )}
            {user.ward && (
              <Row label="Ward" value={user.ward} />
            )}
            {user.bio && (
              <div>
                <p className="text-xs text-(--color-neutral-400) font-medium uppercase tracking-wide mb-1">Bio</p>
                <p className="text-sm text-(--color-neutral-700) leading-relaxed">{user.bio}</p>
              </div>
            )}
            <Row label="Member since" value={new Date(user.joinedAt).getFullYear().toString()} />
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={() => onContact(user)}
              className="flex-1 rounded-lg bg-(--color-green-600) py-2.5 text-sm font-semibold text-white hover:bg-(--color-green-700) transition"
            >
              ✉ Send message
            </button>
            <button
              onClick={onClose}
              className="rounded-lg border border-(--color-neutral-300) px-4 py-2.5 text-sm font-medium text-(--color-neutral-600) hover:bg-(--color-neutral-50) transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-(--color-neutral-400) font-medium uppercase tracking-wide">{label}</span>
      <span className="text-sm text-(--foreground) font-medium">{value}</span>
    </div>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-(--foreground) text-white rounded-xl px-4 py-3 shadow-xl animate-in slide-in-from-bottom-4">
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="text-white/60 hover:text-white text-xs">✕</button>
    </div>
  );
}

export default function DirectoryPage() {
  const { users } = useUsers();
  const { currentUser } = useAuth();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [lgaFilter, setLgaFilter] = useState<string>("");
  const [selected, setSelected] = useState<User | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users
      .filter((u) => u.role !== "guest" && u.id !== currentUser?.id)
      .filter((u) =>
        !q ||
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.occupation ?? "").toLowerCase().includes(q)
      )
      .filter((u) => !roleFilter || u.role === roleFilter)
      .filter((u) => !lgaFilter || u.lga === lgaFilter);
  }, [users, search, roleFilter, lgaFilter, currentUser]);

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-(--foreground)">Member Directory</h1>
          <p className="text-sm text-(--color-neutral-500) mt-1">{filtered.length} member{filtered.length !== 1 ? "s" : ""} found</p>
        </div>
        {/* View toggle */}
        <div className="flex gap-1 bg-(--color-neutral-100) rounded-lg p-1">
          {(["grid", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1.5 text-sm transition ${view === v ? "bg-white shadow-sm text-(--foreground)" : "text-(--color-neutral-500)"}`}
            >
              {v === "grid" ? "⊞" : "☰"}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-(--color-neutral-200) p-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name, email or occupation…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 rounded-lg border border-(--color-neutral-300) px-3.5 py-2 text-sm outline-none focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200) transition"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-(--color-neutral-300) px-3.5 py-2 text-sm outline-none focus:border-(--color-green-500) transition"
        >
          <option value="">All roles</option>
          {ROLE_OPTIONS.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
        </select>
        <select
          value={lgaFilter}
          onChange={(e) => setLgaFilter(e.target.value)}
          className="rounded-lg border border-(--color-neutral-300) px-3.5 py-2 text-sm outline-none focus:border-(--color-green-500) transition"
        >
          <option value="">All LGAs</option>
          {LAGOS_LGAS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        {(search || roleFilter || lgaFilter) && (
          <button
            onClick={() => { setSearch(""); setRoleFilter(""); setLgaFilter(""); }}
            className="rounded-lg border border-(--color-neutral-200) px-3.5 py-2 text-sm text-(--color-neutral-500) hover:bg-(--color-neutral-50) transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-(--color-neutral-400)">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-medium">No members match your search</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((user) => (
            <button
              key={user.id}
              onClick={() => setSelected(user)}
              className="bg-white rounded-xl border border-(--color-neutral-200) p-5 text-left hover:border-(--color-green-300) hover:shadow-md transition group flex flex-col items-center text-center gap-3"
            >
              <Avatar user={user} size="lg" />
              <div>
                <p className="font-semibold text-(--foreground) group-hover:text-(--color-green-600) transition">{user.displayName}</p>
                {user.occupation && <p className="text-xs text-(--color-neutral-500) mt-0.5 truncate">{user.occupation}</p>}
                {user.lga && <p className="text-xs text-(--color-neutral-400) mt-0.5">{user.lga}</p>}
              </div>
              <span className="rounded-full bg-(--color-green-50) text-(--color-green-700) px-2.5 py-0.5 text-xs font-medium capitalize">
                {user.role}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-(--color-neutral-200) divide-y divide-(--color-neutral-100)">
          {filtered.map((user) => (
            <button
              key={user.id}
              onClick={() => setSelected(user)}
              className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-(--color-neutral-50) transition text-left group"
            >
              <Avatar user={user} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-(--foreground) group-hover:text-(--color-green-600) transition">{user.displayName}</p>
                {user.occupation && <p className="text-xs text-(--color-neutral-500) truncate">{user.occupation}</p>}
              </div>
              {user.lga && <span className="text-xs text-(--color-neutral-400) hidden sm:block">{user.lga}</span>}
              <span className="rounded-full bg-(--color-green-50) text-(--color-green-700) px-2.5 py-0.5 text-xs font-medium capitalize flex-shrink-0">
                {user.role}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <ProfileModal
          user={selected}
          onClose={() => setSelected(null)}
          onContact={(u) => {
            setSelected(null);
            showToast(`Message sent to ${u.displayName}! (demo — no real email sent)`);
          }}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
