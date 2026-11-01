import type { IAuthRepository } from '../domain/IAuthRepository';
import type { AuthSession } from '../domain/AuthSession';
import { ValidationError } from '../../../core/errors/AppError';

export class LoginUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(credentials: { email: string; password: string }): Promise<AuthSession> {
    if (!credentials.email || !credentials.email.includes('@')) {
      throw new ValidationError('A valid email address is required.');
    }
    if (!credentials.password || credentials.password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters.');
    }

    return await this.authRepository.login(credentials);
  }
}
