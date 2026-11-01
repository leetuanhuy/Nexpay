export class TokenStorage {
  private static readonly ACCESS_TOKEN_KEY = 'nexpay_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'nexpay_refresh_token';

  static getAccessToken(): string | null {
    try {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  static setTokens(accessToken: string, refreshToken?: string): void {
    try {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch {
      // Storage access blocked or restricted
    }
  }

  static clear(): void {
    try {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    } catch {
      // Storage access blocked
    }
  }
}
