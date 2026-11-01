export type WalletStatus = 'Active' | 'Suspended' | 'Closed';

export interface Wallet {
  readonly id: string;
  readonly userId: string;
  readonly balance: number;
  readonly currency: string;
  readonly status: WalletStatus;
  readonly createdAtUtc: string;
  readonly updatedAtUtc?: string;
}

