# Admin Dashboard CRUD Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Rewritten 2026-09-20** after plan review `docs/reviews/2026-09-20-plan-review-14-to-17.md`
> (4 MAJOR, 3 MINOR, 1 INFO). Do not implement an older copy of this file.

**Goal:** Build the `/admin` dashboard UI — analytics overview, templates table, leads table —
backed by an authenticated fetch wrapper that refreshes expired tokens; and close Y-01 left over
from plan 13.

**Architecture:** `adminFetch` attaches the JWT cookie as a Bearer header, retries once through
`/api/auth/refresh` on 401, and redirects to login when that fails. A route group
`app/admin/(dashboard)/` carries the shared nav so `/admin/login` stays outside it.

**Tech Stack:** Next.js App Router client components, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md`

**Depends on:** `2026-09-19-13-admin-auth-middleware.md` (both token cookies, `lib/auth.ts`);
`2026-09-19-05-template-crud.md` (`/api/admin/templates`); `2026-09-19-11-frontend-scaffold.md`
Task 1 (`/api/admin/leads` — **already implemented**, see Task 3 note);
`2026-09-19-08-analytics.md` (`/api/admin/analytics/summary`).

**This plan touches no backend file.** Everything lives under `frontend/`.

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

## The two admin list endpoints have different shapes — do not unify them

This is the single most likely thing to get wrong in this plan. Verified against the code and
against the project's own tests:

| Endpoint | Java signature | JSON |
|---|---|---|
| `GET /api/admin/templates` | `List<TemplateDto> listAll()` | **flat array** `[ {...}, {...} ]` |
| `GET /api/admin/leads` | `ResponseEntity<Page<LeadDto>>` | **envelope** `{ "content": [...], "totalElements": N, ... }` |

`AdminLeadControllerTest` asserts `jsonPath("$.content").isArray()` and
`jsonPath("$.totalElements").value(3)`. Reading leads as a flat array gives
`leads.map is not a function` and a blank screen (Z-01).

`/api/admin/leads` is paginated because plan 11 Task 1 made it so, deliberately: F-11 added
`max-page-size: 100` because `?size=100000` previously returned 2000 lead rows, each holding a
5000-character message, against a 350MB heap.

---

## Decisions (settled during plan review — do not re-litigate while implementing)

- **(a) `/admin/login` must not inherit the dashboard nav.** Put the three dashboard screens in a
  route group `app/admin/(dashboard)/` and give the layout to that group, not to `app/admin/`.
  URLs are unchanged (route groups in parentheses do not appear in the path). Same class of bug
  plan 18b exists to prevent one level up.
- **(b) `adminFetch` refreshes once on 401, then gives up.** Plan 13 decision (b) deferred this
  here, and the refresh token cookie is already stored and currently unused. One retry only —
  a refresh loop against an endpoint that keeps returning 401 would hammer the backend.
- **(c) Every screen checks `res.ok`.** A 401 that survives the refresh retry sends the user to
  `/admin/login`; anything else renders an error message. Never feed a non-OK body into state.
- **(d) Lead rows render `LeadDto` fields only** — `id`, `name`, `email`, `status`, `createdAt`.
  `phone` and `message` exist in the DTO but are attacker-authored free text from an
  unauthenticated public form (see the javadoc on `LeadDto`); they are out of scope here.
- **(e) React escapes text children by default**, so rendering lead/media names as `{value}` is
  safe. This closes C-04's concern for these screens. Do not introduce
  `dangerouslySetInnerHTML` anywhere in this plan.
- **(f) Soft-deleted templates show as "Inactive", not "Deleted"** (U-03). `TemplateDto.active`
  is the field; `deactivate` writes `action = "DELETE"` to `audit_logs`, but that is an audit
  label, not a user-facing one.

---

### Task 1: Close Y-01 — make the login page's decisions testable

From `docs/reviews/2026-09-20-code-review-plan-13.md`. `app/admin/login/page.tsx` has **zero**
tests: mutation M5 (drop the 429 branch) and M6 (stop storing the refresh token) both stayed
GREEN. Extract the two decisions into pure functions, the same way W-01 was closed.

**Files:**
- Create: `frontend/lib/loginError.ts`
- Create: `frontend/lib/loginError.test.ts`
- Modify: `frontend/lib/auth.ts` — add `persistSession`
- Modify: `frontend/lib/auth.test.ts` — add `persistSession` cases
- Modify: `frontend/app/admin/login/page.tsx` — call both

- [ ] **Step 1: Write the failing tests**

`frontend/lib/loginError.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { loginErrorMessage } from "./loginError";

