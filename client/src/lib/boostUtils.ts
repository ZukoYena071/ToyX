import { useState, useEffect } from "react";

export function isToyBoosted(boostedUntil?: string | Date | null): boolean {
  if (!boostedUntil) return false;
  return new Date(boostedUntil).getTime() > Date.now();
}

export function formatBoostTimeLeft(boostedUntil?: string | Date | null): string {
  if (!boostedUntil) return "";
  const diffMs = new Date(boostedUntil).getTime() - Date.now();
  if (diffMs <= 0) return "";
  const totalHours = Math.floor(diffMs / 3600000);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) return `${days}d ${hours}h left`;
  return `${totalHours}h left`;
}

export function useNow(tickMs = 60000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);
  return now;
}
