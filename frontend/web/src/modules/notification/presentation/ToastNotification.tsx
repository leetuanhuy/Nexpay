import React from 'react';
import { X, ArrowDownLeft, ArrowUpRight, CheckCircle2, XCircle } from 'lucide-react';
import type { NotificationItem } from '../domain/NotificationItem';
import { CurrencyFormatter } from '../../../core/utils/formatters';

interface ToastNotificationProps {
  notification: NotificationItem | null;
  onDismiss: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  notification,
  onDismiss,
}) => {
  if (!notification) return null;

  const isSuccess = notification.type === 'WalletCredited' || notification.type === 'OrderCompleted';
  const isDanger = notification.type === 'OrderFailed';

  const getIcon = () => {
    switch (notification.type) {
      case 'WalletCredited':
        return <ArrowDownLeft className="h-5 w-5 text-emerald-400" />;
      case 'WalletDebited':
        return <ArrowUpRight className="h-5 w-5 text-rose-400" />;
      case 'OrderCompleted':
        return <CheckCircle2 className="h-5 w-5 text-teal-400" />;
      case 'OrderFailed':
        return <XCircle className="h-5 w-5 text-rose-400" />;
    }
  };

  return (
    <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-sm w-full animate-bounce">
      <div
        className={`p-4 rounded-3xl bg-slate-950/95 backdrop-blur-xl border shadow-2xl flex items-start space-x-3.5 transition-all duration-300 ${
          isSuccess
            ? 'border-emerald-500/50 shadow-emerald-950/40'
            : isDanger
            ? 'border-rose-500/50 shadow-rose-950/40'
            : 'border-slate-700 shadow-slate-950/50'
        }`}
      >
        <div
          className={`p-2.5 rounded-2xl shrink-0 ${
            isSuccess
              ? 'bg-emerald-500/15'
              : isDanger
              ? 'bg-rose-500/15'
              : 'bg-slate-800'
          }`}
        >
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              {notification.title}
            </h4>
            <button
              onClick={onDismiss}
              className="text-slate-500 hover:text-white transition cursor-pointer p-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-slate-300 mt-1 leading-snug">
            {notification.message}
          </p>
          {notification.amount !== undefined && notification.amount !== null && (
            <p
              className={`text-xs font-mono font-black mt-1.5 ${
                notification.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {notification.amount >= 0 ? '+' : ''}
              {CurrencyFormatter.formatVND(notification.amount)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
