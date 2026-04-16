interface FooterProps {
  isConnected: boolean;
  lastUpdate: string;
}

export default function Footer({ isConnected, lastUpdate }: FooterProps) {
  return (
    <footer className="bg-primary border-t border-gray-800 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-accent'}`}></span>
          <span className="text-text-secondary">
            狀態: {isConnected ? '已連線' : '連線中'}
          </span>
        </div>
        <div className="text-text-secondary">
          最後更新: {lastUpdate}
        </div>
      </div>
    </footer>
  );
}