import type { IPaymentRepository } from '../domain/IPaymentRepository';

export class SimulatePaymentWebhookUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async execute(orderCode: string): Promise<any> {
    if (!orderCode || !orderCode.trim()) {
      throw new Error('Order code is required.');
    }
    return await this.paymentRepository.simulateWebhook(orderCode.trim());
  }
}

