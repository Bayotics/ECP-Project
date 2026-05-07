"use client";

import { useState, useMemo } from "react";
import { useNews } from "@/context/NewsContext";
import { useAuth } from "@/context/AuthContext";
import {
  AdminPageHeader, AdminFilters, FilterSelect,
  AdminTable, TR, TD, Badge, AdminModal,
  FormField, FormInput, FormSelect, FormTextarea, Btn, SectionDivider, EmptyState,
} from "@/components/admin/AdminUI";
import type { NewsPost } from "@/lib/models/news";

const CATEGORIES = ["all", "news", "announcement", "report", "opinion", "press-release", "blog"];
const STATUSES = ["all", "draft", "published", "archived"];

export default function AdminNewsPage() {
  const { posts, add, update, publish, remove } = useNews();
  const { currentUser } = useAuth();

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<NewsPost | null>(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ title: "", category: "news", excerpt: "", content: "" });
  const [form, setForm] = useState({
    title: "", category: "", status: "", authorName: "",
    excerpt: "", content: "",
    isFeatured: false, isBreaking: false, isPinned: false,
  });
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    let list = posts;
    if (catFilter !== "all") list = list.filter(p => p.category === catFilter);
    if (statusFilter !== "all") list = list.filter(p => p.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.authorName ?? "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => (b.publishedAt ?? b.createdAt ?? "").localeCompare(a.publishedAt ?? a.createdAt ?? ""));
  }, [posts, search, catFilter, statusFilter]);

  function openModal(post: NewsPost) {
    setSelected(post);
    setForm({
      title: post.title,
      category: post.category,
      status: post.status,
      authorName: post.authorName ?? "",
      excerpt: post.excerpt ?? "",
      content: post.content ?? "",
      isFeatured: post.isFeatured ?? false,
      isBreaking: post.isBreaking ?? false,
      isPinned: post.isPinned ?? false,
    });
  }

  function closeModal() { setSelected(null); }

  async function saveChanges() {
    if (!selected) return;
    setSaving(true);
    update(selected.id, {
      title: form.title,
      category: form.category as NewsPost["category"],
      status: form.status as NewsPost["status"],
      authorName: form.authorName || undefined,
      excerpt: form.excerpt || undefined,
      content: form.content || undefined,
      isFeatured: form.isFeatured,
      isBreaking: form.isBreaking,
      isPinned: form.isPinned,
    });
    setSaving(false);
    closeModal();
  }

  function handlePublish() {
    if (!selected) return;
    publish(selected.id);
    setForm(p => ({ ...p, status: "published" }));
  }

  function handleRemove() {
    if (!selected) return;
    if (!confirm(`Delete "${selected.title}"? This cannot be undone.`)) return;
    remove(selected.id);
    closeModal();
  }

  function slugify(str: string) { return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").trim(); }

  function handleCreate() {
    if (!createForm.title.trim()) return;
    add({
      title: createForm.title.trim(),
      slug: slugify(createForm.title),
      category: createForm.category as NewsPost["category"],
      status: "draft",
      excerpt: createForm.excerpt || createForm.title,
      content: createForm.content || "",
      authorId: currentUser?.id ?? "admin",
      authorName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Admin",
      isFeatured: false,
      isBreaking: false,
      isPinned: false,
      tags: [],
      readingTimeMinutes: Math.max(1, Math.ceil((createForm.content.split(" ").length || 1) / 200)),
    });
    setCreating(false);
    setCreateForm({ title: "", category: "news", excerpt: "", content: "" });
  }

  const headers = ["Title", "Category", "Author", "Status", "Featured", "Breaking", "Views", "Published"];

  return (
    <div className="space-y-6">
      <AdminPageHeader title="News" count={filtered.length} subtitle="Manage all news posts and announcements.">
        <Btn variant="primary" size="sm" onClick={() => setCreating(true)}>+ New Post</Btn>
      </AdminPageHeader>

      <AdminFilters search={search} onSearchChange={setSearch} filters={
        <>
          <FilterSelect value={catFilter} onChange={setCatFilter} options={CATEGORIES.map(c => ({ value: c, label: c === "all" ? "All categories" : c.replace("-", " ").replace(/\b\w/g, x => x.toUpperCase()) }))} />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={STATUSES.map(s => ({ value: s, label: s === "all" ? "All statuses" : s.replace(/\b\w/g, x => x.toUpperCase()) }))} />
        </>
      } />

      <AdminTable headers={headers} empty="No posts match your search.">
        {filtered.map(post => (
          <TR key={post.id} onClick={() => openModal(post)}>
            <TD className="font-medium text-(--color-neutral-900) max-w-55 truncate">{post.title}</TD>
            <TD><Badge value={post.category} /></TD>
            <TD>{post.authorName ?? "—"}</TD>
            <TD><Badge value={post.status} /></TD>
            <TD>{post.isFeatured ? <span className="text-(--color-green-600) text-xs font-bold">Yes</span> : <span className="text-(--color-neutral-400) text-xs">No</span>}</TD>
            <TD>{post.isBreaking ? <span className="text-red-600 text-xs font-bold">Yes</span> : <span className="text-(--color-neutral-400) text-xs">No</span>}</TD>
            <TD>{post.viewCount ?? 0}</TD>
            <TD>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}</TD>
          </TR>
        ))}
      </AdminTable>

      {creating && (
        <AdminModal title="New Post" open={creating} onClose={() => setCreating(false)}>
          <div className="space-y-4">
            <FormField label="Title *">
              <FormInput value={createForm.title} onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))} placeholder="Post title" />
            </FormField>
            <FormField label="Category">
              <FormSelect value={createForm.category} onChange={e => setCreateForm(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.filter(c => c !== "all").map(c => <option key={c} value={c}>{c.replace("-", " ").replace(/\b\w/g, x => x.toUpperCase())}</option>)}
              </FormSelect>
            </FormField>
            <FormField label="Excerpt">
              <FormTextarea rows={2} value={createForm.excerpt} onChange={e => setCreateForm(p => ({ ...p, excerpt: e.target.value }))} placeholder="Short summary…" />
            </FormField>
            <FormField label="Content">
              <FormTextarea rows={5} value={createForm.content} onChange={e => setCreateForm(p => ({ ...p, content: e.target.value }))} placeholder="Full post content…" />
            </FormField>
            <div className="flex justify-end gap-2 pt-2 border-t border-(--color-neutral-100)">
              <Btn variant="secondary" onClick={() => setCreating(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={handleCreate} disabled={!createForm.title.trim()}>Create Post</Btn>
            </div>
          </div>
        </AdminModal>
      )}

      {selected && (
        <AdminModal title={selected.title} open={!!selected} onClose={closeModal}>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><FormField label="Title">
                <FormInput value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </FormField></div>
              <FormField label="Category">
                <FormSelect value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.filter(c => c !== "all").map(c => (
                    <option key={c} value={c}>{c.replace("-", " ").replace(/\b\w/g, x => x.toUpperCase())}</option>
                  ))}
                </FormSelect>
              </FormField>
              <FormField label="Status">
                <FormSelect value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  {["draft", "published", "archived"].map(s => (
                    <option key={s} value={s}>{s.replace(/\b\w/g, x => x.toUpperCase())}</option>
                  ))}
                </FormSelect>
              </FormField>
              <div className="col-span-2"><FormField label="Author">
                <FormInput value={form.authorName} onChange={e => setForm(p => ({ ...p, authorName: e.target.value }))} />
              </FormField></div>
            </div>

            <FormField label="Excerpt">
              <FormTextarea rows={2} value={form.excerpt} onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))} />
            </FormField>

            <FormField label="Content">
              <FormTextarea rows={6} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} />
            </FormField>

            <div className="flex gap-5 text-sm">
              {(["isFeatured", "isBreaking", "isPinned"] as const).map(key => (
                <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))} className="accent-(--color-green-600)" />
                  <span className="font-medium text-(--color-neutral-700)">{key.replace("is", "")}</span>
                </label>
              ))}
            </div>

            <div>
              <SectionDivider label="Quick Actions" />
              <div className="flex flex-wrap gap-2 mt-2">
                {form.status !== "published" && <Btn size="sm" variant="success" onClick={handlePublish}>Publish Now</Btn>}
                <Btn size="sm" variant="danger" onClick={handleRemove}>Delete Post</Btn>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-(--color-neutral-100)">
              <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
              <Btn variant="primary" onClick={saveChanges} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Btn>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
