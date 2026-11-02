import type { IWalletRepository } from '../domain/IWalletRepository';
import type { WalletTransaction } from '../domain/WalletTransaction';
import { ValidationError } from '../../../core/errors/AppError';

export class WithdrawWalletUseCase {
  constructor(private readonly walletRepository: IWalletRepository) {}

  async execute(amount: number, description?: string): Promise<WalletTransaction> {
    if (amount <= 0) {
      throw new ValidationError('Withdrawal amount must be greater than zero.');
    }

    return await this.walletRepository.debit(amount, description || 'ATM / Bank Withdrawal');
  }
}
