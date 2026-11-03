import React, { useState, useEffect, useRef } from 'react';
import {
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Copy,
  Check,
  Clock,
  Sparkles,
  RefreshCw,
  Zap,
  Building2,
} from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import { Button } from '../../../shared/Button';
import { CurrencyFormatter } from '../../../core/utils/formatters';
import { useWalletViewModel } from './useWalletViewModel';
import { HttpPaymentRepository } from '../../payment/infrastructure/HttpPaymentRepository';
import { CreateTopUpOrderUseCase } from '../../payment/application/CreateTopUpOrderUseCase';
import { SimulatePaymentWebhookUseCase } from '../../payment/application/SimulatePaymentWebhookUseCase';
import { defaultHttpClient } from '../../../core/http/HttpClient';
import type { TopUpOrderResponse } from '../../payment/domain/PaymentOrder';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

export const TopUpModal: React.FC<TopUpModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'form' | 'vietqr' | 'success'>('form');
  const [amount, setAmount] = useState<number>(100000);
  const [description, setDescription] = useState<string>('Online Wallet Deposit');
  const [method, setMethod] = useState<'vietqr' | 'instant'>('vietqr');
  const [topUpData, setTopUpData] = useState<TopUpOrderResponse | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 mins in seconds

  const { topUp, loading } = useWalletViewModel();
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize repository & use cases
  const paymentRepo = new HttpPaymentRepository(defaultHttpClient);
  const createTopUpUseCase = new CreateTopUpOrderUseCase(paymentRepo);
  const simulateWebhookUseCase = new SimulatePaymentWebhookUseCase(paymentRepo);

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setTopUpData(null);
      setActionError(null);
      setTimeLeft(900);
    } else {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    }
  }, [isOpen]);

  // Timer countdown for VietQR
  useEffect(() => {
    if (step !== 'vietqr') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  // Polling fallback while waiting for Webhook IPN
  useEffect(() => {
    if (step !== 'vietqr' || !topUpData) return;

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await paymentRepo.getOrderStatus(topUpData.orderCode);
        if (res.status === 'Completed') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setStep('success');
          onSuccess?.();
        }
      } catch {
        // Ignore polling errors
      }
    }, 3000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [step, topUpData, onSuccess]);

  if (!isOpen) return null;

  const handleCopy = (field: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (amount < 10000) {
      setActionError('Minimum deposit amount is 10,000 VND.');
      return;
    }

    if (method === 'instant') {
      try {
        await topUp(amount, description);
        setStep('success');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      } catch (err: any) {
        setActionError(err.message || 'Deposit failed');
      }
    } else {
      // Create real VietQR Top-Up order
      try {
        const res = await createTopUpUseCase.execute(amount, 'VietQR', description);
        setTopUpData(res);
        setStep('vietqr');
      } catch (err: any) {
        setActionError(err.message || 'Failed to create VietQR deposit order');
      }
    }
  };

  const handleSimulateWebhook = async () => {
    if (!topUpData) return;
    setSimulating(true);
    setActionError(null);
    try {
      await simulateWebhookUseCase.execute(topUpData.orderCode);
      // Wait a moment for RabbitMQ & SignalR to settle
      setTimeout(() => {
        setSimulating(false);
        setStep('success');
        onSuccess?.();
      }, 1000);
    } catch (err: any) {
      setSimulating(false);
      setActionError(err.message || 'Simulation failed');
    }
  };

  const formatMinutes = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth={step === 'vietqr' ? 'lg' : 'md'}>
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800 mb-5">
        <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <PlusCircle className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Deposit Funds to Wallet</h3>
          <p className="text-xs text-slate-400">
            {step === 'vietqr'
              ? 'Scan VietQR Napas 247 with any banking app'
              : 'Atomic settlement with Webhook IPN & HMAC-SHA256 signature'}
          </p>
        </div>
      </div>

      {actionError && (
        <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* STEP 1: FORM */}
      {step === 'form' && (
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Method Selection Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Select Deposit Method</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setMethod('vietqr')}
                className={`p-3 rounded-2xl border text-left transition flex items-start space-x-3 cursor-pointer ${
                  method === 'vietqr'
                    ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    method === 'vietqr' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-white">VietQR Napas 247</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Real/Sandbox
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Scan via MBBank, VCB, Momo, Techcombank with live Webhook IPN
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMethod('instant')}
                className={`p-3 rounded-2xl border text-left transition flex items-start space-x-3 cursor-pointer ${
                  method === 'instant'
                    ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    method === 'instant' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-white">Instant Demo</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Dev Fast
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Direct stored procedure execution for fast UI testing</p>
                </div>
              </button>
            </div>
          </div>

          {/* Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Select Amount</label>
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
                placeholder="Enter deposit amount"
                required
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold">VND</span>
            </div>
          </div>

          {/* Reference Note */}
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
            <span>
              {method === 'vietqr'
                ? 'Secured with HMAC-SHA256 signature verification & idempotent webhook processing.'
                : 'Atomic stored procedure execution with row-level locks.'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <Button type="button" onClick={onClose} variant="ghost" size="md">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || amount < 10000}
              variant="primary"
              size="md"
              icon={<ArrowRight className="h-4 w-4" />}
            >
              {method === 'vietqr' ? `Generate VietQR (${CurrencyFormatter.formatVND(amount)})` : `Deposit Now`}
            </Button>
          </div>
        </form>
      )}

      {/* STEP 2: VIETQR LIVE PAYMENT SCREEN */}
      {step === 'vietqr' && topUpData && (
        <div className="space-y-5 animate-fade-in">
          {/* Status Bar */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center space-x-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-emerald-400">Awaiting Bank Transfer via Webhook IPN</span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-slate-300">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{formatMinutes(timeLeft)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
            {/* QR Card */}
            <div className="flex flex-col items-center p-4 rounded-3xl bg-white text-slate-900 border border-slate-200 shadow-2xl">
              <img
                src={topUpData.qrCodeUrl}
                alt="VietQR Deposit Code"
                className="w-56 h-56 rounded-2xl object-contain"
              />
              <div className="mt-2.5 text-center">
                <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  {topUpData.bankAccount.bankName}
                </span>
                <p className="text-sm font-black text-emerald-600 font-mono">
                  {CurrencyFormatter.formatVND(topUpData.amount)}
                </p>
              </div>
            </div>

            {/* Bank Transfer Details */}
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">Beneficiary Bank</span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-bold text-white">
                    <Building2 className="h-4 w-4 text-emerald-400" />
                    <span>{topUpData.bankAccount.bankName}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    BIN: {topUpData.bankAccount.bankBin}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">Account Number</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-white text-sm">
                    {topUpData.bankAccount.accountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy('acc', topUpData.bankAccount.accountNumber)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                    title="Copy Account Number"
                  >
                    {copiedField === 'acc' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">Account Name</span>
                <p className="font-bold text-white uppercase">{topUpData.bankAccount.accountName}</p>
              </div>

              {/* Transfer Content - Important */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-amber-400 font-bold">
                  <span>Required Transfer Note</span>
                  <span className="text-[10px]">Must match exactly</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-amber-300 text-sm tracking-wide">
                    {topUpData.bankAccount.transferContent}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy('note', topUpData.bankAccount.transferContent)}
                    className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition cursor-pointer"
                    title="Copy Transfer Note"
                  >
                    {copiedField === 'note' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sandbox Webhook Simulation Button */}
          <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleSimulateWebhook}
              disabled={simulating}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer"
              title="Dispatches authentic HMAC-SHA256 signed webhook for sandbox/testing"
            >
              {simulating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Signing HMAC-SHA256 Webhook...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                  <span>🧪 Simulate Bank Payment (Sandbox Webhook)</span>
                </>
              )}
            </button>

            <div className="flex items-center space-x-2">
              <Button type="button" onClick={() => setStep('form')} variant="ghost" size="sm">
                Change Amount
              </Button>
              <Button type="button" onClick={onClose} variant="secondary" size="sm">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: SUCCESS */}
      {step === 'success' && (
        <div className="py-8 text-center flex flex-col items-center animate-fade-in space-y-3">
          <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center animate-bounce">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h4 className="text-lg font-black text-white">Deposit Confirmed!</h4>
          <p className="text-xs text-slate-400 max-w-xs">
            +{CurrencyFormatter.formatVND(amount)} has been verified via Webhook IPN and credited atomically to your
            wallet ledger.
          </p>
          <div className="pt-4">
            <Button
              type="button"
              onClick={() => {
                onSuccess?.();
                onClose();
              }}
              variant="primary"
              size="md"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
