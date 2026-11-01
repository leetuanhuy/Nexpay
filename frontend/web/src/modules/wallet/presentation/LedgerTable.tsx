import React from 'react';
import { ArrowDownLeft, ArrowUpRight, FileText, CheckCircle2, Clock } from 'lucide-react';
import type { WalletTransaction } from '../domain/WalletTransaction';
import { CurrencyFormatter, DateFormatter } from '../../../core/utils/formatters';
import { Card } from '../../../shared/Card';

interface LedgerTableProps {
  transactions: WalletTransaction[];
  loading: boolean;
}

export const LedgerTable: React.FC<LedgerTableProps> = ({ transactions, loading }) => {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <FileText className="h-5 w-5 text-emerald-400" />
            <span>Double-Entry Audit Ledger</span>
          </h3>
          <p className="text-xs text-slate-400">
            Immutable transaction history logged by SQL Server Banking Stored Procedures.
          </p>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Total: {transactions.length} record{transactions.length === 1 ? '' : 's'}
        </span>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          <Clock className="h-6 w-6 text-slate-500 animate-spin mx-auto mb-2" />
          <span>Loading ledger transactions...</span>
        </div>
      ) : transactions.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          <CheckCircle2 className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-slate-300">No transactions recorded yet.</p>
          <p className="text-slate-500 mt-1">Top up your wallet or checkout an item to generate ledger records.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Balance Progression</th>
                <th className="py-3 px-3">Reference / Description</th>
                <th className="py-3 px-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {transactions.map((tx) => {
                const isCredit = tx.type === 'Credit';
                return (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`p-1.5 rounded-lg ${
                            isCredit
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-rose-500/15 text-rose-400'
                          }`}
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <span className={`font-semibold ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {tx.type}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`font-bold ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isCredit ? '+' : '-'}{CurrencyFormatter.formatVND(tx.amount)}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-300">
                      <span className="text-slate-400">{CurrencyFormatter.formatVND(tx.balanceBefore)}</span>
                      <span className="text-slate-500 mx-1.5">→</span>
                      <span className="font-semibold text-white">{CurrencyFormatter.formatVND(tx.balanceAfter)}</span>
                    </td>

                    <td className="py-3 px-3 font-sans">
                      <p className="font-semibold text-white text-xs">{tx.description || tx.referenceType}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{tx.referenceType || 'System'}</p>
                    </td>

                    <td className="py-3 px-3 text-right text-slate-400 text-[11px]">
                      {DateFormatter.formatDateTime(tx.createdAtUtc)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

