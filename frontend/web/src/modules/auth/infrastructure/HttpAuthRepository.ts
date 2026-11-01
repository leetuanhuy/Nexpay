import type { IAuthRepository } from '../domain/IAuthRepository';
import type { AuthSession } from '../domain/AuthSession';
import type { User } from '../domain/User';
import type { IHttpClient } from '../../../core/http/HttpClient';
import { TokenStorage } from '../../../core/storage/TokenStorage';

export class HttpAuthRepository implements IAuthRepository {
  constructor(private readonly http: IHttpClient) {}

  async login(credentials: { email: string; password: string }): Promise<AuthSession> {
    const data = await this.http.post<AuthSession>('/api/auth/login', credentials);
    TokenStorage.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  async register(payload: { email: string; password: string; fullName: string }): Promise<AuthSession> {
    const data = await this.http.post<AuthSession>('/api/auth/register', payload);
    TokenStorage.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  async getCurrentUser(): Promise<User> {
    return await this.http.get<User>('/api/auth/me');
  }
}

