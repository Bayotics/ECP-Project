"use client";

import { FormField, FormSelect } from "@/components/admin/AdminUI";
import { useUsers } from "@/context/UsersContext";

export default function EventLeadFields({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const { users, isLoading } = useUsers();
  const members = users.filter(user => ["member", "admin", "super-admin"].includes(user.role)).sort((a, b) => a.displayName.localeCompare(b.displayName));
  return <FormField label="Event leads">
    <FormSelect aria-label="Add event lead" value="" disabled={isLoading} onChange={event => { if (event.target.value) onChange([...value, event.target.value]); }}>
      <option value="">{isLoading ? "Loading members…" : "Select a member to add as an event lead"}</option>
      {members.filter(member => !value.includes(member.id)).map(member => <option key={member.id} value={member.id} disabled={member.status !== "active"}>{member.displayName} — {member.email}{member.status !== "active" ? ` (${member.status})` : ""}</option>)}
    </FormSelect>
    <p className="mt-2 text-xs leading-relaxed text-neutral-700">Add one or more members. Selected leads and the membership notification admins receive volunteer sign-up emails. Only active members can be assigned.</p>
    {value.length > 0 && <ul className="mt-3 space-y-2">{value.map(id => {
      const member = members.find(member => member.id === id);
      return <li key={id} className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900"><span className="min-w-0 break-words">{member ? `${member.displayName} — ${member.email}${member.status !== "active" ? ` (${member.status})` : ""}` : "Previously selected member (unavailable)"}</span><button type="button" aria-label={`Remove event lead ${member?.displayName ?? id}`} onClick={() => onChange(value.filter(item => item !== id))} className="shrink-0 p-2 underline">Remove</button></li>;
    })}</ul>}
  </FormField>;
}
