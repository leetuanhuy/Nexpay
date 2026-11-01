import React, { useState } from 'react';
import { PlusCircle, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
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
      }, 1000);
    } catch {
      // Error handled in hook
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      {/* Header */}
      <div className="flex items-center space-x-2 pb-4 border-b border-slate-800 mb-5">
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
          <PlusCircle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Deposit to Wallet</h3>
          <p className="text-xs text-slate-400">Executes SQL Server banking stored procedure</p>
        </div>
      </div>

      {success ? (
        <div className="py-8 text-center flex flex-col items-center animate-fade-in">
          <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 animate-bounce">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h4 className="text-lg font-bold text-white">Deposit Successful!</h4>
          <p className="text-sm text-slate-400 mt-1">
            Wallet balance and audit ledger updated atomically.
          </p>
        </div>
      ) : (
        <form onSubmit={handleTopUp} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Select Amount</label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                    amount === val
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {CurrencyFormatter.formatVND(val)}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Or Enter Custom Amount (VND)</label>
            <input
              type="number"
              min="10000"
              step="10000"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Online Deposit"
              className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              loading={loading}
              className="w-full"
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Deposit {CurrencyFormatter.formatVND(amount)}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
