'use client';

import { useState } from 'react';
import { FileText, Download, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { companies } from '@/data/companies';
import { ComplianceBadge } from '@/components/ui/Badge';
import { RatioBar } from '@/components/ui/RatioBar';
import { THRESHOLDS, getPurificationGuidance } from '@/lib/shariah-engine';
import type { Company } from '@/types';
import clsx from 'clsx';

function generateReport(company: Company): string {
  const { screening, financials } = company;
  if (!screening) return '';
  const purification = getPurificationGuidance(screening.purificationRatio, financials.dividendPerShare ?? 0);

  return `HALALFLOW SHARIAH RESEARCH REPORT
=====================================
Company:   ${company.name} (${company.ticker})
Exchange:  ${company.exchange} | Sector: ${company.sector}
Generated: ${new Date().toISOString().split('T')[0]}
Methodology: AAOIFI Islamic Finance Standards

COMPLIANCE STATUS: ${screening.status}
SHARIAH SCORE: ${screening.score}/100

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINANCIAL RATIO ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Debt Ratio:           ${(screening.debtRatio * 100).toFixed(1)}%  (Limit: ${THRESHOLDS.DEBT_RATIO * 100}%)  ${screening.debtRatio <= THRESHOLDS.DEBT_RATIO ? '✓ PASS' : '✗ FAIL'}
Cash & Securities:    ${(screening.cashRatio * 100).toFixed(1)}%  (Limit: ${THRESHOLDS.CASH_RATIO * 100}%)  ${screening.cashRatio <= THRESHOLDS.CASH_RATIO ? '✓ PASS' : '✗ FAIL'}
Non-Halal Revenue:    ${(screening.nonHalalRevenueRatio * 100).toFixed(3)}%  (Limit: ${THRESHOLDS.NON_HALAL_REVENUE * 100}%)  ${screening.nonHalalRevenueRatio <= THRESHOLDS.NON_HALAL_REVENUE ? '✓ PASS' : '✗ FAIL'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPLIANCE EXPLANATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${screening.explanation}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PURIFICATION GUIDANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${purification.explanation}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KEY FINANCIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Market Cap:       $${(company.marketCap / 1e9).toFixed(2)}B
P/E Ratio:        ${company.peRatio.toFixed(1)}x
EPS:              $${company.eps.toFixed(2)}
Total Assets:     $${(financials.totalAssets / 1e9).toFixed(2)}B
Total Debt:       $${(financials.totalDebt / 1e9).toFixed(2)}B
Total Revenue:    $${(financials.totalRevenue / 1e9).toFixed(2)}B
Dividend Yield:   ${company.dividendYield > 0 ? company.dividendYield.toFixed(2) + '%' : 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DISCLAIMER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This report is for informational purposes only. HalalFlow is not a
financial advisor or broker. Consult a qualified Shariah scholar and
financial advisor before making investment decisions.
`;
}

function ReportCard({ company }: { company: Company }) {
  const [expanded, setExpanded] = useState(false);
  const { screening } = company;
  if (!screening) return null;

  const handleDownload = () => {
    const text = generateReport(company);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HalalFlow_${company.ticker}_Report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#111827] border border-white/8 rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/3 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <FileText className="w-4 h-4 text-slate-400" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{company.ticker}</span>
              <ComplianceBadge status={screening.status} size="sm" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{company.name} · {company.sector}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-semibold">Score: {screening.score}/100</div>
            <div className="text-xs text-slate-500">Compliance report</div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); handleDownload(); }}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-5">
          {/* Ratios */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Financial Ratios</h3>
            <RatioBar label="Debt / Assets" value={screening.debtRatio} threshold={THRESHOLDS.DEBT_RATIO} />
            <RatioBar label="Cash & Securities / Assets" value={screening.cashRatio} threshold={THRESHOLDS.CASH_RATIO} />
            <RatioBar label="Non-Halal Revenue / Total Revenue" value={screening.nonHalalRevenueRatio} threshold={THRESHOLDS.NON_HALAL_REVENUE} />
          </div>

          {/* Criteria */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Criteria</h3>
            <div className="space-y-1.5">
              {screening.passedCriteria.map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-slate-300">{c}</span>
                </div>
              ))}
              {screening.failedCriteria.map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-red-400">✗</span>
                  <span className="text-slate-300">{c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div className={clsx('p-4 rounded-lg text-sm leading-relaxed', {
            'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300': screening.status === 'HALAL',
            'bg-amber-500/10 border border-amber-500/20 text-amber-300': screening.status === 'DOUBTFUL',
            'bg-red-500/10 border border-red-500/20 text-red-300': screening.status === 'NON_COMPLIANT',
          })}>
            {screening.explanation}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResearchPage() {
  const [query, setQuery] = useState('');

  const filtered = companies.filter(c =>
    !query ||
    c.ticker.toLowerCase().includes(query.toLowerCase()) ||
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-emerald-400" />
          Compliance Research Reports
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Expand any equity to view detailed Shariah compliance analysis. Export as text for audit trails.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search company or ticker..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full bg-[#111827] border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
        />
      </div>

      <div className="space-y-3">
        {filtered.map(c => <ReportCard key={c.id} company={c} />)}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No companies match your search.</p>
        </div>
      )}
    </div>
  );
}
