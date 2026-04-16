import { BrokerAPI, OrderRequest, OrderResponse, AccountBalance, Position } from '../types/broker';
import { Stock, MarketIndex } from '../types';
import { generateMockStocks, generateMockIndex } from '../utils/mockData';
import { wsService, fetchWithAuth, fetchLogout, fetchSubscribe, fetchPlaceOrder } from './websocket';

export type BrokerName = 'shioaji' | 'fubon' | 'tsi' | 'mock';

export interface BrokerOption {
  id: BrokerName;
  name: string;
  logo: string;
  description: string;
}

export const BROKER_OPTIONS: BrokerOption[] = [
  { id: 'shioaji', name: '永豐金 (Shioaji)', logo: '🏦', description: 'Python API，文件完善' },
  { id: 'fubon', name: '富邦新一代', logo: '🏢', description: '多語言支援' },
  { id: 'tsi', name: '台新 Nova', logo: '💳', description: '跨平台，易上手' },
  { id: 'mock', name: '模擬資料 (測試用)', logo: '📊', description: '不需 API Key，直接測試' },
];

export interface ApiCredentials {
  broker: BrokerName;
  apiKey?: string;
  secretKey?: string;
  certificatePath?: string;
}

let currentBroker: BrokerAPI | null = null;
let priceUpdateCallback: ((stocks: Stock[]) => void) | null = null;
let indexUpdateCallback: ((index: MarketIndex) => void) | null = null;
let updateInterval: ReturnType<typeof setInterval> | null = null;

export async function createBroker(brokerName: BrokerName): Promise<BrokerAPI> {
  switch (brokerName) {
    case 'shioaji':
      return new ShioajiBroker();
    case 'fubon':
      return new FubonBroker();
    case 'tsi':
      return new TsiBroker();
    case 'mock':
    default:
      return new MockBroker();
  }
}

class MockBroker implements BrokerAPI {
  private stocks: Stock[] = [];
  private connected = false;

  async connect(_apiKey?: string, _secretKey?: string): Promise<boolean> {
    this.stocks = generateMockStocks();
    this.connected = true;
    return true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
  }

  subscribe(codes: string[]): void {
    if (updateInterval) clearInterval(updateInterval);
    
    updateInterval = setInterval(() => {
      if (!this.connected) return;
      
      this.stocks = this.stocks.map(stock => {
        if (codes.includes(stock.code)) {
          const changePercent = stock.changePercent + (Math.random() - 0.5) * 0.3;
          const newPrice = stock.price * (1 + changePercent / 100);
          return {
            ...stock,
            price: Math.round(newPrice * 100) / 100,
            changePercent: Math.round(changePercent * 100) / 100,
            change: Math.round((newPrice - stock.price * 0.98) * 100) / 100,
            volume: stock.volume + Math.floor(Math.random() * 500),
            lastUpdate: new Date().toISOString(),
          };
        }
        return stock;
      });
      
      if (priceUpdateCallback) {
        priceUpdateCallback(this.stocks.filter(s => codes.includes(s.code)));
      }
    }, 3000);
  }

  unsubscribe(_codes: string[]): void {
    // do nothing
  }

  onPriceUpdate(callback: (stocks: Stock[]) => void): void {
    priceUpdateCallback = callback;
  }

  onIndexUpdate(callback: (index: MarketIndex) => void): void {
    indexUpdateCallback = callback;
    
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(() => {
      if (indexUpdateCallback) {
        indexUpdateCallback(generateMockIndex());
      }
    }, 5000);
  }

  async placeOrder(order: OrderRequest): Promise<OrderResponse> {
    console.log('Mock order placed:', order);
    return { success: true, orderId: 'MOCK' + Date.now() };
  }

  async getBalance(): Promise<AccountBalance> {
    return {
      cash: 1000000,
      margin: 0,
      totalAsset: 1500000,
      dailyPL: 25000,
    };
  }

  async getPositions(): Promise<Position[]> {
    return [];
  }
}

class ShioajiBroker implements BrokerAPI {
  private connected = false;
  private simulation = true;

