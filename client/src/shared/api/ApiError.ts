export class ApiError extends Error {
  override readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'ApiError';
    if (cause !== undefined) this.cause = cause;
  }
}

export class HttpError extends ApiError {
  constructor(
    readonly status: number,
    readonly statusText: string,
    readonly body: unknown,
    readonly url: string,
  ) {
    super(`HTTP ${status} ${statusText} — ${url}`);
    this.name = 'HttpError';
  }
}

export class NetworkError extends ApiError {
  constructor(
    cause: unknown,
    readonly url: string,
  ) {
    super(`Network failure — ${url}`, cause);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends ApiError {
  constructor(
    readonly issues: unknown,
    readonly url: string,
  ) {
    super(`Response validation failed — ${url}`);
    this.name = 'ValidationError';
  }
}
