import { useEffect, useState } from "react";
import type { HealthResponse } from "./types";

const POLL_INTERVAL_MS = 15_000;

/** Polls `GET /health` so the header can show live model/index/session stats. */
export function useHealth(healthUrl: string) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [reachable, setReachable] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const response = await fetch(healthUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as HealthResponse;
        if (!cancelled) {
          setHealth(data);
          setReachable(true);
        }
      } catch {
        if (!cancelled) setReachable(false);
      }
    }

    poll();
    const timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [healthUrl]);

  return { health, reachable };
}
