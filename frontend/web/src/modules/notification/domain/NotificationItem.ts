export interface NotificationItem {
  id: string;
  type: 'WalletCredited' | 'WalletDebited' | 'OrderCompleted' | 'OrderFailed';
  title: string;
  message: string;
  amount?: number;
  balanceAfter?: number;
  reference?: string;
  timestamp: string;
  isRead: boolean;
}

