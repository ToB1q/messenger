// lib/websocket/websocket.service.ts
export type WebSocketEvent = 
  | { type: 'message.created'; payload: any }
  | { type: 'message.ack'; payload: any }
  | { type: 'read.updated'; payload: any }
  | { type: 'read.ack'; payload: any }
  | { type: 'typing.updated'; payload: any }
  | { type: 'presence.updated'; payload: any }
  | { type: 'user.profile.updated'; payload: any }
  | { type: 'pong'; payload: any };

export type WebSocketListener = (event: WebSocketEvent) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: WebSocketListener[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;
  private pingInterval: NodeJS.Timeout | null = null;
  private isConnected = false;
  private shouldReconnect = true;
  private connectionInProgress = false;

  connect() {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      console.error('No access token for WebSocket connection');
      return;
    }

    if (this.connectionInProgress) {
      console.log('WebSocket connection already in progress');
      return;
    }

    try {
      this.connectionInProgress = true;
      const wsUrl = `wss://dev5.pinkmoneyx.ru/ws?token=${encodeURIComponent(token)}`;
      console.log('Connecting to WebSocket with token in URL...');
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        this.isConnected = true;
        this.connectionInProgress = false;
        this.reconnectAttempts = 0;
        this.startPingInterval();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📩 Received:', data);
          this.listeners.forEach(listener => listener(data));
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        this.isConnected = false;
        this.connectionInProgress = false;
        this.stopPingInterval();
        
        if (event.code === 4001) {
          console.log('Auth failed, will refresh token and retry...');
          this.refreshTokenAndReconnect();
        } else if (event.code !== 1000 && this.shouldReconnect) {
          this.reconnect();
        }
      };

      this.ws.onerror = (error) => {
        this.connectionInProgress = false;
      };
    } catch (error) {
      console.error('Connection error:', error);
      this.connectionInProgress = false;
    }
  }

  private async refreshTokenAndReconnect() {
    try {
      console.log('Attempting to refresh token...');
      
      const refreshToken = localStorage.getItem('refresh_token');
      const deviceUuid = localStorage.getItem('device_uuid');
      
      if (!refreshToken || !deviceUuid) {
        console.error('No refresh token or device UUID');
        this.reconnect();
        return;
      }
      
      const response = await fetch('https://dev5.pinkmoneyx.ru/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refresh_token: refreshToken,
          device_uuid: deviceUuid
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.tokens) {
        console.log('Token refreshed successfully');
        localStorage.setItem('access_token', data.tokens.access_token);
        localStorage.setItem('refresh_token', data.tokens.refresh_token);
        
        this.reconnectAttempts = 0;
        this.connect();
      } else {
        console.error('Failed to refresh token');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.reconnect();
    }
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }

    const timeout = this.reconnectTimeout * Math.pow(2, this.reconnectAttempts);
    console.log(`Reconnecting in ${timeout}ms (attempt ${this.reconnectAttempts + 1})`);

    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, timeout);
  }

  private startPingInterval() {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'ping',
          payload: { ts: Date.now() }
        }));
      }
    }, 20000);
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  sendMessage(chatId: number, text: string, clientUuid?: string, replyToId?: number | null): boolean {
  if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
    console.log('❌ WebSocket not connected, state:', this.ws?.readyState);
    return false;
  }

  const payload: any = {
    request_id: crypto.randomUUID(),
    chat_id: chatId,
    client_uuid: clientUuid || crypto.randomUUID(),
    text: text
  };

  // Важно: добавляем reply_to_message_id если есть
  if (replyToId) {
    payload.reply_to_message_id = replyToId;
    console.log('📎 Adding reply_to_message_id:', replyToId);
  }

  const message = {
    type: 'message.send',
    payload: payload
  };

  console.log('📤 Sending WebSocket message:', JSON.stringify(message, null, 2));
  
  try {
    this.ws.send(JSON.stringify(message));
    console.log('✅ WebSocket message sent');
    return true;
  } catch (error) {
    console.error('❌ Error sending WebSocket message:', error);
    return false;
  }
}

  sendTyping(chatId: number, isTyping: boolean): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;

    this.ws.send(JSON.stringify({
      type: 'typing.update',
      payload: {
        request_id: crypto.randomUUID(),
        chat_id: chatId,
        is_typing: isTyping
      }
    }));
    return true;
  }

  markAsRead(chatId: number, maxMessageId: number): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;

    this.ws.send(JSON.stringify({
      type: 'read.update',
      payload: {
        request_id: crypto.randomUUID(),
        chat_id: chatId,
        max_message_id: maxMessageId
      }
    }));
    return true;
  }

  addListener(listener: WebSocketListener) {
    this.listeners.push(listener);
  }

  removeListener(listener: WebSocketListener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  disconnect() {
    this.shouldReconnect = false;
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close(1000, 'Normal closure');
      this.ws = null;
    }
    this.isConnected = false;
    this.connectionInProgress = false;
  }

  isActive(): boolean {
    return this.isConnected && this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const websocketService = new WebSocketService();