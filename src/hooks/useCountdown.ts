import { useEffect, useState } from 'react';

function computeRemaining(expiresAt: string | null): number {
  if (!expiresAt) return 0;
  return Math.max(0, new Date(expiresAt).getTime() - Date.now());
}

function formatDuration(ms: number): string {
  if (ms <= 0) return 'Terminé';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}j ${hours}h ${String(minutes).padStart(2, '0')}m`;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  return `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

export function useCountdown(expiresAt: string | null): { label: string; urgent: boolean; expired: boolean } {
  const [remaining, setRemaining] = useState(() => computeRemaining(expiresAt));

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setRemaining(computeRemaining(expiresAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return {
    label: formatDuration(remaining),
    urgent: remaining > 0 && remaining < 60 * 60 * 1000, // < 1h
    expired: expiresAt !== null && remaining === 0,
  };
}
