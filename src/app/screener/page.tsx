'use client';

import { useState, useMemo } from 'react';
import { MagnifyingGlass, Funnel } from '@phosphor-icons/react';
import { companies, sectors } from '@/data/companies';
import { CompanyCard } from '@/components/CompanyCard';
import type { ComplianceStatus } from '@/types';
import clsx from 'clsx';

type StatusFilter = ComplianceStatus | 'all';

const statusOptions: { value: StatusFilter; label: string; activeClass: string }[] = [
  { value: 'all', label: 'All', activeClass: 'bg-zinc-100 text-zinc-900 border-zinc-300' },
  { value: 'HALAL', label: 'Halal', activeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'DOUBTFUL', label: 'Doubtful', activeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'NON_COMPLIANT', label: 'Non-Compliant', activeClass: 'bg-red-50 text-red-600 border-red-200' },
];

export default function ScreenerPage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'price' | 'marketCap' | 'change'>('score');

  const filtered = useMemo(() => {
    let result = [...companies];

    if (query) {
      const q = query.toLowerCase();
      result = result.filter(c =>
        c.ticker.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.sector.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(c => c.screening?.status === statusFilter);
    }

    if (sectorFilter !== 'all') {
      result = result.filter(c => c.sector === sectorFilter);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'score': return (b.screening?.score ?? 0) - (a.screening?.score ?? 0);
        case 'price': return b.price - a.price;
        case 'marketCap': return b.marketCap - a.marketCap;
        case 'change': return b.priceChangePercent - a.priceChangePercent;
        default: return 0;
      }
    });

    return result;
  }, [query, statusFilter, sectorFilter, sortBy]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tighter text-zinc-950">Shariah Screener</h1>
        <p className="text-zinc-500 text-sm mt-1">Filter and sort global equities by Shariah compliance status</p>
      </div>

      {/* Filters */}
      <div className="border border-zinc-200/50 rounded-xl p-4 bg-white space-y-4">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by ticker, name, or sector..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200/80 rounded-lg pl-9 pr-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <Funnel className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-400 mr-1">Status:</span>
            {statusOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={clsx(
                  'text-xs px-3 py-1.5 rounded-full border transition-all duration-200 font-medium active:scale-[0.98]',
                  statusFilter === opt.value
                    ? opt.activeClass
                    : 'bg-transparent border-zinc-200/80 text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Sector filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-400">Sector:</span>
            <select
              value={sectorFilter}
              onChange={e => setSectorFilter(e.target.value)}
              className="bg-zinc-50 border border-zinc-200/80 text-sm text-zinc-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500/40"
            >
              <option value="all">All Sectors</option>
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs text-zinc-400">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="bg-zinc-50 border border-zinc-200/80 text-sm text-zinc-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500/40"
            >
              <option value="score">Compliance Score</option>
              <option value="marketCap">Market Cap</option>
              <option value="price">Price</option>
              <option value="change">% Change</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500">
          Showing <strong className="text-zinc-900">{filtered.length}</strong> of {companies.length} equities
        </span>
      </div>

      {/* Grid — 2-col asymmetric */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(c => <CompanyCard key={c.id} company={c} />)}
        </div>
      ) : (
        <div className="text-center py-20 text-zinc-400">
          <MagnifyingGlass className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No equities match your filters.</p>
          <button
            onClick={() => { setQuery(''); setStatusFilter('all'); setSectorFilter('all'); }}
            className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 active:scale-[0.98] transition-all"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
