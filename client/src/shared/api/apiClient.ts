import { env } from '@/app/config/env';

import { HttpError, NetworkError, ValidationError } from './ApiError';

import type { z, ZodTypeAny } from 'zod';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type QueryValue = string | number | boolean | readonly string[] | undefined;

type ApiAuthRegistration = {
  getAccessToken: () => string | null;
  onUnauthorized: () => void;
};

let apiAuth: ApiAuthRegistration | null = null;

/**
 * Wired from the app auth layer — attaches Bearer tokens and handles API 401s.
 * Keeps `shared/` free of feature imports.
 */
export function configureApiClientAuth(registration: ApiAuthRegistration | null): void {
  apiAuth = registration;
}

export type RequestOptions<TSchema extends ZodTypeAny> = {
  method?: Method;
  path: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
  headers?: HeadersInit;
  schema: TSchema;
  signal?: AbortSignal;
  /**
   * When set (e.g. login), 401 responses do not run the global unauthorized handler.
   */
  skipUnauthorizedRedirect?: boolean;
};

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const base = env.VITE_API_BASE_URL.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);
  if (query) {
    for (const [key, raw] of Object.entries(query)) {
      if (raw === undefined) continue;
      if (Array.isArray(raw)) {
        for (const item of raw) {
          url.searchParams.append(key, String(item));
        }
      } else {
        url.searchParams.set(key, String(raw));
      }
    }
  }
  return url.toString();
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function mergeAuthHeader(headers: HeadersInit | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (
    headers &&
    typeof headers === 'object' &&
    !Array.isArray(headers) &&
    !(headers instanceof Headers)
  ) {
    Object.assign(out, headers as Record<string, string>);
  }
  const token = apiAuth?.getAccessToken();
  if (token) out.Authorization = `Bearer ${token}`;
  return out;
}

export type MultipartRequestOptions<TSchema extends ZodTypeAny> = {
  path: string;
  query?: Record<string, QueryValue>;
  formData: FormData;
  schema: TSchema;
  signal?: AbortSignal;
  skipUnauthorizedRedirect?: boolean;
};

/**
 * POST `multipart/form-data` (e.g. file upload). Does not set `Content-Type` so the
 * runtime can inject the correct boundary.
 */
export async function apiMultipartRequest<TSchema extends ZodTypeAny>(
  opts: MultipartRequestOptions<TSchema>,
): Promise<z.infer<TSchema>> {
  const { path, query, formData, schema, signal, skipUnauthorizedRedirect = false } = opts;
  const url = buildUrl(path, query);

  const init: RequestInit = {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...mergeAuthHeader(undefined),
    },
    body: formData,
  };
  if (signal !== undefined) init.signal = signal;

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (cause) {
    if (signal?.aborted) throw cause;
    throw new NetworkError(cause, url);
  }

  const text = await response.text();
  const data = text.length > 0 ? safeJson(text) : undefined;

  if (!response.ok) {
    if (
      response.status === 401 &&
      !skipUnauthorizedRedirect &&
      apiAuth !== null
    ) {
      apiAuth.onUnauthorized();
    }
    throw new HttpError(response.status, response.statusText, data, url);
  }

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues, url);
  }
  return parsed.data;
}

export async function apiRequest<TSchema extends ZodTypeAny>(
  opts: RequestOptions<TSchema>,
): Promise<z.infer<TSchema>> {
  const {
    method = 'GET',
    path,
    query,
    body,
    headers,
    schema,
    signal,
    skipUnauthorizedRedirect = false,
  } = opts;
  const url = buildUrl(path, query);

  const init: RequestInit = {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...mergeAuthHeader(headers),
    },
  };
  if (body !== undefined) init.body = JSON.stringify(body);
  if (signal !== undefined) init.signal = signal;

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (cause) {
    if (signal?.aborted) throw cause;
    throw new NetworkError(cause, url);
  }

  const text = await response.text();
  const data = text.length > 0 ? safeJson(text) : undefined;

  if (!response.ok) {
    if (
      response.status === 401 &&
      !skipUnauthorizedRedirect &&
      apiAuth !== null
    ) {
      apiAuth.onUnauthorized();
    }
    throw new HttpError(response.status, response.statusText, data, url);
  }

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues, url);
  }
  return parsed.data;
}
