// Server component — evaluated once per SSR request, never re-rendered in browser
export function FreshnessStamp({ date, nowMs }: { date: Date; nowMs?: number }) {
  if (isNaN(date.getTime())) return null;
  // eslint-disable-next-line react-hooks/purity
  const resolvedNow = nowMs ?? Date.now();
  const days = Math.floor((resolvedNow - date.getTime()) / 86400000);
  const label =
    days <= 0
      ? "Dikemaskini hari ini"
      : days === 1
        ? "Dikemaskini semalam"
        : `Dikemaskini ${days} hari lalu`;
  return <span className="text-xs text-zinc-400">{label}</span>;
}
