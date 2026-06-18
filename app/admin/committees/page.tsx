"use client";

import { useState, useMemo, useCallback } from "react";
import { useCommittees } from "@/context/CommitteesContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import {
  AdminPageHeader, AdminFilters, FilterSelect,
  AdminTable, TR, TD, Badge, AdminModal,
  FormField, FormInput, FormSelect, FormTextarea, Btn, SectionDivider,
} from "@/components/admin/AdminUI";
import type { Committee, CommitteeMemberProfile, CommitteeJoinRequest } from "@/lib/models";

const TYPE_OPTIONS = ["standing", "ad-hoc", "executive", "advisory", "technical"] as const;
const STATUS_OPTIONS = ["active", "inactive", "dissolved"] as const;
const ROLE_OPTIONS = ["Chairperson", "Vice Chairperson", "Secretary", "Member"];

type CommitteeForm = {
  name: string; slug: string; description: string; mandate: string;
  type: Committee["type"]; status: Committee["status"];
  establishedAt: string; members: CommitteeMemberProfile[]; imageUrl: string;
};

const BLANK_COMMITTEE: CommitteeForm = {
  name: "", slug: "", description: "", mandate: "",
  type: "standing",
  status: "active",
  establishedAt: new Date().toISOString().split("T")[0],
  members: [],
  imageUrl: "",
};

