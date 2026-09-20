import { API_BASE } from "./apiClient";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  persistSession,
  readCookie,
} from "./auth";

function withAuth(options: RequestInit, token: string | null): RequestInit {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return { ...options, headers };
}

// One retry, never a loop: a refresh endpoint that keeps answering 401 would otherwise turn
// every admin screen into a request flood against an already-unhappy backend. Decision (b).
export async function adminFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const first = await fetch(`${API_BASE}${path}`, withAuth(options, readCookie(ACCESS_TOKEN_COOKIE)));
  if (first.status !== 401) {
    return first;
  }

  const refreshToken = readCookie(REFRESH_TOKEN_COOKIE);
  if (!refreshToken) {
    return first;
  }

  const refreshed = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!refreshed.ok) {
    return first;
  }

  persistSession(await refreshed.json());
  return fetch(`${API_BASE}${path}`, withAuth(options, readCookie(ACCESS_TOKEN_COOKIE)));
}

export function unwrapPage<T>(body: unknown): T[] {
  if (Array.isArray(body)) {
    return body as T[];
  }
  if (body && typeof body === "object" && Array.isArray((body as { content?: unknown }).content)) {
    return (body as { content: T[] }).content;
  }
  return [];
}
