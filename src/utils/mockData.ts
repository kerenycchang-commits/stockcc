import { Stock, MarketIndex, FilterOptions } from '../types';

const stockNames: Record<string, string> = {
  '2330': '台積電',
  '2317': '鴻海',
  '2454': '聯發科',
  '2303': '聯電',
  '2002': '中鋼',
  '2881': '富邦金',
  '2882': '國泰金',
  '2891': '中信金',
  '2609': '陽明',
  '2603': '長榮',
  '3034': '聯詠',
  '3035': '智原',
  '3443': '創意',
  '3413': '京元電子',
  '2356': '英業達',
  '2382': '廣達',
  '3231': '緯創',
  '4938': '和碩',
  '3706': '欣興',
  '3037': '欣銓',
  '5347': '世界',
  '5483': '辛耘',
  '6770': '力積電',
  '6643': '穎崴',
  '6515': '穎漢',
  '5269': '祥碩',
  '6147': '基板',
  '3533': '嘉澤',
  '5263': '邦揚',
  '3164': '景碩',
};

const industries = [
  '半導體', '電子零組件', '電子通路', '電腦周邊', 
  '通訊網路', '光電', '伺服器', '航運', '金控', '鋼鐵'
];

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomInRange(min, max));
}

export function generateMockStocks(): Stock[] {
  const stocks: Stock[] = [];
  const codes = Object.keys(stockNames);
  
  codes.forEach((code) => {
    const basePrice = randomInRange(20, 800);
    const changePercent = randomInRange(-8, 8);
    const change = basePrice * (changePercent / 100);
    const volume = randomInt(1000, 500000);
    
    stocks.push({
      code,
      name: stockNames[code],
      price: Math.round(basePrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      volume,
      high: Math.round(basePrice * (1 + randomInRange(0.01, 0.05)) * 100) / 100,
      low: Math.round(basePrice * (1 - randomInRange(0.01, 0.05)) * 100) / 100,
      turnover: Math.round(volume * basePrice),
      kValue: randomInRange(20, 80),
      dValue: randomInRange(20, 80),
      macd: randomInRange(-5, 5),
      rsi: randomInRange(30, 70),
      industry: industries[randomInt(0, industries.length)],
      lastUpdate: new Date().toISOString(),
    });
  });
  
  return stocks;
}

export function generateMockIndex(): MarketIndex {
  const baseValue = 17500;
  const change = randomInRange(-200, 200);
  return {
    name: '加權指數',
    value: Math.round(baseValue + change),
    change: Math.round(change * 100) / 100,
    changePercent: Math.round((change / baseValue) * 10000) / 100,
  };
}

export function filterStocks(stocks: Stock[], filters: FilterOptions): Stock[] {
  return stocks.filter((stock) => {
    if (stock.changePercent < filters.minChange || stock.changePercent > filters.maxChange) {
      return false;
    }
    if (stock.volume < filters.minVolume) {
      return false;
    }
    if (stock.price < filters.minPrice || stock.price > filters.maxPrice) {
      return false;
    }
    if (filters.industry && stock.industry !== filters.industry) {
      return false;
    }
    if (filters.enableKD && !(stock.kValue > stock.dValue && stock.dValue < 30)) {
      return false;
    }
    if (filters.enableMACD && stock.macd <= 0) {
      return false;
    }
    if (filters.enableRSI && stock.rsi < 50) {
      return false;
    }
    return true;
  });
}

export function generatePriceHistory(basePrice: number, points: number = 20): { time: string; price: number }[] {
  const history = [];
  let price = basePrice * 0.95;
  
  for (let i = 0; i < points; i++) {
    price += randomInRange(-basePrice * 0.02, basePrice * 0.03);
    history.push({
      time: `${9 + Math.floor(i / 4)}:${(i % 4) * 15 + 5}`.padStart(5, '0'),
      price: Math.round(price * 100) / 100,
    });
  }
  
  return history;
}