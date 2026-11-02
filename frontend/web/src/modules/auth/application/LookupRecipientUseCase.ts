import type { IAuthRepository, RecipientInfo } from '../domain/IAuthRepository';
import { ValidationError } from '../../../core/errors/AppError';

export class LookupRecipientUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(query: string): Promise<RecipientInfo> {
    if (!query || !query.trim()) {
      throw new ValidationError('Search query cannot be empty.');
    }

    return await this.authRepository.lookup(query.trim());
  }
}

