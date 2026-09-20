"use client";

import { useState, useMemo } from "react";
import { useDocuments } from "@/context/DocumentsContext";
import { useAuth } from "@/context/AuthContext";
import {
  AdminPageHeader, AdminFilters, FilterSelect,
  AdminTable, TR, TD, Badge, AdminModal,
  FormField, FormInput, FormSelect, FormTextarea, Btn, SectionDivider,
} from "@/components/admin/AdminUI";
import FileUploader, { type UploadedFile } from "@/components/media/FileUploader";
import { formatFileSize, type OrgDocument } from "@/lib/models/document";

const CATEGORIES = ["all", "constitution", "minutes", "report", "handbook", "newsletter", "budget", "policy", "form", "other"];
const ACCESS_LEVELS = ["all", "public", "members-only", "admin-only"];
const FILE_TYPES = ["pdf", "doc", "docx", "xlsx", "img", "other"];

/* Cloudinary reports the extension; map it to the stored fileType. */
const EXT_TO_TYPE: Record<string, OrgDocument["fileType"]> = {
  pdf: "pdf", doc: "doc", docx: "docx", xls: "xlsx", xlsx: "xlsx",
};

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
    label: "", category: "policy", access: "members-only", description: "",
  });
  /* The real file, from /api/uploads. Name, type and size all come from it
     rather than being typed in. */
  const [createFile, setCreateFile] = useState<UploadedFile | null>(null);

  const [form, setForm] = useState({
    label: "", name: "", category: "", access: "",
    fileType: "", description: "",
  });
  const [editFile, setEditFile] = useState<Pick<OrgDocument, "url" | "publicId" | "sizeBytes" | "name"> | null>(null);
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
      description: doc.description ?? "",
    });
    setEditFile({ url: doc.url, publicId: doc.publicId, sizeBytes: doc.sizeBytes, name: doc.name });
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
        url: editFile?.url,
        publicId: editFile?.publicId,
        sizeBytes: editFile?.sizeBytes,
        simulatedSize: formatFileSize(editFile?.sizeBytes) ?? "N/A",
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
    if (!createForm.label.trim() || !createFile) return;
    const ext = (createFile.originalName.split(".").pop() ?? "").toLowerCase();
    await add({
      label: createForm.label.trim(),
      name: createFile.originalName,
      category: createForm.category as OrgDocument["category"],
      access: createForm.access as OrgDocument["access"],
      fileType: EXT_TO_TYPE[ext] ?? "other",
      url: createFile.url,
      publicId: createFile.publicId,
      sizeBytes: createFile.bytes,
      simulatedSize: formatFileSize(createFile.bytes) ?? "N/A",
      description: createForm.description || undefined,
      uploadedBy: currentUser?.id ?? "admin",
    });
    setCreating(false);
    setCreateFile(null);
    setCreateForm({ label: "", category: "policy", access: "members-only", description: "" });
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
            <TD className="uppercase text-xs font-bold text-(--color-neutral-900)">{doc.fileType}</TD>
            <TD className="text-(--color-neutral-900)">{formatFileSize(doc.sizeBytes) ?? doc.simulatedSize ?? "N/A"}</TD>
            <TD>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "N/A"}</TD>
            <TD className="text-(--color-neutral-900) text-xs">{doc.uploadedBy}</TD>
          </TR>
        ))}
      </AdminTable>

      {/* Create Modal */}
      {creating && (
        <AdminModal title="Upload Document" open={creating} onClose={() => setCreating(false)}>
          <div className="space-y-4">
            <FormField label="Document Label *">
              <FormInput value={createForm.label} onChange={e => setCreateForm(p => ({ ...p, label: e.target.value }))} placeholder="e.g. April 2026 meeting minutes" />
            </FormField>
            <FileUploader
              label="File *"
              value={createFile?.url}
              fileName={createFile?.originalName}
              sizeBytes={createFile?.bytes}
              onChange={setCreateFile}
            />
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
            </div>
            <FormField label="Description">
              <FormTextarea rows={2} value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} placeholder="What is this document about?" />
            </FormField>
            <div className="flex justify-end gap-2 pt-2 border-t border-(--color-neutral-100)">
              <Btn variant="secondary" onClick={() => setCreating(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={handleCreate} disabled={!createForm.label.trim() || !createFile}>Add document</Btn>
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
            <FormField label="File name">
              <FormInput value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </FormField>
            <FileUploader
              label="File"
              value={editFile?.url}
              fileName={editFile?.name}
              sizeBytes={editFile?.sizeBytes}
              onChange={(f) => {
                if (!f) {
                  setEditFile(null);
                  return;
                }
                setEditFile({ url: f.url, publicId: f.publicId, sizeBytes: f.bytes, name: f.originalName });
                setForm(p => ({
                  ...p,
                  name: f.originalName,
                  fileType: EXT_TO_TYPE[(f.originalName.split(".").pop() ?? "").toLowerCase()] ?? "other",
                }));
              }}
            />
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
