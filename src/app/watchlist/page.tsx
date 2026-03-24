'use client';

import Link from 'next/link';
import { Star, BookmarkSimple, Trash } from '@phosphor-icons/react';
import { useWatchlist } from '@/lib/watchlist-store';
import { companies } from '@/data/companies';
import { CompanyCard } from '@/components/CompanyCard';

export default function WatchlistPage() {
  const { watchedIds, remove } = useWatchlist();
  const watched = companies.filter(c => watchedIds.includes(c.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter text-zinc-950 flex items-center gap-2">
            <BookmarkSimple className="w-6 h-6 text-amber-500" weight="duotone" />
            Watchlist
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            {watched.length === 0
              ? 'No stocks in your watchlist yet.'
              : `Tracking ${watched.length} ${watched.length === 1 ? 'equity' : 'equities'}`}
          </p>
        </div>
        {watched.length > 0 && (
          <button
            onClick={() => watched.forEach(c => remove(c.id))}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-red-500 active:scale-[0.98] transition-all"
          >
            <Trash className="w-3.5 h-3.5" />
            Clear all
          </button>
        )}
      </div>

      {watched.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">
          <Star className="w-12 h-12 mx-auto mb-4 opacity-20" weight="duotone" />
          <p className="text-base font-medium mb-2 text-zinc-600">Your watchlist is empty</p>
          <p className="text-sm mb-5 text-zinc-400">Star any stock from the screener or company page to track it here.</p>
          <Link
            href="/screener"
            className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-[0_8px_30px_-6px_rgba(5,150,105,0.25)]"
          >
            Browse Screener
          </Link>
        </div>
      ) : (
        <>
          {/* Compliance summary */}
          <div className="grid grid-cols-3 gap-4">
            {(['HALAL', 'DOUBTFUL', 'NON_COMPLIANT'] as const).map(status => {
              const count = watched.filter(c => c.screening?.status === status).length;
              const styles = {
                HALAL: 'text-emerald-700 border-emerald-200 bg-emerald-50',
                DOUBTFUL: 'text-amber-700 border-amber-200 bg-amber-50',
                NON_COMPLIANT: 'text-red-600 border-red-200 bg-red-50',
              };
              const labels = { HALAL: 'Halal', DOUBTFUL: 'Doubtful', NON_COMPLIANT: 'Non-Compliant' };
              return (
                <div key={status} className={`border rounded-xl p-4 ${styles[status]}`}>
                  <div className="text-2xl font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>{count}</div>
                  <div className="text-sm mt-0.5">{labels[status]}</div>
                </div>
              );
            })}
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {watched.map(c => <CompanyCard key={c.id} company={c} />)}
          </div>

          {/* Table view */}
          <div className="border border-zinc-200/50 rounded-xl overflow-hidden bg-white">
            <div className="px-5 py-3 border-b border-zinc-100">
              <h2 className="font-semibold text-sm text-zinc-950">Watchlist Summary</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-400 text-xs">
                  <th className="text-left px-5 py-3 font-medium">Ticker</th>
                  <th className="text-left px-5 py-3 font-medium">Name</th>
                  <th className="text-right px-5 py-3 font-medium">Price</th>
                  <th className="text-right px-5 py-3 font-medium">Change</th>
                  <th className="text-center px-5 py-3 font-medium">Status</th>
                  <th className="text-right px-5 py-3 font-medium">Score</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {watched.map(c => (
                  <tr key={c.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/80 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/company/${c.id}`} className="font-semibold text-zinc-950 hover:text-emerald-600 transition-colors">
                        {c.ticker}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-zinc-500">{c.name}</td>
                    <td className="px-5 py-3 text-right font-medium text-zinc-950" style={{ fontVariantNumeric: 'tabular-nums' }}>${c.price.toFixed(2)}</td>
                    <td className={`px-5 py-3 text-right ${c.priceChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {c.priceChange >= 0 ? '+' : ''}{c.priceChangePercent.toFixed(2)}%
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-xs font-semibold ${
                        c.screening?.status === 'HALAL' ? 'text-emerald-600' :
                        c.screening?.status === 'DOUBTFUL' ? 'text-amber-600' : 'text-red-500'
                      }`}>
                        {c.screening?.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-zinc-950" style={{ fontVariantNumeric: 'tabular-nums' }}>{c.screening?.score ?? '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => remove(c.id)} className="text-zinc-300 hover:text-red-500 active:scale-[0.98] transition-all">
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
