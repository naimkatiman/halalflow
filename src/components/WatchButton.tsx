'use client';

import { Star, StarOff } from 'lucide-react';
import { useWatchlist } from '@/lib/watchlist-store';

export function WatchButton({ companyId }: { companyId: string }) {
  const { isWatched, toggle } = useWatchlist();
  const watched = isWatched(companyId);

  return (
    <button
      onClick={() => toggle(companyId)}
      className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors ${
        watched
          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25'
          : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
      }`}
    >
      {watched
        ? <><Star className="w-3.5 h-3.5 fill-amber-400" /> Watching</>
        : <><StarOff className="w-3.5 h-3.5" /> Watch</>
      }
    </button>
  );
}