describe("loginErrorMessage", () => {
  it("names bad credentials for 401", () => {
    expect(loginErrorMessage(401)).toMatch(/credential/i);
  });

  it("tells the user to wait for 429", () => {
    // Reachable in normal use: 10 login attempts per IP per 15 minutes.
    expect(loginErrorMessage(429)).toMatch(/too many|wait|minute/i);
  });

  it("does not blame the credentials for a server error", () => {
    expect(loginErrorMessage(500)).not.toMatch(/credential/i);
    expect(loginErrorMessage(503)).not.toMatch(/credential/i);
  });

  it("gives 429 and 401 different messages", () => {
    expect(loginErrorMessage(429)).not.toBe(loginErrorMessage(401));
  });
});
```

Append to `frontend/lib/auth.test.ts`:

```ts
import { persistSession, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "./auth";

describe("persistSession", () => {
  let written: string[];

  beforeEach(() => {
    written = [];
    vi.stubGlobal("document", {
      set cookie(value: string) {
        written.push(value);
      },
      get cookie() {
        return written.join("; ");
      },
    });
  });

  it("stores both tokens", () => {
    persistSession({ accessToken: "a.b.c", refreshToken: "r.s.t" });
    expect(written.some((c) => c.startsWith(`${ACCESS_TOKEN_COOKIE}=a.b.c`))).toBe(true);
    expect(written.some((c) => c.startsWith(`${REFRESH_TOKEN_COOKIE}=r.s.t`))).toBe(true);
  });

  it("gives the refresh cookie a longer life than the access cookie", () => {
    persistSession({ accessToken: "a.b.c", refreshToken: "r.s.t" });
    const maxAge = (name: string) =>
      Number(written.find((c) => c.startsWith(name))!.match(/max-age=(\d+)/)![1]);
    expect(maxAge(REFRESH_TOKEN_COOKIE)).toBeGreaterThan(maxAge(ACCESS_TOKEN_COOKIE));
  });

  it("rejects a response that is missing either token", () => {
    expect(() => persistSession({ accessToken: "a.b.c" } as never)).toThrow();
    expect(() => persistSession({ refreshToken: "r.s.t" } as never)).toThrow();
  });
});
```

Add `beforeEach` and `vi` to the existing vitest import in that file.

The third case is Z-02 of the code review (`res.json()` unchecked): without it, a response
missing a field writes the literal string `"undefined"` into the cookie, and the user is bounced
back to login with no error shown — a silent login loop.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run lib/loginError.test.ts lib/auth.test.ts`
Expected: FAIL — `loginError.ts` does not exist, `persistSession` is not exported.

- [ ] **Step 3: Create `loginError.ts`**

```ts
export function loginErrorMessage(status: number): string {
  switch (status) {
    case 401:
      return "Invalid credentials";
    case 429:
      // The login endpoint allows 10 attempts per IP per 15 minutes. Showing "invalid
      // credentials" here makes a rate-limited user retype a password that is already correct.
      return "Too many attempts. Try again in a few minutes.";
    default:
      return "Login is unavailable right now. Try again shortly.";
  }
}
```

- [ ] **Step 4: Add `persistSession` to `lib/auth.ts`**

```ts
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
  const row = document.cookie.split("; ").find((c) => c.startsWith(prefix));
  return row ? row.slice(prefix.length) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; SameSite=Strict${secure}`;
}
```

`readCookie` uses `slice`, not `split("=")[1]`: a JWT has no `=` inside it today, but the refresh
token is an opaque server-generated string and splitting on `=` would silently truncate it.

- [ ] **Step 5: Rewire the login page to use both**

In `frontend/app/admin/login/page.tsx`: delete the local `setCookie` helper and the inline
401/429 branching; call `setError(loginErrorMessage(res.status))` on `!res.ok`, and
`persistSession(await res.json())` on success. Wrap the `persistSession` call so its throw lands
in the existing `catch` and shows an error rather than a blank page.

- [ ] **Step 6: Run the full suite**

Run: `cd frontend && npx vitest run`
Expected: PASS, 36/36 (29 existing + 4 loginError + 3 persistSession).

- [ ] **Step 7: Commit**

```bash
git add frontend/lib/loginError.ts frontend/lib/loginError.test.ts frontend/lib/auth.ts frontend/lib/auth.test.ts frontend/app/admin/login/page.tsx
git commit -m "test: make the login page's error and session decisions testable, closing Y-01"
```

---

### Task 2: `adminFetch` — Bearer header, one refresh retry, typed list helpers

**Files:**
- Create: `frontend/lib/adminApiClient.ts`
- Create: `frontend/lib/adminApiClient.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { adminFetch, unwrapPage } from "./adminApiClient";

