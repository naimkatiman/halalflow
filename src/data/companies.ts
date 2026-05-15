import type { Company, CompanyFinancials } from '@/types';
import { screenCompany, screenCompanyLive } from '@/lib/shariah-engine';
import { getFundamentals, getQuote, type HubFundamentals } from '@/lib/market-data/hub-client';
import { HubUnavailableError, SymbolNotFoundError } from '@/lib/market-data/errors';

type RawCompany = Omit<Company, 'screening' | 'financials'>;

const rawCompanies: RawCompany[] = [
  {
    id: 'AAPL',
    ticker: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    country: 'US',
    description: 'Apple designs, manufactures and markets smartphones, personal computers, tablets, wearables and accessories, and sells a variety of related services.',
    price: 189.30,
    priceChange: 2.15,
    priceChangePercent: 1.15,
    marketCap: 2940000000000,
    peRatio: 31.2,
    eps: 6.08,
    dividendYield: 0.52,
    news: [
      { id: 'n1', title: 'Apple Vision Pro Sales Exceed Expectations', summary: 'Spatial computing device sees strong early adoption.', source: 'Bloomberg', publishedAt: '2026-03-20', sentiment: 'positive', url: '#' },
      { id: 'n2', title: 'WWDC 2026 Announced for June', summary: 'Apple to preview next generation of operating systems.', source: 'Reuters', publishedAt: '2026-03-18', sentiment: 'neutral', url: '#' },
    ],
    tags: ['Tech', 'Mega-cap', 'Dividend'],
  },
  {
    id: 'MSFT',
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    exchange: 'NASDAQ',
    sector: 'Technology',
    industry: 'Software—Infrastructure',
    country: 'US',
    description: 'Microsoft develops and licenses software, services, devices and solutions. Key products include Windows, Microsoft 365, Azure cloud services, and Xbox.',
    price: 415.50,
    priceChange: -1.20,
    priceChangePercent: -0.29,
    marketCap: 3090000000000,
    peRatio: 37.8,
    eps: 10.98,
    dividendYield: 0.72,
    news: [
      { id: 'n3', title: 'Azure AI Revenue Grows 29% YoY', summary: 'Cloud division continues to outpace market expectations.', source: 'CNBC', publishedAt: '2026-03-19', sentiment: 'positive', url: '#' },
    ],
    tags: ['Tech', 'Cloud', 'AI', 'Mega-cap'],
  },
  {
    id: 'AMZN',
    ticker: 'AMZN',
    name: 'Amazon.com Inc.',
    exchange: 'NASDAQ',
    sector: 'Consumer Discretionary',
    industry: 'Internet Retail',
    country: 'US',
    description: 'Amazon operates e-commerce, logistics, cloud computing (AWS), digital advertising, and streaming services.',
    price: 188.40,
    priceChange: 3.10,
    priceChangePercent: 1.67,
    marketCap: 1970000000000,
    peRatio: 44.1,
    eps: 4.27,
    dividendYield: 0,
    news: [
      { id: 'n4', title: 'AWS Beats Estimates, Operating Income Surges', summary: 'Amazon Web Services drives majority of company profit.', source: 'WSJ', publishedAt: '2026-03-21', sentiment: 'positive', url: '#' },
    ],
    tags: ['Tech', 'E-Commerce', 'Cloud'],
  },
  {
    id: 'JPM',
    ticker: 'JPM',
    name: 'JPMorgan Chase & Co.',
    exchange: 'NYSE',
    sector: 'Banks',
    industry: 'Diversified Banks',
    country: 'US',
    description: 'JPMorgan is a global investment bank and financial services company. It operates through investment banking, commercial banking, financial transaction processing, and consumer banking.',
    price: 201.80,
    priceChange: 0.90,
    priceChangePercent: 0.45,
    marketCap: 582000000000,
    peRatio: 12.1,
    eps: 16.68,
    dividendYield: 2.32,
    news: [
      { id: 'n5', title: 'JPMorgan Reports Record Q4 Revenue', summary: 'Investment banking and consumer division beat estimates.', source: 'Bloomberg', publishedAt: '2026-03-17', sentiment: 'positive', url: '#' },
    ],
    tags: ['Finance', 'Banking', 'Dividend'],
  },
  {
    id: 'TSLA',
    ticker: 'TSLA',
    name: 'Tesla Inc.',
    exchange: 'NASDAQ',
    sector: 'Consumer Discretionary',
    industry: 'Auto Manufacturers',
    country: 'US',
    description: 'Tesla designs, develops and sells electric vehicles, energy generation and storage systems.',
    price: 248.50,
    priceChange: -4.20,
    priceChangePercent: -1.66,
    marketCap: 792000000000,
    peRatio: 62.3,
    eps: 3.99,
    dividendYield: 0,
    news: [
      { id: 'n6', title: 'Tesla Cybertruck Deliveries Hit New Record', summary: 'Production ramp continues at Gigafactory Texas.', source: 'Reuters', publishedAt: '2026-03-20', sentiment: 'positive', url: '#' },
      { id: 'n7', title: 'Tesla Faces Increased Competition in China', summary: 'BYD and NIO gain market share in key EV market.', source: 'FT', publishedAt: '2026-03-19', sentiment: 'negative', url: '#' },
    ],
    tags: ['EV', 'Tech', 'Growth'],
  },
  {
    id: 'NVDA',
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    exchange: 'NASDAQ',
    sector: 'Technology',
    industry: 'Semiconductors',
    country: 'US',
    description: 'NVIDIA designs graphics processing units (GPUs) for gaming, data centers, professional visualization, and automotive markets.',
    price: 875.20,
    priceChange: 15.30,
    priceChangePercent: 1.78,
    marketCap: 2150000000000,
    peRatio: 68.5,
    eps: 12.78,
    dividendYield: 0.03,
    news: [
      { id: 'n8', title: 'NVIDIA H200 Chip Demand Surges on AI Boom', summary: 'Data center revenue up 409% year-over-year.', source: 'Bloomberg', publishedAt: '2026-03-22', sentiment: 'positive', url: '#' },
    ],
    tags: ['Semiconductors', 'AI', 'Growth', 'Mega-cap'],
  },
  {
    id: 'GOOGL',
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    exchange: 'NASDAQ',
    sector: 'Communication Services',
    industry: 'Internet Content & Information',
    country: 'US',
    description: "Alphabet is Google's parent company. Operations include Google Search, YouTube, Google Cloud, and Other Bets.",
    price: 171.95,
    priceChange: 0.85,
    priceChangePercent: 0.50,
    marketCap: 2130000000000,
    peRatio: 24.8,
    eps: 6.93,
    dividendYield: 0.48,
    news: [
      { id: 'n9', title: 'Google Gemini Ultra Outperforms GPT-4 on Key Benchmarks', summary: 'AI competition intensifies among big tech.', source: 'TechCrunch', publishedAt: '2026-03-21', sentiment: 'positive', url: '#' },
    ],
    tags: ['Tech', 'Advertising', 'AI', 'Mega-cap'],
  },
  {
    id: 'BRKB',
    ticker: 'BRK.B',
    name: 'Berkshire Hathaway Inc.',
    exchange: 'NYSE',
    sector: 'Financials',
    industry: 'Insurance',
    country: 'US',
    description: 'Berkshire Hathaway is a holding company with diverse businesses including insurance, utilities, railroads, and manufacturing.',
    price: 458.20,
    priceChange: 1.50,
    priceChangePercent: 0.33,
    marketCap: 1000000000000,
    peRatio: 21.3,
    eps: 21.51,
    dividendYield: 0,
    news: [],
    tags: ['Finance', 'Insurance', 'Buffett'],
  },
  {
    id: '1818HK',
    ticker: '1818.HK',
    name: 'Zhaojin Mining Industry',
    exchange: 'HKEX',
    sector: 'Materials',
    industry: 'Gold Mining',
    country: 'HK',
    description: 'Zhaojin Mining is one of the largest gold producers in China, engaged in gold and silver mining, processing and smelting.',
    price: 15.48,
    priceChange: 0.22,
    priceChangePercent: 1.44,
    marketCap: 38500000000,
    peRatio: 18.2,
    eps: 0.85,
    dividendYield: 1.2,
    news: [],
    tags: ['Mining', 'Gold', 'Asia'],
  },
  {
    id: 'SABIC',
    ticker: '2010.SR',
    name: 'Saudi Basic Industries Corp',
    exchange: 'Tadawul',
    sector: 'Materials',
    industry: 'Chemicals',
    country: 'SA',
    description: 'SABIC is one of the world\'s largest petrochemicals manufacturers, producing chemicals, polymers, and fertilizers.',
    price: 82.50,
    priceChange: -0.40,
    priceChangePercent: -0.48,
    marketCap: 495000000000,
    peRatio: 22.4,
    eps: 3.68,
    dividendYield: 3.1,
    news: [],
    tags: ['Chemicals', 'GCC', 'Dividend', 'Shariah'],
  },
];

