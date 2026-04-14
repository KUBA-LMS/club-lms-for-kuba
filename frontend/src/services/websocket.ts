/**
 * WebSocket client service with auto-reconnect and channel subscriptions.
 *
 * Uses React Native built-in WebSocket (no extra packages).
 * WS is signal-only: actual data is always fetched via REST.
 */

type MessageHandler = (data: Record<string, unknown>) => void;

interface WSMessage {
  type: string;
  channel?: string;
  data?: Record<string, unknown>;
  message?: string;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string = "";
  private token: string = "";
  private channels: Set<string> = new Set();
  private listeners: Map<string, Set<MessageHandler>> = new Map();
  private reconnectAttempt: number = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private connected: boolean = false;
  private intentionalClose: boolean = false;

  connect(url: string, token: string): void {
    this.url = url;
    this.token = token;
    this.intentionalClose = false;
    this.reconnectAttempt = 0;
    this._connect();
  }

  disconnect(): void {
    this.intentionalClose = true;
    this._cleanup();
    this.channels.clear();
    this.listeners.clear();
  }

  subscribe(channel: string): void {
    this.channels.add(channel);
    if (this.connected) {
      this._send({ type: "subscribe", channel });
    }
  }

  unsubscribe(channel: string): void {
    this.channels.delete(channel);
    this.listeners.delete(channel);
    if (this.connected) {
      this._send({ type: "unsubscribe", channel });
    }
  }

  /**
   * Register a handler for messages on a channel.
   * Returns an unsubscribe function.
   */
  on(channel: string, handler: MessageHandler): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(handler);

    return () => {
      const set = this.listeners.get(channel);
      if (set) {
        set.delete(handler);
        if (set.size === 0) {
          this.listeners.delete(channel);
        }
      }
    };
  }

  get isConnected(): boolean {
    return this.connected;
  }

  // -- Internal --

  private _connect(): void {
    this._cleanup();

    try {
      const wsUrl = `${this.url}?token=${encodeURIComponent(this.token)}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.connected = true;
        this.reconnectAttempt = 0;
        this._resubscribe();
        this._startPing();
      };

      this.ws.onmessage = (event: WebSocketMessageEvent) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          this._handleMessage(msg);
        } catch {
          // ignore malformed messages
        }
      };

      this.ws.onclose = (event: WebSocketCloseEvent) => {
        this.connected = false;
        this._stopPing();

        // Token expired
        if (event.code === 4001) {
          return;
        }

        if (!this.intentionalClose) {
          this._scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        // onclose will fire after onerror
      };
    } catch {
      this._scheduleReconnect();
    }
  }

  private _cleanup(): void {
    this._stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
    this.connected = false;
  }

  private _send(msg: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private _handleMessage(msg: WSMessage): void {
    if (msg.type === "pong") return;
    if (msg.type === "subscribed" || msg.type === "unsubscribed") return;

    const channel = msg.channel;
    if (!channel) return;

    const handlers = this.listeners.get(channel);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler({ type: msg.type, data: msg.data || {} });
        } catch {
          // don't let one handler break others
        }
      }
    }
  }

  private _resubscribe(): void {
    for (const channel of this.channels) {
      this._send({ type: "subscribe", channel });
    }
  }

  private _startPing(): void {
    this._stopPing();
    this.pingTimer = setInterval(() => {
      this._send({ type: "ping" });
    }, 30_000);
  }

  private _stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private _scheduleReconnect(): void {
    if (this.intentionalClose) return;

    // Exponential backoff: 1s, 2s, 4s, 8s, ... max 30s + jitter
    const base = Math.min(1000 * Math.pow(2, this.reconnectAttempt), 30_000);
    const jitter = Math.random() * 1000;
    const delay = base + jitter;

    this.reconnectAttempt++;
    this.reconnectTimer = setTimeout(() => {
      this._connect();
    }, delay);
  }
}

export const wsService = new WebSocketService();
