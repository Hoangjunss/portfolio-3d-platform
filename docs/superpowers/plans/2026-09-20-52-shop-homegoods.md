# Home Goods/Furniture E-commerce Variant Implementation Plan (`shop-homegoods`)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Home Goods/Furniture e-commerce variant demo site (`templates/shop-homegoods/`,
slug `shop-homegoods`, `display_order` 22 — interactive-demo spec §4.1) as an independent Next.js
static-export app consuming `@portfolio/template-kit`: run its own `hallmark` design pass (warm
anchor hue, serif display direction), scaffold the app and compose `Hero` → `PricedItemGrid`
(products) → `Footer` with real seed data, and build a real cart feature (`useLocalCollection` +
`CartBadge`/`CartDrawer` + a mock checkout summary screen) with an interaction test per master spec
§7.

**Architecture:** This plan assumes `@portfolio/template-kit` (plan 30) already exists and is
importable — `Hero`, `PricedItemGrid`, `Footer`, `CartDrawer`, `CartBadge`, `useLocalCollection`,
`TemplateTheme`, `assertValidTheme` all ship from its barrel export
(`template-kit/src/index.ts`). This plan does not modify `template-kit` itself; if a site-specific
need surfaces during implementation that only `template-kit` can satisfy (a genuinely missing prop,
not a styling choice), that is a `template-kit` change proposed separately, not a bespoke
`templates/shop-homegoods/`-only component (interactive-demo spec §5's "what stays shared" rule).
This plan mirrors the baseline e-commerce site's plan
(`2026-09-20-34-ecommerce.md`) task-for-task — same cart mechanism, same task structure — differing
only in catalog, theme direction, and storage key.

**Tech Stack:** Next.js/React 19, `output: 'export'` static build, TypeScript, Vitest + Testing
Library + jsdom for the cart interaction test, `hallmark` skill (greenfield path) for the design
pass.

**Spec:** `docs/superpowers/specs/2026-09-20-site-shop-homegoods-design.md` (this site's seed data,
theme brief, and cart data flow) plus `docs/superpowers/specs/2026-09-20-interactive-demo-templates-design.md`
(§3.1 `useLocalCollection` contract, §4.1 the extra e-commerce variant row for this site, §3.3
`CartDrawer`/`CartBadge`, §5 the per-site Hallmark convention, §7 the per-site interaction-test gate,
§8 the design scoring gate) and `docs/superpowers/specs/2026-09-20-template-design-system-design.md`
(§4 `Hero`/`PricedItemGrid`/`Footer` behavior, §6 folder/thumbnail/export convention). The baseline
site's own spec (`2026-09-20-site-ecommerce-design.md` §4) is the authoritative description of the
cart mechanism this plan's Task 3 reuses; this site's own spec §4 only restates the one thing that
differs (storage key).

## Global Constraints

- **Hard prerequisite: plan 30 must be landed and its tests passing** before Task 2 can import
  anything from `@portfolio/template-kit` — if `template-kit/` does not yet exist in this repo when
  this plan's execution starts, stop and land plan 30 first; do not stub or duplicate kit
  components inside `templates/shop-homegoods/`.
- No comments restating what code does; only comments explaining non-obvious "why" (matches plan
  30's convention, carried over to this site's own code).
- **No fabricated content.** Product names/prices in the seed data (spec §3.1) are the fictional
  but realistic set already authored in the site spec — do not invent additional "real-sounding"
  stats, testimonials, or review counts anywhere on this page (parent spec §5 / interactive-demo
  spec §5).
- **Theming is a starting direction, not a fixed pick** — `templates/shop-homegoods/theme.ts` must
  satisfy `template-kit`'s `TemplateTheme` shape and pass `assertValidTheme` at build time; its
  actual values come only from Task 1's real Hallmark session. Interactive-demo spec §4.1 assigns
  "warm anchor hue, serif display" as this site's starting family — the session confirms/refines the
  specific hue and serif pairing within that family, it does not invent an unrelated direction
  (interactive-demo spec §5).
- **Render-pattern rule (interactive-demo spec §3.1, non-negotiable):** the product grid (`Hero` →
  `PricedItemGrid` → `Footer`) renders directly from the imported seed file at the page-component
  level — this is what appears in the static HTML export and on first paint. `useLocalCollection`
  only takes over, client-side, for the cart's own mutable state (`CartBadge`/`CartDrawer`), mounted
  inside a client component that hydrates after the static shell is already visible. The page must
  never gate its initial visible content (the product grid) behind `useLocalCollection`'s hydration.
- `next.config.js` requires `output: 'export'` — the deployment convention every one of the 29 sites
  follows (parent spec §6, interactive-demo spec §6); a build that doesn't export statically cannot
  be deployed by the existing CI/Nginx convention.
- `public/thumbnail.webp` is mandatory — `template-kit`'s `check-thumbnail.mjs` (plan 30 Task 2)
  must pass against this site's own file before `npm run build` succeeds (master spec §7's build
  gate: "`npm run build` succeeds + thumbnail present").
