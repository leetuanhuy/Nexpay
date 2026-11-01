import type { Wallet } from './Wallet';
import type { WalletTransaction } from './WalletTransaction';

export interface IWalletRepository {
  getMyWallet(): Promise<Wallet>;
  credit(amount: number, description?: string): Promise<WalletTransaction>;
  debit(amount: number, description?: string): Promise<WalletTransaction>;
  getTransactions(limit?: number): Promise<WalletTransaction[]>;
}

