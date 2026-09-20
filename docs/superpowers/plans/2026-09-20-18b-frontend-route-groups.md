# Frontend Route Groups — Public/Admin Layout Isolation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `frontend/app/` into a `(public)` route group before any shared public chrome
(`SiteNav`/`SiteFooter`, plan 19) or the admin tree (`app/admin/**`, plan 13) exist side by side —
so mounting the public nav/footer in a layout can never leak into `/admin/**`.

**Why now:** plan 19 (landing nav/footer) flagged in its Self-Review Notes that mounting `SiteNav`/
`SiteFooter` directly in the true root `app/layout.tsx` would leak them onto every `/admin/**` route,
because `app/admin/` is a plain subdirectory, not an isolated route-group layout. This plan is a
prerequisite for plan 19 Task 4 and must run before it.

**Corrected premise (2026-09-20):** an earlier draft of this plan claimed `app/admin/` did not exist
yet. It does -- plan 13/14 have run, and the tree is `app/admin/login/page.tsx` plus
`app/admin/(dashboard)/{layout,page,leads,templates}`. Nothing below changes because of that: this
plan only moves the public page, and `admin/` is already a sibling outside `(public)`, which is
exactly the end state we want. Do not touch it.

**Architecture:** Next.js App Router route groups (`(folder)`) create additional root-level layouts
without adding a URL segment. `app/layout.tsx` stays the single true root (`<html>`/`<body>`,
metadata) and renders *only* `{children}` — no nav, no footer. `app/(public)/layout.tsx` (created by
plan 19, not this plan) will be where `SiteNav`/`SiteFooter` mount, wrapping every public page.
`app/admin/**` (already created by plan 13/14) stays a plain sibling directory outside `(public)` — Next.js
does not apply a route group's layout to siblings outside that group, so `/admin/**` never sees the
public chrome, with zero extra config.

**Tech Stack:** Next.js App Router route groups (no new dependency).

**Spec:** `docs/superpowers/specs/2026-09-20-landing-page-ui-design.md` §4 (section order assumes a
public-only chrome).

**Depends on:** `2026-09-19-11-frontend-scaffold.md` (needs `app/page.tsx` to exist). **Required by:**
`2026-09-20-19-landing-nav-footer.md` Task 4 (targets `app/(public)/layout.tsx`, not `app/layout.tsx`).
Plan 13/14 have already created `app/admin/**`; Step 1 verifies it is not nested inside `(public)`.

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
Expected: `app/` contains `admin/`, `globals.css`, `layout.tsx`, `page.tsx`. The `admin/` directory
**is supposed to be there** -- plan 13/14 created it. The only thing to confirm is that it sits at
`frontend/app/admin/` and NOT at `frontend/app/(public)/admin/`. If that holds, continue; this plan
never touches it.

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

This step is a read-only check. `lang` is `"en"` on disk and stays `"en"` -- do not "fix" it to
`"vi"` or anything else; changing it is outside this plan's scope.

If plan 19 already ran and added `SiteNav`/`SiteFooter` directly to this file, move those two lines
into `app/(public)/layout.tsx` from Step 3 instead, and revert this file to the shape above.

- [ ] **Step 5: Verify the URL is unaffected by the route group**

Run:

```bash
cd frontend
npm run build
npm start & SERVER_PID=$!
for i in $(seq 1 30); do curl -sf -o /dev/null http://localhost:3000/ && break; sleep 1; done
curl -s -o /dev/null -w "%{http_code}
" http://localhost:3000/
kill $SERVER_PID
```

Expected: `next build` succeeds and its route table lists `/` (not `/(public)/`); the final `curl`
prints `200`.

The readiness loop and the `kill` both matter: a bare `npm run dev &` followed immediately by `curl`
races the server's startup and reports a false failure, and without the `kill` the server outlives
the step and holds port 3000 against every later run. Use `npm start` (the production server over the
build you just made), not `npm run dev`.

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