- **Cart storage key is `'shop-homegoods-cart'`**, not the baseline's `'ecommerce-cart'` — per
  interactive-demo spec §3.1's storageKey-isolation contract and this site's own spec §4.1, so this
  site's cart data never collides with the baseline site's or the other two extra e-commerce
  variants' cart data in a shared browser.
- Current baseline per `docs/superpowers/STATUS.md`: **re-read `STATUS.md`'s own header for the
  actual current test-count baseline before reporting** — plan 30 and any sites authored/landed
  before this one may have changed it.

---

## Task 1: Hallmark design pass

**Files:**
- Create: `templates/shop-homegoods/theme.ts`
- Create: `templates/shop-homegoods/app/globals.css`

**Interfaces:**
- Consumes: `TemplateTheme` type and `assertValidTheme` from `@portfolio/template-kit` (plan 30
  Task 2) — `theme.ts` must export a value that satisfies `TemplateTheme` and passes
  `assertValidTheme` without throwing.
- Produces: the token set every later task in this plan (Tasks 2-3) and the design-score table
  (Task 3) build against and are scored against.

### Process

- [ ] **Step 1: Invoke the `hallmark` skill, greenfield path**, with the industry/mood direction
  from `docs/superpowers/specs/2026-09-20-site-shop-homegoods-design.md` §5 as the starting brief: a
  home goods/furniture storefront (fictional brand "Mộc Nhà"), warm anchor hue + serif display as
  the assigned starting family (interactive-demo spec §4.1), with the 3 reference directions listed
  in that section as research starting points, not fixed commitments. Follow the skill's own
  research → direction → token-authoring process; do not shortcut to picking a font pair and hex
  values without the research step the skill defines.
- [ ] **Step 2: Confirm/refine the warm-hue family and serif pairing** within the assigned starting
  direction (unlike the baseline `ecommerce` site, which leaves cool-vs-warm fully open, this site's
  family is fixed by interactive-demo spec §4.1 — the open decision here is which specific warm hue
  and which serif/body pairing best fit "Mộc Nhà" without collapsing into rustic/farmhouse cliché)
  — the session's output must state what it picked and why, so the record exists for future
  criterion #10 comparisons against sibling sites (especially `ecommerce` and `shop-streetwear`).
- [ ] **Step 3: Author `templates/shop-homegoods/theme.ts`** exporting a `TemplateTheme`-conforming
  object (at minimum `accentHue`, `displayFont`, `bodyFont` per `template-kit`'s current shape —
  extend only if the Hallmark session's output genuinely needs a field `TemplateTheme` doesn't yet
  have, in which case that is a `template-kit` change proposed separately, not a local workaround)
  and calling `assertValidTheme` on it at module scope so an invalid theme fails the build loudly
  rather than shipping silently.
