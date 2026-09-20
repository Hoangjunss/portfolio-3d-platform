# Admin Auth Pages & Middleware Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Rewritten 2026-09-20** after plan review `docs/reviews/2026-09-20-plan-review-13.md`
> (4 MAJOR, 3 MINOR, 1 INFO, 1 missing task). Do not implement an older copy of this file.

**Goal:** Add the admin login page and a Next.js middleware that guards every `/admin/*` route
behind a *non-expired* JWT cookie — plus close finding W-01 left over from plan 12 task 2.

**Architecture:** `middleware.ts` intercepts `/admin/**`, decodes the `portfolio_access_token`
cookie's `exp` claim, and redirects to `/admin/login` when it is missing, unreadable or expired.
The login page calls the backend's `/api/auth/login` and stores **both** returned tokens as
cookies. Signature verification stays on the backend (`JwtAuthFilter`); this middleware is a UX
gate, not a security boundary.

**Tech Stack:** Next.js Middleware (Edge runtime), Vitest.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md`

**Depends on:** `2026-09-19-03-jwt-auth.md` (needs `POST /api/auth/login`);
`2026-09-19-11-frontend-scaffold.md` (project scaffold); `2026-09-19-12-3d-carousel.md`
(Task 1 refactors a component it created).

**Run-order note:** plan 13 is not blocked by plan 18b — `app/admin/**` is a sibling of
`app/(public)/**`. But plan **19 must never run before 18b**, otherwise `SiteNav`/`SiteFooter`
mount on the root layout and leak into `/admin/login`. Safe orders: `13 → 14 → 18b → 19`, or
`18b → 19 → 13`.

## Global Constraints

- Backend must run within `-Xmx350m` (spec section 7 RAM budget) — no unbounded in-memory collections, use pagination on list endpoints.
- All admin-mutating endpoints (`POST`/`PUT`/`DELETE` under `/api/admin/**`) require a valid JWT with role `ADMIN` or `EDITOR`; only `ADMIN` may manage users and settings.
- Every admin CREATE/UPDATE/DELETE must write an `audit_logs` row (spec section 6); every 5xx response must write a `system_error_logs` row (spec section 8).
- Public GET endpoints (`templates`, `content-sections`) are Redis-cached with cache-aside invalidation on write (spec section 5).
- Public POST endpoints (`leads`, `analytics/events`, `auth/login`) are rate-limited via Bucket4j (spec section 5).
- `analytics_events.ip_hash` stores a hash of the IP, never the raw IP (spec section 6).
- Templates are static-exported Next.js sites served by Nginx on `<slug>.portfolio.com`, no per-template runtime process (spec sections 4, 7).
- No comments restating what code does; only comments explaining non-obvious "why".
- **This plan touches no backend file.** Everything lives under `frontend/`.

---

## Decisions (settled during plan review — do not re-litigate while implementing)

- **(a) Both tokens are cookies.** `portfolio_access_token` **and** `portfolio_refresh_token`,
  same mechanism. Not `localStorage`: a refresh token lives 7 days
  (`jwt.refresh-ttl-days: 7`) and `localStorage` never expires on its own.
  Without the refresh token stored, `POST /api/auth/logout` — which requires it in the body —
  can never be called by any screen, and every login leaks a 7-day token that is only ever
  evicted by the 5-per-user cap.
- **(b) This plan does NOT implement token refresh.** Its job is to *store enough* for plan 14's
  `adminFetch` to refresh on 401. Plan 14 must not assume auto-refresh already exists.
- **(c) The middleware decodes `exp`; it does NOT verify the signature.** Verifying would require
  shipping `jwt.access-secret` into the Edge runtime — a new hole to fix a cosmetic gap. A forged
  token that slips past this middleware is still rejected by `JwtAuthFilter` on every API call.
- **(d) An unparseable token counts as expired** → redirect to login. The middleware must never
  throw: a throw inside middleware 500s the whole site, including the public landing page.
- **(e) `Secure` is conditional on `process.env.NODE_ENV === "production"`,** so `npm run dev`
  over plain `http://localhost` can still set the cookie.
- **(f) `HttpOnly` is impossible here, on purpose.** `JwtAuthFilter` reads **only** the
  `Authorization: Bearer` header — it never looks at cookies. So plan 14's `adminFetch` must read
  the cookie from JS to build that header, which rules out `HttpOnly`. Accepted trade-off for an
  internal dashboard; any XSS on `/admin/**` can steal the token. Write this reasoning as a
  comment in `auth.ts` so the next reader does not "fix" it into a broken state.

---

### Task 1: Close W-01 — make the carousel's texture branch testable

Carried over from `docs/reviews/2026-09-20-code-review-plan-12-task-2.md`. `TemplateCarousel3D`
currently has **zero** test coverage because jsdom has no WebGL, so mutation M8 (drop the
`thumbnailUrl === null` branch) stayed GREEN. Extracting the decision into a pure function makes
it testable without mocking react-three-fiber.

**Files:**
- Create: `frontend/lib/templateTexture.ts`
- Create: `frontend/lib/templateTexture.test.ts`
- Modify: `frontend/components/TemplateCarousel3D.tsx`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { shouldRenderTexture } from "./templateTexture";

describe("shouldRenderTexture", () => {
  it("is true when thumbnailUrl is a non-empty string", () => {
    expect(shouldRenderTexture("https://example.com/a.webp")).toBe(true);
  });

  it("is false when thumbnailUrl is null", () => {
    expect(shouldRenderTexture(null)).toBe(false);
  });

  it("is false when thumbnailUrl is an empty string", () => {
    expect(shouldRenderTexture("")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/templateTexture.test.ts`
Expected: FAIL — `templateTexture.ts` does not exist.

- [ ] **Step 3: Create `templateTexture.ts`**

```ts
// Extracted from TemplateCarousel3D so the branch has a test: jsdom has no WebGL, so the R3F
// component never renders under Vitest and this decision was previously unverifiable (W-01).
export function shouldRenderTexture(thumbnailUrl: string | null): boolean {
  return Boolean(thumbnailUrl);
}
```

- [ ] **Step 4: Rewire `TemplateCarousel3D` to call it**

Replace the inline `template.thumbnailUrl ? ... : ...` condition with
`shouldRenderTexture(template.thumbnailUrl) ? ... : ...`. Do not change what either branch
renders — this step is a refactor, not a behaviour change.

- [ ] **Step 5: Run the full suite**

Run: `cd frontend && npx vitest run`
Expected: PASS, 18/18 (15 existing + 3 new).

- [ ] **Step 6: Commit**

```bash
git add frontend/lib/templateTexture.ts frontend/lib/templateTexture.test.ts frontend/components/TemplateCarousel3D.tsx
git commit -m "test: make the carousel texture branch testable, closing W-01"
```

---

### Task 2: Admin auth pages + expiry-aware `/admin` middleware

**Files:**
- Create: `frontend/middleware.ts`
- Create: `frontend/middleware.test.ts`
- Create: `frontend/lib/auth.ts`
- Create: `frontend/lib/auth.test.ts`
- Create: `frontend/app/admin/login/page.tsx`
- Modify: `frontend/lib/apiClient.ts` — export the existing `API_BASE` constant.

**Interfaces:**
- Consumes: `POST /api/auth/login` from plan 03. Response is `TokenDto`, **unwrapped**:
  `{ "accessToken": "...", "refreshToken": "..." }`. Request body is
  `{ "username": "...", "password": "..." }` (`LoginForm`).
- Produces: `hasValidSession(cookieValue): boolean` used by `middleware.ts`; cookie names
  `portfolio_access_token` and `portfolio_refresh_token`, which plan 14's `adminFetch` reads.

- [ ] **Step 1: Export `API_BASE` from `apiClient.ts`**

Change line 1 of `frontend/lib/apiClient.ts` from `const API_BASE = ...` to
`export const API_BASE = ...`. Nothing else in that file changes.

*Why:* the login page must not re-derive the base URL. A bare
`process.env.NEXT_PUBLIC_API_BASE_URL` with no fallback produces the literal URL
`undefined/api/auth/login` when the env var is unset — which is the current state of the repo,
there is no `.env.local` (finding X-04).

- [ ] **Step 2: Write the failing `auth.ts` test**

```ts
import { describe, expect, it } from "vitest";
import { hasValidSession } from "./auth";

// Builds a token with only the parts hasValidSession reads: a base64url payload carrying exp.
function tokenExpiringAt(epochSeconds: number): string {
  const payload = Buffer.from(JSON.stringify({ sub: "admin", exp: epochSeconds }))
    .toString("base64url");
  return `header.${payload}.signature`;
}

describe("hasValidSession", () => {
  it("returns false when no cookie is present", () => {
    expect(hasValidSession(undefined)).toBe(false);
  });

  it("returns false when the cookie is empty", () => {
    expect(hasValidSession("")).toBe(false);
  });

  it("returns true for a token that has not expired yet", () => {
    expect(hasValidSession(tokenExpiringAt(Math.floor(Date.now() / 1000) + 600))).toBe(true);
  });

  it("returns false for an expired token", () => {
    expect(hasValidSession(tokenExpiringAt(Math.floor(Date.now() / 1000) - 60))).toBe(false);
  });

  it("returns false for a token with no exp claim", () => {
    const payload = Buffer.from(JSON.stringify({ sub: "admin" })).toString("base64url");
    expect(hasValidSession(`header.${payload}.signature`)).toBe(false);
  });

  it("returns false for a malformed token instead of throwing", () => {
    expect(hasValidSession("not-a-jwt")).toBe(false);
    expect(hasValidSession("a.!!!not-base64!!!.c")).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/auth.test.ts`
Expected: FAIL — `auth.ts` does not exist.

- [ ] **Step 4: Create `auth.ts`**

```ts
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
```

**Note for the implementer:** `Buffer` does not exist in the Edge runtime. If `npm run build`
rejects it, swap the decode for `atob(payload.replace(/-/g, "+").replace(/_/g, "/"))`, keep the
`try/catch`, and keep the test's `Buffer` usage (tests run in Node). Do not silently drop the
`base64url` handling — JWT payloads routinely contain `-` and `_`.

- [ ] **Step 5: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/auth.test.ts`
Expected: PASS, 6/6.

- [ ] **Step 6: Write the failing `middleware.test.ts`**

This is the test the previous version of the plan was missing entirely (X-03). `middleware()` is
a plain function over `NextRequest`, so no server is needed.

```ts
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

function requestFor(path: string, token?: string): NextRequest {
  const request = new NextRequest(new URL(path, "http://localhost:3000"));
  if (token !== undefined) {
    request.cookies.set("portfolio_access_token", token);
  }
  return request;
}

function validToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ sub: "admin", exp: Math.floor(Date.now() / 1000) + 600 }),
  ).toString("base64url");
  return `header.${payload}.signature`;
}

describe("middleware", () => {
  it("redirects an unauthenticated /admin request to /admin/login", () => {
    const res = middleware(requestFor("/admin"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/admin/login");
  });

  it("redirects an unauthenticated nested admin route too", () => {
    const res = middleware(requestFor("/admin/templates"));
    expect(new URL(res.headers.get("location")!).pathname).toBe("/admin/login");
  });

  it("redirects when the token is present but expired", () => {
    const expired = `header.${Buffer.from(
      JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 60 }),
    ).toString("base64url")}.signature`;
    const res = middleware(requestFor("/admin", expired));
    expect(new URL(res.headers.get("location")!).pathname).toBe("/admin/login");
  });

  it("lets an authenticated admin request through", () => {
    const res = middleware(requestFor("/admin/templates", validToken()));
    expect(res.headers.get("location")).toBeNull();
  });

  it("never redirects /admin/login itself, even with no cookie", () => {
    const res = middleware(requestFor("/admin/login"));
    expect(res.headers.get("location")).toBeNull();
  });
});
```

The fifth case is load-bearing: without the login exemption the login page redirects to itself
forever, and nothing else in the suite would notice.

- [ ] **Step 7: Run test to verify it fails**

Run: `cd frontend && npx vitest run middleware.test.ts`
Expected: FAIL — `middleware.ts` does not exist.

- [ ] **Step 8: Create `middleware.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, hasValidSession } from "@/lib/auth";

const LOGIN_PATH = "/admin/login";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === LOGIN_PATH) {
    return NextResponse.next();
  }

  if (!hasValidSession(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value)) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
```

Both matcher entries are listed explicitly rather than relying on `:path*` also matching the bare
`/admin` segment (X-08): the guard on the dashboard root is the one that matters most, and the
cost of stating it is one array element. `pathname` is compared for equality instead of
`startsWith("/admin")`, which would also match `/administrator`.

- [ ] **Step 9: Run test to verify it passes**

Run: `cd frontend && npx vitest run middleware.test.ts`
Expected: PASS, 5/5.

- [ ] **Step 10: Create the login page**

```tsx
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
```

- [ ] **Step 11: Run the full suite and the build**

Run: `cd frontend && npx vitest run && npm run build`
Expected: vitest PASS 29/29 (18 after Task 1 + 6 auth + 5 middleware); build succeeds.

If the build rejects `Buffer` in the Edge runtime, apply the `atob` fallback from Step 4 and
re-run both.

- [ ] **Step 12: Run the four mutation checks**

Revert each change, confirm the stated colour, then restore. Report every result including any
that comes back GREEN — a GREEN here is information, not a failure to hide.

| # | Revert | Expected |
|---|---|---|
| M1 | `if (!hasValidSession(...))` → `if (hasValidSession(...))` | RED |
| M2 | Delete the `pathname === LOGIN_PATH` early return | RED |
| M3 | `hasValidSession` body → `return Boolean(cookieValue)` | RED |
| M4 | `shouldRenderTexture` → `return true` | RED |

- [ ] **Step 13: Manually verify redirect behaviour**

Run `cd frontend && npm run dev`, then:

1. Visit `http://localhost:3000/admin` with no cookie → redirected to `/admin/login`. ✅
2. Log in with a seeded admin account → browser lands on `/admin` and shows **404**. ✅

   **The 404 is the correct result at this stage**, not a failure: `app/admin/page.tsx` is
   created by plan 14 and does not exist yet. What it proves is that the middleware let the
   request through — had the guard rejected it, you would see the login page instead (X-07).
3. In devtools, check both `portfolio_access_token` and `portfolio_refresh_token` are set, with
   `max-age` values of 900 and 604800.
4. Delete `portfolio_access_token` and reload `/admin` → back to `/admin/login`.

Backend must be running (`export JAVA_HOME="C:/Program Files/Java/jdk-21.0.11"` first — the
default `JAVA_HOME` is JDK 8 and Maven fails on every `record`).

- [ ] **Step 14: Commit**

```bash
git add frontend/middleware.ts frontend/middleware.test.ts frontend/lib/auth.ts frontend/lib/auth.test.ts frontend/lib/apiClient.ts frontend/app/admin/login
git commit -m "feat: add admin login page and an expiry-aware /admin middleware guard"
```

## Self-Review Notes

- **Spec coverage:** implements the `/admin` route protection decision from the design
  conversation (admin dashboard in the same Next.js app, guarded by middleware).
- **Type consistency:** `ACCESS_TOKEN_COOKIE` / `REFRESH_TOKEN_COOKIE` in `lib/auth.ts` are the
  single source of truth for cookie names. Plan 14's `adminFetch` must import them rather than
  re-typing the string.
- **What this plan deliberately does not do:** automatic token refresh on 401. Decision (b) —
  that belongs to `adminFetch` in plan 14, which now has both tokens available to do it.
- **Known open item it inherits:** with `hasValidSession` reading `exp`, a user whose access
  token expires mid-session is bounced to login rather than refreshed, until plan 14 lands. That
  is a visible regression in convenience and an improvement in honesty — the old behaviour let
  them sit on a dead dashboard.
- **Next plan:** `2026-09-19-14-admin-dashboard-crud.md`.
