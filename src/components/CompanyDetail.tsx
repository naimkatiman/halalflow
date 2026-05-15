'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowSquareOut, Newspaper } from '@phosphor-icons/react';
import { ComplianceBadge } from '@/components/ui/Badge';
import { RatioBar } from '@/components/ui/RatioBar';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { WatchButton } from '@/components/WatchButton';
import { getPurificationGuidance, THRESHOLDS } from '@/lib/shariah-engine';
import type { Company } from '@/types';

function formatNum(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(2)}`;
}

const sentimentColors: Record<string, string> = {
  positive: 'text-emerald-600',
  neutral: 'text-zinc-400',
  negative: 'text-red-500',
};

export function CompanyDetail({ company }: { company: Company }) {
  const { screening, financials } = company;
  const purification = screening && screening.status === 'HALAL'
    ? getPurificationGuidance(screening.purificationRatio, (financials.dividendPerShare ?? 0) * 100)
    : null;

  const up = company.priceChange >= 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back */}
      <Link href="/screener" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Screener
      </Link>

      {/* Header */}
      <div className="border border-zinc-200/50 rounded-xl p-6 bg-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tighter text-zinc-950">{company.ticker}</h1>
              {screening && <ComplianceBadge status={screening.status} size="lg" />}
              <span className="text-xs bg-zinc-100 text-zinc-500 px-2.5 py-1 rounded-full">{company.exchange}</span>
              <span className="text-xs bg-zinc-100 text-zinc-500 px-2.5 py-1 rounded-full">{company.country}</span>
              {company.fundamentalsAsOfDate && (
                <span
                  className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full"
                  title="Fundamentals reporting period (as_of_date) from market-data-hub"
                >
                  Fundamentals as of {company.fundamentalsAsOfDate}
                </span>
              )}
            </div>
            <p className="text-zinc-700 text-lg font-medium mt-1">{company.name}</p>
            <p className="text-zinc-400 text-sm mt-0.5">{company.sector} &middot; {company.industry}</p>
          </div>

          <div className="flex items-start gap-4">
            {screening && <ScoreRing score={screening.score} size={80} />}
            <div className="text-right">
              <div className="text-3xl font-bold text-zinc-950" style={{ fontVariantNumeric: 'tabular-nums' }}>${company.price.toFixed(2)}</div>
              <div aria-live="polite" className={`text-sm font-medium mt-1 ${up ? 'text-emerald-600' : 'text-red-500'}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {up ? '+' : ''}{company.priceChange.toFixed(2)} ({up ? '+' : ''}{company.priceChangePercent.toFixed(2)}%)
              </div>
              <div className="mt-3">
                <WatchButton companyId={company.id} />
              </div>
            </div>
          </div>
        </div>

        <p className="text-zinc-500 text-sm mt-4 leading-relaxed">{company.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
        {/* Compliance Panel */}
        <div className="space-y-5">
          {/* Shariah Screening */}
          <div className="border border-zinc-200/50 rounded-xl p-6 bg-white">
            <h2 className="font-semibold text-zinc-950 mb-4 flex items-center gap-2">
              <span>Shariah Compliance Breakdown</span>
              <span className="text-xs text-zinc-400 font-normal">AAOIFI Methodology</span>
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
                      <span className="text-emerald-600 mt-0.5 font-bold text-xs">PASS</span>
                      <span className="text-zinc-700">{c}</span>
                    </div>
                  ))}
                  {screening.failedCriteria.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-red-500 mt-0.5 font-bold text-xs">FAIL</span>
                      <span className="text-zinc-700">{c}</span>
                    </div>
                  ))}
                </div>

                {/* Explanation */}
                <div className={`mt-5 p-4 rounded-lg text-sm leading-relaxed ${
                  screening.status === 'HALAL' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' :
                  screening.status === 'DOUBTFUL' ? 'bg-amber-50 border border-amber-200 text-amber-800' :
                  'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {screening.explanation}
                </div>
              </>
            )}
          </div>

          {/* Purification */}
          {purification && (
            <div className="border border-zinc-200/50 rounded-xl p-6 bg-white">
              <h2 className="font-semibold text-zinc-950 mb-3">Purification Guidance</h2>
              <p className="text-zinc-500 text-sm leading-relaxed">{purification.explanation}</p>
              {purification.amount > 0 && (
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <span className="text-emerald-700 font-semibold text-sm">Purification amount: ${purification.amount.toFixed(4)} per 100 shares</span>
                </div>
              )}
            </div>
          )}

          {/* News */}
          {company.news && company.news.length > 0 && (
            <div className="border border-zinc-200/50 rounded-xl p-6 bg-white">
              <div className="flex items-center gap-2 mb-4">
                <Newspaper className="w-4 h-4 text-zinc-400" weight="duotone" />
                <h2 className="font-semibold text-zinc-950">Latest News</h2>
              </div>
              <div className="space-y-4">
                {company.news.map(item => (
                  <div key={item.id} className="border-b border-zinc-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-zinc-950 leading-snug">{item.title}</p>
                        <p className="text-zinc-500 text-xs mt-1">{item.summary}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-zinc-400">{item.source}</span>
                          <span className="text-zinc-300">&middot;</span>
                          <span className="text-xs text-zinc-400">{item.publishedAt}</span>
                          <span className={`text-xs font-medium ${sentimentColors[item.sentiment] || 'text-zinc-400'}`}>
                            {item.sentiment}
                          </span>
                        </div>
                      </div>
                      <a href={item.url} className="flex-shrink-0 text-zinc-300 hover:text-zinc-600 transition-colors">
                        <ArrowSquareOut className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar — financials */}
        <div className="space-y-5">
          <div className="border border-zinc-200/50 rounded-xl p-5 bg-white">
            <h2 className="font-semibold text-zinc-950 mb-4 text-sm">Key Financials</h2>
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
                  <span className="text-zinc-400">{label}</span>
                  <span className="font-medium text-zinc-950" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Shariah score */}
          {screening && (
            <div className="border border-zinc-200/50 rounded-xl p-5 bg-white">
              <h2 className="font-semibold text-zinc-950 mb-3 text-sm">Compliance Score</h2>
              <div className="flex items-center gap-4">
                <ScoreRing score={screening.score} size={72} />
                <div>
                  <div className="text-2xl font-bold text-zinc-950">{screening.score}<span className="text-zinc-400 text-base">/100</span></div>
                  <p className="text-xs text-zinc-400 mt-1">Higher is better.</p>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {company.tags && (
            <div className="border border-zinc-200/50 rounded-xl p-5 bg-white">
              <h2 className="font-semibold text-zinc-950 mb-3 text-sm">Tags</h2>
              <div className="flex flex-wrap gap-1.5">
                {company.tags.map(tag => (
                  <span key={tag} className="text-xs bg-zinc-100 text-zinc-500 px-2.5 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
