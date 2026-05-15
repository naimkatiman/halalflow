export type AssetType = "stock" | "etf" | "crypto" | "forex" | "index" | string;

export interface Quote {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  previous_close: number;
  change: number;
  percent_change: number;
  volume: number;
  timestamp: string;
  asset_type: AssetType;
  name: string;
}

export interface Candle {
  symbol: string;
  interval: string;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Fundamentals {
  symbol: string;
  total_debt: number;
  total_assets: number;
  cash_and_securities: number;
  total_revenue: number;
  non_halal_revenue: number;
  as_of_date?: string;
}

export interface CompanyProfile {
  symbol: string;
  name: string;
  exchange?: string;
  asset_type?: AssetType;
  sector?: string;
  industry?: string;
  country?: string;
  currency?: string;
  website?: string;
  description?: string;
}
