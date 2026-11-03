import type { IPaymentRepository } from '../domain/IPaymentRepository';
import type { TopUpOrderResponse } from '../domain/PaymentOrder';

export class CreateTopUpOrderUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async execute(amount: number, method: string = 'VietQR', description?: string): Promise<TopUpOrderResponse> {
    if (amount <= 0) {
      throw new Error('Top-up amount must be greater than zero.');
    }
    if (amount < 10000) {
      throw new Error('Minimum top-up amount is 10,000 VND.');
    }
    return await this.paymentRepository.createTopUpOrder(amount, method, description);
  }
}

