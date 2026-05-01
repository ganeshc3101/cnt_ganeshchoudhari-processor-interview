const TOKEN_SESSION_KEY = 'auth:accessToken';
const TOKEN_PERSIST_KEY = 'auth:accessToken:persist';

/** Legacy mock session — removed on bootstrap */
const LEGACY_SESSION_KEY = 'auth:session';

export function getAccessToken(): string | null {
  const fromSession = sessionStorage.getItem(TOKEN_SESSION_KEY);
  if (fromSession) return fromSession;
  return localStorage.getItem(TOKEN_PERSIST_KEY);
}

export function setAccessToken(token: string, persist: boolean): void {
  clearAccessToken();
  if (persist) {
    localStorage.setItem(TOKEN_PERSIST_KEY, token);
  } else {
    sessionStorage.setItem(TOKEN_SESSION_KEY, token);
  }
}

export function clearAccessToken(): void {
  sessionStorage.removeItem(TOKEN_SESSION_KEY);
  localStorage.removeItem(TOKEN_PERSIST_KEY);
}

export function clearLegacyMockSession(): void {
  try {
    localStorage.removeItem(LEGACY_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
