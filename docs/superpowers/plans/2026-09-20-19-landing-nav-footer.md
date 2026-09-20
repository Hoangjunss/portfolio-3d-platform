# Landing Page — Nav & Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire `frontend/tokens.css` into the app, then build `SiteNav` (Hallmark N9 Edge-aligned minimal) and `SiteFooter` (Hallmark Ft1 Mast-headed) as the shared chrome every landing page section mounts inside.

**Architecture:** `SiteNav` and `SiteFooter` are server components (no client state except the scroll-triggered background swap on `SiteNav`, which needs `"use client"`). Both render inside `app/(public)/layout.tsx` (created by plan 18b), wrapping `{children}` so only the public tree gets this chrome. `app/admin/**` is a plain sibling outside `(public)` and keeps its own nav from plan 13/14 -- it never sees `SiteNav`/`SiteFooter`. Do NOT mount either component in the true root `app/layout.tsx`.

**Tech Stack:** Next.js App Router, TailwindCSS (tokens via CSS custom properties, not Tailwind theme extension), Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-20-landing-page-ui-design.md` (§3 tokens, §4.1 Nav, §4.7 Footer). Backing design tokens already exist at `frontend/tokens.css`.

**Depends on:** `2026-09-20-18b-frontend-route-groups.md` (Task 4 of this plan targets `app/(public)/layout.tsx`, created by that plan — not the true root `app/layout.tsx`). **Required by:** `2026-09-20-20-landing-hero-about.md`, `2026-09-20-21-landing-services-contact.md` — both mount inside the layout this plan produces.

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

- [ ] **Step 3: Actually load the three fonts — declaring them in `tokens.css` does not fetch them**

`tokens.css` names Fraunces, EB Garamond and Geist Mono, but **nothing in the repo loads them**:
no `next/font`, no stylesheet link. Every one of the three therefore falls through to its fallback
(`ui-serif, Georgia, serif` / `ui-monospace`), and spec line 175 — "No Inter/Roboto/system-ui
default" — fails **silently**: no error in the build, none in the browser console, just the wrong
typeface. Fixing this is inside this plan's Goal ("wire `tokens.css` into the app"), because tokens
that resolve to a fallback are not wired.

Use `next/font/google`, which is built into Next 15 (no new dependency) and self-hosts the files, so
there is no runtime request to Google.

Modify `frontend/app/layout.tsx`:

```tsx
import { Fraunces, EB_Garamond, Geist_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin", "vietnamese"], display: "swap", variable: "--font-display-face" });
const ebGaramond = EB_Garamond({ subsets: ["latin", "vietnamese"], display: "swap", variable: "--font-body-face" });
const geistMono = Geist_Mono({ subsets: ["latin"], display: "swap", variable: "--font-wordmark-face" });

export const metadata = {
  title: "Portfolio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${fraunces.variable} ${ebGaramond.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

Then point the three font tokens at the loaded faces, keeping the fallback chain
(`frontend/tokens.css`, lines 22-24 — **do not touch the Hallmark stamp comment at the top**):

```css
  --font-display:  var(--font-display-face), ui-serif, Georgia, serif;
  --font-body:     var(--font-body-face), ui-serif, Georgia, serif;
  --font-wordmark: var(--font-wordmark-face), ui-monospace, monospace;
```

**`subsets` must include `vietnamese`.** All public copy is Vietnamese ("Xem template",
"Đăng nhập quản trị", "Một xưởng, hai mươi bản thiết kế."). With `subsets: ["latin"]` only, every
diacritic falls back to a different font mid-word — visibly mismatched glyphs. If `next build` rejects
`vietnamese` for a family ("Unknown subset"), drop to `["latin", "latin-ext"]` **for that family
only** and write down in the commit body which family lost the subset and why.

**`lang` changes `"en"` → `"vi"`.** The site's content is Vietnamese; `lang="en"` mis-declares it to
screen readers and to the browser's hyphenation. Plan 18b deliberately left this alone to keep its
own diff to the route-group move — this is the plan where the Vietnamese-facing chrome lands, so it
is the right place to correct it.

- [ ] **Step 4: Verify the build picks up the tokens and the fonts**

Run: `cd frontend && npm run build`
Expected: build succeeds; no "unresolved import" or PostCSS error for `tokens.css`; no "Unknown
subset" error from `next/font`.

Then confirm the fonts actually resolve, rather than assuming:

```bash
cd frontend
npm start & SERVER_PID=$!
for i in $(seq 1 30); do curl -sf -o /dev/null http://localhost:3000/ && break; sleep 1; done
curl -s http://localhost:3000/ | grep -o 'lang="[a-z]*"'
curl -s http://localhost:3000/ | grep -c "__variable\|font-display-face"
kill $SERVER_PID
```

Expected: `lang="vi"`, and a non-zero count — `next/font` injects a generated class carrying the
`--font-*-face` variables onto `<html>`. A zero count means the fonts are declared but not loaded,
which is the exact failure this step exists to catch.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/globals.css frontend/app/layout.tsx frontend/tokens.css
git commit -m "chore: wire Hallmark design tokens and load the three fonts they name"
```

---

### Task 2: `SiteNav` — N9 Edge-aligned minimal

**Files:**
- Create: `frontend/components/SiteNav.tsx`
- Test: `frontend/components/SiteNav.test.tsx`

**Interfaces:**
- Consumes: nothing (static wordmark + anchor link — no API call).
- Produces: `<SiteNav />`, mounted once in `app/(public)/layout.tsx` (Task 4) -- never in the true root `app/layout.tsx`.

- [ ] **Step 1: Write the failing test — wordmark and CTA are both present and the CTA points at `#templates`**

**Test idiom — read this before writing the file.** This repo has **no DOM test environment**:
`vitest.config.mjs` sets no `environment`, so tests run in Node with no `document`, and
`@testing-library/react`, `@testing-library/jest-dom` and `jsdom` are **not** in `package.json`.
All 9 existing test files render with `renderToString` from `react-dom/server` and assert on the
returned HTML string. Follow that idiom. **Do not `npm install` a testing library** — adding one is
an unapproved dependency + lockfile change, and `npm ci` in CI would fail on a stale lockfile.

```tsx
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteNav } from "./SiteNav";

describe("SiteNav", () => {
  it("renders the wordmark and a CTA linking to the templates section", () => {
    const html = renderToString(<SiteNav />);
    expect(html).toContain("PORTFOLIO");
    expect(html).toContain('href="#templates"');
    expect(html).toContain("Xem template");
  });

  // N9 is defined by the absence of a nav-link row, so the count is the assertion.
  it("renders exactly one anchor", () => {
    const html = renderToString(<SiteNav />);
    expect(html.match(/<a\s/g) ?? []).toHaveLength(1);
  });
});
```

`SiteNav` is a `"use client"` component, which `renderToString` still renders — `useEffect` simply
does not run, so what the test sees is the pre-scroll state. That is exactly the state being asserted.

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
- Produces: `<SiteFooter />`, mounted once in `app/(public)/layout.tsx` (Task 4) -- never in the true root `app/layout.tsx`.

- [ ] **Step 1: Write the failing test**

Same idiom as Task 2 — `renderToString`, no testing library.

```tsx
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "./SiteFooter";

describe("SiteFooter", () => {
  it("renders the wordmark, the admin login link, and the contact anchor", () => {
    const html = renderToString(<SiteFooter />);
    expect(html).toContain("PORTFOLIO");
    expect(html).toContain('href="/admin/login"');
    expect(html).toContain("Đăng nhập quản trị");
    expect(html).toContain('href="#contact"');
    expect(html).toContain("Liên hệ");
  });

  it("does not render a social icon row (none exist yet)", () => {
    const html = renderToString(<SiteFooter />);
    expect(html).not.toContain("<ul");
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

**Note on `new Date().getFullYear()`:** the home page prerenders as static (`○ (Static)` in the
build output), so this year is frozen at **build time**, not request time. On 1 January the footer
silently shows last year until the next deploy. Accepted for now — the site redeploys on every push
to `master` — but do not "fix" it by making the footer a client component, which would ship React
state for a constant.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/SiteFooter.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/components/SiteFooter.tsx frontend/components/SiteFooter.test.tsx
git commit -m "feat: add SiteFooter (Hallmark Ft1 mast-headed)"
```

---

### Task 4: Mount `SiteNav` + `SiteFooter` in `app/(public)/layout.tsx`

**Files:**
- Modify: `frontend/app/(public)/layout.tsx` (created as a pass-through by `2026-09-20-18b-frontend-route-groups.md`)

**Interfaces:**
- Consumes: `SiteNav`, `SiteFooter` from Task 2/3.
- Produces: every route inside the `(public)` route group renders with the shared chrome.
  `/admin/**` is a plain sibling directory outside `(public)` (plan 13) — Next.js never applies this
  group's layout to it, so no opt-out mechanism is needed on the admin side.

- [ ] **Step 1: Confirm the prerequisite ran**

Run: `test -f "frontend/app/(public)/layout.tsx" && echo present`
Expected: `present`. If missing, run `2026-09-20-18b-frontend-route-groups.md` first — do not mount
`SiteNav`/`SiteFooter` into the true root `app/layout.tsx`, that leaks them into `/admin/**`.

- [ ] **Step 2: Modify `app/(public)/layout.tsx`**

```tsx
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteNav />
      {children}
      <SiteFooter />
    </>
  );
}
```

The true root `frontend/app/layout.tsx` stays untouched — `<html>`/`<body>`/metadata only, rendering
just `{children}`. Do not add `SiteNav`/`SiteFooter` there.

- [ ] **Step 3: Run the full frontend test suite + build as the self-check**

Run: `cd frontend && npx vitest run && npm run build`
Expected: all existing + new tests PASS; `next build` succeeds with no type errors; the generated
route manifest shows `/` (not `/(public)`) as the path for the home page.

- [ ] **Step 4: Commit**

```bash
git add "frontend/app/(public)/layout.tsx"
git commit -m "feat: mount SiteNav and SiteFooter in the (public) route group layout"
```

## Self-Review Notes

- **Spec coverage:** implements design spec §4.1 (Nav) and §4.7 (Footer) in full — wordmark, single CTA, no link row, admin login + contact links, no fabricated social row.
- **Token discipline:** zero hard-coded colours/fonts; every visual value is a `var(--token)` reference back to `frontend/tokens.css`.
- **`/admin` isolation:** handled by plan 18b, which must run first. `SiteNav`/`SiteFooter` mount in `app/(public)/layout.tsx`; `app/admin/**` sits outside that route group, so Next.js never applies the public chrome to it. **This supersedes the earlier open risk recorded here** -- that text was written when the fix was still undecided, and when `app/admin/` was believed not to exist. It does exist (`app/admin/login/`, `app/admin/(dashboard)/`), and it needs no change: only the public tree moves.
- **This is the first of three landing-page plans.** Next: `2026-09-20-20-landing-hero-about.md`.

## Review findings applied (2026-09-20)

See `docs/reviews/2026-09-20-plan-review-19.md`. Two were blocking:

1. **Tests used `@testing-library/react` + `toBeInTheDocument()`, neither installed**, and
   `vitest.config.mjs` declares no DOM environment. Both test files rewritten to the
   `renderToString` idiom the other 9 test files already use.
2. **The three fonts were never loaded.** New Task 1 Step 3 loads them via `next/font/google` with
   the `vietnamese` subset, and corrects `lang="en"` → `"vi"`.

**Open decision, affects plans 20-23, not this plan:** plans 22 and 23 test with `fireEvent`
(click, change), which `renderToString` cannot do — those genuinely need a DOM. Before plan 22 runs,
the project owner has to decide whether to add `jsdom` + `@testing-library/react` +
`@testing-library/jest-dom` and set `environment: "jsdom"`. Plans 20 and 21 assert static markup
only and can be converted to `renderToString` like this plan was.
