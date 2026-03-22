import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Newspaper } from 'lucide-react';
import { getCompanyById, companies } from '@/data/companies';
import { ComplianceBadge } from '@/components/ui/Badge';
import { RatioBar } from '@/components/ui/RatioBar';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { WatchButton } from '@/components/WatchButton';
import { getPurificationGuidance, THRESHOLDS } from '@/lib/shariah-engine';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return companies.map(c => ({ id: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const company = getCompanyById(id);
  if (!company) return { title: 'Company Not Found' };
  return {
    title: `${company.ticker} — ${company.name} | HalalFlow`,
    description: `Shariah compliance breakdown for ${company.name}. Status: ${company.screening?.status}.`,
  };
}

function formatNum(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(2)}`;
}

const sentimentColors = {
  positive: 'text-emerald-400',
  neutral: 'text-slate-400',
  negative: 'text-red-400',
};

export default async function CompanyPage({ params }: Props) {
  const { id } = await params;
  const company = getCompanyById(id);
  if (!company) notFound();

  const { screening, financials } = company;
  const purification = screening && screening.status === 'HALAL'
    ? getPurificationGuidance(screening.purificationRatio, (financials.dividendPerShare ?? 0) * 100)
    : null;

  const up = company.priceChange >= 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back */}
      <Link href="/screener" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Screener
      </Link>

      {/* Header */}
      <div className="bg-[#111827] border border-white/8 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{company.ticker}</h1>
              {screening && <ComplianceBadge status={screening.status} size="lg" />}
              <span className="text-xs bg-white/5 text-slate-400 px-2.5 py-1 rounded-full">{company.exchange}</span>
              <span className="text-xs bg-white/5 text-slate-400 px-2.5 py-1 rounded-full">{company.country}</span>
            </div>
            <p className="text-slate-300 text-lg font-medium mt-1">{company.name}</p>
            <p className="text-slate-500 text-sm mt-0.5">{company.sector} · {company.industry}</p>
          </div>

          <div className="flex items-start gap-4">
            {screening && <ScoreRing score={screening.score} size={80} />}
            <div className="text-right">
              <div className="text-3xl font-bold tabular-nums">${company.price.toFixed(2)}</div>
              <div className={`text-sm font-medium mt-1 ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                {up ? '+' : ''}{company.priceChange.toFixed(2)} ({up ? '+' : ''}{company.priceChangePercent.toFixed(2)}%)
              </div>
              <div className="mt-3">
                <WatchButton companyId={company.id} />
              </div>
            </div>
          </div>
        </div>

        <p className="text-slate-400 text-sm mt-4 leading-relaxed">{company.description}</p>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Compliance Panel */}
        <div className="col-span-3 space-y-5">
          {/* Shariah Screening */}
          <div className="bg-[#111827] border border-white/8 rounded-xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <span>Shariah Compliance Breakdown</span>
              <span className="text-xs text-slate-500 font-normal">AAOIFI Methodology</span>
            </h2>

            {screening && (
              <>
                <div className="space-y-4 mb-5">
                  <RatioBar
                    label="Debt Ratio (Total Debt / Total Assets)"
                    value={screening.debtRatio}
                    threshold={THRESHOLDS.DEBT_RATIO}
                  />
                  <RatioBar
                    label="Cash & Securities Ratio (Cash+Sec / Total Assets)"
                    value={screening.cashRatio}
                    threshold={THRESHOLDS.CASH_RATIO}
                  />
                  <RatioBar
                    label="Non-Halal Revenue Ratio"
                    value={screening.nonHalalRevenueRatio}
                    threshold={THRESHOLDS.NON_HALAL_REVENUE}
                    format="percent"
                  />
                </div>

                {/* Passed / Failed criteria */}
                <div className="space-y-2">
                  {screening.passedCriteria.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-slate-300">{c}</span>
                    </div>
                  ))}
                  {screening.failedCriteria.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-red-400 mt-0.5">✗</span>
                      <span className="text-slate-300">{c}</span>
                    </div>
                  ))}
                </div>

                {/* Explanation */}
                <div className={`mt-5 p-4 rounded-lg text-sm leading-relaxed ${
                  screening.status === 'HALAL' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' :
                  screening.status === 'DOUBTFUL' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300' :
                  'bg-red-500/10 border border-red-500/20 text-red-300'
                }`}>
                  {screening.explanation}
                </div>
              </>
            )}
          </div>

          {/* Purification */}
          {purification && (
            <div className="bg-[#111827] border border-white/8 rounded-xl p-6">
              <h2 className="font-semibold mb-3">Purification Guidance</h2>
              <p className="text-slate-400 text-sm leading-relaxed">{purification.explanation}</p>
              {purification.amount > 0 && (
                <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <span className="text-emerald-400 font-semibold">Purification amount: ${purification.amount.toFixed(4)} per 100 shares</span>
                </div>
              )}
            </div>
          )}

          {/* News */}
          {company.news && company.news.length > 0 && (
            <div className="bg-[#111827] border border-white/8 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Newspaper className="w-4 h-4 text-slate-400" />
                <h2 className="font-semibold">Latest News</h2>
              </div>
              <div className="space-y-4">
                {company.news.map(item => (
                  <div key={item.id} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium leading-snug">{item.title}</p>
                        <p className="text-slate-400 text-xs mt-1">{item.summary}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-slate-500">{item.source}</span>
                          <span className="text-slate-600">·</span>
                          <span className="text-xs text-slate-500">{item.publishedAt}</span>
                          <span className={`text-xs font-medium ${sentimentColors[item.sentiment]}`}>
                            {item.sentiment}
                          </span>
                        </div>
                      </div>
                      <a href={item.url} className="flex-shrink-0 text-slate-500 hover:text-slate-300">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar — financials */}
        <div className="col-span-2 space-y-5">
          <div className="bg-[#111827] border border-white/8 rounded-xl p-5">
            <h2 className="font-semibold mb-4 text-sm">Key Financials</h2>
            <div className="space-y-3">
              {[
                { label: 'Market Cap', value: formatNum(company.marketCap) },
                { label: 'P/E Ratio', value: company.peRatio.toFixed(1) + 'x' },
                { label: 'EPS', value: `$${company.eps.toFixed(2)}` },
                { label: 'Dividend Yield', value: company.dividendYield > 0 ? `${company.dividendYield.toFixed(2)}%` : '—' },
                { label: 'Total Assets', value: formatNum(financials.totalAssets) },
                { label: 'Total Debt', value: formatNum(financials.totalDebt) },
                { label: 'Cash & Securities', value: formatNum(financials.cashAndSecurities) },
                { label: 'Total Revenue', value: formatNum(financials.totalRevenue) },
                { label: 'Total Equity', value: formatNum(financials.totalEquity) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium tabular-nums">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Shariah score */}
          {screening && (
            <div className="bg-[#111827] border border-white/8 rounded-xl p-5">
              <h2 className="font-semibold mb-3 text-sm">Compliance Score</h2>
              <div className="flex items-center gap-4">
                <ScoreRing score={screening.score} size={72} />
                <div>
                  <div className="text-2xl font-bold">{screening.score}<span className="text-slate-500 text-base">/100</span></div>
                  <p className="text-xs text-slate-500 mt-1">Higher is better.</p>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {company.tags && (
            <div className="bg-[#111827] border border-white/8 rounded-xl p-5">
              <h2 className="font-semibold mb-3 text-sm">Tags</h2>
              <div className="flex flex-wrap gap-1.5">
                {company.tags.map(tag => (
                  <span key={tag} className="text-xs bg-white/5 text-slate-400 px-2.5 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
