import { OrderRequest, OrderResponse } from '../types/broker';

const WS_URL = 'ws://localhost:4000/ws';

export type MessageHandler = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnects = 5;
  private reconnectDelay = 3000;
  private handlers: Set<MessageHandler> = new Set();
  private subscribedSymbols: Set<string> = new Set();
  private onConnectionChange: ((connected: boolean) => void) | null = null;

  setConnectionHandler(handler: (connected: boolean) => void) {
    this.onConnectionChange = handler;
  }

  connect(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(WS_URL);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          if (this.onConnectionChange) {
            this.onConnectionChange(true);
          }
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handlers.forEach(handler => handler(data));
          } catch (e) {
            console.error('Failed to parse message:', e);
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          if (this.onConnectionChange) {
            this.onConnectionChange(false);
          }
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          resolve(false);
        };

        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            resolve(false);
          }
        }, 5000);

      } catch (error) {
        console.error('Failed to connect:', error);
        resolve(false);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnects) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnects})`);
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  subscribe(symbols: string[]) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      symbols.forEach(s => this.subscribedSymbols.add(s));
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        symbols
      }));
    }
  }

  unsubscribe(symbols: string[]) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      symbols.forEach(s => this.subscribedSymbols.delete(s));
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        symbols
      }));
    }
  }

  addHandler(handler: MessageHandler) {
    this.handlers.add(handler);
  }

  removeHandler(handler: MessageHandler) {
    this.handlers.delete(handler);
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsService = new WebSocketService();

export async function fetchWithAuth(apiKey: string, secretKey: string, simulation: boolean = true): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:4000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, secret_key: secretKey, simulation })
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
}

export async function fetchLogout(): Promise<void> {
  await fetch('http://localhost:4000/api/logout', { method: 'POST' });
}

export async function fetchSubscribe(symbols: string[]): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:4000/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols })
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Subscribe failed:', error);
    return false;
  }
}

export async function fetchPlaceOrder(order: OrderRequest): Promise<OrderResponse> {
  try {
    const response = await fetch('http://localhost:4000/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    return await response.json();
  } catch (error) {
    console.error('Place order failed:', error);
    return { success: false, message: 'Failed to place order' };
  }
}