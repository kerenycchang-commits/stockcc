import { Stock } from '../types';

interface StockTableProps {
  stocks: Stock[];
  onSelectStock: (stock: Stock) => void;
  selectedCode: string | null;
  priceFlash: Record<string, 'up' | 'down' | null>;
}

export default function StockTable({ stocks, onSelectStock, selectedCode, priceFlash }: StockTableProps) {
  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return (vol / 1000000).toFixed(1) + 'M';
    if (vol >= 1000) return (vol / 1000).toFixed(1) + 'K';
    return vol.toString();
  };

  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  if (stocks.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-12">
        <svg className="w-16 h-16 text-text-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-text-secondary text-center">尚無符合條件的股票</p>
        <p className="text-text-secondary text-sm mt-1">請調整篩選條件或點擊「開始監測」</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          監測列表
          <span className="text-sm font-normal text-text-secondary ml-2">共 {stocks.length} 檔</span>
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-secondary border-b border-gray-700">
              <th className="text-left py-2 px-2 font-medium">代碼/名稱</th>
              <th className="text-right py-2 px-2 font-medium">價格</th>
              <th className="text-right py-2 px-2 font-medium">漲跌幅</th>
              <th className="text-right py-2 px-2 font-medium">成交量</th>
              <th className="text-right py-2 px-2 font-medium">當日高低</th>
              <th className="text-center py-2 px-2 font-medium">買賣力</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => {
              const isUp = stock.changePercent >= 0;
              const flash = priceFlash[stock.code];
              
              return (
                <tr
                  key={stock.code}
                  className={`border-b border-gray-800 cursor-pointer transition-colors hover:bg-primary/50 ${
                    selectedCode === stock.code ? 'bg-primary' : ''
                  } ${flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''}`}
                  onClick={() => onSelectStock(stock)}
                >
                  <td className="py-2 px-2">
                    <div>
                      <span className="font-medium text-text-primary">{stock.code}</span>
                      <span className="text-text-secondary ml-1">{stock.name}</span>
                    </div>
                  </td>
                  <td className={`text-right py-2 px-2 font-medium ${isUp ? 'text-success' : 'text-accent'}`}>
                    {formatPrice(stock.price)}
                  </td>
                  <td className={`text-right py-2 px-2 ${isUp ? 'text-success' : 'text-accent'}`}>
                    <span className={`inline-flex items-center gap-1 ${isUp ? 'bg-success/20' : 'bg-accent/20'} px-2 py-0.5 rounded`}>
                      {isUp ? '▲' : '▼'}
                      {Math.abs(stock.changePercent).toFixed(2)}%
                    </span>
                  </td>
                  <td className="text-right py-2 px-2 text-text-primary">
                    {formatVolume(stock.volume)}
                  </td>
                  <td className="text-right py-2 px-2 text-text-secondary text-xs">
                    <div>H: {formatPrice(stock.high)}</div>
                    <div>L: {formatPrice(stock.low)}</div>
                  </td>
                  <td className="text-center py-2 px-2">
                    <div className={`inline-block px-2 py-0.5 rounded text-xs ${
                      stock.rsi > 60 ? 'bg-success/20 text-success' :
                      stock.rsi < 40 ? 'bg-accent/20 text-accent' :
                      'bg-gray-600/30 text-text-secondary'
                    }`}>
                      {stock.rsi > 60 ? '強' : stock.rsi < 40 ? '弱' : '中'}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}