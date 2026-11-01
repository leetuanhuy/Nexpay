import type { IPaymentRepository } from '../domain/IPaymentRepository';
import type { PaymentOrder } from '../domain/PaymentOrder';
import { ValidationError } from '../../../core/errors/AppError';

export class CheckoutOrderUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async execute(amount: number, description?: string): Promise<PaymentOrder> {
    if (amount <= 0) {
      throw new ValidationError('Checkout order amount must be greater than zero.');
    }

    return await this.paymentRepository.checkout(amount, description || 'E-Commerce Checkout');
  }
}

