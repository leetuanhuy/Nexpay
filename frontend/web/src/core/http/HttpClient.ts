import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { TokenStorage } from '../storage/TokenStorage';
import { UnauthorizedError, AppError, NetworkError } from '../errors/AppError';

export interface IHttpClient {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
}

export class AxiosHttpClient implements IHttpClient {
  private readonly client: AxiosInstance;

  constructor(baseURL: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request Interceptor: Attach JWT token and unique Correlation ID for distributed tracing
    this.client.interceptors.request.use((config) => {
      const token = TokenStorage.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // X-Correlation-ID header matching Gateway and microservices middleware
      config.headers['X-Correlation-ID'] = `fe-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      return config;
    });

    // Response Interceptor: Normalize errors into AppError domain instances
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (!error.response) {
          throw new NetworkError('Unable to connect to Nexpay API Gateway. Please check if services are running.');
        }

        const status = error.response.status;
        const data = error.response.data;

        if (status === 401) {
          TokenStorage.clear();
          window.dispatchEvent(new Event('nexpay_auth_logout'));
          throw new UnauthorizedError(data?.error || 'Authentication session has expired.');
        }

        const message =
          data?.error ||
          (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
          error.message ||
          'An unexpected server error occurred.';

        throw new AppError(message, 'API_ERROR', status);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }
}

// Global singleton instance for app-wide use
export const defaultHttpClient = new AxiosHttpClient();

