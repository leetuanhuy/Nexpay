import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { NotificationItem } from '../domain/NotificationItem';
import { CurrencyFormatter, DateFormatter } from '../../../core/utils/formatters';

interface NotificationBellProps {
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClear: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClear,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'WalletCredited':
        return (
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <ArrowDownLeft className="h-4 w-4" />
          </div>
        );
      case 'WalletDebited':
        return (
          <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        );
      case 'OrderCompleted':
        return (
          <div className="p-2 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        );
      case 'OrderFailed':
        return (
          <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="h-4 w-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer"
        title="Real-Time Notifications"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-black text-slate-950 shadow-md shadow-emerald-500/50 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl bg-slate-950/95 backdrop-blur-xl border border-slate-800 shadow-2xl z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-[11px] text-slate-400 hover:text-emerald-400 transition cursor-pointer flex items-center space-x-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Read all</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={onClear}
                  className="text-[11px] text-slate-400 hover:text-rose-400 transition cursor-pointer p-1"
                  title="Clear all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/50 scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <Sparkles className="h-7 w-7 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400">All caught up!</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Real-time events will stream here automatically via SignalR.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => onMarkAsRead(n.id)}
                  className={`p-3.5 transition flex items-start space-x-3 cursor-pointer ${
                    !n.isRead
                      ? 'bg-slate-900/70 hover:bg-slate-900'
                      : 'bg-transparent hover:bg-slate-900/40 opacity-75'
                  }`}
                >
                  {getIcon(n.type)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-white truncate">{n.title}</p>
                      {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0 ml-2" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-snug line-clamp-2">
                      {n.message}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                      <span className="flex items-center space-x-1 font-mono">
                        <Clock className="h-3 w-3" />
                        <span>{DateFormatter.formatDateTime(n.timestamp)}</span>
                      </span>
                      {n.amount !== undefined && n.amount !== null && (
                        <span
                          className={`font-mono font-bold ${
                            n.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {n.amount >= 0 ? '+' : ''}
                          {CurrencyFormatter.formatVND(n.amount)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