  async connect(apiKey?: string, secretKey?: string): Promise<boolean> {
    if (!apiKey || !secretKey) {
      console.warn('No API credentials provided');
      return false;
    }

    try {
      const wsConnected = await wsService.connect();
      if (!wsConnected) {
        console.error('WebSocket connection failed');
        return false;
      }

      const authSuccess = await fetchWithAuth(apiKey, secretKey, this.simulation);
      if (!authSuccess) {
        console.error('Authentication failed');
        wsService.disconnect();
        return false;
      }

      wsService.setConnectionHandler((connected) => {
        this.connected = connected;
      });

      this.connected = true;
      console.log('Shioaji connected successfully');
      return true;
    } catch (error) {
      console.error('Shioaji connection error:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await fetchLogout();
      wsService.disconnect();
      this.connected = false;
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  subscribe(codes: string[]): void {
    if (this.connected) {
      wsService.subscribe(codes);
      fetchSubscribe(codes);
    }
  }

  unsubscribe(codes: string[]): void {
    wsService.unsubscribe(codes);
  }

  onPriceUpdate(callback: (stocks: Stock[]) => void): void {
    priceUpdateCallback = callback;
    
    wsService.addHandler((data) => {
      if (data.type === 'price' || data.symbol) {
        const stock: Stock = {
          code: data.symbol,
          name: data.name || data.symbol,
          price: data.price || 0,
          change: data.change || 0,
          changePercent: data.change_percent || 0,
          volume: data.volume || 0,
          high: data.high || 0,
          low: data.low || 0,
          turnover: data.turnover || 0,
          kValue: data.k_value || 0,
          dValue: data.d_value || 0,
          macd: data.macd || 0,
          rsi: data.rsi || 0,
          industry: data.industry || '',
          lastUpdate: new Date().toISOString(),
        };
        callback([stock]);
      }
    });
  }

  onIndexUpdate(callback: (index: MarketIndex) => void): void {
    indexUpdateCallback = callback;
  }

  async placeOrder(order: OrderRequest): Promise<OrderResponse> {
    if (!this.connected) {
      return { success: false, message: 'Not connected' };
    }
    return fetchPlaceOrder(order);
  }

  async getBalance(): Promise<AccountBalance> {
    return { cash: 0, margin: 0, totalAsset: 0, dailyPL: 0 };
  }

  async getPositions(): Promise<Position[]> {
    return [];
  }
}

class FubonBroker implements BrokerAPI {
  async connect(): Promise<boolean> {
    console.log('Fubon API not implemented');
    return false;
  }

  async disconnect(): Promise<void> {}

  subscribe(_codes: string[]): void {}

  unsubscribe(_codes: string[]): void {}

  onPriceUpdate(_callback: (stocks: Stock[]) => void): void {}

  onIndexUpdate(_callback: (index: MarketIndex) => void): void {}

  async placeOrder(_order: OrderRequest): Promise<OrderResponse> {
    return { success: false, message: 'Not implemented' };
  }

  async getBalance(): Promise<AccountBalance> {
    return { cash: 0, margin: 0, totalAsset: 0, dailyPL: 0 };
  }

  async getPositions(): Promise<Position[]> {
    return [];
  }
}

class TsiBroker implements BrokerAPI {
  async connect(): Promise<boolean> {
    console.log('TSI API not implemented');
    return false;
  }

  async disconnect(): Promise<void> {}

  subscribe(_codes: string[]): void {}

  unsubscribe(_codes: string[]): void {}

  onPriceUpdate(_callback: (stocks: Stock[]) => void): void {}

  onIndexUpdate(_callback: (index: MarketIndex) => void): void {}

  async placeOrder(_order: OrderRequest): Promise<OrderResponse> {
    return { success: false, message: 'Not implemented' };
  }

  async getBalance(): Promise<AccountBalance> {
    return { cash: 0, margin: 0, totalAsset: 0, dailyPL: 0 };
  }

  async getPositions(): Promise<Position[]> {
    return [];
  }
}

export async function connectToBroker(
  broker: BrokerName, 
  credentials: { apiKey?: string; secretKey?: string; certificatePath?: string }
): Promise<boolean> {
  currentBroker = await createBroker(broker);
  
  if (broker === 'mock') {
    await currentBroker.connect();
  } else if (credentials.apiKey && credentials.secretKey) {
    return await currentBroker.connect(credentials.apiKey, credentials.secretKey);
  }
  
  return true;
}

export function getCurrentBroker(): BrokerAPI | null {
  return currentBroker;
}

export function disconnectBroker(): Promise<void> {
  if (currentBroker) {
    return currentBroker.disconnect();
  }
  return Promise.resolve();
}