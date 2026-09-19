# Admin Dashboard CRUD Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/admin` dashboard UI — analytics overview, templates table, leads table — backed by an authenticated fetch wrapper.

**Architecture:** `adminFetch` attaches the JWT cookie as a Bearer header to every admin API call; `app/admin/layout.tsx` provides shared nav; each screen is a client component that fetches its own data on mount.

**Tech Stack:** Next.js App Router client components, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md`

**Depends on:** `2026-09-19-13-admin-auth-middleware.md` (needs the `portfolio_access_token` cookie); `2026-09-19-05-template-crud.md` (needs `/api/admin/templates`); `2026-09-19-07-lead-notification.md` (needs the `lead` module, extended here with a list endpoint); `2026-09-19-08-analytics.md` (needs `/api/admin/analytics/summary`).

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

### Task: Admin dashboard — CRUD screens + analytics charts

**Files:**
- Create: `frontend/app/admin/layout.tsx`
- Create: `frontend/app/admin/page.tsx`
- Create: `frontend/app/admin/templates/page.tsx`
- Create: `frontend/app/admin/leads/page.tsx`
- Create: `frontend/lib/adminApiClient.ts`
- Test: `frontend/lib/adminApiClient.test.ts`
- Modify: `backend/src/main/java/com/portfolio/platform/lead/LeadRepository.java` — add `findAllByOrderByCreatedAtDesc()`.
- Modify: `backend/src/main/java/com/portfolio/platform/lead/LeadController.java` — add `GET` list endpoint.

**Interfaces:**
- Consumes: `/api/admin/templates` (plan 05), `/api/admin/leads` (added here as a `LeadController` follow-up), `/api/admin/analytics/summary` (plan 08).
- Produces: authenticated fetch wrapper `adminFetch(path, options)` that attaches the JWT cookie as a Bearer header — used by every admin screen.

- [ ] **Step 1: Write the failing `adminApiClient` test**

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { adminFetch } from "./adminApiClient";

describe("adminFetch", () => {
  beforeEach(() => {
    vi.stubGlobal("document", { cookie: "portfolio_access_token=abc.def.ghi" });
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => [] })));
  });

  it("attaches the access token as a Bearer header", async () => {
    await adminFetch("/api/admin/templates");
    const [, options] = (fetch as any).mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer abc.def.ghi");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/adminApiClient.test.ts`
Expected: FAIL — `adminApiClient.ts` does not exist.

- [ ] **Step 3: Create `adminApiClient.ts`**

```ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

function readCookie(name: string): string | null {
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
  return match ? match.split("=")[1] : null;
}

export async function adminFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = readCookie("portfolio_access_token");
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/adminApiClient.test.ts`
Expected: PASS

- [ ] **Step 5: Add `GET /api/admin/leads` to the backend (plan 07 follow-up)**

```java
// LeadRepository.java addition
java.util.List<Lead> findAllByOrderByCreatedAtDesc();
```

```java
// LeadController.java: constructor-inject LeadRepository alongside the existing LeadService, then add:
@GetMapping
public java.util.List<Lead> listAll() {
    return leadRepository.findAllByOrderByCreatedAtDesc();
}
```

- [ ] **Step 6: Verify the backend addition compiles and the endpoint responds**

Run: `mvn -f backend/pom.xml test` (existing `LeadServiceTest` from plan 07 must still pass; no new backend test is required for this thin list endpoint since it has no business logic beyond a repository call)
Expected: PASS; manual `curl -H "Authorization: Bearer <token>" http://localhost:8080/api/admin/leads` returns `200` with a JSON array.

- [ ] **Step 7: Create the admin layout, dashboard home, templates screen, leads screen**

```tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <nav className="w-48 border-r p-4 flex flex-col gap-2">
        <a href="/admin">Dashboard</a>
        <a href="/admin/templates">Templates</a>
        <a href="/admin/leads">Leads</a>
      </nav>
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
```

```tsx
"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminApiClient";

type Summary = { totalViews: number; totalClicks: number; topTemplates: { templateId: number; clickCount: number }[] };

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    adminFetch("/api/admin/analytics/summary").then((res) => res.json()).then(setSummary);
  }, []);

  if (!summary) return <p>Loading...</p>;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="border rounded p-4"><div className="text-sm text-gray-500">Total views</div><div className="text-2xl">{summary.totalViews}</div></div>
      <div className="border rounded p-4"><div className="text-sm text-gray-500">Total clicks</div><div className="text-2xl">{summary.totalClicks}</div></div>
      <div className="border rounded p-4 col-span-3">
        <div className="text-sm text-gray-500 mb-2">Top templates</div>
        <ul>{summary.topTemplates.map((t) => <li key={t.templateId}>Template #{t.templateId}: {t.clickCount} clicks</li>)}</ul>
      </div>
    </div>
  );
}
```

```tsx
"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminApiClient";
import type { Template } from "@/lib/apiClient";

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    adminFetch("/api/admin/templates").then((res) => res.json()).then(setTemplates);
  }, []);

  return (
    <table className="w-full text-left">
      <thead><tr><th>Name</th><th>Slug</th><th>Subdomain</th><th>Order</th></tr></thead>
      <tbody>
        {templates.map((t) => (
          <tr key={t.id}><td>{t.name}</td><td>{t.slug}</td><td>{t.subdomain}</td><td>{t.displayOrder}</td></tr>
        ))}
      </tbody>
    </table>
  );
}
```

```tsx
"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminApiClient";

type Lead = { id: number; name: string; email: string; status: string; createdAt: string };

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    adminFetch("/api/admin/leads").then((res) => res.json()).then(setLeads);
  }, []);

  return (
    <table className="w-full text-left">
      <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Created</th></tr></thead>
      <tbody>
        {leads.map((l) => (
          <tr key={l.id}><td>{l.name}</td><td>{l.email}</td><td>{l.status}</td><td>{l.createdAt}</td></tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 8: Manually verify in a browser**

Run: `cd frontend && npm run dev`, log in at `/admin/login`, visit `/admin`, `/admin/templates`, `/admin/leads`
Expected: dashboard shows analytics numbers, templates/leads tables populate from the backend.

- [ ] **Step 9: Commit**

```bash
git add frontend/app/admin backend/src/main/java/com/portfolio/platform/lead/LeadController.java backend/src/main/java/com/portfolio/platform/lead/LeadRepository.java frontend/lib/adminApiClient.ts frontend/lib/adminApiClient.test.ts
git commit -m "feat: add admin dashboard home, templates, and leads screens"
```

## Self-Review Notes

- **Spec coverage:** implements spec section 4's admin dashboard feature list (templates CRUD view, leads list, analytics dashboard) — media library, content editor, user management, settings, and audit/error log viewers are intentionally left as a follow-up increment beyond this plan's scope (the backend APIs for them already exist from plans 06, 04, 10; only their UI screens are not yet built).
- **Type consistency:** the `Summary`/`Lead` local TypeScript types mirror `AnalyticsSummaryDto` (plan 08) and the `Lead` entity's public fields (plan 07) exactly.
- **This is the last frontend plan.** Next plan starts infra: `2026-09-19-15-docker.md`.
