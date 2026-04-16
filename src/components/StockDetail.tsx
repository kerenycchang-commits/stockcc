import { Stock } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { generatePriceHistory } from '../utils/mockData';

interface StockDetailProps {
  stock: Stock | null;
  onClose: () => void;
}

export default function StockDetail({ stock, onClose }: StockDetailProps) {
  if (!stock) {
    return (
      <div className="card h-full flex flex-col items-center justify-center text-center">
        <svg className="w-16 h-16 text-text-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
        <p className="text-text-secondary">點擊左側股票查看詳情</p>
        <p className="text-text-secondary text-sm mt-1">Select a stock to view details</p>
      </div>
    );
  }

  const isUp = stock.changePercent >= 0;
  const priceHistory = generatePriceHistory(stock.price);

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">{stock.code}</h2>
          <p className="text-text-secondary">{stock.name}</p>
        </div>
        <button
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mb-4">
        <div className="flex items-end gap-3">
          <span className={`text-3xl font-bold ${isUp ? 'text-success' : 'text-accent'}`}>
            {stock.price.toFixed(2)}
          </span>
          <span className={`text-lg ${isUp ? 'text-success' : 'text-accent'}`}>
            {isUp ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-[200px] mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={priceHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3a5a" />
            <XAxis 
              dataKey="time" 
              stroke="#a0a0a0" 
              fontSize={10}
              tickLine={false}
            />
            <YAxis 
              domain={['dataMin - 5', 'dataMax + 5']}
              stroke="#a0a0a0"
              fontSize={10}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #3a3a5a',
                borderRadius: '8px',
                color: '#eaeaea'
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={isUp ? '#00d9a5' : '#e94560'}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-primary rounded-lg p-3">
          <p className="text-xs text-text-secondary mb-1">當日最高</p>
          <p className="text-lg font-semibold text-success">{stock.high.toFixed(2)}</p>
        </div>
        <div className="bg-primary rounded-lg p-3">
          <p className="text-xs text-text-secondary mb-1">當日最低</p>
          <p className="text-lg font-semibold text-accent">{stock.low.toFixed(2)}</p>
        </div>
        <div className="bg-primary rounded-lg p-3">
          <p className="text-xs text-text-secondary mb-1">成交量</p>
          <p className="text-lg font-semibold text-text-primary">
            {(stock.volume / 1000).toFixed(0)}K
          </p>
        </div>
        <div className="bg-primary rounded-lg p-3">
          <p className="text-xs text-text-secondary mb-1">成交金額</p>
          <p className="text-lg font-semibold text-text-primary">
            ${(stock.turnover / 1000000).toFixed(1)}M
          </p>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">技術指標</h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-primary rounded-lg p-2 text-center">
            <p className="text-xs text-text-secondary">KD</p>
            <p className={`font-semibold ${stock.kValue > stock.dValue && stock.dValue < 30 ? 'text-success' : 'text-text-primary'}`}>
              K:{stock.kValue.toFixed(0)} D:{stock.dValue.toFixed(0)}
            </p>
          </div>
          <div className="bg-primary rounded-lg p-2 text-center">
            <p className="text-xs text-text-secondary">MACD</p>
            <p className={`font-semibold ${stock.macd > 0 ? 'text-success' : 'text-accent'}`}>
              {stock.macd.toFixed(2)}
            </p>
          </div>
          <div className="bg-primary rounded-lg p-2 text-center">
            <p className="text-xs text-text-secondary">RSI</p>
            <p className={`font-semibold ${
              stock.rsi > 70 ? 'text-success' :
              stock.rsi < 30 ? 'text-accent' :
              'text-text-primary'
            }`}>
              {stock.rsi.toFixed(0)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button className="flex-1 bg-success text-white py-2 rounded-lg font-medium hover:bg-opacity-90 transition-all">
          買進
        </button>
        <button className="flex-1 bg-accent text-white py-2 rounded-lg font-medium hover:bg-opacity-90 transition-all">
          賣出
        </button>
      </div>
    </div>
  );
}