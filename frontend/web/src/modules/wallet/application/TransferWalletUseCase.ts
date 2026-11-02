import type { IWalletRepository, WalletTransferResult } from '../domain/IWalletRepository';
import { ValidationError } from '../../../core/errors/AppError';

export class TransferWalletUseCase {
  constructor(private readonly walletRepository: IWalletRepository) {}

  async execute(receiverUserId: string, amount: number, description?: string): Promise<WalletTransferResult> {
    if (!receiverUserId) {
      throw new ValidationError('Recipient user is required.');
    }

    if (amount <= 0) {
      throw new ValidationError('Transfer amount must be greater than zero.');
    }

    return await this.walletRepository.transfer(
      receiverUserId,
      amount,
      description || 'P2P Wallet Transfer'
    );
  }
}