function emptyFinancials(marketCap: number): CompanyFinancials {
  return {
    totalDebt: 0,
    totalAssets: 0,
    cashAndSecurities: 0,
    nonHalalRevenue: 0,
    totalRevenue: 0,
    totalEquity: 0,
    marketCap,
  };
}

function fundamentalsToFinancials(
  f: HubFundamentals,
  marketCap: number,
  earningsPerShare: number
): CompanyFinancials {
  return {
    totalDebt: f.total_debt ?? 0,
    totalAssets: f.total_assets ?? 0,
    cashAndSecurities:
      (f.cash_and_equivalents ?? 0) + (f.short_term_investments ?? 0),
    nonHalalRevenue: 0,
    totalRevenue: f.total_revenue ?? 0,
    totalEquity: 0,
    marketCap,
    earningsPerShare,
  };
}

// Static fallback view for legacy sync consumers — no live fundamentals, no
// financial-ratio screening. Sector-exclusion still applies via screenCompany.
// Async getCompanies()/getCompany() below are the real path.
export const companies: Company[] = rawCompanies.map((c) => {
  const financials = emptyFinancials(c.marketCap);
  return {
    ...c,
    financials,
    screening: screenCompany(financials, c.sector, c.industry),
  };
});

export const getCompanyById = (id: string): Company | undefined =>
  companies.find((c) => c.id === id);

