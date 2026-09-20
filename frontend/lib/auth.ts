export const ACCESS_TOKEN_COOKIE = "portfolio_access_token";
export const REFRESH_TOKEN_COOKIE = "portfolio_refresh_token";

export const ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60; // matches jwt.access-ttl-minutes
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // matches jwt.refresh-ttl-days

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Not HttpOnly on purpose: the backend's JwtAuthFilter reads only the Authorization header, so
// adminFetch has to read these values from JS to build that header. Plan 13 decision (f).
export function persistSession(tokens: TokenPair): void {
  if (!tokens?.accessToken || !tokens?.refreshToken) {
    // Writing an absent token produces the literal cookie value "undefined", which then fails
    // hasValidSession and bounces the user back to login with no error shown at all.
    throw new Error("Login response did not contain both tokens");
  }
  writeCookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, ACCESS_TOKEN_MAX_AGE_SECONDS);
  writeCookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, REFRESH_TOKEN_MAX_AGE_SECONDS);
}

export function readCookie(name: string): string | null {
  const prefix = `${name}=`;
  const row = document.cookie.split("; ").findLast((c) => c.startsWith(prefix));
  return row ? row.slice(prefix.length) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; SameSite=Strict${secure}`;
}

// The signature is deliberately not verified here: that would mean shipping jwt.access-secret
// into the Edge runtime. Real authentication happens in the backend's JwtAuthFilter on every API
// call; this only decides whether to show the page or bounce to login. Decision (c).
export function hasValidSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) {
    return false;
  }
  const expiry = readExpiry(cookieValue);
  return expiry !== null && expiry * 1000 > Date.now();
}

// Anything unreadable counts as expired rather than throwing: a throw inside middleware turns
// every route into a 500, including the public landing page. Decision (d).
function readExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { exp?: unknown };
    return typeof decoded.exp === "number" ? decoded.exp : null;
  } catch {
    return null;
  }
}
