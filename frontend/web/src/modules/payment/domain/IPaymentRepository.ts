import type { PaymentOrder } from './PaymentOrder';

export interface IPaymentRepository {
  checkout(amount: number, description?: string): Promise<PaymentOrder>;
  getOrderById(orderId: string): Promise<PaymentOrder>;
  getMyOrders(limit?: number): Promise<PaymentOrder[]>;
}

