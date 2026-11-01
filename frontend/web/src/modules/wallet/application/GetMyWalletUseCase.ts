import type { IWalletRepository } from '../domain/IWalletRepository';
import type { Wallet } from '../domain/Wallet';

export class GetMyWalletUseCase {
  constructor(private readonly walletRepository: IWalletRepository) {}

  async execute(): Promise<Wallet> {
    return await this.walletRepository.getMyWallet();
  }
}
