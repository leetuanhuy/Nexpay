import type { IPaymentRepository } from '../domain/IPaymentRepository';
import type { PaymentOrder } from '../domain/PaymentOrder';
import { ValidationError } from '../../../core/errors/AppError';

export class GetOrderByIdUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async execute(orderId: string): Promise<PaymentOrder> {
    if (!orderId) {
      throw new ValidationError('OrderId is required.');
    }

    return await this.paymentRepository.getOrderById(orderId);
  }
}
