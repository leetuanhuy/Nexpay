import { useState, useEffect, useCallback } from 'react';
import type { NotificationItem } from '../domain/NotificationItem';
import { signalRNotificationService } from '../../../core/realtime/SignalRNotificationService';
import type { NotificationPayload, BalanceUpdatedPayload } from '../../../core/realtime/SignalRNotificationService';

const STORAGE_KEY = 'nexpay_user_notifications';

export const useNotificationViewModel = (
  onBalanceUpdated?: (data: BalanceUpdatedPayload) => void
) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // Ignore storage errors
    }
  }, [notifications]);

  // Subscribe to SignalR events
  useEffect(() => {
    const unsubNotification = signalRNotificationService.onNotification((payload: NotificationPayload) => {
      const item: NotificationItem = {
        id: payload.id || Date.now().toString(),
        type: payload.type,
        title: payload.title,
        message: payload.message,
        amount: payload.amount,
        balanceAfter: payload.balanceAfter,
        reference: payload.reference,
        timestamp: payload.timestamp || new Date().toISOString(),
        isRead: false,
      };

      setNotifications((prev) => [item, ...prev].slice(0, 50));
      setActiveToast(item);
    });

    const unsubBalance = signalRNotificationService.onBalanceUpdated((data: BalanceUpdatedPayload) => {
      onBalanceUpdated?.(data);
    });

    return () => {
      unsubNotification();
      unsubBalance();
    };
  }, [onBalanceUpdated]);

  // Auto-dismiss active toast after 5 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    activeToast,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    dismissToast,
  };
};
