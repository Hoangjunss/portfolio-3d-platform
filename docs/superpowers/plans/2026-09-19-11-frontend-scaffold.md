# Frontend Scaffold & API Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Next.js portfolio frontend project with a typed client for the public backend API.

**Architecture:** A single Next.js App Router project (`frontend/`) with TailwindCSS and a `lib/apiClient.ts` module every later frontend plan imports from.

**Tech Stack:** Next.js 14 (App Router), TypeScript, TailwindCSS, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md`

**Depends on:** `2026-09-19-05-template-crud.md` (needs the `GET /api/public/templates` response shape, `TemplateDto`).

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

### Task: Next.js scaffold + typed API client

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/next.config.mjs`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/postcss.config.js`
- Create: `frontend/app/globals.css`
- Create: `frontend/app/layout.tsx`
- Create: `frontend/app/page.tsx`
- Create: `frontend/lib/apiClient.ts`
- Test: `frontend/lib/apiClient.test.ts`

**Interfaces:**
- Consumes: `GET /api/public/templates` shape from plan 05 (`TemplateDto`).
- Produces: `Template` type, `getTemplates(): Promise<Template[]>`, `trackEvent(payload): Promise<void>` — consumed by plan 12 (carousel) and plan 14 (admin).

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "portfolio-frontend",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run"
  },
  "dependencies": {
    "next": "14.2.15",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "@react-three/fiber": "8.17.10",
    "@react-three/drei": "9.114.3",
    "three": "0.169.0",
    "embla-carousel-react": "8.3.0"
  },
  "devDependencies": {
    "typescript": "5.6.3",
    "@types/react": "18.3.11",
    "@types/node": "22.7.5",
    "@types/three": "0.169.0",
    "tailwindcss": "3.4.13",
    "postcss": "8.4.47",
    "autoprefixer": "10.4.20",
    "vitest": "2.1.2"
  }
}
```

- [ ] **Step 2: Create `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "paths": { "@/*": ["./*"] }
  },
  "include": ["**/*.ts", "**/*.tsx"]
}
```

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};

export default config;
```

```js
module.exports = {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

- [ ] **Step 3: Create `app/globals.css`, `app/layout.tsx`, `app/page.tsx`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```tsx
import "./globals.css";

export const metadata = { title: "Portfolio" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

```tsx
export default function HomePage() {
  return <main>Portfolio home — carousel added in plan 12</main>;
}
```

- [ ] **Step 4: Write the failing `apiClient` test**

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { getTemplates } from "./apiClient";

describe("apiClient.getTemplates", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => [{ id: 1, name: "Restaurant", slug: "restaurant", subdomain: "demo1" }],
    })));
  });

  it("fetches and returns the template list", async () => {
    const templates = await getTemplates();
    expect(templates).toHaveLength(1);
    expect(templates[0].name).toBe("Restaurant");
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/apiClient.test.ts`
Expected: FAIL — `apiClient.ts` does not exist.

- [ ] **Step 6: Create `apiClient.ts`**

```ts
export type Template = {
  id: number;
  name: string;
  slug: string;
  subdomain: string;
  thumbnailMediaId?: number;
  description?: string;
  category?: string;
  techTags?: string;
  displayOrder?: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export async function getTemplates(): Promise<Template[]> {
  const res = await fetch(`${API_BASE}/api/public/templates`);
  if (!res.ok) {
    throw new Error(`Failed to load templates: ${res.status}`);
  }
  return res.json();
}

export async function trackEvent(payload: {
  eventType: "PAGE_VIEW" | "TEMPLATE_CLICK" | "DEMO_OPEN";
  templateId?: number;
  sessionId: string;
  userAgent?: string;
  referrer?: string;
}): Promise<void> {
  await fetch(`${API_BASE}/api/analytics/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/apiClient.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add frontend
git commit -m "feat: scaffold Next.js frontend with typed API client"
```

## Self-Review Notes

- **Spec coverage:** implements spec section 4's Next.js/Tailwind frontend stack choice.
- **Type consistency:** `Template` type fields exactly mirror `TemplateDto` from plan 05 (`id`, `name`, `slug`, `subdomain`, `thumbnailMediaId`, `description`, `category`, `techTags`, `displayOrder`) — any field renamed on the backend must be renamed here too.
- **Next plan:** `2026-09-19-12-3d-carousel.md`.
