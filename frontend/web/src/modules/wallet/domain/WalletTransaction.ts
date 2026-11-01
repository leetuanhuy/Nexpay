export type TransactionType = 'Credit' | 'Debit';

export interface WalletTransaction {
  readonly id: string;
  readonly walletId: string;
  readonly amount: number;
  readonly type: TransactionType;
  readonly balanceBefore: number;
  readonly balanceAfter: number;
  readonly referenceId?: string;
  readonly referenceType?: string;
  readonly description: string;
  readonly createdAtUtc: string;
}

