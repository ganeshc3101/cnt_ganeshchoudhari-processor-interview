import { HttpError, NetworkError } from '@/shared/api/ApiError';

function apiMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const msg = (body as { message?: unknown }).message;
  return typeof msg === 'string' && msg.length > 0 ? msg : null;
}

export function userFacingApiMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpError) {
    if (error.status >= 500) return 'The server is unavailable. Try again later.';
    if (error.status === 401) return apiMessage(error.body) ?? 'Your session expired. Sign in again.';
    return apiMessage(error.body) ?? fallback;
  }
  if (error instanceof NetworkError) {
    return 'Network error. Check your connection and try again.';
  }
  return fallback;
}

export function loginErrorMessage(error: unknown): string {
  if (error instanceof HttpError && error.status === 401) {
    return apiMessage(error.body) ?? 'Invalid credentials.';
  }
  return userFacingApiMessage(error, 'Sign-in failed.');
}
