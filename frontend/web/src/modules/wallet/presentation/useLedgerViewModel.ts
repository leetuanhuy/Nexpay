import { useState, useCallback, useMemo } from 'react';
import type { WalletTransaction } from '../domain/WalletTransaction';
import { HttpWalletRepository } from '../infrastructure/HttpWalletRepository';
import { defaultHttpClient } from '../../../core/http/HttpClient';
import { GetTransactionsUseCase } from '../application/GetTransactionsUseCase';

export const useLedgerViewModel = () => {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getTransactionsUseCase = useMemo(() => {
    const repo = new HttpWalletRepository(defaultHttpClient);
    return new GetTransactionsUseCase(repo);
  }, []);

  const fetchTransactions = useCallback(async (limit: number = 50) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTransactionsUseCase.execute(limit);
      setTransactions(data);
    } catch (err: any) {
      if (err.statusCode !== 401) {
        setError(err.message || 'Unable to load transaction ledger.');
      }
    } finally {
      setLoading(false);
    }
  }, [getTransactionsUseCase]);

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
  };
};

