import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "debug-agent-recent-sessions";
const MAX_ENTRIES = 12;

export interface RecentSession {
  id: string;
  timestamp: number;
  errorText: string;
  context: string;
  verified: boolean | null; // null = session errored before completing
  preview: string;
}

function load(): RecentSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Session history, persisted client-side only — nothing sent to the backend. */
export function useRecentSessions() {
  const [sessions, setSessions] = useState<RecentSession[]>(() => load());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      // Storage full or unavailable (e.g. private browsing) — history just
      // won't persist across reloads; not worth surfacing to the user.
    }
  }, [sessions]);

  const record = useCallback((entry: Omit<RecentSession, "id" | "timestamp" | "preview">) => {
    const preview = entry.errorText.trim().split("\n")[0]?.slice(0, 80) ?? "";
    const next: RecentSession = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      preview,
    };
    setSessions((prev) => [next, ...prev].slice(0, MAX_ENTRIES));
  }, []);

  return { sessions, record };
}
