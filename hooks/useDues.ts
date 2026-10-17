"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DuesPayment, DuesSummary } from "@/lib/models";

interface DuesState { userId: string; records: DuesPayment[]; summary: DuesSummary | null; error: string }
export function useDues(userId?: string) {
  const [state, setState] = useState<DuesState | null>(null);
  const generation = useRef(0);
  const load = useCallback(async () => {
    if (!userId) return;
    const version = generation.current;
    try {
      const response = await fetch("/api/dues", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.ok || !result.summary) throw new Error(result.error ?? "Unable to load dues");
      if (version === generation.current) setState({ userId, records: result.data, summary: result.summary, error: "" });
    } catch (caught) {
      if (version === generation.current) setState(previous => ({
        userId, records: previous?.userId === userId ? previous.records : [],
        summary: previous?.userId === userId ? previous.summary : null,
        error: caught instanceof Error ? caught.message : "Unable to load dues",
      }));
    }
  }, [userId]);
  useEffect(() => {
    const version = ++generation.current;
    void load();
    const refresh = () => { void load(); };
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 60_000);
    return () => { generation.current = version + 1; window.removeEventListener("focus", refresh); window.clearInterval(timer); };
  }, [load]);
  const owned = state?.userId === userId ? state : null;
  return { records: owned?.records ?? [], summary: owned?.summary ?? null, loading: !!userId && !owned, error: owned?.error ?? "", reload: load };
}
