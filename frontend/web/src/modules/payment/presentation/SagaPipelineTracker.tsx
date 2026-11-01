import React from 'react';
import { Zap, CheckCircle2, RefreshCw, XCircle, Clock, Server } from 'lucide-react';
import type { PaymentOrder } from '../domain/PaymentOrder';
import { Badge } from '../../../shared/Badge';
import { CurrencyFormatter } from '../../../core/utils/formatters';

interface SagaPipelineTrackerProps {
  order: PaymentOrder;
  sagaStep: number;
  error?: string | null;
}

export const SagaPipelineTracker: React.FC<SagaPipelineTrackerProps> = ({
  order,
  sagaStep,
  error,
}) => {
  const getBadgeVariant = () => {
    switch (order.status) {
      case 'Completed':
        return 'success';
      case 'Failed':
        return 'danger';
      case 'Processing':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  const isFailed = order.status === 'Failed' || sagaStep === 4;
  const isCompleted = order.status === 'Completed' || sagaStep === 3;
  const isProcessing = order.status === 'Processing' && !isCompleted && !isFailed;

  return (
    <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-[#0d1627] to-slate-900 border border-emerald-500/40 shadow-2xl shadow-emerald-950/20 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-black text-white font-mono">
                Order #{order.orderCode}
              </span>
              <Badge variant={getBadgeVariant()} pulse={isProcessing}>
                {order.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {order.description} • Amount:{' '}
              <strong className="text-emerald-400 font-mono">
                {CurrencyFormatter.formatVND(order.amount)}
              </strong>
            </p>
          </div>
        </div>

        {/* Microservices Tag */}
        <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800">
          <Server className="h-3.5 w-3.5 text-teal-400" />
          <span>Payment.API ↔ RabbitMQ ↔ Wallet.API</span>
        </div>
      </div>

      {/* Interactive 3-Stage Pipeline Stepper */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Step 1: Payment Initiated */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-300 ${
            sagaStep >= 1
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
              : 'bg-slate-950/40 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between font-bold mb-2">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>1. Order Initiated</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded">
              Payment.API
            </span>
          </div>
          <p className="text-[11px] text-slate-300/80 leading-relaxed">
            Record created in SQL Server. Emitted{' '}
            <code className="text-emerald-300 font-mono text-[10px]">OrderCreatedIntegrationEvent</code> to RabbitMQ.
          </p>
        </div>

        {/* Step 2: RabbitMQ Choreography & Wallet Debit */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-300 ${
            sagaStep >= 2
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
              : 'bg-slate-950/40 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between font-bold mb-2">
            <div className="flex items-center space-x-2">
              {sagaStep === 2 ? (
                <RefreshCw className="h-4 w-4 text-amber-400 animate-spin" />
              ) : sagaStep > 2 ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <Clock className="h-4 w-4 text-slate-500" />
              )}
              <span>2. RabbitMQ Choreography</span>
            </div>
            <span className="text-[10px] font-mono text-teal-400/80 bg-teal-500/10 px-2 py-0.5 rounded">
              Wallet.API
            </span>
          </div>
          <p className="text-[11px] text-slate-300/80 leading-relaxed">
            Wallet consumer executed{' '}
            <code className="text-teal-300 font-mono text-[10px]">sp_DebitWallet</code> with rowlock. Outcome returned to bus.
          </p>
        </div>

        {/* Step 3: Saga Outcome Finalized */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-300 ${
            isCompleted
              ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200'
              : isFailed
              ? 'bg-rose-500/15 border-rose-500/50 text-rose-200'
              : 'bg-slate-950/40 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between font-bold mb-2">
            <div className="flex items-center space-x-2">
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : isFailed ? (
                <XCircle className="h-4 w-4 text-rose-400" />
              ) : (
                <Clock className="h-4 w-4 text-slate-500" />
              )}
              <span>3. Saga Outcome</span>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                isCompleted
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : isFailed
                  ? 'text-rose-400 bg-rose-500/10'
                  : 'text-slate-400 bg-slate-800'
              }`}
            >
              {isCompleted ? 'SUCCESS' : isFailed ? 'COMPENSATED' : 'WAITING'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300/80 leading-relaxed">
            {isCompleted && 'Payment succeeded. Double-entry ledger debited.'}
            {isFailed && (
              <span className="text-rose-300 font-medium">
                {error || order.failureReason || 'Failed: Insufficient balance. Saga transaction compensated.'}
              </span>
            )}
            {!isCompleted && !isFailed && 'Awaiting transaction finalization event...'}
          </p>
        </div>
      </div>
    </div>
  );
};
