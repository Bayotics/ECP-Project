"use client";

import { useState } from "react";
import { useCommittees } from "@/context/CommitteesContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import type { Committee, CommitteeJoinRequest } from "@/lib/models";

const TYPE_COLORS: Record<string, string> = {
  standing:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "ad-hoc":  "bg-amber-50 text-amber-700 border-amber-200",
  executive: "bg-rose-50 text-rose-700 border-rose-200",
  advisory:  "bg-sky-50 text-sky-700 border-sky-200",
  technical: "bg-violet-50 text-violet-700 border-violet-200",
};

export default function MemberCommitteesPage() {
  const { getActive, requestToJoin } = useCommittees();
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [modalCommittee, setModalCommittee] = useState<Committee | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const committees = getActive();

  // Determine which committees the current user belongs to
  const myCommitteeIds = new Set(
    committees
      .filter(c => c.members.some(m => m.userId === currentUser?.id))
      .map(c => c.id)
  );

  function openJoinModal(committee: Committee) {
    setModalCommittee(committee);
    setMessage("");
  }

  async function handleJoinRequest() {
    if (!modalCommittee || !currentUser) return;
    setSending(true);
    try {
      const result: CommitteeJoinRequest = await requestToJoin(
        modalCommittee.id,
        modalCommittee.name,
        currentUser.id,
        currentUser.displayName,
        currentUser.email,
        message.trim() || undefined,
      );
      if (result) {
        setSubmitted(prev => new Set([...prev, modalCommittee.id]));
        setModalCommittee(null);
        success(`Request to join ${modalCommittee.name} submitted.`, "Request Sent");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send request";
      error(msg, "Error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-(--color-neutral-900)">Chapter Committees</h1>
        <p className="text-sm text-(--color-neutral-500) mt-1">
          Browse active committees, learn what they do, and request to join one.
        </p>
      </div>

      {/* My committees banner */}
      {myCommitteeIds.size > 0 && (
        <div className="rounded-xl border border-(--color-green-200) bg-(--color-green-50) px-5 py-4">
          <p className="text-sm font-semibold text-(--color-green-700) mb-2">Your Committees</p>
          <div className="flex flex-wrap gap-2">
            {committees.filter(c => myCommitteeIds.has(c.id)).map(c => {
              const myRole = c.members.find(m => m.userId === currentUser?.id)?.role ?? "Member";
              return (
                <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-(--color-green-300) px-3 py-1 text-sm text-(--color-green-800) font-medium">
                  {c.name}
                  <span className="text-xs text-(--color-green-500)">· {myRole}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* All committees grid */}
      {committees.length === 0 ? (
        <div className="text-center py-16 text-(--color-neutral-400)">
          <p className="text-lg">No active committees at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {committees.map(c => {
            const chair = c.members.find(m => m.isChairperson);
            const isMember = myCommitteeIds.has(c.id);
            const hasRequested = submitted.has(c.id);
            const typeColor = TYPE_COLORS[c.type] ?? "bg-gray-50 text-gray-600 border-gray-200";

            return (
              <div key={c.id} className={`rounded-2xl border bg-white flex flex-col overflow-hidden transition hover:shadow-md ${isMember ? "border-(--color-green-300) ring-1 ring-(--color-green-200)" : "border-(--color-neutral-200)"}`}>
                {/* Card header */}
                <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="font-semibold text-(--color-neutral-900) text-base truncate">{c.name}</h2>
                      {isMember && (
                        <span className="text-[10px] font-bold bg-(--color-green-600) text-white rounded-full px-2 py-0.5">MEMBER</span>
                      )}
                    </div>
                    <span className={`inline-block text-xs font-semibold rounded-full px-2.5 py-0.5 border ${typeColor} capitalize`}>
                      {c.type.replace(/-/g, " ")}
                    </span>
                  </div>
                  <span className="text-xs text-(--color-neutral-400) flex-shrink-0">{c.members.length} member{c.members.length !== 1 ? "s" : ""}</span>
                </div>

                {/* Description */}
                <div className="px-5 pb-3 flex-1">
                  <p className="text-sm text-(--color-neutral-600) line-clamp-3">{c.description}</p>
                  {c.mandate && (
                    <p className="text-xs text-(--color-neutral-400) mt-2 italic line-clamp-2">{c.mandate}</p>
                  )}
                </div>

                {/* Contact person */}
                {chair && (
                  <div className="mx-5 mb-3 rounded-lg bg-(--color-neutral-50) border border-(--color-neutral-200) px-3 py-2.5 flex items-center gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-(--color-green-100) text-(--color-green-700) text-xs font-bold">
                      {chair.name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-(--color-neutral-700) truncate">{chair.name}</p>
                      <p className="text-xs text-(--color-neutral-400)">Chairperson · Contact</p>
                    </div>
                  </div>
                )}

                {/* Action */}
                <div className="px-5 pb-5">
                  {isMember ? (
                    <div className="text-center text-xs text-(--color-green-600) font-medium py-2">
                      ✓ You are a member of this committee
                    </div>
                  ) : hasRequested ? (
                    <div className="text-center text-xs text-(--color-neutral-500) font-medium py-2 rounded-lg bg-(--color-neutral-50) border border-(--color-neutral-200)">
                      Request pending review
                    </div>
                  ) : (
                    <button
                      onClick={() => openJoinModal(c)}
                      className="w-full rounded-lg border border-(--color-green-600) text-(--color-green-600) text-sm font-semibold py-2 hover:bg-(--color-green-50) transition-colors"
                    >
                      Request to Join
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Join request modal */}
      {modalCommittee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-(--color-neutral-900)">Request to Join</h2>
              <p className="text-sm text-(--color-neutral-500) mt-0.5">{modalCommittee.name}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-(--color-neutral-700) mb-1">
                Message <span className="font-normal text-(--color-neutral-400)">(optional)</span>
              </label>
              <textarea
                rows={4}
                className="w-full px-3 py-2.5 text-sm text-gray-600 rounded-xl border border-(--color-neutral-300) focus:outline-none focus:ring-2 focus:ring-(--color-green-400) resize-none transition-shadow"
                placeholder="Why do you want to join this committee? Any relevant experience?"
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setModalCommittee(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-(--color-neutral-300) text-(--color-neutral-600) hover:bg-(--color-neutral-50) transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleJoinRequest()}
                disabled={sending}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-(--color-green-600) text-white hover:bg-(--color-green-700) disabled:opacity-60 transition-colors"
              >
                {sending ? "Sending…" : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
