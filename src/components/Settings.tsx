import { useState } from 'react';
import { BROKER_OPTIONS, BrokerName, ApiCredentials } from '../services/broker';
import { ConnectionStatus } from '../types/broker';

interface SettingsProps {
  connectionStatus: ConnectionStatus;
  onConnectionChange: (status: ConnectionStatus) => void;
  onBrokerConnect: (broker: BrokerName, credentials: ApiCredentials) => Promise<boolean>;
}

export default function Settings({ connectionStatus, onConnectionChange, onBrokerConnect }: SettingsProps) {
  const [selectedBroker, setSelectedBroker] = useState<BrokerName>('mock');
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');
    onConnectionChange('connecting');

    try {
      const success = await onBrokerConnect(selectedBroker, {
        broker: selectedBroker,
        apiKey: apiKey || undefined,
        secretKey: secretKey || undefined,
      });

      if (success) {
        onConnectionChange('connected');
      } else {
        setError('連線失敗，請檢查 API Key 是否正確');
        onConnectionChange('error');
      }
    } catch (err: any) {
      setError(err.message || '連線失敗');
      onConnectionChange('error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    onConnectionChange('disconnected');
    setApiKey('');
    setSecretKey('');
  };

  return (
    <div className="card space-y-4">
      <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
        <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        API 設定
      </h2>

      <div>
        <label className="block text-sm text-text-secondary mb-2">選擇券商</label>
        <div className="grid grid-cols-2 gap-2">
          {BROKER_OPTIONS.map((broker) => (
            <button
              key={broker.id}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedBroker === broker.id
                  ? 'border-accent bg-accent/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => setSelectedBroker(broker.id)}
            >
              <span className="text-lg mr-2">{broker.logo}</span>
              <span className="text-sm text-text-primary">{broker.name}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedBroker !== 'mock' && (
        <>
          <div>
            <label className="block text-sm text-text-secondary mb-1">API Key</label>
            <input
              type="text"
              className="input-field w-full"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="輸入 API Key"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">Secret Key</label>
            <input
              type="password"
              className="input-field w-full"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="輸入 Secret Key"
            />
          </div>

          <p className="text-xs text-text-secondary">
            {selectedBroker === 'shioaji' && '⚠️ 請至永豐金證券官網申請 API Key'}
            {selectedBroker === 'fubon' && '⚠️ 請至富邦證券申請 API 權限'}
            {selectedBroker === 'tsi' && '⚠️ 請至台新證券申請 API 權限'}
          </p>
        </>
      )}

      {error && (
        <div className="p-3 bg-accent/20 border border-accent rounded-lg text-accent text-sm">
          {error}
        </div>
      )}

      {connectionStatus === 'connected' ? (
        <button
          className="w-full py-3 rounded-lg font-semibold bg-accent/20 text-accent hover:bg-accent/30 transition-all"
          onClick={handleDisconnect}
        >
          斷開連線
        </button>
      ) : (
        <button
          className={`w-full py-3 rounded-lg font-semibold transition-all ${
            isConnecting
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-success hover:bg-opacity-90'
          }`}
          onClick={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? '連線中...' : '連接券商'}
        </button>
      )}

      <div className="pt-3 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">連線狀態</span>
          <span className={`flex items-center gap-2 ${
            connectionStatus === 'connected' ? 'text-success' :
            connectionStatus === 'error' ? 'text-accent' :
            'text-yellow-500'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-success' :
              connectionStatus === 'error' ? 'bg-accent' :
              'bg-yellow-500'
            }`}></span>
            {connectionStatus === 'connected' && '已連線'}
            {connectionStatus === 'connecting' && '連線中'}
            {connectionStatus === 'disconnected' && '未連線'}
            {connectionStatus === 'error' && '連線失敗'}
          </span>
        </div>
      </div>
    </div>
  );
}