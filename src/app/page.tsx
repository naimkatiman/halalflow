'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, XCircle, Warning, ChartLineUp, TrendUp, TrendDown, ArrowUpRight } from '@phosphor-icons/react';
import { companies } from '@/data/companies';
import { CompanyCard } from '@/components/CompanyCard';

export default function DashboardPage() {
  const halal = companies.filter(c => c.screening?.status === 'HALAL');
  const nonCompliant = companies.filter(c => c.screening?.status === 'NON_COMPLIANT');
  const doubtful = companies.filter(c => c.screening?.status === 'DOUBTFUL');

  const topGainers = [...companies].sort((a, b) => b.priceChangePercent - a.priceChangePercent).slice(0, 3);
  const topLosers = [...companies].sort((a, b) => a.priceChangePercent - b.priceChangePercent).slice(0, 3);
  const featured = companies.filter(c => c.screening?.status === 'HALAL').slice(0, 4);

  return (
    <div className="space-y-16">
      {/* Hero — Asymmetric split */}
      <section className="grid grid-cols-1 md:grid-cols-5 gap-12 items-start pt-4">
        <div className="md:col-span-3 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Screening {companies.length} global equities · AAOIFI
          </div>
          <h1 className="text-4xl md:text-6xl tracking-tighter leading-none font-bold text-zinc-950">
            Shariah-compliant
            <br />
            stock screening
          </h1>
          <p className="text-lg text-zinc-500 max-w-lg leading-relaxed">
            Real-time AAOIFI screening for the modern Muslim investor. 4,200+ equities covered with full compliance breakdowns.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/screener"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_20px_40px_-15px_rgba(5,150,105,0.3)]"
            >
              <ChartLineUp className="w-4 h-4" weight="bold" />
              Open Screener
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/watchlist"
              className="inline-flex items-center gap-2 border border-zinc-200/50 hover:border-zinc-300 text-zinc-700 font-medium px-5 py-2.5 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            >
              Watchlist
            </Link>
          </div>
        </div>

        {/* Right side — Stats stack */}
        <div className="md:col-span-2 space-y-4">
          <div className="border border-zinc-200/50 rounded-xl p-6 space-y-1 animate-fade-in-up" style={{ '--index': 0 } as React.CSSProperties}>
            <div className="flex items-center gap-2 text-emerald-600 mb-3">
              <CheckCircle className="w-5 h-5" weight="fill" />
              <span className="text-sm font-medium">Halal</span>
            </div>
            <div className="text-5xl font-bold tracking-tighter text-zinc-950">{halal.length}</div>
            <div className="text-xs text-zinc-400 mt-1">{((halal.length / companies.length) * 100).toFixed(0)}% of screened universe</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-zinc-200/50 rounded-xl p-5 animate-fade-in-up" style={{ '--index': 1 } as React.CSSProperties}>
              <div className="flex items-center gap-1.5 text-amber-600 mb-2">
                <Warning className="w-4 h-4" weight="fill" />
                <span className="text-xs font-medium">Doubtful</span>
              </div>
              <div className="text-3xl font-bold tracking-tight text-zinc-950">{doubtful.length}</div>
            </div>
            <div className="border border-zinc-200/50 rounded-xl p-5 animate-fade-in-up" style={{ '--index': 2 } as React.CSSProperties}>
              <div className="flex items-center gap-1.5 text-red-500 mb-2">
                <XCircle className="w-4 h-4" weight="fill" />
                <span className="text-xs font-medium">Non-Compliant</span>
              </div>
              <div className="text-3xl font-bold tracking-tight text-zinc-950">{nonCompliant.length}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Movers — Zigzag layout */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendUp className="w-4 h-4 text-emerald-600" weight="bold" />
            <h2 className="font-semibold text-sm text-zinc-950">Top Gainers</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {topGainers.map(c => (
              <Link key={c.id} href={`/company/${c.id}`} className="flex items-center justify-between py-3 hover:bg-zinc-50/80 -mx-3 px-3 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm text-zinc-950">{c.ticker}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                    {c.screening!.status}
                  </span>
                </div>
                <div className="text-right flex items-center gap-3">
                  <span className="text-sm font-bold text-zinc-950">${c.price.toFixed(2)}</span>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                    <ArrowUpRight className="w-3 h-3" />
                    +{c.priceChangePercent.toFixed(2)}%
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-4 md:mt-12">
          <div className="flex items-center gap-2">
            <TrendDown className="w-4 h-4 text-red-500" weight="bold" />
            <h2 className="font-semibold text-sm text-zinc-950">Top Losers</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {topLosers.map(c => (
              <Link key={c.id} href={`/company/${c.id}`} className="flex items-center justify-between py-3 hover:bg-zinc-50/80 -mx-3 px-3 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm text-zinc-950">{c.ticker}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                    {c.screening!.status}
                  </span>
                </div>
                <div className="text-right flex items-center gap-3">
                  <span className="text-sm font-bold text-zinc-950">${c.price.toFixed(2)}</span>
                  <span className="text-xs font-semibold text-red-500">
                    {c.priceChangePercent.toFixed(2)}%
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured — Asymmetric 2-col */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold tracking-tight text-zinc-950">Halal-Screened Equities</h2>
          <Link href="/screener" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 transition-colors">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featured.map(c => <CompanyCard key={c.id} company={c} />)}
        </div>
      </section>

      {/* Methodology */}
      <section className="border border-zinc-200/50 rounded-xl p-8 flex gap-6">
        <div className="w-1 bg-emerald-600 rounded-full flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-zinc-950 mb-2">Screening Methodology</h3>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-2xl">
            HalalFlow applies the AAOIFI methodology. A stock is{' '}
            <strong className="text-emerald-700">HALAL</strong> when: (1) Total Debt / Total Assets &lt; 33%,
            (2) Cash + Securities / Total Assets &lt; 33%, and (3) Non-Halal Revenue / Total Revenue &lt; 5%.
            Sectors like banking, alcohol, tobacco, gambling, and defense are categorically excluded.
          </p>
        </div>
      </section>
    </div>
  );
}
