import type { IPaymentRepository } from '../domain/IPaymentRepository';
import type { PaymentOrder, TopUpOrderResponse } from '../domain/PaymentOrder';
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

  async createTopUpOrder(
    amount: number,
    paymentMethod: string = 'VietQR',
    description?: string
  ): Promise<TopUpOrderResponse> {
    return await this.http.post<TopUpOrderResponse>('/api/payments/topup', {
      amount,
      paymentMethod,
      description: description || 'Nexpay Wallet Deposit via VietQR',
    });
  }

  async simulateWebhook(orderCode: string): Promise<any> {
    return await this.http.post<any>('/api/payments/webhook/simulate', {
      orderCode,
    });
  }

  async getOrderStatus(orderCode: string): Promise<{ orderCode: string; status: string; amount: number }> {
    return await this.http.get<{ orderCode: string; status: string; amount: number }>(
      `/api/payments/status/${orderCode}`
    );
  }
}
