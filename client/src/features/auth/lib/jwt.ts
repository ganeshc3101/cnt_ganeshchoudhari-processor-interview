/**
 * Client-side JWT payload read for UX only (expiry hint). Not verified — server enforces auth.
 */
function base64UrlToJson(segment: string): unknown {
  const padded = segment.padEnd(segment.length + ((4 - (segment.length % 4)) % 4), '=');
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  const json = atob(base64);
  return JSON.parse(json) as unknown;
}

/**
 * @returns Unix seconds from `exp`, or null if missing / not a JWT
 */
export function readJwtExpiryUnix(token: string): number | null {
  const parts = token.split('.');
  if (parts.length < 2 || parts[1] === undefined) return null;
  try {
    const payload = base64UrlToJson(parts[1]);
    if (!payload || typeof payload !== 'object' || !('exp' in payload)) return null;
    const exp = (payload as { exp?: unknown }).exp;
    return typeof exp === 'number' ? exp : null;
  } catch {
    return null;
  }
}

export function isJwtLikelyExpired(token: string, skewSeconds: number): boolean {
  const exp = readJwtExpiryUnix(token);
  if (exp === null) return false;
  const now = Math.floor(Date.now() / 1000);
  return now >= exp - skewSeconds;
}
