"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/client/api";
import type { VolunteerOpportunity } from "@/lib/models/volunteer";

export function useVolunteerOpportunities(eventId = "", allEvents = false) {
  const { currentUser } = useAuth();
  const [data, setData] = useState<VolunteerOpportunity[] | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function fetchOpportunities() {
      const rows = await apiRequest<VolunteerOpportunity[]>(`/api/volunteers/opportunities${eventId && !allEvents ? `?eventId=${encodeURIComponent(eventId)}` : ""}`, { signal: controller.signal });
      if (allEvents && eventId && !rows.some(row => row.id === eventId)) {
        const selected = await apiRequest<VolunteerOpportunity[]>(`/api/volunteers/opportunities?eventId=${encodeURIComponent(eventId)}`, { signal: controller.signal });
        rows.push(...selected);
      }
      return rows;
    }
    fetchOpportunities().then(rows => { if (!controller.signal.aborted) { setData(rows); setError(""); } }).catch(error => {
      if (!controller.signal.aborted) { setData(null); setError(error instanceof Error ? error.message : "Could not load volunteer opportunities."); }
    });
    const timer = setInterval(() => setAttempt(value => value + 1), 60000);
    const refresh = () => setAttempt(value => value + 1);
    window.addEventListener("focus", refresh);
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [eventId, allEvents, currentUser?.id, attempt]);
  return { data, error, retry: () => setAttempt(value => value + 1) };
}
