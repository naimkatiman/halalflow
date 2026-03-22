'use client';

import { useState, useMemo } from 'react';
import { Search, Filter } from 'lucide-react';
import { companies, sectors } from '@/data/companies';
import { CompanyCard } from '@/components/CompanyCard';
import type { ComplianceStatus } from '@/types';
import clsx from 'clsx';

type StatusFilter = ComplianceStatus | 'all';

const statusOptions: { value: StatusFilter; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: 'text-slate-300' },
  { value: 'HALAL', label: 'Halal', color: 'text-emerald-400' },
  { value: 'DOUBTFUL', label: 'Doubtful', color: 'text-amber-400' },
  { value: 'NON_COMPLIANT', label: 'Non-Compliant', color: 'text-red-400' },
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
        <h1 className="text-2xl font-bold">Shariah Screener</h1>
        <p className="text-slate-400 text-sm mt-1">Filter and sort global equities by Shariah compliance status</p>
      </div>

      {/* Filters */}
      <div className="bg-[#111827] border border-white/8 rounded-xl p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by ticker, name, or sector..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:bg-white/8 transition-colors"
          />
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs text-slate-500 mr-1">Status:</span>
            {statusOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={clsx(
                  'text-xs px-3 py-1.5 rounded-full border transition-colors font-medium',
                  statusFilter === opt.value
                    ? 'bg-white/10 border-white/20 ' + opt.color
                    : 'bg-transparent border-white/8 text-slate-500 hover:text-slate-300 hover:border-white/15'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Sector filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Sector:</span>
            <select
              value={sectorFilter}
              onChange={e => setSectorFilter(e.target.value)}
              className="bg-white/5 border border-white/10 text-sm text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500/40"
            >
              <option value="all">All Sectors</option>
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs text-slate-500">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="bg-white/5 border border-white/10 text-sm text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500/40"
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
        <span className="text-sm text-slate-400">
          Showing <strong className="text-slate-200">{filtered.length}</strong> of {companies.length} equities
        </span>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(c => <CompanyCard key={c.id} company={c} />)}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No equities match your filters.</p>
          <button
            onClick={() => { setQuery(''); setStatusFilter('all'); setSectorFilter('all'); }}
            className="mt-3 text-sm text-emerald-400 hover:text-emerald-300"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
