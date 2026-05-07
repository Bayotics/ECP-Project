"use client";

import { useState, useMemo } from "react";
import { useUsers } from "@/context/UsersContext";
import {
  AdminPageHeader, AdminFilters, FilterSelect,
  AdminTable, TR, TD, Badge, AdminModal,
  FormField, FormInput, FormSelect, Btn, SectionDivider, EmptyState,
} from "@/components/admin/AdminUI";
import type { User } from "@/lib/models/user";

const ROLES = ["all", "guest", "applicant", "member", "admin", "super-admin"];
const STATUSES = ["all", "active", "inactive", "suspended", "pending"];

export default function AdminMembersPage() {
  const { users, update, setRole, setStatus } = useUsers();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<User | null>(null);

  // local edit state
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", lga: "", occupation: "", role: "", status: "" });
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    let list = users;
    if (roleFilter !== "all") list = list.filter(u => u.role === roleFilter);
    if (statusFilter !== "all") list = list.filter(u => u.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.lga ?? "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => (b.joinedAt ?? "").localeCompare(a.joinedAt ?? ""));
  }, [users, search, roleFilter, statusFilter]);

  function openModal(user: User) {
    setSelected(user);
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? "",
      lga: user.lga ?? "",
      occupation: user.occupation ?? "",
      role: user.role,
      status: user.status,
    });
  }

  function closeModal() { setSelected(null); }

  async function saveChanges() {
    if (!selected) return;
    setSaving(true);
    update(selected.id, {
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone || undefined,
      lga: form.lga || undefined,
      occupation: form.occupation || undefined,
    });
    if (form.role !== selected.role) setRole(selected.id, form.role as User["role"]);
    if (form.status !== selected.status) setStatus(selected.id, form.status as User["status"]);
    setSaving(false);
    closeModal();
  }

  const headers = ["Name", "Email", "Role", "Status", "LGA", "Joined"];

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Members" count={filtered.length} subtitle="Manage all registered users." />

      <AdminFilters
        search={search}
        onSearchChange={setSearch}
        filters={
          <>
            <FilterSelect
              value={roleFilter}
              onChange={setRoleFilter}
              options={ROLES.map(r => ({ value: r, label: r === "all" ? "All roles" : r.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase()) }))}
            />
            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUSES.map(s => ({ value: s, label: s === "all" ? "All statuses" : s.replace(/\b\w/g, c => c.toUpperCase()) }))}
            />
          </>
        }
      />

      <AdminTable headers={headers} empty="No users match your search.">
        {filtered.map(user => (
          <TR key={user.id} onClick={() => openModal(user)}>
            <TD className="font-medium text-(--color-neutral-900)">{user.firstName} {user.lastName}</TD>
            <TD>{user.email}</TD>
            <TD><Badge value={user.role} /></TD>
            <TD><Badge value={user.status} /></TD>
            <TD>{user.lga ?? "—"}</TD>
            <TD>{user.joinedAt ? new Date(user.joinedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}</TD>
          </TR>
        ))}
      </AdminTable>

      {selected && (
        <AdminModal title={`${selected.firstName} ${selected.lastName}`} open={!!selected} onClose={closeModal}>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="First Name">
                <FormInput value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} />
              </FormField>
              <FormField label="Last Name">
                <FormInput value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
              </FormField>
              <FormField label="Phone">
                <FormInput value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </FormField>
              <FormField label="LGA">
                <FormInput value={form.lga} onChange={e => setForm(p => ({ ...p, lga: e.target.value }))} />
              </FormField>
              <div className="col-span-2"><FormField label="Occupation">
                <FormInput value={form.occupation} onChange={e => setForm(p => ({ ...p, occupation: e.target.value }))} />
              </FormField></div>
            </div>

            <div>
              <SectionDivider label="Role & Status" />
              <div className="grid grid-cols-2 gap-3 mt-2">
    <FormField label="Role">
                  <FormSelect value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                    {["guest", "applicant", "member", "admin", "super-admin"].map(r => (
                      <option key={r} value={r}>{r.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
                    ))}
                  </FormSelect>
                </FormField>
                <FormField label="Status">
                  <FormSelect value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    {["active", "inactive", "suspended", "pending"].map(s => (
                      <option key={s} value={s}>{s.replace(/\b\w/g, c => c.toUpperCase())}</option>
                    ))}
                  </FormSelect>
                </FormField>
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
