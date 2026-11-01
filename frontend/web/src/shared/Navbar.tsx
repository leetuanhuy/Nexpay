import React from 'react';
import { Wallet as WalletIcon, Activity, User as UserIcon, LogOut } from 'lucide-react';
import type { User } from '../modules/auth/domain/User';
import { Button } from './Button';

interface NavbarProps {
  user: User | null;
  gatewayConnected: boolean;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  gatewayConnected,
  onLogout,
  onOpenAuth,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <WalletIcon className="h-6 w-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Nexpay
              </span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Microservices
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Fintech & Digital Wallet Platform
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-4">
          {/* Gateway Status Pill */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
            <Activity className={`h-3.5 w-3.5 ${gatewayConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span className="text-slate-400">Gateway (YARP :5000):</span>
            <span className={gatewayConnected ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
              {gatewayConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>

          {user ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-white leading-tight">{user.fullName}</p>
                  <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[120px]">{user.email}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Log Out"
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