- [ ] **Step 4: Author `templates/shop-homegoods/app/globals.css`** with the session's actual token
  values (`--color-*`, `--font-*`, `--space-*` custom properties matching `template-kit`'s CSS
  variable name contract, parent spec §5) plus this site's `theme.ts` mood applied — importing
  `template-kit`'s base tokens and overriding values per the session's picks, not redefining the
  variable *names*.
- [ ] **Step 5: Verify `assertValidTheme(themeFromThemeTs)` does not throw** — run a one-off
  `node --loader ts-node/esm -e "..."` (or the project's existing TS execution convention) that
  imports `templates/shop-homegoods/theme.ts` and calls `assertValidTheme` on its default/named
  export, confirming no error.

### Acceptance criteria

- `templates/shop-homegoods/theme.ts` exists, exports a value satisfying `template-kit`'s
  `TemplateTheme` shape, and calling `assertValidTheme` on it does not throw.
- `templates/shop-homegoods/app/globals.css` exists and defines real values (not placeholders, not
  copied verbatim from another site) for every custom property `template-kit`'s components read.
- The Hallmark session's direction and warm-hue/serif-pairing decision (Step 2) are recorded —
  either inline as a short comment block at the top of `theme.ts` explaining the "why" (non-obvious
  per this plan's Global Constraints comment rule — a design decision is not "restating what code
  does") or in this plan file's own Task 1 notes once executed; either location is acceptable as
  long as a later reader can see the decision was made deliberately, not defaulted.
- Real hex/font/spacing values are **not** written into this plan file — only into the two output
  files above, per this plan's "No Placeholders" exception for Task 1 (concrete values are a real
  future Hallmark-session output, not something this plan fabricates ahead of that session).

- [ ] **Step 6: Commit** — `feat(shop-homegoods): Hallmark design pass — theme tokens`

---

## Task 2: Next.js app scaffold + static page composition

**Files:**
- Create: `templates/shop-homegoods/app/layout.tsx`
- Create: `templates/shop-homegoods/app/page.tsx`
- Create: `templates/shop-homegoods/data/seed.ts`
- Create: `templates/shop-homegoods/public/thumbnail.webp` (placeholder — see Step 5 note)
- Create: `templates/shop-homegoods/next.config.js`
- Create: `templates/shop-homegoods/package.json`
- Test: `templates/shop-homegoods/scripts/build-gate.test.mjs`

**Interfaces:**
- Consumes: `Hero`, `PricedItemGrid`, `Footer` from `@portfolio/template-kit`'s barrel export (plan
  30 Task 5); `templates/shop-homegoods/theme.ts` / `app/globals.css` (Task 1).
- Produces: a building, statically-exportable page at `templates/shop-homegoods/` that Task 3's cart
  feature mounts inside, and the `public/thumbnail.webp` the portfolio platform's 3D carousel (main
  spec plan 12) resolves via the `templates` table row already seeded for `shop-homegoods` (plan 30
  Task 1, `display_order` 22).

### Design decisions

**(a) `page.tsx` composes `Hero` → `PricedItemGrid` → `Footer` as a server component reading
directly from `templates/shop-homegoods/data/seed.ts`** — per this plan's Global Constraints
render-pattern rule, no `useLocalCollection` call lives in `page.tsx` itself; the cart client
component (Task 3) is mounted as a sibling inside `layout.tsx` (for `CartBadge` in the header, which
must appear on every page/scroll position per spec §2) and inside `page.tsx` (for `CartDrawer`,
opened from the badge), not wrapping the static content.

**(b) `PricedItemGrid`'s `onSelect` is wired to the cart's `add`-or-`update` handler exposed by
Task 3's client component**, passed down via a small client-boundary wrapper (`page.tsx` stays a
server component; a thin `'use client'` wrapper around `PricedItemGrid` + the cart hook is Task 3's
job, not duplicated here) — Task 2 only needs the product grid to render correctly with a no-op
`onSelect` until Task 3 wires the real handler in, since `PricedItemGrid` itself never assumes cart
state exists (plan 30 Task 3, decision (i): kit components take everything via props).

