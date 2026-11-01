import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  CheckCircle2,
  Clock,
  Search,
  TrendingDown,
  TrendingUp,
  Scale,
} from 'lucide-react';
import type { WalletTransaction } from '../domain/WalletTransaction';
import { CurrencyFormatter, DateFormatter } from '../../../core/utils/formatters';
import { Card } from '../../../shared/Card';

interface LedgerTableProps {
  transactions: WalletTransaction[];
  loading: boolean;
}

export const LedgerTable: React.FC<LedgerTableProps> = ({ transactions, loading }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const totalCredits = transactions
    .filter((t) => t.type === 'Credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebits = transactions
    .filter((t) => t.type === 'Debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredTransactions = transactions.filter((t) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.description.toLowerCase().includes(term) ||
      t.referenceType?.toLowerCase().includes(term) ||
      t.id.toLowerCase().includes(term)
    );
  });

  return (
    <Card className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <FileText className="h-5 w-5" />
            </span>
            <span>Double-Entry Financial Ledger</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable transaction history logged by SQL Server banking stored procedures.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search reference or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition w-64"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800">
            {transactions.length} records
          </span>
        </div>
      </div>

      {/* 3 Metric Cards for Audit */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Inflow */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-emerald-500/20 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block">Total Deposits (Credits)</span>
            <span className="text-base font-black text-emerald-400 font-mono">
              +{CurrencyFormatter.formatVND(totalCredits)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        {/* Total Outflow */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-rose-500/20 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block">Total Debits (Spent)</span>
            <span className="text-base font-black text-rose-400 font-mono">
              -{CurrencyFormatter.formatVND(totalDebits)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
            <TrendingDown className="h-5 w-5" />
          </div>
        </div>

        {/* Net Flow */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-teal-500/20 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block">Net Ledger Delta</span>
            <span className="text-base font-black text-white font-mono">
              {CurrencyFormatter.formatVND(totalCredits - totalDebits)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
            <Scale className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          <Clock className="h-6 w-6 text-emerald-500 animate-spin mx-auto mb-2" />
          <span>Synchronizing immutable records from SQL Server...</span>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
          <CheckCircle2 className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-slate-300">
            {searchTerm ? 'No matching records found' : 'No transactions recorded yet.'}
          </p>
          <p className="text-slate-500 mt-1">
            Top up your wallet or simulate an order to generate audit records.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Balance Progression</th>
                <th className="py-3.5 px-4">Description / Reference</th>
                <th className="py-3.5 px-4 text-right">Timestamp (UTC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono bg-slate-900/40">
              {filteredTransactions.map((tx) => {
                const isCredit = tx.type === 'Credit';
                return (
                  <tr key={tx.id} className="hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4">
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

                    <td className="py-3.5 px-4">
                      <span className={`font-bold ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isCredit ? '+' : '-'}{CurrencyFormatter.formatVND(tx.amount)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="text-slate-400">{CurrencyFormatter.formatVND(tx.balanceBefore)}</span>
                      <span className="text-slate-500 mx-2">→</span>
                      <span className="font-bold text-white">{CurrencyFormatter.formatVND(tx.balanceAfter)}</span>
                    </td>

                    <td className="py-3.5 px-4 font-sans">
                      <p className="font-semibold text-white text-xs">{tx.description || tx.referenceType}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Ref: {tx.referenceType || 'StoredProc: sp_ExecuteDebit'}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-400 text-[11px]">
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
