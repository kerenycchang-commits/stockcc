import { FilterOptions } from '../types';

interface FilterPanelProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onStartMonitoring: () => void;
  isMonitoring: boolean;
}

const industries = ['', '半導體', '電子零組件', '電子通路', '電腦周邊', '通訊網路', '光電', '伺服器', '航運', '金控', '鋼鐵'];

export default function FilterPanel({ filters, onFilterChange, onStartMonitoring, isMonitoring }: FilterPanelProps) {
  const handleChange = (key: keyof FilterOptions, value: number | boolean | string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="card space-y-4">
      <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
        <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        篩選條件
      </h2>

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-text-secondary mb-1">漲跌幅範圍 (%)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              className="input-field w-20 text-center"
              value={filters.minChange}
              onChange={(e) => handleChange('minChange', parseFloat(e.target.value) || 0)}
              placeholder="最低"
            />
            <span className="text-text-secondary">~</span>
            <input
              type="number"
              className="input-field w-20 text-center"
              value={filters.maxChange}
              onChange={(e) => handleChange('maxChange', parseFloat(e.target.value) || 0)}
              placeholder="最高"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">成交量門檻 (股)</label>
          <input
            type="number"
            className="input-field w-full"
            value={filters.minVolume}
            onChange={(e) => handleChange('minVolume', parseInt(e.target.value) || 0)}
            placeholder="最低成交量"
          />
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">價格區間 ($)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              className="input-field w-20 text-center"
              value={filters.minPrice}
              onChange={(e) => handleChange('minPrice', parseFloat(e.target.value) || 0)}
              placeholder="最低"
            />
            <span className="text-text-secondary">~</span>
            <input
              type="number"
              className="input-field w-20 text-center"
              value={filters.maxPrice}
              onChange={(e) => handleChange('maxPrice', parseFloat(e.target.value) || 0)}
              placeholder="最高"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">產業別</label>
          <select
            className="input-field w-full"
            value={filters.industry}
            onChange={(e) => handleChange('industry', e.target.value)}
          >
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind || '全部產業'}
              </option>
            ))}
          </select>
        </div>

        <div className="border-t border-gray-700 pt-3">
          <label className="block text-sm text-text-secondary mb-2">技術指標</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-accent"
                checked={filters.enableKD}
                onChange={(e) => handleChange('enableKD', e.target.checked)}
              />
              <span className="text-sm text-text-primary">KD黃金交叉 (K&gt;D 且 D&lt;30)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-accent"
                checked={filters.enableMACD}
                onChange={(e) => handleChange('enableMACD', e.target.checked)}
              />
              <span className="text-sm text-text-primary">MACD 柱狀體正值</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-accent"
                checked={filters.enableRSI}
                onChange={(e) => handleChange('enableRSI', e.target.checked)}
              />
              <span className="text-sm text-text-primary">RSI &gt; 50</span>
            </label>
          </div>
        </div>
      </div>

      <button
        className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
          isMonitoring
            ? 'bg-accent/50 text-white cursor-not-allowed'
            : 'bg-accent text-white hover:bg-opacity-90'
        }`}
        onClick={onStartMonitoring}
        disabled={isMonitoring}
      >
        {isMonitoring ? '監測中...' : '🚀 開始監測'}
      </button>
    </div>
  );
}