'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Star, StarOff } from 'lucide-react';
import { ComplianceBadge } from '@/components/ui/Badge';
import type { Company } from '@/types';
import { useWatchlist } from '@/lib/watchlist-store';

interface CompanyCardProps {
  company: Company;
}

function formatMarketCap(v: number): string {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  return `$${(v / 1e6).toFixed(0)}M`;
}

export function CompanyCard({ company }: CompanyCardProps) {
  const { isWatched, toggle } = useWatchlist();
  const watched = isWatched(company.id);
  const up = company.priceChange >= 0;

  return (
    <div className="bg-[#111827] border border-white/8 rounded-xl p-4 hover:border-emerald-500/30 transition-colors group">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Link href={`/company/${company.id}`} className="font-bold text-base hover:text-emerald-400 transition-colors">
              {company.ticker}
            </Link>
            {company.screening && (
              <ComplianceBadge status={company.screening.status} size="sm" />
            )}
          </div>
          <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">{company.name}</p>
        </div>
        <button
          onClick={() => toggle(company.id)}
          className="text-slate-500 hover:text-amber-400 transition-colors"
          aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
        >
          {watched ? <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> : <StarOff className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-xl font-bold tabular-nums">${company.price.toFixed(2)}</div>
          <div className={`flex items-center gap-1 text-sm font-medium mt-0.5 ${up ? 'text-emerald-400' : 'text-red-400'}`}>
            {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {up ? '+' : ''}{company.priceChange.toFixed(2)} ({up ? '+' : ''}{company.priceChangePercent.toFixed(2)}%)
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Mkt Cap</div>
          <div className="text-sm font-semibold">{formatMarketCap(company.marketCap)}</div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/5 flex-wrap">
        <span className="text-xs bg-white/5 text-slate-400 px-2 py-0.5 rounded-full">{company.sector}</span>
        <span className="text-xs bg-white/5 text-slate-400 px-2 py-0.5 rounded-full">{company.exchange}</span>
        {company.screening?.score !== undefined && (
          <span className="ml-auto text-xs text-slate-500">
            Score: <span className="font-semibold text-slate-300">{company.screening.score}</span>
          </span>
        )}
      </div>
    </div>
  );
}
