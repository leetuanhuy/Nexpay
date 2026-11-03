export type OrderPaymentStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Cancelled';

export interface PaymentOrder {
  readonly id: string;
  readonly orderCode: string;
  readonly userId: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: OrderPaymentStatus;
  readonly orderType?: string;
  readonly paymentMethod?: string;
  readonly qrCodeUrl?: string;
  readonly checkoutUrl?: string;
  readonly expiresAtUtc?: string;
  readonly description?: string;
  readonly failureReason?: string;
  readonly createdAtUtc: string;
  readonly updatedAtUtc?: string;
}

export interface TopUpBankAccount {
  readonly bankName: string;
  readonly bankBin: string;
  readonly accountNumber: string;
  readonly accountName: string;
  readonly transferContent: string;
}

export interface TopUpOrderResponse {
  readonly orderId: string;
  readonly orderCode: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: OrderPaymentStatus;
  readonly paymentMethod: string;
  readonly qrCodeUrl: string;
  readonly bankAccount: TopUpBankAccount;
  readonly expiresAtUtc: string;
}