**(c) `next.config.js` sets `output: 'export'`** per parent spec §6 — non-negotiable, this is what
lets the CI/Nginx convention (main spec §7, plan 17) deploy this site's static files to
`/var/www/templates/shop-homegoods/`.

**(d) `package.json`'s `build` script runs `template-kit`'s `check-thumbnail.mjs` before `next
build`** — same convention plan 30 Task 2 designed for every site to consume (decision (h) in that
plan): `"build": "node ../../template-kit/scripts/check-thumbnail.mjs public/thumbnail.webp && next
build"` (relative path adjusted to this repo's actual `template-kit/` location once plan 30 lands).

- [ ] **Step 1: Write the failing build-gate test**

```javascript
// templates/shop-homegoods/scripts/build-gate.test.mjs
import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const SITE_ROOT = path.resolve(import.meta.dirname, '..');

describe('shop-homegoods build gate', () => {
  it('public/thumbnail.webp exists', () => {
    expect(existsSync(path.join(SITE_ROOT, 'public', 'thumbnail.webp'))).toBe(true);
  });

  it('npm run build succeeds and produces a static export', () => {
    execSync('npm run build', { cwd: SITE_ROOT, stdio: 'pipe' });
    expect(existsSync(path.join(SITE_ROOT, 'out', 'index.html'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `cd templates/shop-homegoods && npx vitest run
  scripts/build-gate.test.mjs` (directory/package don't exist yet, expect failure).
- [ ] **Step 3: `templates/shop-homegoods/data/seed.ts`** — the `PRODUCTS` array exactly as
  specified in `docs/superpowers/specs/2026-09-20-site-shop-homegoods-design.md` §3.1 (12
  `ProductItem` rows, `id`/`title`/`price` fields, no `image`), plus a small `STORE_NAME = 'Mộc
  Nhà'` constant `Hero` and `layout.tsx` both read for headline/nav copy consistency.
- [ ] **Step 4: `templates/shop-homegoods/next.config.js`**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
};

