# Landing Page — Nav & Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire `frontend/tokens.css` into the app, then build `SiteNav` (Hallmark N9 Edge-aligned minimal) and `SiteFooter` (Hallmark Ft1 Mast-headed) as the shared chrome every landing page section mounts inside.

**Architecture:** `SiteNav` and `SiteFooter` are server components (no client state except the scroll-triggered background swap on `SiteNav`, which needs `"use client"`). Both render inside `app/layout.tsx`, wrapping `{children}` so every route (including future `/admin` pages, which already have their own nav from plan 13) gets the public nav/footer only on the public route group.

**Tech Stack:** Next.js App Router, TailwindCSS (tokens via CSS custom properties, not Tailwind theme extension), Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-20-landing-page-ui-design.md` (§3 tokens, §4.1 Nav, §4.7 Footer). Backing design tokens already exist at `frontend/tokens.css`.

**Depends on:** none (first landing-page plan). **Required by:** `2026-09-20-20-landing-hero-about.md`, `2026-09-20-21-landing-services-contact.md` — both mount inside the layout this plan produces.

## Global Constraints

- Backend must run within `-Xmx350m` (spec section 7 RAM budget) — no unbounded in-memory collections, use pagination on list endpoints.
- All admin-mutating endpoints (`POST`/`PUT`/`DELETE` under `/api/admin/**`) require a valid JWT with role `ADMIN` or `EDITOR`; only `ADMIN` may manage users and settings.
- Every admin CREATE/UPDATE/DELETE must write an `audit_logs` row (spec section 6); every 5xx response must write a `system_error_logs` row (spec section 8).
- Public GET endpoints (`templates`, `content-sections`) are Redis-cached with cache-aside invalidation on write (spec section 5).
- Public POST endpoints (`leads`, `analytics/events`, `auth/login`) are rate-limited via Bucket4j (spec section 5).
- Templates are static-exported Next.js sites served by Nginx on `<slug>.portfolio.com`, no per-template runtime process (spec sections 4, 7).
- No comments restating what code does; only comments explaining non-obvious "why".
- **Package layout follows spec section 5.1 (layered), not feature packages** — n/a to this plan (frontend-only), kept for consistency with sibling plans.
- **Every colour and font-family in CSS must reference a token from `frontend/tokens.css`** (`var(--color-*)`, `var(--font-*)`, `var(--space-*)`, `var(--text-*)`, `var(--ease-*)`, `var(--dur-*)`). No hard-coded OKLCH/hex/`font-family` string anywhere in a component or `globals.css`. If a value is needed that has no token yet, add it to `tokens.css` first, then reference it.
- Hallmark stamp (`/* Hallmark · ... */`) at the top of `tokens.css` must not be removed or edited by this plan.

---

### Task 1: Wire `tokens.css` into `app/globals.css`

**Files:**
- Modify: `frontend/app/globals.css`

**Interfaces:**
- Produces: every CSS custom property from `tokens.css` available globally to every component created in this and later plans.

- [ ] **Step 1: Read the current `globals.css` and confirm the three `@tailwind` lines are untouched**

Run: `cat frontend/app/globals.css`
Expected: exactly `@tailwind base;`, `@tailwind components;`, `@tailwind utilities;` — nothing else yet.

- [ ] **Step 2: Prepend the tokens import above the Tailwind directives**

```css
@import "../tokens.css";

@tailwind base;
@tailwind components;
@tailwind utilities;

html, body {
  font-family: var(--font-body);
}
```

- [ ] **Step 3: Verify the build picks up the tokens**

Run: `cd frontend && npm run build`
Expected: build succeeds; no "unresolved import" or PostCSS error for `tokens.css`.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/globals.css
git commit -m "chore: wire Hallmark design tokens into globals.css"
```

---

### Task 2: `SiteNav` — N9 Edge-aligned minimal

**Files:**
- Create: `frontend/components/SiteNav.tsx`
- Test: `frontend/components/SiteNav.test.tsx`

**Interfaces:**
- Consumes: nothing (static wordmark + anchor link — no API call).
- Produces: `<SiteNav />`, mounted once in `app/layout.tsx`.

- [ ] **Step 1: Write the failing test — wordmark and CTA are both present and the CTA points at `#templates`**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteNav } from "./SiteNav";

