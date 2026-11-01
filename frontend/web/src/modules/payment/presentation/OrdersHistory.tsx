import React, { useState } from 'react';
import { Package, CheckCircle2, XCircle, Clock, AlertCircle, ShoppingBag } from 'lucide-react';
import type { PaymentOrder } from '../domain/PaymentOrder';
import { CurrencyFormatter, DateFormatter } from '../../../core/utils/formatters';
import { Card } from '../../../shared/Card';
import { Badge } from '../../../shared/Badge';

interface OrdersHistoryProps {
  orders: PaymentOrder[];
  loading: boolean;
}

export const OrdersHistory: React.FC<OrdersHistoryProps> = ({ orders, loading }) => {
  const [filter, setFilter] = useState<'All' | 'Completed' | 'Failed' | 'Processing'>('All');

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

  const filteredOrders = orders.filter((o) => {
    if (filter === 'All') return true;
    return o.status === filter;
  });

  const completedCount = orders.filter((o) => o.status === 'Completed').length;
  const failedCount = orders.filter((o) => o.status === 'Failed').length;

  return (
    <Card className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Package className="h-5 w-5" />
            </span>
            <span>Distributed Payment Orders (Saga Records)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Orders orchestrated across Payment.API and Wallet.API with compensation guarantee.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2">
          {(['All', 'Completed', 'Processing', 'Failed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                filter === status
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                  : 'bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Total Orders</span>
          <span className="text-lg font-black text-white font-mono">{orders.length}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-emerald-500 uppercase tracking-wider block font-bold">Completed</span>
          <span className="text-lg font-black text-emerald-400 font-mono">{completedCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-rose-500 uppercase tracking-wider block font-bold">Compensated / Failed</span>
          <span className="text-lg font-black text-rose-400 font-mono">{failedCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-teal-400 uppercase tracking-wider block font-bold">Success Rate</span>
          <span className="text-lg font-black text-teal-300 font-mono">
            {orders.length > 0 ? `${Math.round((completedCount / orders.length) * 100)}%` : '100%'}
          </span>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          <Clock className="h-6 w-6 text-emerald-500 animate-spin mx-auto mb-2" />
          <span>Loading distributed orders...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
          <ShoppingBag className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-slate-300">
            {filter === 'All' ? 'No payment orders placed yet.' : `No ${filter.toLowerCase()} orders found.`}
          </p>
          <p className="text-slate-500 mt-1">Visit the Store tab to simulate purchasing goods via Saga.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((ord) => {
            const isCompleted = ord.status === 'Completed';
            const isFailed = ord.status === 'Failed';
            return (
              <div
                key={ord.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center space-x-3.5">
                  <div
                    className={`p-2.5 rounded-2xl shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : isFailed
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
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
                    <div className="flex items-center space-x-2.5">
                      <h4 className="text-xs font-black text-white font-mono tracking-wider">
                        #{ord.orderCode}
                      </h4>
                      <Badge variant={getBadgeVariant(ord.status)} pulse={ord.status === 'Processing'}>
                        {ord.status}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold text-slate-200 mt-1">{ord.description}</p>
                    {ord.failureReason && (
                      <div className="flex items-center space-x-1.5 text-[11px] text-rose-400 mt-1 font-mono">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>Compensated: {ord.failureReason}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                  <span className="text-base sm:text-lg font-black text-white font-mono">
                    {CurrencyFormatter.formatVND(ord.amount)}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {DateFormatter.formatDateTime(ord.createdAtUtc)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
