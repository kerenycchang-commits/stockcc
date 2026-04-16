export interface Stock {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  turnover: number;
  kValue: number;
  dValue: number;
  macd: number;
  rsi: number;
  industry: string;
  lastUpdate: string;
}

export interface FilterOptions {
  minChange: number;
  maxChange: number;
  minVolume: number;
  minPrice: number;
  maxPrice: number;
  enableKD: boolean;
  enableMACD: boolean;
  enableRSI: boolean;
  industry: string;
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}