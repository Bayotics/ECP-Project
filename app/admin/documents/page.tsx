"use client";

import { useState, useMemo } from "react";
import { useDocuments } from "@/context/DocumentsContext";
import { useAuth } from "@/context/AuthContext";
import {
  AdminPageHeader, AdminFilters, FilterSelect,
  AdminTable, TR, TD, Badge, AdminModal,
  FormField, FormInput, FormSelect, FormTextarea, Btn, SectionDivider,
} from "@/components/admin/AdminUI";
import type { OrgDocument } from "@/lib/models/document";

const CATEGORIES = ["all", "constitution", "minutes", "report", "handbook", "newsletter", "budget", "policy", "form", "other"];
const ACCESS_LEVELS = ["all", "public", "members-only", "admin-only"];
const FILE_TYPES = ["pdf", "docx", "xlsx", "img", "other"];

const FILE_ICONS: Record<string, string> = {
  pdf: "📄", docx: "📝", xlsx: "📊", img: "🖼️", other: "📁",
};

export default function AdminDocumentsPage() {
  const { documents, add, update, remove } = useDocuments();
  const { currentUser } = useAuth();

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [selected, setSelected] = useState<OrgDocument | null>(null);
  const [creating, setCreating] = useState(false);

  const [createForm, setCreateForm] = useState({
    label: "", name: "", category: "policy", access: "members-only",
    fileType: "pdf", simulatedSize: "", description: "",
  });

  const [form, setForm] = useState({
    label: "", name: "", category: "", access: "",
    fileType: "", simulatedSize: "", description: "",
  });
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    let list = documents;
    if (catFilter !== "all") list = list.filter(d => d.category === catFilter);
    if (accessFilter !== "all") list = list.filter(d => d.access === accessFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d => d.label.toLowerCase().includes(q) || d.name.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }, [documents, search, catFilter, accessFilter]);

  function openModal(doc: OrgDocument) {
    setSelected(doc);
    setForm({
      label: doc.label,
      name: doc.name,
      category: doc.category,
      access: doc.access,
      fileType: doc.fileType,
      simulatedSize: doc.simulatedSize,
      description: doc.description ?? "",
    });
  }

  function closeModal() { setSelected(null); }

  async function saveChanges() {
    if (!selected) return;
    setSaving(true);
    try {
      await update(selected.id, {
        label: form.label,
        name: form.name,
        category: form.category as OrgDocument["category"],
        access: form.access as OrgDocument["access"],
        fileType: form.fileType as OrgDocument["fileType"],
        simulatedSize: form.simulatedSize,
        description: form.description || undefined,
      });
      closeModal();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    if (!confirm(`Delete "${selected.label}"? This cannot be undone.`)) return;
    await remove(selected.id);
    closeModal();
  }

  async function handleCreate() {
    if (!createForm.label.trim()) return;
    await add({
      label: createForm.label.trim(),
      name: createForm.name.trim() || `${createForm.label.trim().replace(/\s+/g, "_")}.${createForm.fileType}`,
      category: createForm.category as OrgDocument["category"],
      access: createForm.access as OrgDocument["access"],
      fileType: createForm.fileType as OrgDocument["fileType"],
      simulatedSize: createForm.simulatedSize || "—",
      description: createForm.description || undefined,
      uploadedBy: currentUser?.id ?? "admin",
    });
    setCreating(false);
    setCreateForm({ label: "", name: "", category: "policy", access: "members-only", fileType: "pdf", simulatedSize: "", description: "" });
  }

  const headers = ["", "Label", "Category", "Access", "Type", "Size", "Uploaded", "Uploaded By"];

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Documents" count={filtered.length} subtitle="Manage organisational documents and files.">
        <Btn variant="primary" size="sm" onClick={() => setCreating(true)}>+ Upload Document</Btn>
      </AdminPageHeader>

      <AdminFilters search={search} onSearchChange={setSearch} filters={
        <>
          <FilterSelect value={catFilter} onChange={setCatFilter} options={CATEGORIES.map(c => ({ value: c, label: c === "all" ? "All categories" : c.replace(/\b\w/g, x => x.toUpperCase()) }))} />
          <FilterSelect value={accessFilter} onChange={setAccessFilter} options={ACCESS_LEVELS.map(a => ({ value: a, label: a === "all" ? "All access" : a.replace(/-/g, " ").replace(/\b\w/g, x => x.toUpperCase()) }))} />
        </>
      } />

      <AdminTable headers={headers} empty="No documents found.">
        {filtered.map(doc => (
          <TR key={doc.id} onClick={() => openModal(doc)}>
            <TD className="w-8 text-xl">{FILE_ICONS[doc.fileType] ?? "📁"}</TD>
            <TD className="font-medium text-(--color-neutral-900)">{doc.label}</TD>
            <TD><Badge value={doc.category} /></TD>
            <TD><Badge value={doc.access} /></TD>
            <TD className="uppercase text-xs font-bold text-(--color-neutral-500)">{doc.fileType}</TD>
            <TD className="text-(--color-neutral-500)">{doc.simulatedSize}</TD>
            <TD>{new Date(doc.uploadedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</TD>
            <TD className="text-(--color-neutral-500) text-xs">{doc.uploadedBy}</TD>
          </TR>
        ))}
      </AdminTable>

      {/* Create Modal */}
      {creating && (
        <AdminModal title="Upload Document" open={creating} onClose={() => setCreating(false)}>
          <div className="space-y-4">
            <FormField label="Document Label *">
              <FormInput value={createForm.label} onChange={e => setCreateForm(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Meeting Minutes Q2 2026" />
            </FormField>
            <FormField label="File Name">
              <FormInput value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. meeting_minutes_q2_2026.pdf (auto-generated if blank)" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Category">
                <FormSelect value={createForm.category} onChange={e => setCreateForm(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.filter(c => c !== "all").map(c => <option key={c} value={c}>{c.replace(/\b\w/g, x => x.toUpperCase())}</option>)}
                </FormSelect>
              </FormField>
              <FormField label="Access Level">
                <FormSelect value={createForm.access} onChange={e => setCreateForm(p => ({ ...p, access: e.target.value }))}>
                  {ACCESS_LEVELS.filter(a => a !== "all").map(a => <option key={a} value={a}>{a.replace(/-/g, " ").replace(/\b\w/g, x => x.toUpperCase())}</option>)}
                </FormSelect>
              </FormField>
              <FormField label="File Type">
                <FormSelect value={createForm.fileType} onChange={e => setCreateForm(p => ({ ...p, fileType: e.target.value }))}>
                  {FILE_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                </FormSelect>
              </FormField>
              <FormField label="File Size">
                <FormInput value={createForm.simulatedSize} onChange={e => setCreateForm(p => ({ ...p, simulatedSize: e.target.value }))} placeholder="e.g. 1.4 MB" />
              </FormField>
            </div>
            <FormField label="Description">
              <FormTextarea rows={2} value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} placeholder="What is this document about?" />
            </FormField>
            <div className="flex justify-end gap-2 pt-2 border-t border-(--color-neutral-100)">
              <Btn variant="secondary" onClick={() => setCreating(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={handleCreate} disabled={!createForm.label.trim()}>Add Document</Btn>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Edit Modal */}
      {selected && (
        <AdminModal title={selected.label} open={!!selected} onClose={closeModal}>
          <div className="space-y-4">
            <FormField label="Label">
              <FormInput value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} />
            </FormField>
            <FormField label="File Name">
              <FormInput value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Category">
                <FormSelect value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.filter(c => c !== "all").map(c => <option key={c} value={c}>{c.replace(/\b\w/g, x => x.toUpperCase())}</option>)}
                </FormSelect>
              </FormField>
              <FormField label="Access Level">
                <FormSelect value={form.access} onChange={e => setForm(p => ({ ...p, access: e.target.value }))}>
                  {ACCESS_LEVELS.filter(a => a !== "all").map(a => <option key={a} value={a}>{a.replace(/-/g, " ").replace(/\b\w/g, x => x.toUpperCase())}</option>)}
                </FormSelect>
              </FormField>
              <FormField label="File Type">
                <FormSelect value={form.fileType} onChange={e => setForm(p => ({ ...p, fileType: e.target.value }))}>
                  {FILE_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                </FormSelect>
              </FormField>
              <FormField label="File Size">
                <FormInput value={form.simulatedSize} onChange={e => setForm(p => ({ ...p, simulatedSize: e.target.value }))} />
              </FormField>
            </div>
            <FormField label="Description">
              <FormTextarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </FormField>
            <SectionDivider label="Danger Zone" />
            <Btn size="sm" variant="danger" onClick={handleDelete}>Delete Document</Btn>
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
