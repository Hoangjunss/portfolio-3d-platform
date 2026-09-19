# Admin Auth Pages & Middleware Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the admin login page and a Next.js middleware that guards every `/admin/*` route behind a valid JWT cookie.

**Architecture:** `middleware.ts` intercepts `/admin/**` requests and redirects to `/admin/login` when the `portfolio_access_token` cookie is missing; the login page calls the backend's `/api/auth/login` and sets that cookie.

**Tech Stack:** Next.js Middleware, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md`

**Depends on:** `2026-09-19-03-jwt-auth.md` (needs `POST /api/auth/login`); `2026-09-19-11-frontend-scaffold.md` (project scaffold).

## Global Constraints

- Backend must run within `-Xmx350m` (spec section 7 RAM budget) — no unbounded in-memory collections, use pagination on list endpoints.
- All admin-mutating endpoints (`POST`/`PUT`/`DELETE` under `/api/admin/**`) require a valid JWT with role `ADMIN` or `EDITOR`; only `ADMIN` may manage users and settings.
- Every admin CREATE/UPDATE/DELETE must write an `audit_logs` row (spec section 6); every 5xx response must write a `system_error_logs` row (spec section 8).
- Public GET endpoints (`templates`, `content-sections`) are Redis-cached with cache-aside invalidation on write (spec section 5).
- Public POST endpoints (`leads`, `analytics/events`, `auth/login`) are rate-limited via Bucket4j (spec section 5).
- `analytics_events.ip_hash` stores a hash of the IP, never the raw IP (spec section 6).
- Templates are static-exported Next.js sites served by Nginx on `<slug>.portfolio.com`, no per-template runtime process (spec sections 4, 7).
- No comments restating what code does; only comments explaining non-obvious "why".

---

### Task: Admin auth pages + JWT-guarded `/admin` middleware

**Files:**
- Create: `frontend/middleware.ts`
- Create: `frontend/app/admin/login/page.tsx`
- Create: `frontend/lib/auth.ts`
- Test: `frontend/lib/auth.test.ts`

**Interfaces:**
- Consumes: `POST /api/auth/login` from plan 03.
- Produces: `isAuthenticated`/`hasValidSession(cookieValue): boolean` used by `middleware.ts`; cookie name `portfolio_access_token` — every admin page/component from plan 14 onward reads auth state via this cookie.

- [ ] **Step 1: Write the failing `auth.ts` test**

```ts
import { describe, expect, it } from "vitest";
import { hasValidSession } from "./auth";

describe("hasValidSession", () => {
  it("returns false when no cookie is present", () => {
    expect(hasValidSession(undefined)).toBe(false);
  });

  it("returns true when the cookie has a non-empty value", () => {
    expect(hasValidSession("some.jwt.token")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/auth.test.ts`
Expected: FAIL — `auth.ts` does not exist.

- [ ] **Step 3: Create `auth.ts`**

```ts
export function hasValidSession(cookieValue: string | undefined): boolean {
  return Boolean(cookieValue && cookieValue.length > 0);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/auth.test.ts`
Expected: PASS

- [ ] **Step 5: Create `middleware.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { hasValidSession } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("portfolio_access_token")?.value;

  if (request.nextUrl.pathname.startsWith("/admin") && request.nextUrl.pathname !== "/admin/login") {
    if (!hasValidSession(token)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

- [ ] **Step 6: Create the login page**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      setError("Invalid credentials");
      return;
    }
    const { accessToken } = await res.json();
    document.cookie = `portfolio_access_token=${accessToken}; path=/; SameSite=Strict`;
    router.push("/admin");
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto mt-20 flex flex-col gap-3">
      <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="border p-2" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="border p-2" />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" className="bg-blue-600 text-white p-2 rounded">Log in</button>
    </form>
  );
}
```

- [ ] **Step 7: Manually verify redirect behavior**

Run: `cd frontend && npm run dev`, visit `http://localhost:3000/admin` without a cookie set
Expected: redirected to `/admin/login`; after a successful login, visiting `/admin` stays on the page.

- [ ] **Step 8: Commit**

```bash
git add frontend/middleware.ts frontend/app/admin/login frontend/lib/auth.ts frontend/lib/auth.test.ts
git commit -m "feat: add admin login page and JWT-cookie-guarded /admin middleware"
```

## Self-Review Notes

- **Spec coverage:** implements the `/admin` route protection decision from the design conversation (admin dashboard merged into the same Next.js app, guarded by middleware).
- **Type consistency:** cookie name `portfolio_access_token` is the single source of truth every admin fetch call in plan 14 must read via `document.cookie`.
- **Next plan:** `2026-09-19-14-admin-dashboard-crud.md`.
