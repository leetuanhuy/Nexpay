import type { IWalletRepository } from '../domain/IWalletRepository';
import type { WalletTransaction } from '../domain/WalletTransaction';

export class GetTransactionsUseCase {
  constructor(private readonly walletRepository: IWalletRepository) {}

  async execute(limit: number = 50): Promise<WalletTransaction[]> {
    return await this.walletRepository.getTransactions(limit);
  }
}

