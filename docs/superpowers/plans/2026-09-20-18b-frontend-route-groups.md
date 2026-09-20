# Frontend Route Groups — Public/Admin Layout Isolation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `frontend/app/` into a `(public)` route group before any shared public chrome
(`SiteNav`/`SiteFooter`, plan 19) or the admin tree (`app/admin/**`, plan 13) exist side by side —
so mounting the public nav/footer in a layout can never leak into `/admin/**`.

**Why now:** plan 19 (landing nav/footer) flagged in its Self-Review Notes that mounting `SiteNav`/
`SiteFooter` directly in the true root `app/layout.tsx` would leak them onto every `/admin/**` route,
because `app/admin/` today is a plain subdirectory, not an isolated route-group layout. This plan is
a prerequisite for plan 19 Task 4 and must run before it. `app/admin/` does not exist on disk yet
(plan 13/14 haven't run), so this is a clean move, not a refactor of existing admin code.

**Architecture:** Next.js App Router route groups (`(folder)`) create additional root-level layouts
without adding a URL segment. `app/layout.tsx` stays the single true root (`<html>`/`<body>`,
metadata) and renders *only* `{children}` — no nav, no footer. `app/(public)/layout.tsx` (created by
plan 19, not this plan) will be where `SiteNav`/`SiteFooter` mount, wrapping every public page.
`app/admin/**` (created later by plan 13) stays a plain sibling directory outside `(public)` — Next.js
does not apply a route group's layout to siblings outside that group, so `/admin/**` never sees the
public chrome, with zero extra config.

**Tech Stack:** Next.js App Router route groups (no new dependency).

**Spec:** `docs/superpowers/specs/2026-09-20-landing-page-ui-design.md` §4 (section order assumes a
public-only chrome).

**Depends on:** `2026-09-19-11-frontend-scaffold.md` (needs `app/page.tsx` to exist). **Required by:**
`2026-09-20-19-landing-nav-footer.md` Task 4 (targets `app/(public)/layout.tsx`, not `app/layout.tsx`).
**Must run before:** `2026-09-19-13-admin-auth-middleware.md` if that plan has not yet created
`app/admin/**` — if it already has by the time this runs, verify `app/admin/` is NOT accidentally
nested inside `(public)` before proceeding (Step 1 checks this).

## Global Constraints

- No comments restating what code does; only comments explaining non-obvious "why".
- Route group folders (`(public)`) must not appear in the URL — verify with a build + manual route
  check, not just by reading the folder name.
- Do not touch `app/admin/**` in this plan even if it already exists — this plan only isolates the
  public tree; admin isolation is automatic once `(public)` exists, as long as `admin/` stays outside it.

---

### Task 1: Move the public page into a `(public)` route group

**Files:**
- Move: `frontend/app/page.tsx` → `frontend/app/(public)/page.tsx`
- Create: `frontend/app/(public)/layout.tsx` (pass-through only — plan 19 Task 4 fills it with `SiteNav`/`SiteFooter`)
- Modify: `frontend/app/layout.tsx` (confirm it stays minimal — no nav/footer added here)

**Interfaces:**
- Produces: a route group boundary so a later layout at `app/(public)/layout.tsx` can wrap only the
  public tree without affecting `/admin/**` or any other top-level route Next.js resolves later.

- [ ] **Step 1: Confirm current state before moving anything**

Run: `ls frontend/app` and `cat frontend/app/layout.tsx`
Expected: `app/` contains `globals.css`, `layout.tsx`, `page.tsx` only — no `admin/` directory yet.
If `admin/` already exists, stop and confirm it sits at `frontend/app/admin/`, not
`frontend/app/(public)/admin/`, before continuing.

- [ ] **Step 2: Create the route group and move the page**

```bash
mkdir -p "frontend/app/(public)"
git mv frontend/app/page.tsx "frontend/app/(public)/page.tsx"
```

- [ ] **Step 3: Add a pass-through layout for the group**

```tsx
// frontend/app/(public)/layout.tsx
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

This is intentionally a no-op wrapper for now — plan 19 Task 4 replaces the body with
`<SiteNav />{children}<SiteFooter />`. Keeping this plan's scope to "make the group exist and prove
the URL is unaffected" avoids coupling it to components that don't exist yet.

- [ ] **Step 4: Confirm the root layout has no nav/footer and only renders `{children}`**

```tsx
// frontend/app/layout.tsx — unchanged from plan 11 scaffold
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
```

If plan 19 already ran and added `SiteNav`/`SiteFooter` directly to this file, move those two lines
into `app/(public)/layout.tsx` from Step 3 instead, and revert this file to the shape above.

- [ ] **Step 5: Verify the URL is unaffected by the route group**

Run: `cd frontend && npm run build && npm run dev &` then `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/`
Expected: `next build` succeeds (route groups never appear in the generated route manifest as a URL
segment); `curl` returns `200` for `/` — the route group folder name `(public)` does not become part
of the path.

- [ ] **Step 6: Run the existing test suite as a regression check**

Run: `cd frontend && npx vitest run`
Expected: all existing tests still PASS (this plan moves one file and adds one pass-through layout —
nothing that existing tests import should have moved).

- [ ] **Step 7: Commit**

```bash
git add frontend/app
git commit -m "chore: isolate public routes into a (public) route group before mounting shared chrome"
```

## Self-Review Notes

- **Spec coverage:** n/a (infra-only, no product behavior change) — this plan exists purely to make
  plan 19's Task 4 safe to run without leaking public nav/footer into `/admin/**`.
- **Verified claim:** route groups are a Next.js App Router primitive specifically for this case —
  "organize routes without affecting the URL path." No new dependency, no runtime cost.
- **Downstream effect:** plan 19 Task 4 must be read as amended — it now modifies
  `app/(public)/layout.tsx` (created in Step 3 above), not `app/layout.tsx`. The plan 19 file itself
  has been updated to reflect this; if it hasn't, treat this note as the source of truth.
- **Next:** `2026-09-20-19-landing-nav-footer.md` Task 4, then plan 13 (admin middleware) can safely
  create `app/admin/**` as a plain sibling directory at any time — no ordering dependency between the
  two trees once this plan is done.
