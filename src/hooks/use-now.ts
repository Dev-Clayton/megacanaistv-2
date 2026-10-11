import { useEffect, useState } from "react";

/** Current time, refreshed every 30s. Returns 0 until hydrated to keep SSR stable. */
export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
