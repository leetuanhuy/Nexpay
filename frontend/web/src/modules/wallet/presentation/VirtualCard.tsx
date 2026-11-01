import React from 'react';
import { Wifi, Sparkles, ShieldCheck, ArrowUpRight, PlusCircle, RefreshCw } from 'lucide-react';
import type { Wallet } from '../domain/Wallet';
import { CurrencyFormatter } from '../../../core/utils/formatters';
import { Button } from '../../../shared/Button';
import { Badge } from '../../../shared/Badge';

interface VirtualCardProps {
  wallet: Wallet | null;
  cardholderName?: string;
  loading: boolean;
  onTopUp: () => void;
  onRefresh: () => void;
}

export const VirtualCard: React.FC<VirtualCardProps> = ({
  wallet,
  cardholderName = 'Nexpay VIP Member',
  loading,
  onTopUp,
  onRefresh,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      {/* 1. Digital ATM Card */}
      <div className="lg:col-span-2 relative overflow-hidden rounded-3xl p-7 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/70 border border-slate-700/60 shadow-2xl shadow-emerald-950/20 group">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none group-hover:bg-emerald-500/15 transition-all duration-700" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between h-full min-h-[220px]">
          {/* Card Top Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="text-lg font-black tracking-wider text-emerald-400">NEXPAY</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                VIP Platinum
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Wifi className="h-5 w-5 text-slate-400 rotate-90" />
              <Badge variant="success" pulse>
                {wallet?.status || 'Active'}
              </Badge>
            </div>
          </div>

          {/* Card Middle: EMV Chip & Balance */}
          <div className="my-4 flex items-end justify-between">
            <div>
              <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium mb-1">
                <span>Available Balance</span>
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  title="Refresh Balance"
                  className="text-slate-400 hover:text-emerald-400 transition cursor-pointer"
                >
                  <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-baseline space-x-2">
                <span>{loading ? 'Updating...' : CurrencyFormatter.formatVND(wallet?.balance)}</span>
              </div>
            </div>

            {/* Metallic Gold Chip */}
            <div className="h-9 w-12 rounded-md bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 border border-amber-300/60 shadow-inner flex flex-col justify-around p-1 opacity-90">
              <div className="h-0.5 bg-amber-800/50 w-full" />
              <div className="h-0.5 bg-amber-800/50 w-full" />
            </div>
          </div>

          {/* Card Bottom Row: Cardholder & Masked Number */}
          <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-800/80">
            <div>
              <p className="text-[10px] uppercase text-slate-400 tracking-wider">Cardholder</p>
              <p className="font-semibold text-white tracking-wide uppercase">{cardholderName}</p>
            </div>
            <div className="text-right font-mono">
              <p className="text-[10px] uppercase text-slate-400 tracking-wider">Wallet Account ID</p>
              <p className="font-semibold text-slate-300 tracking-wider">
                {wallet ? `**** ${wallet.id.substring(wallet.id.length - 8)}` : '**** 2026'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Action Panel */}
      <div className="rounded-3xl p-6 bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 text-sm font-semibold text-white mb-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>Fast Wallet Actions</span>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            Directly execute banking stored procedures with row-level pessimistic locking.
          </p>

          <Button
            onClick={onTopUp}
            variant="primary"
            size="lg"
            className="w-full justify-between"
            icon={<PlusCircle className="h-5 w-5" />}
          >
            <span>Top Up Balance</span>
            <ArrowUpRight className="h-4 w-4 ml-auto" />
          </Button>
        </div>

        {/* Security & Ledger guarantee info */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-start space-x-2.5 text-[11px] text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Atomic double-entry ledger guarantee. All debit & credit operations use <code className="text-slate-300 font-mono">sp_DebitWallet</code> and <code className="text-slate-300 font-mono">sp_CreditWallet</code>.
          </span>
        </div>
      </div>
    </div>
  );
};
