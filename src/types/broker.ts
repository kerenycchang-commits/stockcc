import { Stock, MarketIndex } from '../types';

export interface BrokerAPI {
  connect(apiKey?: string, secretKey?: string): Promise<boolean>;
  disconnect(): Promise<void>;
  subscribe(stockCodes: string[]): void;
  unsubscribe(stockCodes: string[]): void;
  onPriceUpdate(callback: (stocks: Stock[]) => void): void;
  onIndexUpdate(callback: (index: MarketIndex) => void): void;
  placeOrder(order: OrderRequest): Promise<OrderResponse>;
  getBalance(): Promise<AccountBalance>;
  getPositions(): Promise<Position[]>;
}

export interface OrderRequest {
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  orderType: 'limit' | 'market';
  timeInForce: 'ROD' | 'IOC' | 'FOK';
}

export interface OrderResponse {
  success: boolean;
  orderId?: string;
  message?: string;
}

export interface AccountBalance {
  cash: number;
  margin: number;
  totalAsset: number;
  dailyPL: number;
}

export interface Position {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  unrealizedPL: number;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface BrokerConfig {
  name: string;
  logo: string;
  supportedFeatures: string[];
}