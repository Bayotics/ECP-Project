"use client";
import { useState } from "react";
import type { User } from "@/lib/models/user";
import { accountIsRestricted } from "@/lib/models/user";
import { useAuth } from "@/context/AuthContext";
import { useUsers } from "@/context/UsersContext";
import { apiRequestEnvelope } from "@/lib/client/api";
import { Badge, Btn, SectionDivider } from "@/components/admin/AdminUI";

export default function MemberAccessControls({ member, onUpdated }: { member: User; onUpdated: (user: User) => void }) {
  const { currentUser } = useAuth();
  const { refresh } = useUsers();
  const [action, setAction] = useState<"active" | "suspended" | "revoked" | null>(null);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const protectedAccount = member.id === currentUser?.id || member.role === "admin" || member.role === "super-admin";
  async function apply() {
    if (!action) return;
    setPending(true); setError(""); setMessage("");
    try {
      const result = await apiRequestEnvelope<User, { notified?: boolean; unchanged?: boolean; warning?: string }>(`/api/users/${member.id}/status`, {
        method: "PATCH", body: JSON.stringify({ status: action, reason: reason.trim() }),
      });
      if (!result.data) throw new Error("The updated member was not returned");
      onUpdated(result.data); setAction(null); setReason("");
      setMessage(result.warning ?? (result.unchanged ? "The account already has this status." : "Account access updated and the member notified by email."));
      await refresh().catch(() => { /* The selected account has already been updated. */ });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to update account access"); }
    finally { setPending(false); }
  }
  return <section className="space-y-3">
    <SectionDivider label="Portal access" />
    <div className="flex items-center gap-3 text-sm"><span>Current status</span><Badge value={member.status} /></div>
    {protectedAccount ? <p className="text-sm text-neutral-700">Administrator accounts are protected from these membership controls.</p> : <>
      <p className="text-sm text-neutral-700">Suspended and revoked members lose portal access until reinstated. The member receives an email explaining the change.</p>
      <div className="flex flex-wrap gap-2">
        {!accountIsRestricted(member.status) && <Btn variant="secondary" size="sm" disabled={pending} onClick={() => { setAction("suspended"); setError(""); }}>Suspend member</Btn>}
        {member.status !== "revoked" && <Btn variant="danger" size="sm" disabled={pending} onClick={() => { setAction("revoked"); setError(""); }}>Revoke membership</Btn>}
        {accountIsRestricted(member.status) && <Btn variant="primary" size="sm" disabled={pending} onClick={() => { setAction("active"); setError(""); }}>Reinstate member</Btn>}
      </div>
      {action && <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-neutral-950">{action === "active" ? `Reinstate ${member.displayName}? They will be able to sign in again.` : `${action === "suspended" ? "Suspend" : "Revoke membership for"} ${member.displayName}? Existing sessions will stop working and portal access will be blocked.`}</p>
        <label className="block text-sm text-neutral-900">Reason to include in the member’s email (optional)<textarea maxLength={500} value={reason} disabled={pending} onChange={event => setReason(event.target.value)} className="mt-1 block w-full rounded-xl border border-neutral-300 bg-white p-3" /></label>
        <div className="flex flex-wrap gap-2"><Btn variant={action === "active" ? "primary" : "danger"} size="sm" disabled={pending} onClick={apply}>{pending ? "Updating…" : action === "active" ? "Confirm reinstatement" : action === "suspended" ? "Confirm suspension" : "Confirm revocation"}</Btn><Btn variant="secondary" size="sm" disabled={pending} onClick={() => setAction(null)}>Cancel action</Btn></div>
      </div>}
    </>}
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {message && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-900">{message}</p>}
  </section>;
}
