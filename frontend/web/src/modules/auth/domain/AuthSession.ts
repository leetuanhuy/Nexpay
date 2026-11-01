export interface AuthSession {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
}
