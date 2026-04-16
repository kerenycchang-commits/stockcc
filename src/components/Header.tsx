import { MarketIndex } from '../types';

interface HeaderProps {
  marketIndex: MarketIndex | null;
  isConnected: boolean;
  brokerName?: string;
  onSettingsClick?: () => void;
}

export default function Header({ marketIndex, isConnected, brokerName, onSettingsClick }: HeaderProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-TW', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const timeStr = now.toLocaleTimeString('zh-TW', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <header className="bg-primary border-b border-gray-800 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">台股當沖監測</h1>
            <p className="text-xs text-text-secondary">Taiwan Stock Scanner</p>
          </div>
        </div>

        {marketIndex && (
          <div className="flex items-center gap-6 bg-secondary px-4 py-2 rounded-lg">
            <div>
              <p className="text-xs text-text-secondary">{marketIndex.name}</p>
              <p className="text-xl font-bold text-text-primary">{marketIndex.value.toLocaleString()}</p>
            </div>
            <div className={`text-right ${marketIndex.change >= 0 ? 'text-success' : 'text-accent'}`}>
              <p className="text-lg font-semibold">
                {marketIndex.change >= 0 ? '+' : ''}{marketIndex.change}
              </p>
              <p className="text-sm">
                ({marketIndex.changePercent >= 0 ? '+' : ''}{marketIndex.changePercent}%)
              </p>
            </div>
          </div>
        )}

<div className="flex items-center gap-4 text-sm">
            {brokerName && (
              <span className="text-text-secondary text-xs hidden md:inline">
                {brokerName}
              </span>
            )}
            <div className="text-right">
              <p className="text-text-primary">{dateStr}</p>
              <p className="text-text-secondary">{timeStr}</p>
            </div>
            <button
              onClick={onSettingsClick}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              title="API 設定"
            >
              <svg className="w-5 h-5 text-text-secondary hover:text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${isConnected ? 'bg-success/20 text-success' : 'bg-accent/20 text-accent'}`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-accent'}`}></span>
              <span>{isConnected ? '即時連線' : '斷線'}</span>
            </div>
          </div>
      </div>
    </header>
  );
}