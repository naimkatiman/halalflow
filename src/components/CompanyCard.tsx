'use client';

import Link from 'next/link';
import { TrendUp, TrendDown, Star } from '@phosphor-icons/react';
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
    <div className="bg-white border border-zinc-200/50 rounded-xl p-5 hover:border-emerald-200 transition-all duration-200 group">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={`/company/${company.id}`}
              className="font-bold text-base text-zinc-950 hover:text-emerald-600 transition-colors"
            >
              {company.ticker}
            </Link>
            {company.screening && (
              <ComplianceBadge status={company.screening.status} size="sm" />
            )}
          </div>
          <p className="text-zinc-400 text-xs mt-0.5 line-clamp-1">
            {company.name}
          </p>
        </div>
        <button
          onClick={() => toggle(company.id)}
          className="text-zinc-300 hover:text-amber-500 active:scale-[0.98] transition-colors"
          aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
        >
          <Star
            className="w-4 h-4"
            weight={watched ? 'fill' : 'regular'}
            style={watched ? { color: '#f59e0b' } : undefined}
          />
        </button>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div
            className="text-xl font-bold text-zinc-950"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            ${company.price.toFixed(2)}
          </div>
          <div
            className={`flex items-center gap-1 text-sm font-medium mt-0.5 ${
              up ? 'text-emerald-600' : 'text-red-500'
            }`}
          >
            {up ? (
              <TrendUp className="w-3.5 h-3.5" weight="bold" />
            ) : (
              <TrendDown className="w-3.5 h-3.5" weight="bold" />
            )}
            {up ? '+' : ''}
            {company.priceChange.toFixed(2)} ({up ? '+' : ''}
            {company.priceChangePercent.toFixed(2)}%)
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-zinc-400">Mkt Cap</div>
          <div
            className="text-sm font-semibold text-zinc-700"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formatMarketCap(company.marketCap)}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-zinc-100 flex-wrap">
        <span className="text-xs bg-zinc-50 text-zinc-500 px-2 py-0.5 rounded-full">
          {company.sector}
        </span>
        <span className="text-xs bg-zinc-50 text-zinc-500 px-2 py-0.5 rounded-full">
          {company.exchange}
        </span>
        {company.screening?.score !== undefined && (
          <span className="ml-auto text-xs text-zinc-400">
            Score:{' '}
            <span className="font-semibold text-zinc-700">
              {company.screening.score}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
