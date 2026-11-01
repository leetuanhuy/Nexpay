import { useState, useCallback, useMemo } from 'react';
import type { Wallet } from '../domain/Wallet';
import { HttpWalletRepository } from '../infrastructure/HttpWalletRepository';
import { defaultHttpClient } from '../../../core/http/HttpClient';
import { GetMyWalletUseCase } from '../application/GetMyWalletUseCase';
import { TopUpWalletUseCase } from '../application/TopUpWalletUseCase';

export const useWalletViewModel = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { getMyWalletUseCase, topUpWalletUseCase } = useMemo(() => {
    const repo = new HttpWalletRepository(defaultHttpClient);
    return {
      getMyWalletUseCase: new GetMyWalletUseCase(repo),
      topUpWalletUseCase: new TopUpWalletUseCase(repo),
    };
  }, []);

  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyWalletUseCase.execute();
      setWallet(data);
    } catch (err: any) {
      if (err.statusCode !== 401) {
        setError(err.message || 'Unable to fetch wallet details.');
      }
    } finally {
      setLoading(false);
    }
  }, [getMyWalletUseCase]);

  const topUp = async (amount: number, description?: string) => {
    try {
      setLoading(true);
      setError(null);
      const tx = await topUpWalletUseCase.execute(amount, description);
      await fetchWallet();
      return tx;
    } catch (err: any) {
      setError(err.message || 'Top-up failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    wallet,
    loading,
    error,
    fetchWallet,
    topUp,
    clearError: () => setError(null),
  };
};
