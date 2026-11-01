import React, { useState } from 'react';
import { PlusCircle, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import { Button } from '../../../shared/Button';
import { CurrencyFormatter } from '../../../core/utils/formatters';
import { useWalletViewModel } from './useWalletViewModel';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRESET_AMOUNTS = [100000, 200000, 500000, 1000000, 2000000, 5000000];

export const TopUpModal: React.FC<TopUpModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [amount, setAmount] = useState<number>(500000);
  const [description, setDescription] = useState<string>('Online Wallet Deposit');
  const [success, setSuccess] = useState<boolean>(false);

  const { topUp, loading, error } = useWalletViewModel();

  if (!isOpen) return null;

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await topUp(amount, description);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
        onClose();
      }, 1200);
    } catch {
      // Error handled in hook
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800 mb-5">
        <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <PlusCircle className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Deposit Funds to Wallet</h3>
          <p className="text-xs text-slate-400">Atomic execution via SQL Server banking stored procedure</p>
        </div>
      </div>

      {success ? (
        <div className="py-8 text-center flex flex-col items-center animate-fade-in space-y-3">
          <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center animate-bounce">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h4 className="text-lg font-black text-white">Deposit Completed!</h4>
          <p className="text-xs text-slate-400 max-w-xs">
            Your wallet balance and audit ledger have been credited atomically via{' '}
            <code className="text-emerald-300 font-mono">sp_CreditWallet</code>.
          </p>
        </div>
      ) : (
        <form onSubmit={handleTopUp} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Select Deposit Amount</label>
            <div className="grid grid-cols-3 gap-2.5">
              {PRESET_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    amount === val
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                  }`}
                >
                  {CurrencyFormatter.formatVND(val)}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Custom Amount (VND)</label>
            <div className="relative">
              <input
                type="number"
                min="10000"
                step="10000"
                value={amount}
                onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500 transition"
                placeholder="Enter custom deposit"
                required
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold">VND</span>
            </div>
          </div>

          {/* Note / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Reference Note</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition"
              placeholder="e.g. Salary, ATM Deposit, Testing"
              required
            />
          </div>

          {/* Security Guarantee Badge */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center space-x-2 text-[11px] text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Pessimistic row-locking protects concurrent transactions.</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <Button type="button" onClick={onClose} variant="ghost" size="md">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || amount <= 0}
              variant="primary"
              size="md"
              icon={<ArrowRight className="h-4 w-4" />}
            >
              {loading ? 'Executing Proc...' : `Confirm ${CurrencyFormatter.formatVND(amount)}`}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
