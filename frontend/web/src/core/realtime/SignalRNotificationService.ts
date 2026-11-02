import * as signalR from '@microsoft/signalr';
import { TokenStorage } from '../storage/TokenStorage';

export interface NotificationPayload {
  id: string;
  type: 'WalletCredited' | 'WalletDebited' | 'OrderCompleted' | 'OrderFailed';
  title: string;
  message: string;
  amount?: number;
  balanceAfter?: number;
  reference?: string;
  timestamp: string;
  isRead?: boolean;
}

export interface BalanceUpdatedPayload {
  amount: number;
  balance: number;
  type: 'Credit' | 'Debit';
}

export interface OrderCompletedPayload {
  orderId: string;
  orderCode: string;
  amount: number;
  transactionId: string;
}

export interface OrderFailedPayload {
  orderId: string;
  orderCode: string;
  reason: string;
}

type NotificationCallback = (payload: NotificationPayload) => void;
type BalanceUpdatedCallback = (data: BalanceUpdatedPayload) => void;
type OrderCompletedCallback = (data: OrderCompletedPayload) => void;
type OrderFailedCallback = (data: OrderFailedPayload) => void;

class SignalRNotificationService {
  private hubConnection: signalR.HubConnection | null = null;
  private notificationListeners: NotificationCallback[] = [];
  private balanceListeners: BalanceUpdatedCallback[] = [];
  private orderCompletedListeners: OrderCompletedCallback[] = [];
  private orderFailedListeners: OrderFailedCallback[] = [];
  private isConnecting: boolean = false;

  public async startConnection(baseUrl: string = '', userId?: string): Promise<void> {
    const token = TokenStorage.getAccessToken();
    if (!token) {
      console.log('[SignalR] No access token found. Delaying connection.');
      return;
    }

    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      if (userId) {
        try {
          await this.hubConnection.invoke('RegisterUser', userId);
        } catch {
          // Ignore
        }
      }
      return;
    }

    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      // Connect through API Gateway on port 5000 (or direct to Notification Service on port 5250)
      const hubUrl = baseUrl ? `${baseUrl}/hubs/notifications` : 'http://localhost:5000/hubs/notifications';

      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => TokenStorage.getAccessToken() || '',
          skipNegotiation: false,
          withCredentials: true,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Register Incoming Real-time Handlers
      this.hubConnection.on('ReceiveNotification', (payload: NotificationPayload) => {
        console.log('[SignalR] Notification Received:', payload);
        this.notificationListeners.forEach((cb) => cb(payload));
      });

      this.hubConnection.on('BalanceUpdated', (data: BalanceUpdatedPayload) => {
        console.log('[SignalR] Balance Updated Event:', data);
        this.balanceListeners.forEach((cb) => cb(data));
      });

      this.hubConnection.on('OrderCompleted', (data: OrderCompletedPayload) => {
        console.log('[SignalR] Order Completed Event:', data);
        this.orderCompletedListeners.forEach((cb) => cb(data));
      });

      this.hubConnection.on('OrderFailed', (data: OrderFailedPayload) => {
        console.log('[SignalR] Order Failed Event:', data);
        this.orderFailedListeners.forEach((cb) => cb(data));
      });

      await this.hubConnection.start();
      console.log('[SignalR] Connected to Notification Hub successfully.');

      // Register user group if provided
      if (userId) {
        try {
          await this.hubConnection.invoke('RegisterUser', userId);
          console.log('[SignalR] Successfully registered connection for user:', userId);
        } catch (regErr) {
          console.warn('[SignalR] User group registration warning:', regErr);
        }
      }
    } catch (err) {
      console.warn('[SignalR] Unable to connect to notification hub:', err);
    } finally {
      this.isConnecting = false;
    }
  }

  public async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
        console.log('[SignalR] Disconnected from Notification Hub.');
      } catch (err) {
        console.warn('[SignalR] Error stopping connection:', err);
      } finally {
        this.hubConnection = null;
      }
    }
  }

  public onNotification(callback: NotificationCallback): () => void {
    this.notificationListeners.push(callback);
    return () => {
      this.notificationListeners = this.notificationListeners.filter((cb) => cb !== callback);
    };
  }

  public onBalanceUpdated(callback: BalanceUpdatedCallback): () => void {
    this.balanceListeners.push(callback);
    return () => {
      this.balanceListeners = this.balanceListeners.filter((cb) => cb !== callback);
    };
  }

  public onOrderCompleted(callback: OrderCompletedCallback): () => void {
    this.orderCompletedListeners.push(callback);
    return () => {
      this.orderCompletedListeners = this.orderCompletedListeners.filter((cb) => cb !== callback);
    };
  }

  public onOrderFailed(callback: OrderFailedCallback): () => void {
    this.orderFailedListeners.push(callback);
    return () => {
      this.orderFailedListeners = this.orderFailedListeners.filter((cb) => cb !== callback);
    };
  }

  public isConnected(): boolean {
    return this.hubConnection?.state === signalR.HubConnectionState.Connected;
  }
}

export const signalRNotificationService = new SignalRNotificationService();
