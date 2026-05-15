import { cache, CACHE_TTL } from "../cache";
import {
  HubUnavailableError,
  MarketDataError,
  SymbolNotFoundError,
} from "./errors";
import type { AssetType, Candle, Quote } from "./types";

export interface HubFundamentals {
  symbol: string;
  as_of_date: string | null;
  total_assets: number | null;
  total_debt: number | null;
  cash_and_equivalents: number | null;
  short_term_investments: number | null;
  total_revenue: number | null;
  ebit: number | null;
  operating_income: number | null;
  source_filing_url: string | null;
  cached?: boolean;
}

interface SymbolMeta {
  symbol: string;
  name: string;
  asset_type: AssetType;
  is_active: boolean;
  fetch_quote: boolean;
  fetch_candles: boolean;
  candle_intervals: string[];
}

function getBaseUrl(): string {
  const url = process.env.MARKET_DATA_HUB_URL;
  if (!url) {
    throw new MarketDataError("MARKET_DATA_HUB_URL is not configured");
  }
  return url.replace(/\/+$/, "");
}

async function hubFetch<T>(path: string, symbolForErrors?: string): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch (cause) {
    throw new HubUnavailableError(`Hub network error: ${url}`, { cause });
  }

  if (res.status === 404 && symbolForErrors) {
    throw new SymbolNotFoundError(symbolForErrors);
  }
  if (res.status >= 500) {
    throw new HubUnavailableError(`Hub ${res.status} on ${path}`, {
      status: res.status,
    });
  }
  if (!res.ok) {
    throw new MarketDataError(`Hub ${res.status} on ${path}`);
  }

  return (await res.json()) as T;
}

export async function getQuote(symbol: string): Promise<Quote> {
  const encoded = encodeURIComponent(symbol);
  return hubFetch<Quote>(`/api/quotes/${encoded}`, symbol);
}

export async function getQuotesByType(type: AssetType): Promise<Quote[]> {
  const encoded = encodeURIComponent(type);
  const body = await hubFetch<{ data: Quote[]; count: number }>(
    `/api/quotes/type/${encoded}`
  );
  return body.data ?? [];
}

export async function getCandles(
  symbol: string,
  interval: string = "15min",
  limit: number = 100
): Promise<Candle[]> {
  const encoded = encodeURIComponent(symbol);
  const params = new URLSearchParams({
    interval,
    limit: String(limit),
  });
  const body = await hubFetch<{
    symbol: string;
    interval: string;
    count: number;
    values: Array<Omit<Candle, "symbol" | "interval">>;
  }>(`/api/candles/${encoded}?${params.toString()}`, symbol);

  return (body.values ?? []).map((v) => ({
    symbol: body.symbol,
    interval: body.interval,
    ...v,
  }));
}

export async function getFundamentals(symbol: string): Promise<HubFundamentals> {
  const key = `mh:fundamentals:${symbol.toUpperCase()}`;
  return cache.cacheWithTTL<HubFundamentals>(key, CACHE_TTL.FUNDAMENTALS, () => {
    const encoded = encodeURIComponent(symbol);
    return hubFetch<HubFundamentals>(`/api/fundamentals/${encoded}`, symbol);
  });
}

export async function searchSymbols(
  q: string,
  type?: AssetType
): Promise<SymbolMeta[]> {
  const body = await hubFetch<{ data: SymbolMeta[]; count: number }>(
    `/api/symbols`
  );
  const needle = q.trim().toLowerCase();
  return (body.data ?? []).filter((s) => {
    if (type && s.asset_type !== type) return false;
    if (!needle) return true;
    return (
      s.symbol.toLowerCase().includes(needle) ||
      (s.name ?? "").toLowerCase().includes(needle)
    );
  });
}
