import type { Wallet } from './Wallet';
import type { WalletTransaction } from './WalletTransaction';

export interface WalletTransferResult {
  readonly senderTransactionId: string;
  readonly receiverTransactionId: string;
  readonly senderWalletId: string;
  readonly receiverWalletId: string;
  readonly amount: number;
  readonly senderBalanceBefore: number;
  readonly senderBalanceAfter: number;
  readonly receiverBalanceBefore: number;
  readonly receiverBalanceAfter: number;
  readonly createdAtUtc: string;
}

export interface IWalletRepository {
  getMyWallet(): Promise<Wallet>;
  credit(amount: number, description?: string): Promise<WalletTransaction>;
  debit(amount: number, description?: string): Promise<WalletTransaction>;
  transfer(receiverUserId: string, amount: number, description?: string): Promise<WalletTransferResult>;
  getTransactions(limit?: number): Promise<WalletTransaction[]>;
}
