export const ACCESS_TOKEN_COOKIE = "portfolio_access_token";
export const REFRESH_TOKEN_COOKIE = "portfolio_refresh_token";

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
