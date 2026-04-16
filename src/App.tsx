import { useState, useEffect, useCallback } from 'react';
import { Stock, MarketIndex, FilterOptions } from './types';
import { ConnectionStatus } from './types/broker';
import Header from './components/Header';
import FilterPanel from './components/FilterPanel';
import StockTable from './components/StockTable';
import StockDetail from './components/StockDetail';
import Settings from './components/Settings';
import Footer from './components/Footer';
import { generateMockStocks, generateMockIndex, filterStocks } from './utils/mockData';
import { BrokerName, ApiCredentials, connectToBroker, BROKER_OPTIONS } from './services/broker';

const defaultFilters: FilterOptions = {
  minChange: -10,
  maxChange: 10,
  minVolume: 1000,
  minPrice: 0,
  maxPrice: 10000,
  enableKD: false,
  enableMACD: false,
  enableRSI: false,
  industry: '',
};

export default function App() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [marketIndex, setMarketIndex] = useState<MarketIndex | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [currentBroker, setCurrentBroker] = useState<BrokerName>('mock');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('--:--:--');
  const [priceFlash, setPriceFlash] = useState<Record<string, 'up' | 'down' | null>>({});
  const [showSettings, setShowSettings] = useState(false);

  const updatePrices = useCallback(() => {
    setStocks(prevStocks => {
      const updatedStocks = prevStocks.map(stock => {
        const changePercent = stock.changePercent + (Math.random() - 0.5) * 0.5;
        const newPrice = stock.price * (1 + changePercent / 100);
        
        let flash: 'up' | 'down' | null = null;
        if (newPrice > stock.price) flash = 'up';
        else if (newPrice < stock.price) flash = 'down';
        
        if (flash) {
          setPriceFlash(prev => ({ ...prev, [stock.code]: flash }));
          setTimeout(() => {
            setPriceFlash(prev => ({ ...prev, [stock.code]: null }));
          }, 500);
        }
        
        return {
          ...stock,
          price: Math.round(newPrice * 100) / 100,
          change: Math.round((newPrice - stock.price) * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
          volume: stock.volume + Math.floor(Math.random() * 1000),
          high: Math.max(stock.high, newPrice),
          low: Math.min(stock.low, newPrice),
          lastUpdate: new Date().toISOString(),
        };
      });
      
      return updatedStocks;
    });
    
    setMarketIndex(generateMockIndex());
    setLastUpdate(new Date().toLocaleTimeString('zh-TW'));
  }, []);

  useEffect(() => {
    const initialStocks = generateMockStocks();
    setStocks(initialStocks);
    setFilteredStocks(filterStocks(initialStocks, filters));
    setMarketIndex(generateMockIndex());
    setConnectionStatus('connected');
  }, []);

  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(updatePrices, 3000);
      return () => clearInterval(interval);
    }
  }, [isMonitoring, updatePrices]);

  useEffect(() => {
    setFilteredStocks(filterStocks(stocks, filters));
  }, [stocks, filters]);

  const handleConnect = async (broker: BrokerName, credentials: ApiCredentials): Promise<boolean> => {
    setCurrentBroker(broker);
    const success = await connectToBroker(broker, credentials);
    if (success) {
      setConnectionStatus('connected');
      const newStocks = generateMockStocks();
      setStocks(newStocks);
      setFilteredStocks(filterStocks(newStocks, filters));
    }
    return success;
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setFilteredStocks(filterStocks(stocks, newFilters));
  };

  const handleStartMonitoring = () => {
    setIsMonitoring(true);
  };

  const handleSelectStock = (stock: Stock) => {
    setSelectedStock(stock);
  };

  const brokerName = BROKER_OPTIONS.find(b => b.id === currentBroker)?.name || '模擬資料';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header 
        marketIndex={marketIndex} 
        isConnected={connectionStatus === 'connected'}
        brokerName={brokerName}
        onSettingsClick={() => setShowSettings(!showSettings)}
      />
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-4">
        <div className={`grid gap-4 ${showSettings ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1 lg:grid-cols-12'}`}>
          <div className="lg:col-span-3">
            <FilterPanel
              filters={filters}
              onFilterChange={handleFilterChange}
              onStartMonitoring={handleStartMonitoring}
              isMonitoring={isMonitoring}
            />
          </div>
          
          {showSettings && (
            <div className="lg:col-span-3">
              <Settings 
                connectionStatus={connectionStatus}
                onConnectionChange={setConnectionStatus}
                onBrokerConnect={handleConnect}
              />
            </div>
          )}
          
          <div className={showSettings ? 'lg:col-span-3' : 'lg:col-span-6'}>
            <StockTable
              stocks={filteredStocks}
              onSelectStock={handleSelectStock}
              selectedCode={selectedStock?.code || null}
              priceFlash={priceFlash}
            />
          </div>
          
          <div className="lg:col-span-3">
            <StockDetail
              stock={selectedStock}
              onClose={() => setSelectedStock(null)}
            />
          </div>
        </div>
      </main>
      
      <Footer isConnected={connectionStatus === 'connected'} lastUpdate={lastUpdate} />
    </div>
  );
}