module.exports = nextConfig;
```

- [ ] **Step 5: `templates/shop-homegoods/public/thumbnail.webp`** — a minimal valid WEBP file
  (passes `template-kit`'s magic-byte check, plan 30 Task 2 decision (h)) standing in for the real
  screenshot an admin uploads later through the media library (parent spec §6 — the deployed file
  and the `templates.thumbnail_media_id` row are related by that manual step, not by this plan). Not
  a placeholder *value* inside a spec/plan file — this is a real binary file this task is required
  to produce so the build gate can pass; swapping in the real product-photo screenshot later is an
  ordinary content update, not a re-scaffold.
- [ ] **Step 6: `templates/shop-homegoods/package.json`**

```json
{
  "name": "shop-homegoods",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "build": "node ../../template-kit/scripts/check-thumbnail.mjs public/thumbnail.webp && next build",
    "dev": "next dev",
    "test": "vitest run"
  },
  "dependencies": {
    "@portfolio/template-kit": "*",
    "next": "15.5.0",
    "react": "19.2.0",
    "react-dom": "19.2.0"
  },
  "devDependencies": {
    "typescript": "5.6.3",
    "vitest": "5.0.1",
    "@testing-library/react": "16.3.3",
    "@testing-library/jest-dom": "7.0.1",
    "jsdom": "30.1.0"
  }
}
```

- [ ] **Step 7: `templates/shop-homegoods/app/layout.tsx`** — root layout importing `app/globals.css`
  (Task 1), rendering a header containing the store name/nav and the cart client wrapper's
  `CartBadge` slot (Task 3 fills the actual `CartBadge` import in; this task renders the header
  structure and leaves the badge's mount point as Task 3's own client component boundary so
  `layout.tsx` itself stays a server component per Next.js App Router convention).
- [ ] **Step 8: `templates/shop-homegoods/app/page.tsx`** — composes `Hero` (headline/subhead/CTA
  scrolling to the product grid anchor, per spec §2) → `PricedItemGrid` (`currency="VND"`,
  `items=PRODUCTS`, `ctaLabel="Add to cart"`, `onSelect` passed through from the cart client
  wrapper Task 3 provides) → `Footer` (link set: Shop, About, Shipping & Returns, Contact;
  `showSocial={true}`), reading `PRODUCTS`/`STORE_NAME` from `data/seed.ts` directly (no
  `useLocalCollection` call in this file, per Global Constraints).
- [ ] **Step 9: Run the build-gate test, verify it passes** — `cd templates/shop-homegoods && npm
  install && npx vitest run scripts/build-gate.test.mjs`.
- [ ] **Step 10: Mutation checks**

| # | Revert | Test that must go RED |
|---|---|---|
| M1 | delete `public/thumbnail.webp` | the thumbnail-exists test |
| M2 | remove `output: 'export'` from `next.config.js` | the `npm run build` produces no `out/index.html` (build still "succeeds" but the export step never runs, so the assertion on `out/index.html` fails) |

- [ ] **Step 11: Commit** — `feat(shop-homegoods): scaffold Next.js app, compose Hero/PricedItemGrid/Footer with seed data`

---

## Task 3: Cart feature + checkout mock summary + design score

**Files:**
- Create: `templates/shop-homegoods/app/CartProvider.tsx`
- Create: `templates/shop-homegoods/app/CheckoutSummary.tsx`
- Create: `templates/shop-homegoods/app/CartProvider.test.tsx`

**Interfaces:**
- Consumes: `useLocalCollection`, `CartBadge`, `CartDrawer` from `@portfolio/template-kit`'s barrel
  export (plan 30 Tasks 4-5); `PRODUCTS` from `templates/shop-homegoods/data/seed.ts` (Task 2).
- Produces: the real cart behavior wired into `layout.tsx`'s header (`CartBadge`) and `page.tsx`'s
  `PricedItemGrid` `onSelect` (`CartDrawer` + add-to-cart logic) left as stubs by Task 2; the mock
  checkout summary screen this site's `CartDrawer.onCheckout` opens.

### Design decisions

**(e) `CartProvider.tsx` is a single `'use client'` component owning the
`useLocalCollection<CartLine>('shop-homegoods-cart', [])` call** — note the storage key is
`'shop-homegoods-cart'`, distinct from the baseline `ecommerce` site's `'ecommerce-cart'` and from
the other two extra e-commerce variants' own keys, per interactive-demo spec §3.1's isolation
contract and this site's own spec §4.1 — exposing `CartBadge` and `CartDrawer` (with the
add-or-update-qty logic from this site's spec §4.3, itself a restatement of the baseline site spec
§4.3, wired into a handler it exposes for `page.tsx`'s `PricedItemGrid.onSelect`) so there is
exactly one hook instance for the whole page — matching the hook's storageKey-isolation contract
(plan 30 Task 4) and avoiding two independent `useLocalCollection` calls silently diverging.

**(f) Seed is the empty array literal, not imported from `data/seed.ts`** — per spec §4.2, a cart
starts empty for every visitor; `PRODUCTS` (Task 2) is the catalog the cart's lines are *built from*
at add-time, never the cart's own seed data.

**(g) `CheckoutSummary.tsx` is a presentational component, not a route** — rendered conditionally
inside `CartProvider`'s own state (`checkoutOpen: boolean`) toggled by `CartDrawer.onCheckout`, per
this site's spec §4.3 (which defers to the baseline site spec §4.5's exact mechanism): computes
subtotal from the current cart lines, adds a fixed mock shipping fee presented as this fictional
storefront's own content (implementer's call on the exact figure, appropriate to furniture-scale
shipping rather than the baseline's small-goods figure), shows a total, and a "This is a demo — no
order was placed" notice with a "Continue shopping" action that closes the summary without mutating
the cart.

- [ ] **Step 1: Write the failing interaction test**

```tsx
// templates/shop-homegoods/app/CartProvider.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CartProvider } from './CartProvider';
import { PRODUCTS } from '../data/seed';

beforeEach(() => {
  window.localStorage.clear();
});

