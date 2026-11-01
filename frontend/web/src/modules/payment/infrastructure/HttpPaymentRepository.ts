import type { IPaymentRepository } from '../domain/IPaymentRepository';
import type { PaymentOrder } from '../domain/PaymentOrder';
import type { IHttpClient } from '../../../core/http/HttpClient';

export class HttpPaymentRepository implements IPaymentRepository {
  constructor(private readonly http: IHttpClient) {}

  async checkout(amount: number, description?: string): Promise<PaymentOrder> {
    return await this.http.post<PaymentOrder>('/api/payments/checkout', {
      amount,
      description: description || 'E-Commerce Order Checkout',
      currency: 'VND',
    });
  }

  async getOrderById(orderId: string): Promise<PaymentOrder> {
    return await this.http.get<PaymentOrder>(`/api/payments/${orderId}`);
  }

  async getMyOrders(limit: number = 50): Promise<PaymentOrder[]> {
    return await this.http.get<PaymentOrder[]>(`/api/payments/my-orders?limit=${limit}`);
  }
}