function cookieJar(initial: string) {
  let jar = initial;
  return {
    get cookie() {
      return jar;
    },
    set cookie(v: string) {
      jar = `${jar}; ${v}`;
    },
  };
}

describe("adminFetch", () => {
  beforeEach(() => {
    vi.stubGlobal("document", cookieJar("portfolio_access_token=abc.def.ghi"));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("attaches the access token as a Bearer header", async () => {
    const fetchMock = vi.fn(async () => new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await adminFetch("/api/admin/templates");

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new Headers(options.headers).get("Authorization")).toBe("Bearer abc.def.ghi");
  });

  it("retries once through /api/auth/refresh after a 401, then replays the request", async () => {
    vi.stubGlobal("document", cookieJar(
      "portfolio_access_token=stale; portfolio_refresh_token=r.s.t",
    ));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ accessToken: "new.a.b", refreshToken: "new.r.s" }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await adminFetch("/api/admin/templates");

    expect(res.status).toBe(200);
    expect(fetchMock.mock.calls[1][0]).toContain("/api/auth/refresh");
    const replayed = fetchMock.mock.calls[2][1] as RequestInit;
    expect(new Headers(replayed.headers).get("Authorization")).toBe("Bearer new.a.b");
  });

  it("gives up after one failed refresh instead of looping", async () => {
    vi.stubGlobal("document", cookieJar(
      "portfolio_access_token=stale; portfolio_refresh_token=r.s.t",
    ));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 401 }))
      .mockResolvedValueOnce(new Response("{}", { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await adminFetch("/api/admin/templates");

    expect(res.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not attempt a refresh when there is no refresh token", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    await adminFetch("/api/admin/templates");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("unwrapPage", () => {
  it("returns content from a Spring Page envelope", () => {
    expect(unwrapPage({ content: [{ id: 1 }], totalElements: 1 })).toEqual([{ id: 1 }]);
  });

  it("returns an empty array for a body that is not a page", () => {
    expect(unwrapPage({ error: "UNAUTHORIZED" })).toEqual([]);
    expect(unwrapPage(null)).toEqual([]);
  });
});
```

The last `unwrapPage` case is the guard for Z-01 and Z-03 together: whatever the backend returns,
the screen gets an array and never calls `.map` on an object.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/adminApiClient.test.ts`
Expected: FAIL — `adminApiClient.ts` does not exist.

- [ ] **Step 3: Create `adminApiClient.ts`**

```ts
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

// GET /api/admin/leads returns a Spring Page envelope while GET /api/admin/templates returns a
// flat array. Screens must never call .map on a body they did not verify is an array.
export function unwrapPage<T>(body: unknown): T[] {
  if (Array.isArray(body)) {
    return body as T[];
  }
  if (body && typeof body === "object" && Array.isArray((body as { content?: unknown }).content)) {
    return (body as { content: T[] }).content;
  }
  return [];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/adminApiClient.test.ts`
Expected: PASS, 6/6.

---

### Task 3: The three dashboard screens, inside a route group

> **`GET /api/admin/leads` already exists.** Plan 11 Task 1 shipped `AdminLeadController` +
> `LeadDto` + `LeadConverter` (commits `136a486`, `6a39589`). The old copy of this plan told you
> to add a list endpoint to `LeadController` and to modify `LeadRepository` — **do neither**.
> Touch no backend file in this plan, and do not run Maven; nothing here can affect it.

**Files:**
- Create: `frontend/app/admin/(dashboard)/layout.tsx`
- Create: `frontend/app/admin/(dashboard)/page.tsx`
- Create: `frontend/app/admin/(dashboard)/templates/page.tsx`
- Create: `frontend/app/admin/(dashboard)/leads/page.tsx`

The parentheses matter: a route group does not appear in the URL, so these serve `/admin`,
`/admin/templates`, `/admin/leads` exactly as before — but `app/admin/login/page.tsx` sits
outside the group and does **not** inherit this layout (Z-02, decision (a)).

- [ ] **Step 1: Create the dashboard layout**

```tsx
import Link from "next/link";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <nav className="w-48 border-r p-4 flex flex-col gap-2">
        <Link href="/admin">Dashboard</Link>
        <Link href="/admin/templates">Templates</Link>
        <Link href="/admin/leads">Leads</Link>
      </nav>
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
```

`Link`, not `<a href>`: a bare anchor triggers a full document load on every nav, re-running
middleware and re-downloading the bundle each time.

- [ ] **Step 2: Create a small shared loader hook**

`frontend/app/admin/(dashboard)/useAdminResource.ts`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/adminApiClient";

type State<T> = { data: T | null; error: string | null };

// Decision (c): a non-OK body must never reach state. Feeding an ApiErrorDto into a list and
// then calling .map on it is how a routine expired session turns into a blank page.
export function useAdminResource<T>(path: string, parse: (body: unknown) => T): State<T> {
  const router = useRouter();
  const [state, setState] = useState<State<T>>({ data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    adminFetch(path)
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        if (!res.ok) {
          if (!cancelled) setState({ data: null, error: `Request failed (${res.status})` });
          return;
        }
        const parsed = parse(await res.json());
        if (!cancelled) setState({ data: parsed, error: null });
      })
      .catch(() => {
        if (!cancelled) setState({ data: null, error: "Cannot reach the server." });
      });
    return () => {
      cancelled = true;
    };
  }, [path, parse, router]);

  return state;
}
```

- [ ] **Step 3: Create the dashboard home**

```tsx
"use client";

import { useAdminResource } from "./useAdminResource";

type Summary = {
  totalViews: number;
  totalClicks: number;
  topTemplates: { templateId: number; clickCount: number }[];
};

const parseSummary = (body: unknown) => body as Summary;

export default function AdminDashboardPage() {
  const { data, error } = useAdminResource<Summary>("/api/admin/analytics/summary", parseSummary);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p>Loading…</p>;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="border rounded p-4">
        <div className="text-sm text-gray-500">Total views</div>
        <div className="text-2xl">{data.totalViews}</div>
      </div>
      <div className="border rounded p-4">
        <div className="text-sm text-gray-500">Total clicks</div>
        <div className="text-2xl">{data.totalClicks}</div>
      </div>
      <div className="border rounded p-4 col-span-3">
        <div className="text-sm text-gray-500 mb-2">Top templates</div>
        <ul>
          {data.topTemplates.map((t) => (
            <li key={t.templateId}>
              Template #{t.templateId}: {t.clickCount} clicks
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

Field names match `AnalyticsSummaryDto(long totalViews, long totalClicks, List<TemplateClickCountDto> topTemplates)`
and `TemplateClickCountDto(Long templateId, long clickCount)` — verified against the records.

- [ ] **Step 4: Create the templates screen (flat array, with the `active` column)**

```tsx
"use client";

import { useAdminResource } from "../useAdminResource";
import { unwrapPage } from "@/lib/adminApiClient";
import type { Template } from "@/lib/apiClient";

const parseTemplates = (body: unknown) => unwrapPage<Template>(body);

export default function AdminTemplatesPage() {
  const { data, error } = useAdminResource<Template[]>("/api/admin/templates", parseTemplates);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p>Loading…</p>;

  return (
    <table className="w-full text-left">
      <thead>
        <tr><th>Name</th><th>Slug</th><th>Subdomain</th><th>Order</th><th>Status</th><th>Views</th></tr>
      </thead>
      <tbody>
        {data.map((t) => (
          <tr key={t.id}>
            <td>{t.name}</td>
            <td>{t.slug}</td>
            <td>{t.subdomain}</td>
            <td>{t.displayOrder}</td>
            {/* Decision (f): deactivate writes audit action "DELETE", but the row is soft-deleted,
                not gone. Showing "Deleted" here would misdescribe a reversible state. */}
            <td>{t.active ? "Active" : "Inactive"}</td>
            <td>{t.viewCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 5: Create the leads screen (Page envelope)**

```tsx
"use client";

import { useAdminResource } from "../useAdminResource";
import { unwrapPage } from "@/lib/adminApiClient";

// Mirrors LeadDto. phone and message exist on the DTO but are attacker-authored free text from
// an unauthenticated public form; decision (d) keeps them off this screen.
type Lead = {
  id: number;
  name: string;
  email: string;
  status: string;
  createdAt: string;
};

const parseLeads = (body: unknown) => unwrapPage<Lead>(body);

export default function AdminLeadsPage() {
  const { data, error } = useAdminResource<Lead[]>("/api/admin/leads", parseLeads);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p>Loading…</p>;
  if (data.length === 0) return <p>No leads yet.</p>;

  return (
    <table className="w-full text-left">
      <thead>
        <tr><th>Name</th><th>Email</th><th>Status</th><th>Created</th></tr>
      </thead>
      <tbody>
        {data.map((l) => (
          <tr key={l.id}>
            {/* Decision (e): these are attacker-authored strings. React escapes text children,
                so this is safe — but never move them into dangerouslySetInnerHTML. */}
            <td>{l.name}</td>
            <td>{l.email}</td>
            <td>{l.status}</td>
            <td>{new Date(l.createdAt).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 6: Run the full suite and the build**

Run: `cd frontend && npx vitest run && npm run build`
Expected: vitest PASS 42/42 (36 after Task 1 + 6 adminApiClient); build succeeds and lists
`/admin`, `/admin/templates`, `/admin/leads`, `/admin/login` as routes.

- [ ] **Step 7: Run the six mutation checks**

Revert each, confirm the colour, restore. Report every result including any that comes back
GREEN — a GREEN is information, not something to hide.

| # | Revert | Expected |
|---|---|---|
| M1 | `unwrapPage` → `return body as T[]` (no envelope handling) | RED |
| M2 | `unwrapPage` non-array fallback → `return body as T[]` | RED |
| M3 | `adminFetch` returns `first` without attempting refresh | RED |
| M4 | `adminFetch` retries refresh in a `while` loop instead of once | RED |
| M5 | `loginErrorMessage` returns "Invalid credentials" for every status | RED |
| M6 | `persistSession` drops the missing-token check | RED |

- [ ] **Step 8: Manually verify in a browser**

Backend must be running (`export JAVA_HOME="C:/Program Files/Java/jdk-21.0.11"` first).
Run `cd frontend && npm run dev`, then:

1. Visit `/admin/login` → **no sidebar nav** is visible. This is Z-02; if you see
   Dashboard/Templates/Leads links next to the login form, the route group is wrong.
2. Log in → `/admin` renders the three analytics tiles.
3. `/admin/templates` → table lists templates with a Status column.
4. `/admin/leads` → table renders, or "No leads yet." Neither may show a blank page.
5. In devtools, delete `portfolio_access_token` (keep the refresh cookie) and reload
   `/admin/templates` → the network tab shows a `POST /api/auth/refresh` and the table still
   loads. This is the only way to see decision (b) working.

- [ ] **Step 9: Commit**

```bash
git add frontend/app/admin frontend/lib/adminApiClient.ts frontend/lib/adminApiClient.test.ts
git commit -m "feat: add admin dashboard, templates, and leads screens behind a refreshing fetch wrapper"
```

## Self-Review Notes

- **Spec coverage:** spec section 4's admin dashboard list (templates view, leads list, analytics).
  Media library, content editor, user management, settings, and audit/error log viewers have
  backends already (plans 04, 06, 10) but no UI — they are plans 22–27 in the extended roadmap,
  which is **not yet reviewed or approved**.
- **Deliberately not done here:** A-09 (short cache TTL on `/api/admin/analytics/summary`, 3
  queries per call) and L-03 (the audit-row test using `findAll().get(size-1)`) are **backend**
  work. This plan touches no backend file, so both stay open and move to the next backend plan.
  C-04 and U-03 are closed by decisions (e) and (f).
- **What this plan does not do:** any write action. `/admin/templates` stays read-only, so plan
  25's manual verification step still has to create an audit entry with `curl`.
- **Next plan:** `2026-09-19-15-docker.md` — but see
  `docs/reviews/2026-09-20-plan-review-14-to-17.md`: plans 15/16/17 have 10 MAJOR findings
  between them and **none of their verification steps can run on this machine** (no Docker).