describe("SiteNav", () => {
  it("renders the wordmark and a CTA linking to the templates section", () => {
    render(<SiteNav />);
    expect(screen.getByText("PORTFOLIO")).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: "Xem template" });
    expect(cta).toHaveAttribute("href", "#templates");
  });

  it("has no visible link row besides the CTA (N9 has no nav-link list)", () => {
    render(<SiteNav />);
    expect(screen.queryAllByRole("link")).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/SiteNav.test.tsx`
Expected: FAIL — `SiteNav.tsx` does not exist.

- [ ] **Step 3: Create `SiteNav.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed inset-x-0 top-0 z-[var(--z-sticky)] flex items-center justify-between px-[clamp(1rem,4vw,1.5rem)] py-[var(--space-md)] transition-colors"
      style={{
        backgroundColor: scrolled ? "var(--color-paper)" : "transparent",
        borderBottom: scrolled ? "1px solid var(--color-rule)" : "1px solid transparent",
        transitionDuration: "var(--dur-short)",
        transitionTimingFunction: "var(--ease-out)",
      }}
    >
      <span
        className="uppercase"
        style={{ fontFamily: "var(--font-wordmark)", letterSpacing: "0.08em", fontSize: "var(--text-sm)" }}
      >
        PORTFOLIO
      </span>
      <a
        href="#templates"
        className="min-h-[44px] min-w-[44px] flex items-center"
        style={{ fontFamily: "var(--font-body)", color: "var(--color-ink)", borderBottom: "1px solid var(--color-accent)" }}
      >
        Xem template
      </a>
    </nav>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/SiteNav.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/components/SiteNav.tsx frontend/components/SiteNav.test.tsx
git commit -m "feat: add SiteNav (Hallmark N9 edge-aligned minimal)"
```

---

### Task 3: `SiteFooter` — Ft1 Mast-headed

**Files:**
- Create: `frontend/components/SiteFooter.tsx`
- Test: `frontend/components/SiteFooter.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `<SiteFooter />`, mounted once in `app/layout.tsx`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteFooter } from "./SiteFooter";

describe("SiteFooter", () => {
  it("renders the wordmark, the admin login link, and the contact anchor", () => {
    render(<SiteFooter />);
    expect(screen.getByText("PORTFOLIO")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đăng nhập quản trị" })).toHaveAttribute("href", "/admin/login");
    expect(screen.getByRole("link", { name: "Liên hệ" })).toHaveAttribute("href", "#contact");
  });

  it("does not render a social icon row (none exist yet)", () => {
    render(<SiteFooter />);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/SiteFooter.test.tsx`
Expected: FAIL — `SiteFooter.tsx` does not exist.

- [ ] **Step 3: Create `SiteFooter.tsx`**

```tsx
export function SiteFooter() {
  return (
    <footer
      className="flex flex-col gap-[var(--space-md)] px-[clamp(1rem,4vw,1.5rem)] py-[var(--space-2xl)] sm:flex-row sm:items-baseline sm:justify-between"
      style={{ borderTop: "1px solid var(--color-rule)" }}
    >
      <div className="flex flex-col gap-[var(--space-xs)]">
        <span
          className="uppercase"
          style={{ fontFamily: "var(--font-wordmark)", letterSpacing: "0.08em", fontSize: "var(--text-sm)" }}
        >
          PORTFOLIO
        </span>
        <p style={{ fontFamily: "var(--font-body)", fontStyle: "italic", color: "var(--color-muted)" }}>
          Một xưởng, hai mươi bản thiết kế.
        </p>
      </div>
      <div className="flex gap-[var(--space-lg)]">
        <a href="/admin/login" style={{ color: "var(--color-ink)" }}>
          Đăng nhập quản trị
        </a>
        <a href="#contact" style={{ color: "var(--color-ink)" }}>
          Liên hệ
        </a>
      </div>
      <p
        className="uppercase"
        style={{ fontSize: "var(--text-xs)", letterSpacing: "0.08em", color: "var(--color-muted)" }}
      >
        © {new Date().getFullYear()} Portfolio
      </p>
    </footer>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/SiteFooter.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/components/SiteFooter.tsx frontend/components/SiteFooter.test.tsx
git commit -m "feat: add SiteFooter (Hallmark Ft1 mast-headed)"
```

---

### Task 4: Mount `SiteNav` + `SiteFooter` in `app/layout.tsx`

**Files:**
- Modify: `frontend/app/layout.tsx`

**Interfaces:**
- Consumes: `SiteNav`, `SiteFooter` from Task 2/3.
- Produces: every route under `app/` renders with the shared chrome, unless a route segment (e.g. `/admin/**`, which has its own layout from plan 13) opts out via a nested layout that omits `{children}` wrapping — out of scope here, `/admin` already has its own `app/admin/layout.tsx` that Next.js will use instead for that subtree.

- [ ] **Step 1: Modify `layout.tsx`**

```tsx
import "./globals.css";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "Portfolio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <SiteNav />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Run the full frontend test suite + build as the self-check**

Run: `cd frontend && npx vitest run && npm run build`
Expected: all existing + new tests PASS; `next build` succeeds with no type errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/layout.tsx
git commit -m "feat: mount SiteNav and SiteFooter in the root layout"
```

## Self-Review Notes

- **Spec coverage:** implements design spec §4.1 (Nav) and §4.7 (Footer) in full — wordmark, single CTA, no link row, admin login + contact links, no fabricated social row.
- **Token discipline:** zero hard-coded colours/fonts; every visual value is a `var(--token)` reference back to `frontend/tokens.css`.
- **`/admin` isolation:** confirmed `app/admin/layout.tsx` (plan 13) is a separate layout segment — Next.js App Router does not nest the root layout's `SiteNav`/`SiteFooter` inside a route group that defines its own layout only when using route groups `(public)`/`(admin)`. **Open risk flagged, not fixed here:** the current `app/admin/` tree is a plain subdirectory, not a route group — mounting `SiteNav`/`SiteFooter` in the root layout WILL currently leak the public nav/footer onto every `/admin/**` page too. Fixing this (moving `admin/` under a `(admin)` route group, and the public sections under a `(public)` route group) is a **prerequisite** this plan's Task 4 depends on; flagged for the operator to confirm before merging Task 4, or fold into this task if approved.
- **This is the first of three landing-page plans.** Next: `2026-09-20-20-landing-hero-about.md`.
