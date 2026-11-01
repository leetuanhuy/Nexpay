import type { IAuthRepository } from '../domain/IAuthRepository';
import type { User } from '../domain/User';

export class GetCurrentUserUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(): Promise<User> {
    return await this.authRepository.getCurrentUser();
  }
}
