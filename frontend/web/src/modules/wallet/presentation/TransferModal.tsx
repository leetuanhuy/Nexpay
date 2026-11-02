import React, { useState, useEffect } from 'react';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  UserCheck,
  Search,
  History,
  ShieldCheck,
  ClipboardPaste,
} from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import { Button } from '../../../shared/Button';
import { CurrencyFormatter } from '../../../core/utils/formatters';
import { useWalletViewModel } from './useWalletViewModel';
import { HttpAuthRepository } from '../../auth/infrastructure/HttpAuthRepository';
import { defaultHttpClient } from '../../../core/http/HttpClient';
import { LookupRecipientUseCase } from '../../auth/application/LookupRecipientUseCase';
import type { RecipientInfo } from '../../auth/domain/IAuthRepository';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  currentBalance?: number;
  initialRecipient?: RecipientInfo;
  initialAmount?: number;
  onSuccess?: () => void;
}

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];
const RECENT_KEY = 'nexpay_recent_recipients';

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
  currentBalance = 0,
  initialRecipient,
  initialAmount,
  onSuccess,
}) => {
  const [query, setQuery] = useState<string>('');
  const [recipient, setRecipient] = useState<RecipientInfo | null>(null);
  const [lookingUp, setLookingUp] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(initialAmount || 50000);
  const [description, setDescription] = useState<string>('P2P Wallet Transfer');
  const [success, setSuccess] = useState<boolean>(false);
  const [recentContacts, setRecentContacts] = useState<RecipientInfo[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const { transfer, loading, error } = useWalletViewModel();

  useEffect(() => {
    if (initialRecipient) {
      setRecipient(initialRecipient);
      setQuery(initialRecipient.email);
    }
    if (initialAmount) {
      setAmount(initialAmount);
    }
  }, [initialRecipient, initialAmount]);

  if (!isOpen) return null;

  const handleLookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    try {
      setLookingUp(true);
      setLookupError(null);
      const authRepo = new HttpAuthRepository(defaultHttpClient);
      const useCase = new LookupRecipientUseCase(authRepo);
      const res = await useCase.execute(query);

      if (currentUserId && res.id.toLowerCase() === currentUserId.toLowerCase()) {
        setLookupError('You cannot transfer money to your own wallet.');
        setRecipient(null);
        return;
      }

      setRecipient(res);
    } catch (err: any) {
      setLookupError(err.message || 'Recipient not found. Check email or User ID.');
      setRecipient(null);
    } finally {
      setLookingUp(false);
    }
  };

  const selectRecent = (contact: RecipientInfo) => {
    setRecipient(contact);
    setQuery(contact.email);
    setLookupError(null);
  };

  const handleParseQrOrLink = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) return;

      let emailOrId = text.trim();
      let transferAmount: number | null = null;
      let transferNote: string | null = null;

      // Check if JSON QR payload
      if (text.startsWith('{') && text.includes('nexpay')) {
        try {
          const parsed = JSON.parse(text);
          emailOrId = parsed.receiverEmail || parsed.receiverId;
          if (parsed.amount) transferAmount = Number(parsed.amount);
          if (parsed.note) transferNote = parsed.note;
        } catch {
          // ignore
        }
      } else if (text.includes('transferTo=')) {
        try {
          const url = new URL(text);
          const to = url.searchParams.get('transferTo');
          const amt = url.searchParams.get('amount');
          if (to) emailOrId = to;
          if (amt) transferAmount = Number(amt);
        } catch {
          // ignore
        }
      }

      setQuery(emailOrId);
      if (transferAmount) setAmount(transferAmount);
      if (transferNote) setDescription(transferNote);

      setLookingUp(true);
      setLookupError(null);
      const authRepo = new HttpAuthRepository(defaultHttpClient);
      const useCase = new LookupRecipientUseCase(authRepo);
      const res = await useCase.execute(emailOrId);

      if (currentUserId && res.id.toLowerCase() === currentUserId.toLowerCase()) {
        setLookupError('You cannot transfer money to your own wallet.');
        setRecipient(null);
      } else {
        setRecipient(res);
      }
    } catch (err: any) {
      setLookupError('Unable to parse clipboard: ' + (err.message || 'Check clipboard.'));
    } finally {
      setLookingUp(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient) return;

    try {
      await transfer(recipient.id, amount, description);
      
      // Save to recent contacts
      const updated = [recipient, ...recentContacts.filter((c) => c.id !== recipient.id)].slice(0, 5);
      setRecentContacts(updated);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
        onClose();
      }, 1500);
    } catch {
      // Handled in VM
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800 mb-5">
        <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
          <Send className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Peer-to-Peer (P2P) Wallet Transfer</h3>
          <p className="text-xs text-slate-400">Atomic double-entry transaction via sp_TransferWallet</p>
        </div>
      </div>

      {success ? (
        <div className="py-8 text-center flex flex-col items-center animate-fade-in space-y-3">
          <div className="h-16 w-16 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center animate-bounce">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h4 className="text-lg font-black text-white">Transfer Completed!</h4>
          <p className="text-xs text-slate-400 max-w-xs">
            Successfully transferred{' '}
            <span className="font-bold text-teal-400 font-mono">
              {CurrencyFormatter.formatVND(amount)}
            </span>{' '}
            to <span className="font-bold text-white">{recipient?.fullName}</span>.
          </p>
        </div>
      ) : (
        <form onSubmit={handleTransfer} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Available Balance info */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Your Available Balance:</span>
            <span className="font-mono font-bold text-emerald-400">
              {CurrencyFormatter.formatVND(currentBalance)}
            </span>
          </div>

          {/* Step 1: Find Recipient */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Recipient Email or User ID
              </label>
              <button
                type="button"
                onClick={handleParseQrOrLink}
                className="text-[11px] text-teal-400 hover:text-teal-300 transition flex items-center space-x-1 cursor-pointer font-medium"
                title="Paste QR payload, Link, or Email from clipboard"
              >
                <ClipboardPaste className="h-3.5 w-3.5" />
                <span>Paste QR / Link</span>
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (recipient && e.target.value !== recipient.email) {
                      setRecipient(null);
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500 transition"
                  placeholder="e.g. user@nexpay.vn or GUID"
                  required
                />
              </div>
              <Button
                type="button"
                onClick={handleLookup}
                disabled={lookingUp || !query.trim()}
                variant="secondary"
                size="md"
                className="shrink-0"
                icon={<Search className="h-4 w-4" />}
              >
                {lookingUp ? 'Finding...' : 'Check'}
              </Button>
            </div>

            {lookupError && (
              <p className="text-[11px] text-rose-400 mt-1.5 flex items-center space-x-1">
                <AlertCircle className="h-3 w-3 inline" />
                <span>{lookupError}</span>
              </p>
            )}

            {/* Recipient Verified Card */}
            {recipient && (
              <div className="mt-2.5 p-3 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between animate-fade-in">
                <div className="flex items-center space-x-3">
                  <div className="h-9 w-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-sm">
                    {recipient.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-white">{recipient.fullName}</span>
                      <UserCheck className="h-3.5 w-3.5 text-teal-400" />
                    </div>
                    <span className="text-[11px] text-slate-400">{recipient.email}</span>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300">
                  Verified
                </span>
              </div>
            )}
          </div>

          {/* Recent Contacts quick click */}
          {recentContacts.length > 0 && !recipient && (
            <div>
              <span className="text-[11px] text-slate-500 flex items-center space-x-1 mb-1.5">
                <History className="h-3 w-3" />
                <span>Recent Recipients:</span>
              </span>
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin">
                {recentContacts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectRecent(c)}
                    className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white transition flex items-center space-x-1.5 shrink-0 cursor-pointer"
                  >
                    <div className="h-4 w-4 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-[10px] font-bold">
                      {c.fullName.charAt(0)}
                    </div>
                    <span>{c.fullName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amount Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Select Amount</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {PRESET_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`py-2 px-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    amount === val
                      ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-md shadow-teal-500/20'
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
                min="1000"
                step="1000"
                value={amount}
                onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-sm focus:outline-none focus:border-teal-500 transition"
                placeholder="Enter transfer amount"
                required
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold">VND</span>
            </div>
          </div>

          {/* Transfer Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Transfer Note</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-teal-500 transition"
              placeholder="e.g. Lunch split, Coffee, Rent"
              required
            />
          </div>

          {/* Deadlock Protection Guarantee */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center space-x-2 text-[11px] text-slate-400">
            <ShieldCheck className="h-4 w-4 text-teal-400 shrink-0" />
            <span>Monotonic lock ordering guarantees zero deadlocks under high concurrency.</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <Button type="button" onClick={onClose} variant="ghost" size="md">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !recipient || amount <= 0 || amount > currentBalance}
              variant="primary"
              size="md"
              className="bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold"
              icon={<ArrowRight className="h-4 w-4" />}
            >
              {loading ? 'Processing Transfer...' : `Send ${CurrencyFormatter.formatVND(amount)}`}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
