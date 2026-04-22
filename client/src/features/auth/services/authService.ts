import { SessionSchema, type Session } from '../types/auth';

const SESSION_STORAGE_KEY = 'auth:session';

/**
 * Authentication service — mock foundation.
 *
 * The API surface (`getSession` / `signIn` / `signOut`) is intentionally shaped
 * so the implementation can later be replaced with a real HttpOnly-cookie +
 * `GET /auth/session` flow without changing any consumer (provider, hooks,
 * components).
 *
 * The stored object carries NO sensitive tokens — only a non-sensitive
 * identity flag. Real tokens MUST live in HttpOnly cookies set by the server.
 */

const readStored = (): Session | null => {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = SessionSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

const writeStored = (session: Session): void => {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
};

const clearStored = (): void => {
  localStorage.removeItem(SESSION_STORAGE_KEY);
};

export const authService = {
  async getSession(): Promise<Session | null> {
    // TODO: replace with `GET /auth/session` (HttpOnly cookie-based).
    return readStored();
  },

  async signIn(): Promise<Session> {
    // TODO: replace with `POST /auth/sign-in` — server sets an HttpOnly cookie
    // and returns the public session identity.
    const session: Session = { authenticated: true, userId: 'dev-user' };
    writeStored(session);
    return session;
  },

  async signOut(): Promise<void> {
    // TODO: replace with `POST /auth/sign-out` — server clears the cookie.
    clearStored();
  },
};
