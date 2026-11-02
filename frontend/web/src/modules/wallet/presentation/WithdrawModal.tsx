import React, { useState } from 'react';
import { MinusCircle, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import { Button } from '../../../shared/Button';
import { CurrencyFormatter } from '../../../core/utils/formatters';
import { useWalletViewModel } from './useWalletViewModel';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance?: number;
  onSuccess?: () => void;
}

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  currentBalance = 0,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<number>(100000);
  const [description, setDescription] = useState<string>('ATM / Bank Withdrawal');
  const [success, setSuccess] = useState<boolean>(false);

  const { withdraw, loading, error } = useWalletViewModel();

  if (!isOpen) return null;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await withdraw(amount, description);
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
        <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <MinusCircle className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Withdraw Funds (Debit Wallet)</h3>
          <p className="text-xs text-slate-400">Atomic execution via SQL Server banking stored procedure</p>
        </div>
      </div>

      {success ? (
        <div className="py-8 text-center flex flex-col items-center animate-fade-in space-y-3">
          <div className="h-16 w-16 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center animate-bounce">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h4 className="text-lg font-black text-white">Withdrawal Successful!</h4>
          <p className="text-xs text-slate-400 max-w-xs">
            Your wallet balance has been debited atomically via{' '}
            <code className="text-rose-300 font-mono">sp_DebitWallet</code>.
          </p>
        </div>
      ) : (
        <form onSubmit={handleWithdraw} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Available Balance info */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Available Balance:</span>
            <span className="font-mono font-bold text-emerald-400">
              {CurrencyFormatter.formatVND(currentBalance)}
            </span>
          </div>

          {/* Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Select Withdrawal Amount</label>
            <div className="grid grid-cols-3 gap-2.5">
              {PRESET_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    amount === val
                      ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
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
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-sm focus:outline-none focus:border-rose-500 transition"
                placeholder="Enter withdrawal amount"
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
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-rose-500 transition"
              placeholder="e.g. Bank transfer, ATM payout, Testing"
              required
            />
          </div>

          {/* Security Guarantee Badge */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center space-x-2 text-[11px] text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Pessimistic row-locking ensures zero overdrafts.</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <Button type="button" onClick={onClose} variant="ghost" size="md">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || amount <= 0 || amount > currentBalance}
              variant="danger"
              size="md"
              icon={<ArrowRight className="h-4 w-4" />}
            >
              {loading ? 'Executing Proc...' : `Withdraw ${CurrencyFormatter.formatVND(amount)}`}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
