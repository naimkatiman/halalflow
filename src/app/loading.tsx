export default function Loading() {
  return (
    <div role="status" className="flex items-center justify-center py-24">
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <div className="w-4 h-4 border-2 border-zinc-200 border-t-emerald-600 rounded-full animate-spin" aria-hidden="true" />
        <span>Loading…</span>
      </div>
    </div>
  );
}
