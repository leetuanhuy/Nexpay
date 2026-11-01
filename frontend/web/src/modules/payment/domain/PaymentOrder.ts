export type OrderPaymentStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed';

export interface PaymentOrder {
  readonly id: string;
  readonly orderCode: string;
  readonly userId: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: OrderPaymentStatus;
  readonly description?: string;
  readonly failureReason?: string;
  readonly createdAtUtc: string;
  readonly completedAtUtc?: string;
}
