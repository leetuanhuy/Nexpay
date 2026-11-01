import type { IAuthRepository } from '../domain/IAuthRepository';
import type { AuthSession } from '../domain/AuthSession';
import { ValidationError } from '../../../core/errors/AppError';

export class RegisterUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(payload: { email: string; password: string; fullName: string }): Promise<AuthSession> {
    if (!payload.fullName || payload.fullName.trim().length === 0) {
      throw new ValidationError('Full name is required.');
    }
    if (!payload.email || !payload.email.includes('@')) {
      throw new ValidationError('A valid email address is required.');
    }
    if (!payload.password || payload.password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters.');
    }

    return await this.authRepository.register(payload);
  }
}
