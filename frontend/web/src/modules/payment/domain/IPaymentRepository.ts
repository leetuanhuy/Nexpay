import type { PaymentOrder, TopUpOrderResponse } from './PaymentOrder';

export interface IPaymentRepository {
  checkout(amount: number, description?: string): Promise<PaymentOrder>;
  getOrderById(orderId: string): Promise<PaymentOrder>;
  getMyOrders(limit?: number): Promise<PaymentOrder[]>;
  createTopUpOrder(amount: number, paymentMethod?: string, description?: string): Promise<TopUpOrderResponse>;
  simulateWebhook(orderCode: string): Promise<any>;
  getOrderStatus(orderCode: string): Promise<{ orderCode: string; status: string; amount: number }>;
}
