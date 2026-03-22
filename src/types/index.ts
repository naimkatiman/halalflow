export type ComplianceStatus = 'HALAL' | 'DOUBTFUL' | 'NON_COMPLIANT';

export interface ShariahScreenResult {
  status: ComplianceStatus;
  score: number; // 0–100
  debtRatio: number;
  cashRatio: number;
  nonHalalRevenueRatio: number;
  purificationRatio: number;
  failedCriteria: string[];
  passedCriteria: string[];
  explanation: string;
}

export interface CompanyFinancials {
  totalDebt: number;
  totalAssets: number;
  cashAndSecurities: number;
  nonHalalRevenue: number;
  totalRevenue: number;
  totalEquity: number;
  marketCap: number;
  dividendPerShare?: number;
  earningsPerShare?: number;
}

export interface Company {
  id: string;
  ticker: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  country: string;
  description: string;
  logo?: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  marketCap: number;
  peRatio: number;
  eps: number;
  dividendYield: number;
  financials: CompanyFinancials;
  screening?: ShariahScreenResult;
  news?: NewsItem[];
  tags?: string[];
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  url: string;
}

export interface WatchlistItem {
  companyId: string;
  addedAt: string;
  alertPrice?: number;
  notes?: string;
}

export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  label?: string;
  createdAt: string;
  dueDate?: string;
}

export interface ResearchReport {
  companyId: string;
  generatedAt: string;
  summary: string;
  complianceAnalysis: string;
  financialHighlights: string;
  riskFactors: string;
  recommendation: 'BUY' | 'HOLD' | 'AVOID';
}

export type SectorFilter = string | 'all';
export type StatusFilter = ComplianceStatus | 'all';
