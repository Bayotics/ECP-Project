"use client";

import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { usersDB } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/storage/keys";

const LAGOS_LGAS = [
  "Agege","Ajeromi-Ifelodun","Alimosho","Amuwo-Odofin","Apapa",
  "Badagry","Epe","Eti-Osa","Ibeju-Lekki","Ifako-Ijaiye",
  "Ikeja","Ikorodu","Kosofe","Lagos Island","Lagos Mainland",
  "Mushin","Ojo","Oshodi-Isolo","Shomolu","Surulere",
];

const PRIVACY_KEY = STORAGE_KEYS.USERS + "_privacy";

interface PrivacySettings {
  showEmail: boolean;
  showPhone: boolean;
  showOccupation: boolean;
  showBio: boolean;
  showInDirectory: boolean;
}

const DEFAULT_PRIVACY: PrivacySettings = {
  showEmail: false,
  showPhone: false,
  showOccupation: true,
  showBio: true,
  showInDirectory: true,
};

function loadPrivacy(userId: string): PrivacySettings {
  if (typeof window === "undefined") return DEFAULT_PRIVACY;
  try {
    const raw = localStorage.getItem(`${PRIVACY_KEY}_${userId}`);
    return raw ? { ...DEFAULT_PRIVACY, ...JSON.parse(raw) } : DEFAULT_PRIVACY;
  } catch { return DEFAULT_PRIVACY; }
}

function savePrivacy(userId: string, settings: PrivacySettings) {
  localStorage.setItem(`${PRIVACY_KEY}_${userId}`, JSON.stringify(settings));
}

