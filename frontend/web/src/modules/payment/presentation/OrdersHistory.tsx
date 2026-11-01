import React from 'react';
import { Package, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { PaymentOrder } from '../domain/PaymentOrder';
import { CurrencyFormatter, DateFormatter } from '../../../core/utils/formatters';
import { Card } from '../../../shared/Card';
import { Badge } from '../../../shared/Badge';

interface OrdersHistoryProps {
  orders: PaymentOrder[];
  loading: boolean;
}

export const OrdersHistory: React.FC<OrdersHistoryProps> = ({ orders, loading }) => {
  const getBadgeVariant = (status: string) => {
    switch (status) {
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
    <Card className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Package className="h-5 w-5 text-emerald-400" />
            <span>Orders & Payment History</span>
          </h3>
          <p className="text-xs text-slate-400">
            Orders processed across Payment and Wallet microservices via Saga Choreography.
          </p>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Total: {orders.length} order{orders.length === 1 ? '' : 's'}
        </span>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          <Clock className="h-6 w-6 text-slate-500 animate-spin mx-auto mb-2" />
          <span>Loading orders...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          <Package className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-slate-300">No payment orders placed yet.</p>
          <p className="text-slate-500 mt-1">Visit the Checkout Simulator tab to place test orders.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((ord) => {
            const isCompleted = ord.status === 'Completed';
            const isFailed = ord.status === 'Failed';
            return (
              <div
                key={ord.id}
                className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between hover:bg-slate-800/70 transition"
              >
                <div className="flex items-center space-x-3.5">
                  <div
                    className={`p-2 rounded-xl ${
                      isCompleted
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : isFailed
                        ? 'bg-rose-500/10 text-rose-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : isFailed ? (
                      <XCircle className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5 animate-spin" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-white font-mono">#{ord.orderCode}</h4>
                      <Badge variant={getBadgeVariant(ord.status)} pulse={ord.status === 'Processing'}>
                        {ord.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{ord.description}</p>
                    {ord.failureReason && (
                      <p className="text-[11px] text-rose-400 mt-0.5">Reason: {ord.failureReason}</p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-white font-mono">
                    {CurrencyFormatter.formatVND(ord.amount)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {DateFormatter.formatDateTime(ord.createdAtUtc)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

