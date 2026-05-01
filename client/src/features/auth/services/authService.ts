import { z } from 'zod';

import { apiRequest } from '@/shared/api/apiClient';
import { HttpError } from '@/shared/api/ApiError';

import {
  clearAccessToken,
  clearLegacyMockSession,
  getAccessToken,
  setAccessToken,
} from '../lib/authTokenStorage';
import { isJwtLikelyExpired } from '../lib/jwt';
import {
  AuthLoginResponseSchema,
  LoginFormSchema,
  UserMeSchema,
  type LoginFormValues,
  type UserMe,
} from '../types/auth';

export const authService = {
  async getStoredSessionUser(signal?: AbortSignal): Promise<UserMe | null> {
    clearLegacyMockSession();
    const token = getAccessToken();
    if (!token) return null;
    if (isJwtLikelyExpired(token, 60)) {
      clearAccessToken();
      return null;
    }
    try {
      return await apiRequest({
        method: 'GET',
        path: '/v1/auth/me',
        schema: UserMeSchema,
        ...(signal !== undefined ? { signal } : {}),
      });
    } catch (e: unknown) {
      if (e instanceof HttpError && e.status === 401) {
        clearAccessToken();
      }
      return null;
    }
  },

  async login(values: LoginFormValues, signal?: AbortSignal): Promise<UserMe> {
    const parsed = LoginFormSchema.parse(values);
    const auth = await apiRequest({
      method: 'POST',
      path: '/v1/auth/login',
      body: {
        username: parsed.username,
        password: parsed.password,
      },
      schema: AuthLoginResponseSchema,
      skipUnauthorizedRedirect: true,
      ...(signal !== undefined ? { signal } : {}),
    });
    setAccessToken(auth.accessToken, parsed.rememberMe);
    return apiRequest({
      method: 'GET',
      path: '/v1/auth/me',
      schema: UserMeSchema,
      ...(signal !== undefined ? { signal } : {}),
    });
  },

  async fetchMe(signal?: AbortSignal): Promise<UserMe> {
    return apiRequest({
      method: 'GET',
      path: '/v1/auth/me',
      schema: UserMeSchema,
      ...(signal !== undefined ? { signal } : {}),
    });
  },

  async signOut(signal?: AbortSignal): Promise<void> {
    try {
      await apiRequest({
        method: 'POST',
        path: '/v1/auth/logout',
        schema: z.undefined(),
        skipUnauthorizedRedirect: true,
        ...(signal !== undefined ? { signal } : {}),
      });
    } catch {
      /* best-effort — always clear locally */
    } finally {
      clearAccessToken();
    }
  },
};