export default function ProfilePage() {
  const { currentUser, refreshCurrentUser } = useAuth();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    lga: "",
    ward: "",
    occupation: "",
    bio: "",
    avatarUrl: "",
  });
  const [privacy, setPrivacy] = useState<PrivacySettings>(DEFAULT_PRIVACY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [savedPrivacy, setSavedPrivacy] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "privacy">("profile");

  useEffect(() => {
    if (!currentUser) return;
    setForm({
      firstName:  currentUser.firstName  ?? "",
      lastName:   currentUser.lastName   ?? "",
      phone:      currentUser.phone      ?? "",
      lga:        currentUser.lga        ?? "",
      ward:       currentUser.ward       ?? "",
      occupation: currentUser.occupation ?? "",
      bio:        currentUser.bio        ?? "",
      avatarUrl:  currentUser.avatarUrl  ?? "",
    });
    setPrivacy(loadPrivacy(currentUser.id));
  }, [currentUser]);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!currentUser) return;
    setSaving(true);
    usersDB.update(currentUser.id, {
      ...form,
      displayName: `${form.firstName.trim()} ${form.lastName.trim()}`,
    });
    refreshCurrentUser();
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleSavePrivacy() {
    if (!currentUser) return;
    setSavingPrivacy(true);
    savePrivacy(currentUser.id, privacy);
    setTimeout(() => {
      setSavingPrivacy(false);
      setSavedPrivacy(true);
      setTimeout(() => setSavedPrivacy(false), 3000);
    }, 400);
  }

  function togglePrivacy(key: keyof PrivacySettings) {
    setPrivacy((p) => ({ ...p, [key]: !p[key] }));
  }

  const initials = currentUser
    ? `${form.firstName[0] ?? ""}${form.lastName[0] ?? ""}`.toUpperCase()
    : "?";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-500">My Profile</h1>
        <p className="text-sm text-(--color-neutral-500) mt-1">Manage your personal information and privacy settings</p>
      </div>

      {/* Avatar + name header */}
      <div className="bg-white rounded-2xl border border-(--color-neutral-200) p-6 flex items-center gap-5">
        {form.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.avatarUrl} alt="Avatar" className="h-20 w-20 rounded-full object-cover flex-shrink-0 ring-4 ring-(--color-green-100)" />
        ) : (
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-(--color-green-500) text-white text-2xl font-bold ring-4 ring-(--color-green-100)">
            {initials}
          </div>
        )}
        <div>
          <p className="text-xl font-bold text-gray-500">{form.firstName} {form.lastName}</p>
          <p className="text-sm text-(--color-neutral-500)">{currentUser?.email}</p>
          <span className="inline-block mt-1 rounded-full bg-(--color-green-100) text-(--color-green-700) px-2.5 py-0.5 text-xs font-medium capitalize">
            {currentUser?.role}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-(--color-neutral-100) rounded-xl p-1 w-fit">
        {(["profile", "privacy"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
              activeTab === tab
                ? "bg-white text-gray-500 shadow-sm"
                : "text-(--color-neutral-500) hover:text-gray-500"
            }`}
          >
            {tab === "privacy" ? "Privacy Settings" : "Edit Profile"}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-(--color-neutral-200) p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1.5">First name</label>
              <input
                type="text" required value={form.firstName} onChange={set("firstName")}
                className="w-full rounded-lg border border-(--color-neutral-300) bg-white px-3.5 py-2.5 text-sm outline-none focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200) transition"
              />
            </div>
            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1.5">Last name</label>
              <input
                type="text" required value={form.lastName} onChange={set("lastName")}
                className="w-full rounded-lg border border-(--color-neutral-300) bg-white px-3.5 py-2.5 text-sm outline-none focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200) transition"
              />
            </div>
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1.5">Phone</label>
              <input
                type="tel" value={form.phone} onChange={set("phone")} placeholder="08012345678"
                className="w-full rounded-lg border border-(--color-neutral-300) bg-white px-3.5 py-2.5 text-sm outline-none focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200) transition"
              />
            </div>
            {/* LGA */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1.5">Local Government Area</label>
              <select
                value={form.lga} onChange={set("lga")}
                className="w-full rounded-lg border border-(--color-neutral-300) bg-white px-3.5 py-2.5 text-sm outline-none focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200) transition"
              >
                <option value="">Select LGA…</option>
                {LAGOS_LGAS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            {/* Ward */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1.5">Ward</label>
              <input
                type="text" value={form.ward} onChange={set("ward")} placeholder="e.g. Ward 3"
                className="w-full rounded-lg border border-(--color-neutral-300) bg-white px-3.5 py-2.5 text-sm outline-none focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200) transition"
              />
            </div>
            {/* Occupation */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1.5">Occupation</label>
              <input
                type="text" value={form.occupation} onChange={set("occupation")} placeholder="e.g. Software Engineer"
                className="w-full rounded-lg border border-(--color-neutral-300) bg-white px-3.5 py-2.5 text-sm outline-none focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200) transition"
              />
            </div>
          </div>
          {/* Avatar URL */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1.5">Avatar URL <span className="text-(--color-neutral-400)">(optional)</span></label>
            <input
              type="url" value={form.avatarUrl} onChange={set("avatarUrl")} placeholder="https://…"
              className="w-full rounded-lg border border-(--color-neutral-300) bg-white px-3.5 py-2.5 text-sm outline-none focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200) transition"
            />
          </div>
          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1.5">Bio <span className="text-(--color-neutral-400)">(optional)</span></label>
            <textarea
              rows={3} value={form.bio} onChange={set("bio")} placeholder="Tell the community about yourself…"
              className="w-full rounded-lg border border-(--color-neutral-300) bg-white px-3.5 py-2.5 text-sm outline-none focus:border-(--color-green-500) focus:ring-2 focus:ring-(--color-green-200) transition resize-none"
            />
          </div>
          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1.5">Email <span className="text-(--color-neutral-400)">(cannot be changed)</span></label>
            <input
              type="email" value={currentUser?.email ?? ""} readOnly
              className="w-full rounded-lg border border-(--color-neutral-200) bg-(--color-neutral-50) px-3.5 py-2.5 text-sm text-(--color-neutral-400) cursor-not-allowed"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit" disabled={saving}
              className="rounded-lg bg-(--color-green-600) px-6 py-2.5 text-sm font-semibold text-white hover:bg-(--color-green-700) disabled:opacity-60 transition"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            {saved && <span className="text-sm text-(--color-green-600) font-medium">✓ Profile updated!</span>}
          </div>
        </form>
      )}

      {activeTab === "privacy" && (
        <div className="bg-white rounded-2xl border border-(--color-neutral-200) p-6 space-y-5">
          <p className="text-sm text-(--color-neutral-500)">
            Control what other members can see when they view your profile in the directory.
          </p>
          <div className="space-y-4 divide-y divide-(--color-neutral-100)">
            {([
              { key: "showInDirectory", label: "Show me in the member directory", desc: "Other members can find and view your profile" },
              { key: "showEmail",       label: "Show email address",               desc: "Members can see your email in your profile" },
              { key: "showPhone",       label: "Show phone number",                desc: "Members can see your phone number" },
              { key: "showOccupation",  label: "Show occupation",                  desc: "Your job title/occupation is visible" },
              { key: "showBio",         label: "Show bio",                         desc: "Your bio paragraph is shown on your profile" },
            ] as { key: keyof PrivacySettings; label: string; desc: string }[]).map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between pt-4 first:pt-0">
                <div>
                  <p className="text-sm font-medium text-gray-500">{label}</p>
                  <p className="text-xs text-(--color-neutral-400) mt-0.5">{desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => togglePrivacy(key)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                    privacy[key] ? "bg-(--color-green-500)" : "bg-(--color-neutral-300)"
                  }`}
                  role="switch"
                  aria-checked={privacy[key]}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                      privacy[key] ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSavePrivacy}
              disabled={savingPrivacy}
              className="rounded-lg bg-(--color-green-600) px-6 py-2.5 text-sm font-semibold text-white hover:bg-(--color-green-700) disabled:opacity-60 transition"
            >
              {savingPrivacy ? "Saving…" : "Save privacy settings"}
            </button>
            {savedPrivacy && <span className="text-sm text-(--color-green-600) font-medium">✓ Settings saved!</span>}
          </div>
        </div>
      )}
    </div>
  );
}
