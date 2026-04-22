
import { env } from '@/app/config/env';

import { HttpError, NetworkError, ValidationError } from './ApiError';

import type { z, ZodTypeAny } from 'zod';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type QueryValue = string | number | boolean | undefined;

export type RequestOptions<TSchema extends ZodTypeAny> = {
  method?: Method;
  path: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
  headers?: HeadersInit;
  schema: TSchema;
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(path.replace(/^\//, ''), env.VITE_API_BASE_URL);
  if (query) {
    for (const [key, raw] of Object.entries(query)) {
      if (raw !== undefined) url.searchParams.set(key, String(raw));
    }
  }
  return url.toString();
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest<TSchema extends ZodTypeAny>(
  opts: RequestOptions<TSchema>,
): Promise<z.infer<TSchema>> {
  const { method = 'GET', path, query, body, headers, schema, signal } = opts;
  const url = buildUrl(path, query);

  const init: RequestInit = {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
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
    throw new HttpError(response.status, response.statusText, data, url);
  }

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues, url);
  }
  return parsed.data;
}
