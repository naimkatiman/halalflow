import Link from 'next/link';
import { TrendingUp, TrendingDown, CheckCircle, XCircle, AlertTriangle, ChevronRight, BarChart3 } from 'lucide-react';
import { companies } from '@/data/companies';
import { CompanyCard } from '@/components/CompanyCard';
import { ComplianceBadge } from '@/components/ui/Badge';

export default function DashboardPage() {
  const halal = companies.filter(c => c.screening?.status === 'HALAL');
  const nonCompliant = companies.filter(c => c.screening?.status === 'NON_COMPLIANT');
  const doubtful = companies.filter(c => c.screening?.status === 'DOUBTFUL');

  const topGainers = [...companies].sort((a, b) => b.priceChangePercent - a.priceChangePercent).slice(0, 3);
  const topLosers = [...companies].sort((a, b) => a.priceChangePercent - b.priceChangePercent).slice(0, 3);
  const featured = companies.filter(c => c.screening?.status === 'HALAL').slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shariah Intelligence Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Screening {companies.length} global equities &nbsp;·&nbsp; AAOIFI Methodology &nbsp;·&nbsp; Updated daily
          </p>
        </div>
        <Link
          href="/screener"
          className="flex items-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <BarChart3 className="w-4 h-4" />
          Full Screener
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#111827] border border-emerald-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Halal</span>
          </div>
          <div className="text-3xl font-bold">{halal.length}</div>
          <div className="text-xs text-slate-500 mt-1">{((halal.length / companies.length) * 100).toFixed(0)}% of screened universe</div>
        </div>
        <div className="bg-[#111827] border border-amber-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-medium">Doubtful</span>
          </div>
          <div className="text-3xl font-bold">{doubtful.length}</div>
          <div className="text-xs text-slate-500 mt-1">Consult your Shariah board</div>
        </div>
        <div className="bg-[#111827] border border-red-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <XCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Non-Compliant</span>
          </div>
          <div className="text-3xl font-bold">{nonCompliant.length}</div>
          <div className="text-xs text-slate-500 mt-1">Excluded from halal portfolio</div>
        </div>
      </div>

      {/* Movers */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#111827] border border-white/8 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h2 className="font-semibold text-sm">Top Gainers</h2>
          </div>
          <div className="space-y-3">
            {topGainers.map(c => (
              <Link key={c.id} href={`/company/${c.id}`} className="flex items-center justify-between hover:bg-white/3 -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{c.ticker}</span>
                  <ComplianceBadge status={c.screening!.status} size="sm" />
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">${c.price.toFixed(2)}</div>
                  <div className="text-xs text-emerald-400">+{c.priceChangePercent.toFixed(2)}%</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-[#111827] border border-white/8 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <h2 className="font-semibold text-sm">Top Losers</h2>
          </div>
          <div className="space-y-3">
            {topLosers.map(c => (
              <Link key={c.id} href={`/company/${c.id}`} className="flex items-center justify-between hover:bg-white/3 -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{c.ticker}</span>
                  <ComplianceBadge status={c.screening!.status} size="sm" />
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">${c.price.toFixed(2)}</div>
                  <div className="text-xs text-red-400">{c.priceChangePercent.toFixed(2)}%</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Halal Stocks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Halal-Screened Equities</h2>
          <Link href="/screener" className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {featured.map(c => <CompanyCard key={c.id} company={c} />)}
        </div>
      </div>

      {/* Methodology note */}
      <div className="bg-[#111827] border border-white/8 rounded-xl p-5 flex gap-4">
        <div className="w-1 bg-emerald-500 rounded-full flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-sm mb-1">Screening Methodology</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            HalalFlow applies the AAOIFI methodology. A stock is{' '}
            <strong className="text-emerald-400">HALAL</strong> when: (1) Total Debt / Total Assets &lt; 33%,
            (2) Cash + Securities / Total Assets &lt; 33%, and (3) Non-Halal Revenue / Total Revenue &lt; 5%.
            Sectors like banking, alcohol, tobacco, gambling, and defense are categorically excluded.
          </p>
        </div>
      </div>
    </div>
  );
}
