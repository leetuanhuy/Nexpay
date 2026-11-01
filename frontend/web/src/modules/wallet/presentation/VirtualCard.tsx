import React, { useState } from 'react';
import {
  Wifi,
  ShieldCheck,
  ArrowUpRight,
  PlusCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Check,
  Lock,
  Unlock,
  CreditCard,
  TrendingUp,
} from 'lucide-react';
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
  const [showCardNumber, setShowCardNumber] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);

  const walletSuffix = wallet?.id ? wallet.id.replace(/-/g, '').slice(-4).toUpperCase() : '8829';
  const fullCardNumber = `4829 •••• •••• ${walletSuffix}`;
  const rawCardNumber = `4829 8840 9210 ${walletSuffix}`;

  const handleCopyCard = () => {
    navigator.clipboard.writeText(rawCardNumber.replace(/\s+/g, ''));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const dailyLimit = 50000000;
  const currentBalance = wallet?.balance ?? 0;
  const usagePercent = Math.min(100, Math.round((currentBalance / dailyLimit) * 100));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* 1. Digital ATM Card (Col 7) */}
      <div className="lg:col-span-7 relative group">
        {/* Glow ambient background */}
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-indigo-500/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />

        <div className="relative rounded-3xl p-7 sm:p-8 bg-gradient-to-br from-slate-900 via-[#0d1525] to-[#0a1e1d] border border-slate-700/80 shadow-2xl flex flex-col justify-between min-h-[250px] overflow-hidden">
          {/* Card subtle mesh patterns */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20" />

          {/* Frozen Overlay */}
          {isFrozen && (
            <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center space-y-3 animate-fade-in">
              <div className="p-4 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400">
                <Lock className="h-8 w-8" />
              </div>
              <p className="text-base font-bold text-white">Card Temporarily Frozen</p>
              <p className="text-xs text-slate-400 max-w-xs text-center">
                Transactions are paused for your security. Toggle card protection to resume.
              </p>
              <button
                onClick={() => setIsFrozen(false)}
                className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 transition flex items-center space-x-2 cursor-pointer"
              >
                <Unlock className="h-4 w-4 text-emerald-400" />
                <span>Unfreeze Card</span>
              </button>
            </div>
          )}

          {/* Card Top Row */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-emerald-400 to-teal-300 flex items-center justify-center font-black text-slate-950 text-sm shadow-md shadow-emerald-500/30">
                  N
                </div>
                <div>
                  <span className="text-base font-black tracking-wider text-white">NEXPAY</span>
                  <span className="text-[10px] ml-1.5 font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    PLATINUM
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Dual NFC Contactless Wave SVG */}
              <div className="flex items-center space-x-1 text-slate-400" title="Contactless Payment Enabled">
                <Wifi className="h-5 w-5 text-slate-300 rotate-90" />
              </div>
              <Badge variant={wallet?.status === 'Active' ? 'success' : 'warning'} pulse>
                {wallet?.status || 'Active'}
              </Badge>
            </div>
          </div>

          {/* Card Middle: EMV Chip & Balance */}
          <div className="relative z-10 my-6 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 text-xs font-medium text-slate-400 mb-1">
                <span>Available Balance</span>
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  title="Refresh Balance from Database"
                  className="text-slate-400 hover:text-emerald-400 transition cursor-pointer p-0.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
                </button>
              </div>
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono flex items-baseline">
                {loading ? (
                  <span className="text-slate-500 animate-pulse text-2xl">Syncing ledger...</span>
                ) : (
                  <span>{CurrencyFormatter.formatVND(wallet?.balance)}</span>
                )}
              </div>
            </div>

            {/* Realistic EMV Metallic Smart Chip */}
            <div className="h-11 w-14 rounded-lg bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 border border-amber-300/60 shadow-lg flex flex-col justify-around p-1.5 opacity-95">
              <div className="h-0.5 bg-amber-900/40 w-full rounded" />
              <div className="flex justify-between items-center px-1">
                <div className="h-3 w-3 rounded-full border border-amber-900/50" />
                <div className="h-3 w-3 rounded-full border border-amber-900/50" />
              </div>
              <div className="h-0.5 bg-amber-900/40 w-full rounded" />
            </div>
          </div>

          {/* Card Bottom Row: Card Details & Network Logo */}
          <div className="relative z-10 flex items-end justify-between pt-4 border-t border-slate-800/80">
            <div className="space-y-1.5">
              {/* Card Number with Show/Hide & Copy */}
              <div className="flex items-center space-x-2">
                <p className="font-mono text-xs sm:text-sm font-semibold tracking-widest text-slate-200">
                  {showCardNumber ? rawCardNumber : fullCardNumber}
                </p>
                <button
                  onClick={() => setShowCardNumber(!showCardNumber)}
                  className="text-slate-400 hover:text-white transition cursor-pointer p-1"
                  title={showCardNumber ? 'Hide Card Number' : 'Show Full Card Number'}
                >
                  {showCardNumber ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={handleCopyCard}
                  className="text-slate-400 hover:text-emerald-400 transition cursor-pointer p-1"
                  title="Copy Card Number"
                >
                  {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Cardholder & Expiry */}
              <div className="flex items-center space-x-6 text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider">
                <div>
                  <span className="text-[9px] text-slate-500 block">CARDHOLDER</span>
                  <span className="font-semibold text-slate-200">{cardholderName}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block">EXPIRES</span>
                  <span className="font-semibold text-slate-200">08/29</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block">CVV</span>
                  <span className="font-semibold text-slate-200 font-mono">•••</span>
                </div>
              </div>
            </div>

            {/* Mastercard / Visa Dual Circles SVG */}
            <div className="flex items-center space-x-0">
              <div className="h-7 w-7 rounded-full bg-rose-500/90 shadow-md -mr-2.5" />
              <div className="h-7 w-7 rounded-full bg-amber-400/90 shadow-md opacity-90" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Fast Actions & Account Security (Col 5) */}
      <div className="lg:col-span-5 rounded-3xl p-6 sm:p-7 bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Wallet Management</h3>
                <p className="text-[11px] text-slate-400">Direct SQL Server stored procedure actions</p>
              </div>
            </div>
            <button
              onClick={() => setIsFrozen(!isFrozen)}
              className={`p-2 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                isFrozen
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Toggle Security Lock"
            >
              {isFrozen ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              <span>{isFrozen ? 'Locked' : 'Active'}</span>
            </button>
          </div>

          {/* Primary Action Button */}
          <Button
            onClick={onTopUp}
            variant="primary"
            size="lg"
            className="w-full justify-between shadow-lg shadow-emerald-500/20 mb-4"
            icon={<PlusCircle className="h-5 w-5" />}
          >
            <span className="font-bold text-sm">Deposit / Top Up Wallet</span>
            <ArrowUpRight className="h-4 w-4 ml-auto" />
          </Button>

          {/* Spending Limit Meter */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center space-x-1">
                <TrendingUp className="h-3.5 w-3.5 text-teal-400" />
                <span>Daily Limit Allowance</span>
              </span>
              <span className="font-mono font-bold text-slate-200">
                {CurrencyFormatter.formatVND(dailyLimit)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{usagePercent}% utilized</span>
              <span className="text-emerald-400 font-medium">Verified Tier 1</span>
            </div>
          </div>
        </div>

        {/* Double-Entry Ledger Guarantee Notice */}
        <div className="pt-4 border-t border-slate-800/80 flex items-start space-x-3 text-xs text-slate-400">
          <div className="p-1 rounded bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <p className="text-[11px] leading-relaxed">
            All balance modifications are executed using{' '}
            <code className="text-emerald-300 font-mono text-[10px] bg-slate-950 px-1 py-0.5 rounded">
              sp_DebitWallet
            </code>{' '}
            and{' '}
            <code className="text-emerald-300 font-mono text-[10px] bg-slate-950 px-1 py-0.5 rounded">
              sp_CreditWallet
            </code>{' '}
            with ACID transactions and row-level locks.
          </p>
        </div>
      </div>
    </div>
  );
};
