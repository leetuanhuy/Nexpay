import type { IWalletRepository } from '../domain/IWalletRepository';
import type { Wallet } from '../domain/Wallet';
import type { WalletTransaction } from '../domain/WalletTransaction';
import type { IHttpClient } from '../../../core/http/HttpClient';

export class HttpWalletRepository implements IWalletRepository {
  constructor(private readonly http: IHttpClient) {}

  async getMyWallet(): Promise<Wallet> {
    return await this.http.get<Wallet>('/api/wallets/me');
  }

  async credit(amount: number, description?: string): Promise<WalletTransaction> {
    return await this.http.post<WalletTransaction>('/api/wallets/credit', {
      amount,
      description: description || 'Online Deposit',
    });
  }

  async debit(amount: number, description?: string): Promise<WalletTransaction> {
    return await this.http.post<WalletTransaction>('/api/wallets/debit', {
      amount,
      description: description || 'Payment Debit',
    });
  }

  async getTransactions(limit: number = 50): Promise<WalletTransaction[]> {
    return await this.http.get<WalletTransaction[]>(`/api/wallets/transactions?limit=${limit}`);
  }
}

