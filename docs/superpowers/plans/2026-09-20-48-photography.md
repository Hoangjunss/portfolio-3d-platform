# Photography Demo Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `photography` demo template site (`templates/photography/`) — plan 48 of the 29
site plans under the interactive-demo templates program (category #18, Photography Studio). Run a
real per-site Hallmark design pass, scaffold the static Next.js export composing `Hero` →
`PhotoGallery`(full-bleed masonry, lightbox) → `PricedItemGrid`(packages/pricing) → `Footer` from
`@portfolio/template-kit`, and build its favorite/filter interactive feature on
`useLocalCollection`.

**Architecture:** This plan is plan 48 in the interactive-demo spec's §9 execution order — one of
plans 31-59, independent of the other 28 once plan 30 lands. It has one hard prerequisite:
`2026-09-20-30-template-kit-scaffold.md` must be complete and committed (`@portfolio/template-kit`
built, tested, exporting `Hero`, `PhotoGallery`, `PricedItemGrid`, `Footer`, `useLocalCollection`,
`TemplateTheme`/`assertValidTheme` from its barrel `src/index.ts`). This plan does not modify
`template-kit` itself — it only consumes it. Task 1 runs a real Hallmark design session (not a
scaffold/placeholder step) and commits its own theme output; Task 2 scaffolds the Next.js app and
static composition; Task 3 builds the favorite/filter interactive feature, its interaction test,
plus the design-scoring self-audit.

**Tech Stack:** Next.js 15 / React 19 static export (`output: 'export'`), TypeScript, Vitest +
Testing Library + jsdom for the interaction test, `@portfolio/template-kit` as a local workspace
dependency. No backend change — this plan touches nothing under `backend/`.

**Spec:** `docs/superpowers/specs/2026-09-20-site-photography-design.md` (section composition, seed
data shape/content, favorite/filter data flow, Hallmark design brief) plus the two specs it is
scoped by: `docs/superpowers/specs/2026-09-20-interactive-demo-templates-design.md` (§3.1
`useLocalCollection` contract, §3.2 row #18 the favorite/filter feature, §5 per-site Hallmark
requirement, §7 the build+interaction test gate, §8 the 10-criterion design scoring gate, §9
execution order) and `docs/superpowers/specs/2026-09-20-template-design-system-design.md` (§3 row 18
distinguishing sections, §4 component behavior/prop contracts, §6 folder/thumbnail/slug
convention).

## Global Constraints

- **Hard prerequisite: plan 30 must be committed first.** Do not start Task 2 until
  `@portfolio/template-kit`'s barrel export (`template-kit/src/index.ts`) exists and its own test
  suite passes — this plan imports from it, it does not vendor or reimplement any kit component.
- **`slug` = `photography`, `subdomain` = `photography`, `display_order` = 18** — fixed by plan 30
  Task 1's authoritative slug table; do not deviate.
- No comments restating what code does; only comments explaining non-obvious "why" (same rule as
  plan 30/31).
- **No fabricated content.** Seed data (the 13 gallery photos, the 3 packages, and the empty
  favorites seed) must match `docs/superpowers/specs/2026-09-20-site-photography-design.md` §4/§5/§6
  exactly — no invented statistics presented as real, no Lorem Ipsum above the fold, no fake client
  testimonials.
- **Static content must never be gated behind `useLocalCollection`'s hydration** (interactive-demo
  spec §3.1's render-pattern rule) — `PHOTOS` and `PACKAGES` render directly from imported seed data
  in the server-rendered/static-exported page; only the per-photo favorite toggles and the
  favorites-only filter state live inside a client component that mounts after the static shell is
  visible.
- Every composed page must render at 320/375/414/768px without horizontal scroll (same rule
  `template-kit` components are already built to, per plan 30's Global Constraints — this plan is
  responsible for not breaking it at the page-composition level, particularly the full-bleed masonry
  gallery section, which is the one section in this site most likely to introduce horizontal
  overflow if column widths aren't constrained).
- `next.config.js` must set `output: 'export'` (parent spec §6, unchanged).
- `public/thumbnail.webp` is required and validated by `template-kit/scripts/check-thumbnail.mjs`
  (plan 30 Task 2) wired into this site's own `package.json` `build` script — this plan does not
  reimplement the checker, only calls it.
- Do not fabricate Hallmark token values in this plan document. Task 1 states the process and the
  required output shape; the real hex/font/spacing values only exist after the real session runs.
- Do not fabricate Task 3's design-score numbers in this plan document. The score table is written
  with criterion names and an empty/TBD score column — real scores are filled in by whoever executes
  Task 3, after implementation, per master spec §8.
- Current baseline: re-read `docs/superpowers/STATUS.md`'s own header for the actual current
  pass count before reporting — plans may have landed between this plan's authoring and its
  execution.

---

## Task 1: Hallmark design pass

**Files:**
- Create: `templates/photography/theme.ts`
- Create: `templates/photography/app/globals.css`
- Create (Hallmark's own working artifacts, per the skill's normal output — moodboard/reference
  notes, wherever the `hallmark` skill places them): no fixed path prescribed here; follow the
  skill's own convention.

**Interfaces:**
- Consumes: `TemplateTheme` type and `assertValidTheme` validator from `@portfolio/template-kit`
  (`template-kit/src/theme.ts`, shipped by plan 30 Task 2) — this site's `theme.ts` must conform to
  that shape and call `assertValidTheme` on its own exported value so a malformed token set fails
  the build loudly instead of shipping `undefined` CSS variables.
- Produces: `templates/photography/theme.ts` (the validated `TemplateTheme` value this site commits
  to) and `templates/photography/app/globals.css` (the `--color-*`/`--font-*`/`--space-*` custom
  properties `template-kit`'s components read at render time, populated with this site's real
  values instead of placeholders).

### Design decision

**(a) This is a real Hallmark session, not a scaffold placeholder.** Per interactive-demo spec §5,
every one of the 29 sites gets its own full `hallmark` skill pass (greenfield path), same rigor as
the main portfolio site's own pass and plan 31's corporate precedent — not a value picked from the
parent spec's old 4-cluster enum (that enum is explicitly overridden, per plan 30 decision (f)). The
input to the session is this plan's own spec, `docs/superpowers/specs/2026-09-20-site-photography-design.md`
§7 ("Hallmark design brief") — the fictional studio's mood (documentary wedding/portrait
photography, warm/natural), the non-binding warm-hue/serif starting direction, and the 3 reference
directions to research. The session may land anywhere its research supports, including deviating
from that starting direction, as long as the result clears every criterion in master spec §8 at Task
3 time (particularly #1 anti-generic, #2 typographic craft, #3 color coherence, and #10
distinctiveness against the other 3 sites sharing the warm/serif starting cluster — Restaurant,
Beauty, Wedding).

- [ ] **Step 1: Invoke the `hallmark` skill, greenfield path**, supplying it this plan's context:
  the site is a photography-studio demo landing page (`Hero` → full-bleed masonry `PhotoGallery`
  with favorite/filter → `PricedItemGrid` packages → `Footer`), industry mood per spec §7, and the
  constraint that output must conform to `template-kit`'s `TemplateTheme` shape (`accentHue: string`,
  `displayFont: string`, `bodyFont: string` — plus whatever additional `--space-*`/motion tokens the
  session decides are needed for `globals.css`, which are not constrained by `TemplateTheme`'s type
  since that type only governs the 3 fields `template-kit`'s components read directly).
- [ ] **Step 2: Run the session's research phase** — the skill's own process for the 2-3 reference
  directions named in the spec (documentary wedding photographer portfolios, Vietnamese/SEA boutique
  studio branding, film-photography-adjacent editorial layout), converging on one direction with a
  rationale, not a blend of all three.
- [ ] **Step 3: Produce `templates/photography/theme.ts`** exporting a `TemplateTheme`-conformant
  object and calling `assertValidTheme` on it at module scope (so an invalid theme throws at import
  time, not silently):

```typescript
import { assertValidTheme, type TemplateTheme } from '@portfolio/template-kit';

const theme: TemplateTheme = {
  accentHue: /* real value from the Hallmark session, not a placeholder */ '',
  displayFont: /* real value from the Hallmark session */ '',
  bodyFont: /* real value from the Hallmark session */ '',
};

export default assertValidTheme(theme);
```

  (The empty-string right-hand sides above are illustrative of the shape only — the real file
  committed in this step must have the session's actual values; an empty string would fail
  `assertValidTheme` itself and is not an acceptable committed state.)

- [ ] **Step 4: Produce `templates/photography/app/globals.css`** defining the `--color-*`/
  `--font-*`/`--space-*` (and any motion-duration/easing tokens the session's interaction-polish
  direction needs, per master spec §8 criterion #5 — particularly relevant here for the lightbox
  open/close transition and the favorite-toggle micro-interaction) custom properties
  `template-kit`'s components read, with real values matching `theme.ts`'s exported `TemplateTheme`
  — no ad-hoc hex/OKLCH values outside this token file (master spec §8 criterion #3 requires every
  color trace to a token).
- [ ] **Step 5: Verify WCAG AA contrast** on every real text/background token pairing the session
  defines (criterion #3) — using the Hallmark skill's own audit capability or an equivalent contrast
  checker; record the pass in the session's own notes. Pay particular attention to any caption/label
  text overlaid directly on photos in the masonry gallery, since that pairing is the one most likely
  to fail contrast in a photo-forward layout.
- [ ] **Step 6: Verify `theme.ts` imports and `assertValidTheme` succeeds** —
  `cd templates/photography && npx tsx theme.ts` (or equivalent quick run) exits 0, no thrown error.
- [ ] **Step 7: Commit** — `design: Hallmark pass for photography site theme`

**Acceptance criteria for this task:** `templates/photography/theme.ts` exists, type-checks against
`TemplateTheme`, and its module-scope `assertValidTheme` call does not throw; `globals.css` defines
real (non-placeholder) values for every token `template-kit` components consume; the direction is
traceable to the spec's Hallmark brief (§7) and its research phase, not asserted without process.

---

## Task 2: Next.js app scaffold + static page composition

**Files:**
- Create: `templates/photography/package.json`, `templates/photography/tsconfig.json`,
  `templates/photography/next.config.js`
- Create: `templates/photography/app/layout.tsx`, `templates/photography/app/page.tsx`
- Create: `templates/photography/data/seed.ts`
- Create: `templates/photography/public/thumbnail.webp` (placeholder image — see step 6 note)
- Test: `templates/photography/scripts/build-gate.test.mjs`

**Interfaces:**
- Consumes: `Hero`, `PhotoGallery`, `PricedItemGrid`, `Footer` from `@portfolio/template-kit`'s
  barrel export (plan 30 Task 5); `theme.ts`/`globals.css` from Task 1;
  `template-kit/scripts/check-thumbnail.mjs` (plan 30 Task 2) wired into this `package.json`'s
  `build` script.
- Produces: the static page at `templates/photography/app/page.tsx` that this plan's own Task 3
  extends with the interactive gallery favorite/filter section; the `npm run build` gate every later
  Task in this plan (and any future maintenance) relies on.

### Design decisions

**(b) `data/seed.ts` holds `PHOTOS` and `PACKAGES`** exactly as shaped in
`docs/superpowers/specs/2026-09-20-site-photography-design.md` §4/§5 — imported directly into
`page.tsx`, never behind a hook, per the Global Constraints render-pattern rule. All 13 photos and
all 3 packages are copied verbatim from the spec — do not trim or invent additional rows.

**(c) `public/thumbnail.webp` in this step is a real, valid WEBP file (placeholder imagery is
acceptable, an invalid/missing file is not)** — the build-gate check (plan 30 Task 2's
`checkThumbnail`) asserts real `RIFF`/`WEBP` magic bytes, not just a `.webp`-named file. Use any
placeholder WEBP export (e.g. a neutral generated image matching this site's Task 1 accent color)
until an admin uploads the real one through the media library, per parent spec §6 — this step's job
is to satisfy the build gate honestly, not to fake the check.

**(d) The `PhotoGallery` section is composed full-bleed** — a page-level wrapper (`width: 100vw`
technique or an unconstrained-width section, per whatever the Task 1 Hallmark session's layout
direction specifies) rather than the standard content-column container `Hero`/`PricedItemGrid`/
`Footer` use, per spec §2's "full-bleed" requirement and parent spec §3 row 18's distinguishing
section. This is a page-composition decision, not a new `template-kit` component prop.

- [ ] **Step 1: Write the failing build-gate test** — asserts `npm run build` (which runs
  `check-thumbnail.mjs` then `next build`) exits 0 and `out/` (or the configured static-export
  output dir) contains an `index.html`:

```javascript
// templates/photography/scripts/build-gate.test.mjs
import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

describe('photography site build gate', () => {
  it('npm run build succeeds and produces a static export with index.html', () => {
    execSync('npm run build', { cwd: ROOT, stdio: 'pipe' });
    expect(existsSync(path.join(ROOT, 'out', 'index.html'))).toBe(true);
  });

  it('public/thumbnail.webp exists and is a valid WEBP before build runs', () => {
    const { checkThumbnail } = require('../../template-kit/scripts/check-thumbnail.mjs');
    const result = checkThumbnail(path.join(ROOT, 'public', 'thumbnail.webp'));
    expect(result.ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `cd templates/photography && npx vitest run
  scripts/build-gate.test.mjs` (package/app don't exist yet, expect failure).
- [ ] **Step 3: `templates/photography/package.json`**

```json
{
  "name": "photography-template",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "node ../../template-kit/scripts/check-thumbnail.mjs public/thumbnail.webp && next build",
    "test": "vitest run"
  },
  "dependencies": {
    "@portfolio/template-kit": "workspace:*",
    "next": "15.5.4",
    "react": "19.2.0",
    "react-dom": "19.2.0"
  },
  "devDependencies": {
    "@types/node": "^24",
    "@types/react": "19.2.2",
    "typescript": "5.6.3",
    "vitest": "5.0.1"
  }
}
```

- [ ] **Step 4: `templates/photography/next.config.js`**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
};

module.exports = nextConfig;
```

- [ ] **Step 5: `templates/photography/tsconfig.json`** — same shape as
  `template-kit/tsconfig.json` (plan 30 Task 2 Step 4) with `jsx: "preserve"` and Next.js's standard
  `plugins`/`paths` additions per the installed Next.js version's own scaffold defaults.
- [ ] **Step 6: Add `public/thumbnail.webp`** — a placeholder WEBP image (any tool capable of
  emitting a real `RIFF`/`WEBP` file; content is not load-bearing for this step, validity is).
- [ ] **Step 7: `templates/photography/data/seed.ts`** — the `Photo`/`PHOTOS` (13 entries) and
  `Package`/`PACKAGES` (3 entries) arrays exactly as specified in
  `docs/superpowers/specs/2026-09-20-site-photography-design.md` §4/§5 (copy verbatim from the
  spec — do not trim or invent additional rows).
- [ ] **Step 8: `templates/photography/app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mộc Ảnh Studio',
  description: 'Đám cưới và chân dung, kể bằng khoảnh khắc thật.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 9: `templates/photography/app/page.tsx`** — imports `Hero`, `PricedItemGrid`, `Footer`
  from `@portfolio/template-kit`, and `PHOTOS`/`PACKAGES` from `../data/seed`; composes them in the
  exact section order from spec §2 (`Hero` → [full-bleed gallery/favorite section, wired in Task 3]
  → `PricedItemGrid`(packages) → `Footer`). Task 3 adds the client-component gallery section with
  favorite toggles and the favorites filter — this step may leave that slot as an explicit, clearly
  named empty `<section>` comment marker (not a TODO left unresolved at plan end — Task 3 fills it
  in the same plan) so the page composes and builds correctly before Task 3 lands.
- [ ] **Step 10: Run `cd templates/photography && npm install && npm run build`, then `npx vitest
  run scripts/build-gate.test.mjs`, verify pass.**
- [ ] **Step 11: Mutation checks**

| # | Revert | Test that must go RED |
|---|---|---|
| M1 | remove `output: 'export'` from `next.config.js` | the static-export `out/index.html` existence assertion |
| M2 | replace `public/thumbnail.webp` with a non-WEBP file of the same name | the thumbnail-valid-WEBP test |
| M3 | drop `check-thumbnail.mjs` from the `build` npm script | the build-gate test (build would succeed on an invalid thumbnail, silently passing when it should fail first) |

- [ ] **Step 12: Commit** — `feat: scaffold photography template Next.js app with static section composition`

---

## Task 3: Favorite/filter interactive feature + design scoring

**Files:**
- Create: `templates/photography/app/GallerySection.tsx` (client component)
- Modify: `templates/photography/app/page.tsx` (wire `GallerySection` into the slot left by Task 2
  Step 9)
- Test: `templates/photography/app/GallerySection.test.tsx`

**Interfaces:**
- Consumes: `useLocalCollection`, `PhotoGallery` from `@portfolio/template-kit`.
- Produces: the site's one required interaction test per master spec §7 ("exactly one interaction
  test exercising its `useLocalCollection` feature end-to-end"); the final design-score table that
  marks this plan complete per master spec §8.

### Design decisions

**(e) `GallerySection` is a client component (`'use client'`)** mounted inside the otherwise
static-exported `page.tsx`, per the Global Constraints render-pattern rule — it owns the
`useLocalCollection` call, renders `PhotoGallery` with a per-photo favorite toggle overlay and the
favorites-only filter control; the rest of the page (`Hero`, `PricedItemGrid`, `Footer`) stays
server/static-rendered.

**(f) The favorite toggle and filter are page-local JSX composed around `PhotoGallery`, not a new
`template-kit` component** — per `docs/superpowers/specs/2026-09-20-site-photography-design.md` §6's
documented rationale (this is a same-page filter on the gallery already visible, not a separate
saved-items panel, so `SavedItemsPanel` doesn't fit; the interactive-demo spec §3.2 row #18 calls
it a "favorites lightbox filter," not a panel). `PhotoGallery` itself is unmodified — `GallerySection`
passes it whichever filtered `photos` array is currently selected (all 13, or the favorited subset)
and renders the favorite toggle buttons as a sibling overlay, not a new `PhotoGallery` prop.

- [ ] **Step 1: Write the failing interaction test**

```tsx
// templates/photography/app/GallerySection.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GallerySection } from './GallerySection';

beforeEach(() => {
  window.localStorage.clear();
});

describe('GallerySection', () => {
  it('renders all 13 photos by default with the favorites filter off', () => {
    render(<GallerySection />);
    expect(screen.getAllByRole('img')).toHaveLength(13);
  });

  it('favoriting a photo, then switching the filter to favorites-only, shows only that photo', async () => {
    render(<GallerySection />);

    fireEvent.click(screen.getByRole('button', { name: /favorite.*ceremony-arch|favorite.*01/i }));

    fireEvent.click(screen.getByRole('button', { name: /favorites only/i }));

    await waitFor(() => {
      expect(screen.getAllByRole('img')).toHaveLength(1);
    });
  });

  it('a favorited photo persists across remount (simulated reload)', async () => {
    const { unmount } = render(<GallerySection />);
    fireEvent.click(screen.getByRole('button', { name: /favorite.*ceremony-arch|favorite.*01/i }));
    unmount();

    render(<GallerySection />);
    fireEvent.click(screen.getByRole('button', { name: /favorites only/i }));

    await waitFor(() => {
      expect(screen.getAllByRole('img')).toHaveLength(1);
    });
  });

  it('un-favoriting a photo removes it from the favorites-only filtered view', async () => {
    render(<GallerySection />);
    const favoriteButton = screen.getByRole('button', { name: /favorite.*ceremony-arch|favorite.*01/i });

    fireEvent.click(favoriteButton);
    fireEvent.click(screen.getByRole('button', { name: /favorites only/i }));
    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(1));

    fireEvent.click(screen.getByRole('button', { name: /unfavorite.*ceremony-arch|unfavorite.*01/i }));

    await waitFor(() => {
      expect(screen.queryAllByRole('img')).toHaveLength(0);
    });
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `cd templates/photography && npx vitest run
  app/GallerySection.test.tsx` (module doesn't exist yet).
- [ ] **Step 3: `templates/photography/app/GallerySection.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { useLocalCollection, PhotoGallery } from '@portfolio/template-kit';
import { PHOTOS } from '../data/seed';

interface FavoritePhoto {
  id: string;
  photoId: string;
  favoritedAt: string;
}

const FAVORITES_SEED: FavoritePhoto[] = [];

export function GallerySection() {
  const { items: favorites, add, remove } = useLocalCollection<FavoritePhoto>(
    'photography-favorites',
    FAVORITES_SEED,
  );
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  function toggleFavorite(photoId: string) {
    const existing = favorites.find((f) => f.photoId === photoId);
    if (existing) {
      remove(existing.id);
    } else {
      add({ id: crypto.randomUUID(), photoId, favoritedAt: new Date().toISOString() });
    }
  }

  const favoritedIds = new Set(favorites.map((f) => f.photoId));
  const visiblePhotos = showFavoritesOnly
    ? PHOTOS.filter((photo) => favoritedIds.has(photo.id))
    : PHOTOS;

  return (
    <section className="photography-gallery">
      <div className="photography-gallery-controls">
        <button
          type="button"
          aria-pressed={showFavoritesOnly}
          onClick={() => setShowFavoritesOnly((prev) => !prev)}
        >
          {showFavoritesOnly ? 'Show all' : 'Favorites only'}
        </button>
      </div>
      <div className="photography-gallery-grid">
        {visiblePhotos.map((photo) => {
          const isFavorited = favoritedIds.has(photo.id);
          return (
            <div key={photo.id} className="photography-gallery-item">
              <button
                type="button"
                aria-label={`${isFavorited ? 'Unfavorite' : 'Favorite'} ${photo.id}`}
                onClick={() => toggleFavorite(photo.id)}
              >
                {isFavorited ? '♥' : '♡'}
              </button>
            </div>
          );
        })}
      </div>
      <PhotoGallery layout="masonry" lightbox photos={visiblePhotos} />
    </section>
  );
}
```

  (Rendering both a per-photo favorite-button overlay and `PhotoGallery` itself against the same
  `visiblePhotos` array means the test's `getAllByRole('img')` count reflects `PhotoGallery`'s own
  `<img>` elements; the favorite buttons carry no `img` role, so the count assertion is unambiguous.)

- [ ] **Step 4: Wire `GallerySection` into `page.tsx`** — replace Task 2 Step 9's marker with
  `<GallerySection />`, positioned between `Hero` and `PricedItemGrid` per spec §2.
- [ ] **Step 5: Run `cd templates/photography && npx vitest run`, verify all pass.**
- [ ] **Step 6: Run the full build gate again** — `npm run build`, confirm still green after wiring
  `GallerySection` in.
- [ ] **Step 7: Mutation checks**

| # | Revert | Test that must go RED |
|---|---|---|
| M4 | make `toggleFavorite` always call `add()` (never `remove()` on an already-favorited photo) | the un-favoriting-removes-it test |
| M5 | seed `FAVORITES_SEED` with a non-empty fake favorite instead of `[]` | the default-all-13-photos-render test (one photo would already read as favorited/filtered incorrectly on first paint) |
| M6 | break `useLocalCollection` usage by seeding `favorites` from local `useState(() => [])` instead of calling the hook | the favorite-persists-across-remount test |
| M7 | make the favorites-only filter compare against `PHOTOS` by array index instead of `favoritedIds.has(photo.id)` | the favorite-then-filter-shows-only-that-photo test |

- [ ] **Step 8: Commit** — `feat: add favorite/filter interactive feature to photography site`

### Design score

Per master spec §8: every criterion must reach 9-10/10 before this plan is marked complete; a
criterion that cannot without a real trade-off must say so with a one-line reason instead of an
inflated number. This table is filled in by whoever executes this task, after the real
implementation and a real Hallmark `audit` pass exist to score against — the scores below are
intentionally left blank at plan-authoring time (master spec §8: scoring happens after
implementation, not during planning).

| # | Criterion | Score (0-10) | Notes |
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

- [ ] **Step 9: Run the Hallmark `audit` capability** against the built site, score each criterion
  honestly, fill in the table above, and fix/re-score any criterion below 9/10 before considering
  this plan complete.
- [ ] **Step 10: Commit** — `docs: plan 48 complete — photography site design score`

## Self-Review Notes

- **Spec coverage:** `2026-09-20-site-photography-design.md` §2 (Task 2's section composition), §3
  (the fictional studio/positioning feeding `Hero` copy and Task 1's brief), §4 (Task 2's gallery
  seed data), §5 (Task 2's packages seed data), §6 (Task 3's favorite/filter feature and its
  page-local-JSX-vs-`SavedItemsPanel` rationale), §7 (Task 1's Hallmark brief). Interactive-demo
  spec §3.1 (Task 3's hook usage), §3.2 row #18 (the feature itself), §5 (Task 1's per-site Hallmark
  requirement), §7 (Task 2/3's build + interaction test gates), §8 (Task 3's design-score table), §9
  (this plan is "plan 48" in that section's numbering). Parent spec §3 row 18 (the full-bleed
  masonry + packages distinguishing sections), §4 (Task 2's `PhotoGallery`/`PricedItemGrid`
  component contracts), §6 (Task 2's folder/thumbnail/`output: 'export'` convention).
- **Explicitly not built here:** any of the other 28 site plans (31-47, 49-59); changes to
  `@portfolio/template-kit` itself (any new component or hook change belongs in a plan-30 follow-up,
  not here); CI wiring for this site's static-export deploy (plan 17, parameterized for 29 sites,
  unchanged by this plan); real thumbnail upload through the admin media library (admin action, not
  a code task); real/licensed photography for the 13 gallery images (Task 2 implementation detail,
  placeholder-but-valid images are acceptable per the same convention plan 31 established for its
  own thumbnail).
- **Dependency confirmed:** this plan assumes plan 30's barrel export
  (`template-kit/src/index.ts`) already ships `Hero`, `PhotoGallery`, `PricedItemGrid`, `Footer`,
  `useLocalCollection`, `TemplateTheme`, `assertValidTheme` — if plan 30 is not yet complete when
  this plan is executed, Task 2 cannot start; verify plan 30's own commit history first.
- **Next step:** once this plan's design score (Task 3) clears every criterion at 9-10/10 (or
  documents an honest trade-off), later site plans in §9's sequence may reuse this plan's structure
  as their own precedent, the same way this plan reused plan 31's.
