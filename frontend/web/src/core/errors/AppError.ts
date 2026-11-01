export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;

  constructor(message: string, code: string = 'GENERIC_ERROR', statusCode?: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Session expired or unauthenticated.') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Unable to connect to Nexpay API Gateway.') {
    super(message, 'NETWORK_ERROR', 0);
  }
}

