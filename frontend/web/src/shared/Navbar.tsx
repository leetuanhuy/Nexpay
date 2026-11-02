import React from 'react';
import {
  Wallet as WalletIcon,
  Activity,
  User as UserIcon,
  LogOut,
  Terminal,
} from 'lucide-react';
import type { User } from '../modules/auth/domain/User';
import type { NotificationItem } from '../modules/notification/domain/NotificationItem';
import { NotificationBell } from '../modules/notification/presentation/NotificationBell';
import { Button } from './Button';

interface NavbarProps {
  user: User | null;
  gatewayConnected: boolean;
  unreadCount?: number;
  notifications?: NotificationItem[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onClearNotifications?: () => void;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  gatewayConnected,
  unreadCount = 0,
  notifications = [],
  onMarkAsRead = () => {},
  onMarkAllAsRead = () => {},
  onClearNotifications = () => {},
  onLogout,
  onOpenAuth,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <WalletIcon className="h-5 w-5 text-slate-950 font-black" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Nexpay
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                FinTech Core
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              Digital Wallet & Distributed Saga Microservices
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-2.5 sm:space-x-3.5">
          {/* Quick links to Developer Portals */}
          <div className="hidden lg:flex items-center space-x-2">
            <a
              href="http://localhost:5341"
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-400 hover:text-emerald-400 transition flex items-center space-x-1.5"
              title="Open Seq Distributed Traces"
            >
              <Activity className="h-3 w-3 text-emerald-400" />
              <span>Seq Logs</span>
            </a>
            <a
              href="http://localhost:15672"
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-400 hover:text-amber-400 transition flex items-center space-x-1.5"
              title="Open RabbitMQ Management UI"
            >
              <Terminal className="h-3 w-3 text-amber-400" />
              <span>RabbitMQ</span>
            </a>
          </div>

          {/* Gateway Status Pill */}
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs">
            <div className={`h-2 w-2 rounded-full ${gatewayConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-slate-400 hidden md:inline">Gateway :5000:</span>
            <span className={gatewayConnected ? 'text-emerald-400 font-semibold text-[11px]' : 'text-amber-400 font-semibold text-[11px]'}>
              {gatewayConnected ? 'Healthy' : 'Connecting...'}
            </span>
          </div>

          {/* Real-time Notification Bell */}
          {user && (
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={onMarkAsRead}
              onMarkAllAsRead={onMarkAllAsRead}
              onClear={onClearNotifications}
            />
          )}

          {/* User Section */}
          {user ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex items-center space-x-2.5 px-3 py-1.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-sm">
                  {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-white leading-tight">{user.fullName}</p>
                  <p className="text-[10px] text-slate-400 font-mono leading-tight truncate max-w-[120px]">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Button
              onClick={onOpenAuth}
              variant="primary"
              size="sm"
              icon={<UserIcon className="h-4 w-4" />}
            >
              Sign In / Register
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
