/**
 * HalalFlow Shariah Screening Engine
 *
 * Implements AAOIFI + MSCI Islamic Index screening methodology:
 *
 * Financial Ratios (all relative to total assets / market cap):
 *   1. Debt Ratio:            Total Debt / Total Assets < 33%
 *   2. Cash + Securities:     (Cash + Securities) / Total Assets < 33%
 *   3. Non-Halal Revenue:     Non-Halal Revenue / Total Revenue < 5%
 *
 * Sectors automatically excluded (non-compliant):
 *   - Conventional Banking & Finance
 *   - Alcohol production/distribution
 *   - Tobacco
 *   - Weapons / Defense contractors
 *   - Gambling / Casinos
 *   - Pork-related industries
 *   - Adult entertainment
 */

import type { ShariahScreenResult, CompanyFinancials, ComplianceStatus } from '@/types';
import type { HubFundamentals } from './market-data/hub-client';

const NON_COMPLIANT_SECTORS = [
  'Banks', 'Diversified Banks', 'Thrifts & Mortgage Finance',
  'Consumer Finance', 'Capital Markets',
  'Alcohol', 'Tobacco', 'Gambling', 'Casinos',
  'Defense', 'Aerospace & Defense',
  'Adult Entertainment',
];

const NON_COMPLIANT_KEYWORDS = [
  'bank', 'alcohol', 'tobacco', 'casino', 'gambling', 'pork',
  'defense', 'weapons', 'insurance', 'riba', 'adult',
];

export const THRESHOLDS = {
  DEBT_RATIO: 0.33,
  CASH_RATIO: 0.33,
  NON_HALAL_REVENUE: 0.05,
};

export function screenCompany(
  financials: CompanyFinancials,
  sector: string,
  industry: string
): ShariahScreenResult {
  const failedCriteria: string[] = [];
  const passedCriteria: string[] = [];

  // Check sector exclusion first
  const sectorLower = (sector + ' ' + industry).toLowerCase();
  const sectorExcluded = NON_COMPLIANT_KEYWORDS.some(k => sectorLower.includes(k)) ||
    NON_COMPLIANT_SECTORS.some(s => sector.toLowerCase().includes(s.toLowerCase()));

  if (sectorExcluded) {
    return {
      status: 'NON_COMPLIANT',
      score: 0,
      debtRatio: 0,
      cashRatio: 0,
      nonHalalRevenueRatio: 1,
      purificationRatio: 0,
      failedCriteria: [`Sector excluded: ${sector} is categorically non-Shariah-compliant`],
      passedCriteria: [],
      explanation: `${sector} is categorically excluded under Shariah screening standards (AAOIFI). Activities in this sector involve riba (interest), gambling, or other prohibited elements.`,
    };
  }

  const { totalDebt, totalAssets, cashAndSecurities, nonHalalRevenue, totalRevenue } = financials;

  // 1. Debt ratio
  const debtRatio = totalAssets > 0 ? totalDebt / totalAssets : 0;
  if (debtRatio > THRESHOLDS.DEBT_RATIO) {
    failedCriteria.push(
      `Debt ratio ${(debtRatio * 100).toFixed(1)}% exceeds 33% threshold (Total Debt / Total Assets)`
    );
  } else {
    passedCriteria.push(
      `Debt ratio ${(debtRatio * 100).toFixed(1)}% is within 33% limit`
    );
  }

  // 2. Cash + securities ratio
  const cashRatio = totalAssets > 0 ? cashAndSecurities / totalAssets : 0;
  if (cashRatio > THRESHOLDS.CASH_RATIO) {
    failedCriteria.push(
      `Cash & securities ratio ${(cashRatio * 100).toFixed(1)}% exceeds 33% threshold`
    );
  } else {
    passedCriteria.push(
      `Cash & securities ratio ${(cashRatio * 100).toFixed(1)}% is within 33% limit`
    );
  }

  // 3. Non-halal revenue
  const nonHalalRevenueRatio = totalRevenue > 0 ? nonHalalRevenue / totalRevenue : 0;
  if (nonHalalRevenueRatio > THRESHOLDS.NON_HALAL_REVENUE) {
    failedCriteria.push(
      `Non-halal revenue ${(nonHalalRevenueRatio * 100).toFixed(2)}% exceeds 5% tolerance`
    );
  } else {
    passedCriteria.push(
      `Non-halal revenue ${(nonHalalRevenueRatio * 100).toFixed(2)}% is within 5% tolerance`
    );
  }

  // Purification ratio (income to be donated if passing)
  const purificationRatio = nonHalalRevenueRatio;

  // Determine status
  let status: ComplianceStatus;
  let score: number;

  if (failedCriteria.length === 0) {
    status = 'HALAL';
    score = Math.round(
      100 -
      (debtRatio / THRESHOLDS.DEBT_RATIO) * 20 -
      (cashRatio / THRESHOLDS.CASH_RATIO) * 10 -
      (nonHalalRevenueRatio / THRESHOLDS.NON_HALAL_REVENUE) * 10
    );
    score = Math.max(60, Math.min(100, score));
  } else if (failedCriteria.length === 1 && nonHalalRevenueRatio <= 0.10) {
    status = 'DOUBTFUL';
    score = Math.round(40 - failedCriteria.length * 10);
  } else {
    status = 'NON_COMPLIANT';
    score = Math.max(0, Math.round(30 - failedCriteria.length * 15));
  }

  const explanation = buildExplanation(status, failedCriteria, passedCriteria, purificationRatio);

  return {
    status,
    score,
    debtRatio,
    cashRatio,
    nonHalalRevenueRatio,
    purificationRatio,
    failedCriteria,
    passedCriteria,
    explanation,
  };
}