const BLANK_MEMBER: CommitteeMemberProfile = {
  name: "", role: "Member", bio: "", isChairperson: false, isViceChair: false,
  joinedCommitteeAt: new Date().toISOString().split("T")[0], userId: "",
};

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminCommitteesPage() {
  const { committees, add, update, remove, addMember, removeMember, getJoinRequests, reviewJoinRequest } = useCommittees();
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // modals
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Committee | null>(null);
  const [tab, setTab] = useState<"details" | "members" | "requests">("details");

  // forms
  const [form, setForm] = useState({ ...BLANK_COMMITTEE });
  const [memberForm, setMemberForm] = useState({ ...BLANK_MEMBER });
  const [saving, setSaving] = useState(false);

  // join requests state
  const [joinRequests, setJoinRequests] = useState<CommitteeJoinRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const filtered = useMemo(() => {
    let list = committees;
    if (typeFilter !== "all") list = list.filter(c => c.type === typeFilter);
    if (statusFilter !== "all") list = list.filter(c => c.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [committees, search, typeFilter, statusFilter]);

  function openCreate() {
    setForm({ ...BLANK_COMMITTEE });
    setCreateOpen(true);
  }

  function openEdit(committee: Committee) {
    setSelected(committee);
    setTab("details");
    setForm({
      name: committee.name,
      slug: committee.slug,
      description: committee.description,
      mandate: committee.mandate ?? "",
      type: committee.type,
      status: committee.status,
      establishedAt: committee.establishedAt.split("T")[0],
      members: committee.members,
      imageUrl: committee.imageUrl ?? "",
    });
    setMemberForm({ ...BLANK_MEMBER });
  }

  async function loadJoinRequests(committeeId: string) {
    setLoadingRequests(true);
    try {
      const data = await getJoinRequests(committeeId);
      setJoinRequests(data);
    } finally {
      setLoadingRequests(false);
    }
  }

  function handleTabChange(newTab: "details" | "members" | "requests") {
    setTab(newTab);
    if (newTab === "requests" && selected) {
      void loadJoinRequests(selected.id);
    }
  }

  async function handleCreate() {
    if (!form.name.trim() || !form.description.trim()) {
      error("Name and description are required.", "Validation Error");
      return;
    }
    setSaving(true);
    try {
      await add({
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        description: form.description.trim(),
        mandate: form.mandate.trim() || undefined,
        type: form.type,
        status: form.status,
        establishedAt: form.establishedAt,
        members: [],
        imageUrl: form.imageUrl.trim() || undefined,
      });
      setCreateOpen(false);
      success("Committee created successfully.", "Created");
    } catch {
      error("Failed to create committee.", "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    if (!selected) return;
    setSaving(true);
    try {
      await update(selected.id, {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        description: form.description.trim(),
        mandate: form.mandate.trim() || undefined,
        type: form.type,
        status: form.status,
        establishedAt: form.establishedAt,
        imageUrl: form.imageUrl.trim() || undefined,
      });
      setSelected(null);
      success("Committee updated.", "Saved");
    } catch {
      error("Failed to update committee.", "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this committee? This cannot be undone.")) return;
    try {
      await remove(id);
      if (selected?.id === id) setSelected(null);
      success("Committee deleted.", "Deleted");
    } catch {
      error("Failed to delete committee.", "Error");
    }
  }

  async function handleAddMember() {
    if (!selected || !memberForm.name.trim()) return;
    setSaving(true);
    try {
      const isChair = memberForm.role === "Chairperson";
      const isVice = memberForm.role === "Vice Chairperson";
      const newMember: CommitteeMemberProfile = {
        ...memberForm,
        name: memberForm.name.trim(),
        isChairperson: isChair,
        isViceChair: isVice,
        joinedCommitteeAt: memberForm.joinedCommitteeAt || new Date().toISOString().split("T")[0],
      };
      const updated = await addMember(selected.id, newMember);
      if (updated) setSelected(updated);
      setMemberForm({ ...BLANK_MEMBER });
      success("Member added.", "Added");
    } catch {
      error("Failed to add member.", "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveMember(name: string) {
    if (!selected) return;
    if (!confirm(`Remove ${name} from this committee?`)) return;
    try {
      const updated = await removeMember(selected.id, name);
      if (updated) setSelected(updated);
      success("Member removed.", "Removed");
    } catch {
      error("Failed to remove member.", "Error");
    }
  }

  const handleReviewRequest = useCallback(async (requestId: string, status: "approved" | "rejected") => {
    const reviewedBy = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Admin";
    try {
      await reviewJoinRequest(requestId, status, reviewedBy);
      setJoinRequests(prev => prev.map(r => r.id === requestId ? { ...r, status, reviewedAt: new Date().toISOString(), reviewedBy } : r));
      success(`Request ${status}.`, status === "approved" ? "Approved" : "Rejected");
    } catch {
      error("Failed to update request.", "Error");
    }
  }, [currentUser, reviewJoinRequest, success, error]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Committees"
        count={filtered.length}
        subtitle="Manage chapter committees, members, and join requests."
      >
        <Btn size="sm" variant="primary" onClick={openCreate}>+ New Committee</Btn>
      </AdminPageHeader>

      <AdminFilters
        search={search}
        onSearchChange={setSearch}
        filters={
          <>
            <FilterSelect
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { value: "all", label: "All types" },
                ...TYPE_OPTIONS.map(t => ({ value: t, label: t.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) })),
              ]}
            />
            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All statuses" },
                ...STATUS_OPTIONS.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
              ]}
            />
          </>
        }
      />

      <AdminTable
        headers={["Name", "Type", "Status", "Members", "Chair", "Established"]}
        empty="No committees found."
      >
        {filtered.map(c => {
          const chair = c.members.find(m => m.isChairperson);
          return (
            <TR key={c.id} onClick={() => openEdit(c)}>
              <TD className="font-medium text-(--color-neutral-900)">{c.name}</TD>
              <TD><Badge value={c.type} /></TD>
              <TD><Badge value={c.status} /></TD>
              <TD>{c.members.length}</TD>
              <TD>{chair?.name ?? <span className="text-(--color-neutral-400) text-xs">Unassigned</span>}</TD>
              <TD>{new Date(c.establishedAt).toLocaleDateString("en-NG", { month: "short", year: "numeric" })}</TD>
            </TR>
          );
        })}
      </AdminTable>

      {/* Create modal */}
      {createOpen && (
        <AdminModal title="New Committee" open={createOpen} onClose={() => setCreateOpen(false)}>
          <CommitteeFormFields form={form} setForm={setForm} />
          <div className="flex justify-end gap-2 pt-2">
            <Btn size="sm" variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Btn>
            <Btn size="sm" variant="primary" onClick={handleCreate} disabled={saving}>{saving ? "Creating…" : "Create"}</Btn>
          </div>
        </AdminModal>
      )}

      {/* Edit modal */}
      {selected && (
        <AdminModal title={selected.name} open={!!selected} onClose={() => setSelected(null)}>
          {/* Tabs */}
          <div className="flex gap-1 border-b border-(--color-neutral-200) mb-4">
            {(["details", "members", "requests"] as const).map(t => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? "border-(--color-green-600) text-(--color-green-700)" : "border-transparent text-(--color-neutral-500) hover:text-gray-500"}`}
              >
                {t === "requests" ? "Join Requests" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === "details" && (
            <>
              <CommitteeFormFields form={form} setForm={setForm} />
              <div className="flex justify-between gap-2 pt-2">
                <Btn size="sm" variant="danger" onClick={() => void handleDelete(selected.id)}>Delete</Btn>
                <div className="flex gap-2">
                  <Btn size="sm" variant="secondary" onClick={() => setSelected(null)}>Cancel</Btn>
                  <Btn size="sm" variant="primary" onClick={handleUpdate} disabled={saving}>{saving ? "Saving…" : "Save"}</Btn>
                </div>
              </div>
            </>
          )}

          {tab === "members" && (
            <div className="space-y-4">
              {/* Member list */}
              {selected.members.length === 0 ? (
                <p className="text-sm text-(--color-neutral-400) text-center py-4">No members yet.</p>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {selected.members.map(m => (
                    <div key={m.name} className="flex items-center justify-between gap-3 rounded-lg border border-(--color-neutral-200) px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">{m.name}</p>
                        <p className="text-xs text-(--color-neutral-400)">{m.role}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {m.isChairperson && <Badge value="chairperson" className="text-[10px]" />}
                        <button
                          onClick={() => void handleRemoveMember(m.name)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <SectionDivider label="Add Member" />
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Full Name *">
                  <FormInput value={memberForm.name} onChange={e => setMemberForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Adebayo Salako" />
                </FormField>
                <FormField label="Role">
                  <FormSelect value={memberForm.role} onChange={e => setMemberForm(p => ({ ...p, role: e.target.value }))}>
                    {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </FormSelect>
                </FormField>
                <FormField label="User ID (optional)">
                  <FormInput value={memberForm.userId ?? ""} onChange={e => setMemberForm(p => ({ ...p, userId: e.target.value }))} placeholder="Link to member account" />
                </FormField>
                <FormField label="Joined Date">
                  <FormInput type="date" value={memberForm.joinedCommitteeAt} onChange={e => setMemberForm(p => ({ ...p, joinedCommitteeAt: e.target.value }))} />
                </FormField>
              </div>
              <div className="flex justify-end">
                <Btn size="sm" variant="primary" onClick={handleAddMember} disabled={saving || !memberForm.name.trim()}>
                  {saving ? "Adding…" : "Add Member"}
                </Btn>
              </div>
            </div>
          )}

          {tab === "requests" && (
            <div className="space-y-3">
              {loadingRequests ? (
                <p className="text-sm text-(--color-neutral-400) text-center py-4">Loading…</p>
              ) : joinRequests.length === 0 ? (
                <p className="text-sm text-(--color-neutral-400) text-center py-4">No join requests.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {joinRequests.map(req => (
                    <div key={req.id} className="rounded-lg border border-(--color-neutral-200) p-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-500">{req.userName}</p>
                          <p className="text-xs text-(--color-neutral-400)">{req.userEmail}</p>
                        </div>
                        <Badge value={req.status} />
                      </div>
                      {req.message && (
                        <p className="text-xs text-(--color-neutral-600) bg-(--color-neutral-50) rounded p-2">{req.message}</p>
                      )}
                      <p className="text-xs text-(--color-neutral-400)">{new Date(req.requestedAt).toLocaleDateString("en-NG")}</p>
                      {req.status === "pending" && (
                        <div className="flex gap-2 pt-1">
                          <Btn size="sm" variant="success" onClick={() => void handleReviewRequest(req.id, "approved")}>Approve</Btn>
                          <Btn size="sm" variant="danger" onClick={() => void handleReviewRequest(req.id, "rejected")}>Reject</Btn>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </AdminModal>
      )}
    </div>
  );
}

/* ─── Shared form fields ────────────────────────────── */
function CommitteeFormFields({
  form,
  setForm,
}: {
  form: CommitteeForm;
  setForm: React.Dispatch<React.SetStateAction<CommitteeForm>>;
}) {
  return (
    <div className="space-y-3 mb-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Name *">
          <FormInput
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value, slug: p.slug || e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }))}
            placeholder="e.g. Finance Committee"
          />
        </FormField>
        <FormField label="Slug">
          <FormInput
            value={form.slug}
            onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
            placeholder="auto-generated"
          />
        </FormField>
        <FormField label="Type">
          <FormSelect value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as Committee["type"] }))}>
            {(["standing", "ad-hoc", "executive", "advisory", "technical"] as const).map(t => (
              <option key={t} value={t}>{t.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
            ))}
          </FormSelect>
        </FormField>
        <FormField label="Status">
          <FormSelect value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Committee["status"] }))}>
            {(["active", "inactive", "dissolved"] as const).map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </FormSelect>
        </FormField>
        <FormField label="Established Date">
          <FormInput type="date" value={form.establishedAt} onChange={e => setForm(p => ({ ...p, establishedAt: e.target.value }))} />
        </FormField>
        <FormField label="Image URL (optional)">
          <FormInput value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} placeholder="https://…" />
        </FormField>
      </div>
      <FormField label="Description *">
        <FormTextarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What does this committee do?" />
      </FormField>
      <FormField label="Mandate (optional)">
        <FormTextarea rows={2} value={form.mandate} onChange={e => setForm(p => ({ ...p, mandate: e.target.value }))} placeholder="Committee mandate or charter…" />
      </FormField>
    </div>
  );
}
