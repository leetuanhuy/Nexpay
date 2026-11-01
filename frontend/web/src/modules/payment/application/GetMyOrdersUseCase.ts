import type { IPaymentRepository } from '../domain/IPaymentRepository';
import type { PaymentOrder } from '../domain/PaymentOrder';

export class GetMyOrdersUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async execute(limit: number = 50): Promise<PaymentOrder[]> {
    return await this.paymentRepository.getMyOrders(limit);
  }
}

