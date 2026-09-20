"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/apiClient";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth";

const ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60; // matches jwt.access-ttl-minutes
const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // matches jwt.refresh-ttl-days

// Not HttpOnly on purpose: the backend's JwtAuthFilter reads only the Authorization header, so
// plan 14's adminFetch has to read this value from JS to build that header. Decision (f).
function setCookie(name: string, value: string, maxAgeSeconds: number) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; SameSite=Strict${secure}`;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        // 429 is reachable in normal use: rate-limit allows 10 login attempts per IP per 15
        // minutes, so a user who mistypes repeatedly then types it right must be told to wait
        // instead of being shown "invalid credentials" again.
        if (res.status === 429) {
          setError("Too many attempts. Try again in a few minutes.");
        } else if (res.status === 401) {
          setError("Invalid credentials");
        } else {
          setError("Login is unavailable right now. Try again shortly.");
        }
        return;
      }

      const { accessToken, refreshToken } = await res.json();
      setCookie(ACCESS_TOKEN_COOKIE, accessToken, ACCESS_TOKEN_MAX_AGE_SECONDS);
      setCookie(REFRESH_TOKEN_COOKIE, refreshToken, REFRESH_TOKEN_MAX_AGE_SECONDS);
      router.push("/admin");
    } catch {
      setError("Cannot reach the server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto mt-20 flex flex-col gap-3">
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        autoComplete="username"
        className="border p-2"
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder="Password"
        autoComplete="current-password"
        className="border p-2"
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" disabled={submitting} className="bg-blue-600 text-white p-2 rounded disabled:opacity-50">
        {submitting ? "Signing in…" : "Log in"}
      </button>
    </form>
  );
}
