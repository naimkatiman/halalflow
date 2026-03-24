'use client';

import { Star } from '@phosphor-icons/react';
import { useWatchlist } from '@/lib/watchlist-store';

export function WatchButton({ companyId }: { companyId: string }) {
  const { isWatched, toggle } = useWatchlist();
  const watched = isWatched(companyId);

  return (
    <button
      onClick={() => toggle(companyId)}
      className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 active:scale-[0.98] ${
        watched
          ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
          : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
      }`}
    >
      <Star
        className="w-3.5 h-3.5"
        weight={watched ? 'fill' : 'regular'}
      />
      {watched ? 'Watching' : 'Watch'}
    </button>
  );
}
