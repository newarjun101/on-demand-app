export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export const ok = <T>(data: T): ApiSuccess<T> => ({ success: true, data });

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(code: string, message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const errors = {
  badRequest: (message = 'Bad request', details?: unknown) =>
    new AppError('BAD_REQUEST', message, 400, details),
  validation: (message = 'Validation failed', details?: unknown) =>
    new AppError('VALIDATION_ERROR', message, 422, details),
  unauthorized: (message = 'Unauthorized') => new AppError('UNAUTHORIZED', message, 401),
  forbidden: (message = 'Forbidden') => new AppError('FORBIDDEN', message, 403),
  notFound: (message = 'Not found') => new AppError('NOT_FOUND', message, 404),
  conflict: (message = 'Conflict') => new AppError('CONFLICT', message, 409),
  tooMany: (message = 'Too many requests') => new AppError('RATE_LIMITED', message, 429),
  internal: (message = 'Internal server error') =>
    new AppError('INTERNAL_ERROR', message, 500),
};