export const getCompaniesBySector = (sector: string): Company[] =>
  sector === 'all' ? companies : companies.filter((c) => c.sector === sector);

export const getCompaniesByStatus = (status: string): Company[] =>
  status === 'all' ? companies : companies.filter((c) => c.screening?.status === status);

export const sectors = [...new Set(companies.map((c) => c.sector))];

async function buildCompanyLive(raw: RawCompany): Promise<Company> {
  let price = raw.price;
  let priceChange = raw.priceChange;
  let priceChangePercent = raw.priceChangePercent;

  try {
    const q = await getQuote(raw.ticker);
    if (Number.isFinite(q.price)) price = q.price;
    if (Number.isFinite(q.change)) priceChange = q.change;
    if (Number.isFinite(q.percent_change)) priceChangePercent = q.percent_change;
  } catch (err: unknown) {
    if (!(err instanceof HubUnavailableError) && !(err instanceof SymbolNotFoundError)) {
      throw err;
    }
  }

  let fundamentals: HubFundamentals | null = null;
  try {
    fundamentals = await getFundamentals(raw.ticker);
  } catch (err: unknown) {
    if (!(err instanceof HubUnavailableError) && !(err instanceof SymbolNotFoundError)) {
      throw err;
    }
  }

  const financials = fundamentals
    ? fundamentalsToFinancials(fundamentals, raw.marketCap, raw.eps)
    : emptyFinancials(raw.marketCap);

  const screening = fundamentals
    ? screenCompanyLive({
        fundamentals,
        sector: raw.sector,
        industry: raw.industry,
        marketCap: raw.marketCap,
      })
    : screenCompany(financials, raw.sector, raw.industry);

  return {
    ...raw,
    price,
    priceChange,
    priceChangePercent,
    financials,
    fundamentalsAsOfDate: fundamentals?.as_of_date ?? undefined,
    screening,
  };
}

export async function getCompanies(): Promise<Company[]> {
  return Promise.all(rawCompanies.map(buildCompanyLive));
}

export async function getCompany(id: string): Promise<Company | undefined> {
  const raw = rawCompanies.find((c) => c.id === id);
  if (!raw) return undefined;
  return buildCompanyLive(raw);
}
