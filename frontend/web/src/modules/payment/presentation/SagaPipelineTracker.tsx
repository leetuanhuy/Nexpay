import React from 'react';
import { Zap, CheckCircle, RefreshCw, XCircle, Clock } from 'lucide-react';
import type { PaymentOrder } from '../domain/PaymentOrder';
import { Badge } from '../../../shared/Badge';

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

  return (
    <div className="rounded-2xl p-5 bg-slate-900 border border-emerald-500/30 shadow-xl space-y-4 animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Zap className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Saga Execution Pipeline: Order #{order.orderCode}
          </span>
        </div>
        <Badge variant={getBadgeVariant()} pulse={order.status === 'Processing'}>
          {order.status}
        </Badge>
      </div>

      {/* Stepper */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* Step 1 */}
        <div
          className={`p-3 rounded-xl border ${
            sagaStep >= 1
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}
        >
          <div className="flex items-center space-x-2 font-semibold">
            <CheckCircle className="h-4 w-4" />
            <span>1. Order Initiated</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Payment.API created order and published OrderCreatedIntegrationEvent.
          </p>
        </div>

        {/* Step 2 */}
        <div
          className={`p-3 rounded-xl border ${
            sagaStep >= 2
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}
        >
          <div className="flex items-center space-x-2 font-semibold">
            <RefreshCw className={`h-4 w-4 ${sagaStep === 2 ? 'animate-spin' : ''}`} />
            <span>2. RabbitMQ Choreography</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Wallet.API executes sp_DebitWallet with rowlock and publishes outcome.
          </p>
        </div>

        {/* Step 3 */}
        <div
          className={`p-3 rounded-xl border ${
            sagaStep === 3
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : sagaStep === 4
              ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}
        >
          <div className="flex items-center space-x-2 font-semibold">
            {sagaStep === 3 ? (
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            ) : sagaStep === 4 ? (
              <XCircle className="h-4 w-4 text-rose-400" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            <span>3. Finalize Status</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {sagaStep === 3
              ? 'Payment succeeded & balance debited.'
              : sagaStep === 4
              ? `Failed: ${error || order.failureReason || 'Insufficient balance'}`
              : 'Awaiting event confirmation...'}
          </p>
        </div>
      </div>
    </div>
  );
};

