'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle,
  XCircle,
  Warning,
  ChartLineUp,
  TrendUp,
  TrendDown,
  ArrowUpRight,
  Funnel,
  Buildings,
  ShieldCheck,
  CircleNotch,
} from '@phosphor-icons/react';
import { companies } from '@/data/companies';
import { CompanyCard } from '@/components/CompanyCard';

export default function DashboardPage() {
  const halal = companies.filter((c) => c.screening?.status === 'HALAL');
  const nonCompliant = companies.filter(
    (c) => c.screening?.status === 'NON_COMPLIANT'
  );
  const doubtful = companies.filter(
    (c) => c.screening?.status === 'DOUBTFUL'
  );

  const topGainers = [...companies]
    .sort((a, b) => b.priceChangePercent - a.priceChangePercent)
    .slice(0, 3);
  const topLosers = [...companies]
    .sort((a, b) => a.priceChangePercent - b.priceChangePercent)
    .slice(0, 3);
  const featured = companies
    .filter((c) => c.screening?.status === 'HALAL')
    .slice(0, 4);

  const stats = [
    { label: 'Equities screened', value: '4,200+' },
    { label: 'Ratio checks', value: '3' },
    { label: 'Sectors covered', value: '12' },
    { label: 'Avg latency', value: '< 200ms' },
  ];

  const features = [
    {
      icon: ChartLineUp,
      title: 'Real-time AAOIFI screening',
      description:
        'Continuous debt, cash, and revenue ratio checks against AAOIFI thresholds. Results update as filings arrive.',
    },
    {
      icon: Buildings,
      title: 'Company profiles with ratio breakdown',
      description:
        'Full financial profiles with visual ratio bars, compliance history, and sector classification for every equity.',
    },
    {
      icon: Funnel,
      title: 'Sector exclusion engine',
      description:
        'Automatic exclusion of non-permissible sectors: banking, alcohol, tobacco, gambling, weapons, and adult entertainment.',
    },
    {
      icon: CircleNotch,
      title: 'Shariah score ring',
      description:
        'Aggregate compliance score from 0-100 based on weighted ratio proximity to thresholds. Visual ring indicator per company.',
    },
  ];

  return (
    <div className="space-y-20">
      {/* Hero — Asymmetric split */}
      <section
        className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 items-start pt-4 animate-fade-up"
        style={{ '--index': 0 } as React.CSSProperties}
      >
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Screening {companies.length} global equities
          </div>
          <h1
            className="text-4xl md:text-6xl tracking-tighter leading-[1.05] font-bold text-zinc-950"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            Screen 4,200+ equities for Shariah compliance in real time.
          </h1>
          <p className="text-lg text-zinc-500 max-w-lg leading-relaxed">
            AAOIFI-standard debt, cash, and revenue ratio screening. Built for
            Muslim investors who don&apos;t compromise.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/screener"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-[0_8px_30px_-6px_rgba(5,150,105,0.35)]"
            >
              <ShieldCheck className="w-4 h-4" weight="bold" />
              Start screening
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/watchlist"
              className="inline-flex items-center gap-2 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98] text-zinc-700 font-medium px-6 py-3 rounded-xl transition-all duration-200"
            >
              Watchlist
            </Link>
          </div>
        </div>

        {/* Right side — Stats stack */}
        <div className="space-y-4">
          <div
            className="border border-zinc-200/50 rounded-xl p-6 space-y-1 bg-white animate-fade-up"
            style={{ '--index': 1 } as React.CSSProperties}
          >
            <div className="flex items-center gap-2 text-emerald-600 mb-3">
              <CheckCircle className="w-5 h-5" weight="fill" />
              <span className="text-sm font-medium">Halal</span>
            </div>
            <div
              className="text-5xl font-bold tracking-tighter text-zinc-950"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {halal.length}
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              {((halal.length / companies.length) * 100).toFixed(0)}% of
              screened universe
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div
              className="border border-zinc-200/50 rounded-xl p-5 bg-white animate-fade-up"
              style={{ '--index': 2 } as React.CSSProperties}
            >
              <div className="flex items-center gap-1.5 text-amber-600 mb-2">
                <Warning className="w-4 h-4" weight="fill" />
                <span className="text-xs font-medium">Doubtful</span>
              </div>
              <div
                className="text-3xl font-bold tracking-tight text-zinc-950"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {doubtful.length}
              </div>
            </div>
            <div
              className="border border-zinc-200/50 rounded-xl p-5 bg-white animate-fade-up"
              style={{ '--index': 3 } as React.CSSProperties}
            >
              <div className="flex items-center gap-1.5 text-red-500 mb-2">
                <XCircle className="w-4 h-4" weight="fill" />
                <span className="text-xs font-medium">Non-Compliant</span>
              </div>
              <div
                className="text-3xl font-bold tracking-tight text-zinc-950"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {nonCompliant.length}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="animate-fade-up"
            style={{ '--index': i + 4 } as React.CSSProperties}
          >
            <div
              className="text-3xl md:text-4xl font-bold tracking-tighter text-zinc-950"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {stat.value}
            </div>
            <div className="text-sm text-zinc-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Features — Zigzag 2-col */}
      <section className="space-y-6">
        <h2
          className="text-2xl font-bold tracking-tighter text-zinc-950 animate-fade-up"
          style={{ '--index': 8 } as React.CSSProperties}
        >
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`border border-zinc-200/50 rounded-xl p-6 bg-white hover:border-emerald-200 transition-colors animate-fade-up ${
                i % 2 === 1 ? 'md:translate-y-8' : ''
              }`}
              style={{ '--index': i + 9 } as React.CSSProperties}
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
                <feature.icon
                  className="w-5 h-5 text-emerald-600"
                  weight="duotone"
                />
              </div>
              <h3 className="font-semibold text-zinc-950 mb-1.5">
                {feature.title}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Movers — Zigzag layout */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendUp className="w-4 h-4 text-emerald-600" weight="bold" />
            <h2 className="font-semibold text-sm text-zinc-950">
              Top Gainers
            </h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {topGainers.map((c) => (
              <Link
                key={c.id}
                href={`/company/${c.id}`}
                className="flex items-center justify-between py-3 hover:bg-zinc-50/80 active:scale-[0.98] -mx-3 px-3 rounded-lg transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm text-zinc-950">
                    {c.ticker}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                    {c.screening!.status}
                  </span>
                </div>
                <div className="text-right flex items-center gap-3">
                  <span
                    className="text-sm font-bold text-zinc-950"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    ${c.price.toFixed(2)}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                    <ArrowUpRight className="w-3 h-3" />+
                    {c.priceChangePercent.toFixed(2)}%
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
            {topLosers.map((c) => (
              <Link
                key={c.id}
                href={`/company/${c.id}`}
                className="flex items-center justify-between py-3 hover:bg-zinc-50/80 active:scale-[0.98] -mx-3 px-3 rounded-lg transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm text-zinc-950">
                    {c.ticker}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                    {c.screening!.status}
                  </span>
                </div>
                <div className="text-right flex items-center gap-3">
                  <span
                    className="text-sm font-bold text-zinc-950"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    ${c.price.toFixed(2)}
                  </span>
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
          <h2 className="text-xl font-bold tracking-tight text-zinc-950">
            Halal-Screened Equities
          </h2>
          <Link
            href="/screener"
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featured.map((c) => (
            <CompanyCard key={c.id} company={c} />
          ))}
        </div>
      </section>

      {/* Methodology */}
      <section className="border border-zinc-200/50 rounded-xl p-8 bg-white flex gap-6">
        <div className="w-1 bg-emerald-600 rounded-full flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-zinc-950 mb-2">
            Screening Methodology
          </h3>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-2xl">
            HalalFlow applies the AAOIFI methodology. A stock is{' '}
            <strong className="text-emerald-700">HALAL</strong> when: (1) Total
            Debt / Total Assets &lt; 33%, (2) Cash + Securities / Total Assets
            &lt; 33%, and (3) Non-Halal Revenue / Total Revenue &lt; 5%.
            Sectors like banking, alcohol, tobacco, gambling, and defense are
            categorically excluded.
          </p>
        </div>
      </section>
    </div>
  );
}
