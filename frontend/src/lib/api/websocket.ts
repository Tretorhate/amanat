import { authStore } from '@/lib/store/authStore';

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  connect() {
    const token = authStore.getState().token;
    if (!token) {
      console.warn('WebSocket: No auth token available');
      return;
    }

    const url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/notifications/';

    try {
      this.socket = new WebSocket(`${url}?token=${token}`);

      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);
        // Emit custom event for components to listen to
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ws-message', { detail: data }));
        }
      };

      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  subscribeToAppeal(appealId: string) {
    // URL-based subscription handled by backend
    console.log('Subscribed to appeal:', appealId);
  }

  unsubscribeFromAppeal(appealId: string) {
    console.log('Unsubscribed from appeal:', appealId);
  }

  send(message: Record<string, unknown>) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }
}

export const wsService = new WebSocketService();
