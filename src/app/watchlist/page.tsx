'use client';

import Link from 'next/link';
import { Star, BookMarked, Trash2 } from 'lucide-react';
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookMarked className="w-6 h-6 text-amber-400" />
            Watchlist
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {watched.length === 0
              ? 'No stocks in your watchlist yet.'
              : `Tracking ${watched.length} ${watched.length === 1 ? 'equity' : 'equities'}`}
          </p>
        </div>
        {watched.length > 0 && (
          <button
            onClick={() => watched.forEach(c => remove(c.id))}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear all
          </button>
        )}
      </div>

      {watched.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Star className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-base font-medium mb-2">Your watchlist is empty</p>
          <p className="text-sm mb-5">Star any stock from the screener or company page to track it here.</p>
          <Link
            href="/screener"
            className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-500/25 transition-colors"
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
              const colors = {
                HALAL: 'text-emerald-400 border-emerald-500/20',
                DOUBTFUL: 'text-amber-400 border-amber-500/20',
                NON_COMPLIANT: 'text-red-400 border-red-500/20',
              };
              const labels = { HALAL: 'Halal', DOUBTFUL: 'Doubtful', NON_COMPLIANT: 'Non-Compliant' };
              return (
                <div key={status} className={`bg-[#111827] border rounded-xl p-4 ${colors[status]}`}>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm mt-0.5">{labels[status]}</div>
                </div>
              );
            })}
          </div>

          {/* Cards */}
          <div className="grid grid-cols-3 gap-4">
            {watched.map(c => <CompanyCard key={c.id} company={c} />)}
          </div>

          {/* Table view */}
          <div className="bg-[#111827] border border-white/8 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5">
              <h2 className="font-semibold text-sm">Watchlist Summary</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 text-xs">
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
                  <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/company/${c.id}`} className="font-semibold hover:text-emerald-400 transition-colors">
                        {c.ticker}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-400">{c.name}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium">${c.price.toFixed(2)}</td>
                    <td className={`px-5 py-3 text-right tabular-nums ${c.priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {c.priceChange >= 0 ? '+' : ''}{c.priceChangePercent.toFixed(2)}%
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-xs font-semibold ${
                        c.screening?.status === 'HALAL' ? 'text-emerald-400' :
                        c.screening?.status === 'DOUBTFUL' ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {c.screening?.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium">{c.screening?.score ?? '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => remove(c.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
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
