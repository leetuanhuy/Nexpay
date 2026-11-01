import type { User } from './User';
import type { AuthSession } from './AuthSession';

export interface IAuthRepository {
  login(credentials: { email: string; password: string }): Promise<AuthSession>;
  register(payload: { email: string; password: string; fullName: string }): Promise<AuthSession>;
  getCurrentUser(): Promise<User>;
}