function buildExplanation(
  status: ComplianceStatus,
  failed: string[],
  passed: string[],
  purificationRatio: number
): string {
  if (status === 'HALAL') {
    const purText = purificationRatio > 0
      ? ` A purification ratio of ${(purificationRatio * 100).toFixed(3)}% of dividend income should be donated to charity.`
      : '';
    return `This stock passes all Shariah screening criteria under AAOIFI methodology. It is permissible (halal) to invest in.${purText}`;
  }

  if (status === 'DOUBTFUL') {
    return `This stock has borderline compliance. It fails ${failed.length} criterion: ${failed.join('. ')}. Scholars differ on its permissibility. Consult your local Shariah board before investing.`;
  }

  return `This stock does not meet Shariah compliance standards. It fails ${failed.length} criteria: ${failed.join('; ')}. It is not permissible (haram) to invest in under standard Islamic finance rules.`;
}

export interface LiveScreenInput {
  fundamentals: HubFundamentals;
  sector: string;
  industry: string;
  // Hub doesn't expose non-halal revenue today; caller supplies it
  // (e.g. 0 when unknown, or an analyst-provided estimate).
  nonHalalRevenue?: number;
  // Optional context the live payload doesn't carry but the pure engine accepts.
  totalEquity?: number;
  marketCap?: number;
}

/**
 * Accepts a live `HubFundamentals` payload (snake_case, nullable fields, no
 * `non_halal_revenue`), normalizes it to the engine's internal
 * `CompanyFinancials` shape, and runs the standard pure screening.
 *
 * Mapping:
 *   total_debt              -> totalDebt           (null -> 0)
 *   total_assets            -> totalAssets         (null -> 0)
 *   cash_and_equivalents
 *     + short_term_investments -> cashAndSecurities  (nulls -> 0)
 *   total_revenue           -> totalRevenue        (null -> 0)
 *   non_halal_revenue       (not provided by hub) -> caller-supplied, default 0
 */
export function screenCompanyLive(input: LiveScreenInput): ShariahScreenResult {
  const {
    fundamentals,
    sector,
    industry,
    nonHalalRevenue = 0,
    totalEquity = 0,
    marketCap = 0,
  } = input;

  const cashAndSecurities =
    (fundamentals.cash_and_equivalents ?? 0) +
    (fundamentals.short_term_investments ?? 0);

  const financials: CompanyFinancials = {
    totalDebt: fundamentals.total_debt ?? 0,
    totalAssets: fundamentals.total_assets ?? 0,
    cashAndSecurities,
    nonHalalRevenue,
    totalRevenue: fundamentals.total_revenue ?? 0,
    totalEquity,
    marketCap,
  };

  return screenCompany(financials, sector, industry);
}

export function getPurificationGuidance(
  purificationRatio: number,
  dividendIncome: number
): { amount: number; explanation: string } {
  const amount = dividendIncome * purificationRatio;
  return {
    amount,
    explanation: amount > 0
      ? `Donate ${(purificationRatio * 100).toFixed(3)}% of dividend income ($${amount.toFixed(2)}) to a recognized charity to purify this investment.`
      : 'No purification required — this company reports zero non-halal revenue.',
  };
}