describe('shop-homegoods cart', () => {
  it('add item updates the cart badge count', async () => {
    const { unmount } = render(<CartProvider products={PRODUCTS} />);
    expect(screen.getByText('0')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /add to cart/i })[0]);

    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
    unmount();
  });

  it('adding the same product twice increments qty instead of duplicating the line', async () => {
    render(<CartProvider products={PRODUCTS} />);
    const addButtons = screen.getAllByRole('button', { name: /add to cart/i });

    fireEvent.click(addButtons[0]);
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());

    fireEvent.click(addButtons[0]);
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText(/open cart/i));
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('reload (remount) still shows the item that was added', async () => {
    const { unmount } = render(<CartProvider products={PRODUCTS} />);
    fireEvent.click(screen.getAllByRole('button', { name: /add to cart/i })[0]);
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
    unmount();

    render(<CartProvider products={PRODUCTS} />);
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
  });

  it('qty change updates the badge total', async () => {
    render(<CartProvider products={PRODUCTS} />);
    fireEvent.click(screen.getAllByRole('button', { name: /add to cart/i })[0]);
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText(/open cart/i));
    fireEvent.change(screen.getByLabelText(/quantity/i), { target: { value: '4' } });

    await waitFor(() => expect(screen.getByText('4')).toBeInTheDocument());
  });

  it('remove drops the line and zeroes the badge', async () => {
    render(<CartProvider products={PRODUCTS} />);
    fireEvent.click(screen.getAllByRole('button', { name: /add to cart/i })[0]);
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText(/open cart/i));
    fireEvent.click(screen.getByRole('button', { name: /remove/i }));

    await waitFor(() => expect(screen.getByText('0')).toBeInTheDocument());
  });

  it('checkout shows a summary with subtotal, shipping, and total, and does not clear the cart', async () => {
    render(<CartProvider products={PRODUCTS} />);
    fireEvent.click(screen.getAllByRole('button', { name: /add to cart/i })[0]);
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText(/open cart/i));
    fireEvent.click(screen.getByRole('button', { name: /checkout/i }));

    expect(await screen.findByText(/no order was placed/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /continue shopping/i }));
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('cart is isolated under its own storage key, not the baseline ecommerce site\'s key', async () => {
    render(<CartProvider products={PRODUCTS} />);
    fireEvent.click(screen.getAllByRole('button', { name: /add to cart/i })[0]);
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());

    expect(window.localStorage.getItem('ecommerce-cart')).toBeNull();
    expect(window.localStorage.getItem('shop-homegoods-cart')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails** — module doesn't exist.
- [ ] **Step 3: `templates/shop-homegoods/app/CartProvider.tsx`**
- [ ] **Step 4: `templates/shop-homegoods/app/CheckoutSummary.tsx`**
- [ ] **Step 5: Wire `CartProvider`'s `CartBadge` into `app/layout.tsx`'s header slot and
  `CartProvider`'s exposed add-to-cart handler into `app/page.tsx`'s `PricedItemGrid.onSelect`**
  (closing the stubs Task 2 left open, per that task's decision (b)).
- [ ] **Step 6: Run `cd templates/shop-homegoods && npx vitest run`, verify all pass.**
- [ ] **Step 7: Mutation checks**

| # | Revert | Test that must go RED |
|---|---|---|
| M3 | make add-to-cart always call `add(...)`, never checking for an existing line | the "adding the same product twice increments qty instead of duplicating" test |
| M4 | make `CheckoutSummary`'s "Continue shopping" also call `reset()` on the cart | the "does not clear the cart" assertion in the checkout test |
| M5 | seed `CartProvider`'s `useLocalCollection` from `PRODUCTS` instead of `[]` | the initial `screen.getByText('0')` assertion at the start of the first test |
| M6 | hardcode `CartProvider`'s `useLocalCollection` storage key to `'ecommerce-cart'` instead of `'shop-homegoods-cart'` | the storage-key isolation test |

- [ ] **Step 8: Commit** — `feat(shop-homegoods): add cart feature with mock checkout summary`

### Design score

Per master spec (`2026-09-20-interactive-demo-templates-design.md`) §8 — scored 0-10, bar is
maximum achievable score per criterion, not a passing minimum. To be filled in by whoever runs the
Hallmark `audit` pass against the implemented site, after Task 3 lands — **not scored by this
plan**; the table below is the required structure only.

| # | Criterion | Score | Notes |
|---|---|---|---|
| 1 | Anti-generic / anti-AI-slop | TBD | |
| 2 | Typographic craft | TBD | |
| 3 | Color system coherence | TBD | |
| 4 | Layout/spacing rhythm | TBD | |
| 5 | Motion & interaction polish | TBD | |
| 6 | Responsive integrity | TBD | |
| 7 | Accessibility | TBD | |
| 8 | Content authenticity | TBD | |
| 9 | Interaction correctness | TBD | |
| 10 | Brand/industry distinctiveness | TBD | |

- [ ] **Step 9: Run the Hallmark `audit` capability against the built site**, score every criterion,
  fill in the table above. Any criterion below 9/10 is not done — fix and re-score before marking
  this plan complete (master spec §8). A criterion that cannot reach 9-10/10 without a real
  trade-off must say so explicitly in its Notes cell with a one-line reason, not a silently inflated
  number.

---

## Self-Review Notes

- **Spec coverage:** interactive-demo spec §3.1 (Task 3's `useLocalCollection` use), §4.1 (this
  site's row in the extra e-commerce variants table — catalog/theme direction), §3.3 (Task 2/3's
  `CartDrawer`/`CartBadge` composition), §5 (Task 1's Hallmark pass), §7 (Task 3's interaction
  test), §8 (Task 3's design-score table), §9 (this plan is "plan 52" in that section's execution
  order). Parent spec §4 (Task 2's `Hero`/`PricedItemGrid`/`Footer` composition, amended per this
  site's spec §2 for the real `onSelect`), §6 (Task 2's folder/thumbnail/export convention). Site
  spec `2026-09-20-site-shop-homegoods-design.md` §3 (Task 2's seed data), §4 (Task 3's cart data
  flow and storage key), §5 (Task 1's design brief).
- **Explicitly not built here:** any change to `template-kit` itself (a genuinely missing kit
  capability is a separate `template-kit` plan, not a local workaround per interactive-demo spec
  §5); the baseline `ecommerce` site and the other extra e-commerce variants
  (`shop-streetwear`/`shop-electronics`, interactive-demo spec §4.1 — separate plans, `ecommerce`
  already plan 34); real thumbnail upload through the admin media library (parent spec §6, an admin
  action); CI wiring for this site's own static-export deploy (plan 17, a parameter change to an
  existing pipeline, out of scope here per interactive-demo spec §10).
- **Hard prerequisite carried through every task:** plan 30 (`template-kit` scaffold) must be landed
  before Task 2 can import `Hero`/`PricedItemGrid`/`Footer`/`CartDrawer`/`CartBadge`/
  `useLocalCollection`, and before Task 1's `theme.ts` can import `TemplateTheme`/`assertValidTheme`.
- **Type consistency checked:** `CartProvider`'s `CartLine` usage (Task 3) is exactly
  `template-kit`'s existing `CartLine` shape (`id`/`title`/`price`/`qty`, plan 30 Task 5) — no new
  fields invented for this site, matching the site spec §4.1's explicit statement that this is not a
  bespoke extension. Only the storage key (`'shop-homegoods-cart'`) and the seed catalog differ from
  the baseline plan's own Task 3.
- **Next step:** once this plan's design score (Task 3) clears the 9/10 bar on every criterion, this
  plan is complete. The remaining extra e-commerce variant plan (`shop-electronics`, interactive-demo
  spec §4.1) can reuse this plan's Task 2/3 structure nearly verbatim, swapping only the seed catalog,
  storage key, and the Hallmark brief's committed hue family.
