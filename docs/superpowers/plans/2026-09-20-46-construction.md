# Construction Demo Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `construction` demo template site (`templates/construction/`) — site #16 of the
29 site plans under the interactive-demo templates program. Run a real per-site Hallmark design
pass, scaffold the static Next.js export composing `Hero` → `PhotoGallery`(projects, masonry) →
`Timeline`(process, horizontal) → `ItemGrid`(services) → `Footer` from `@portfolio/template-kit`,
and build its "Request a quote" interactive feature on `useLocalCollection`.

**Architecture:** This plan is plan 46 in the interactive-demo spec's §9 execution order — one of
plans 31-59, each independent once plan 30 lands. It has one hard prerequisite:
`2026-09-20-30-template-kit-scaffold.md` must be complete and committed (`@portfolio/template-kit`
built, tested, exporting `Hero`, `PhotoGallery`, `Timeline`, `ItemGrid`, `Footer`, `InquiryForm`,
`useLocalCollection`, `TemplateTheme`/`assertValidTheme` from its barrel `src/index.ts`). This plan
does not modify `template-kit` itself — it only consumes it. Task 1 runs a real Hallmark design
session (not a scaffold/placeholder step) and commits its own theme output; Task 2 scaffolds the
Next.js app and static composition; Task 3 builds the quote-request interactive feature and its
interaction test, plus the design-scoring self-audit.

**Tech Stack:** Next.js 15 / React 19 static export (`output: 'export'`), TypeScript, Vitest +
Testing Library + jsdom for the interaction test, `@portfolio/template-kit` as a local workspace
dependency. No backend change — this plan touches nothing under `backend/`.

**Spec:** `docs/superpowers/specs/2026-09-20-site-construction-design.md` (section composition,
seed data shape/content, interactive-feature data flow, Hallmark design brief) plus the two specs it
is scoped by: `docs/superpowers/specs/2026-09-20-interactive-demo-templates-design.md` (§3.1
`useLocalCollection` contract, §3.2 row #16 the quote-request feature, §5 per-site Hallmark
requirement, §7 the build+interaction test gate, §8 the 10-criterion design scoring gate, §9
execution order) and `docs/superpowers/specs/2026-09-20-template-design-system-design.md` (§3
Construction/Architecture taxonomy row, §4 component behavior/prop contracts, §6
folder/thumbnail/slug convention).

## Global Constraints

- **Hard prerequisite: plan 30 must be committed first.** Do not start Task 2 until
  `@portfolio/template-kit`'s barrel export (`template-kit/src/index.ts`) exists and its own test
  suite passes — this plan imports from it, it does not vendor or reimplement any kit component.
- **`slug` = `construction`, `subdomain` = `construction`, `display_order` = 16** — fixed by plan 30
  Task 1's authoritative slug table; do not deviate.
- No comments restating what code does; only comments explaining non-obvious "why" (same rule as
  plan 30/31).
- **No fabricated content.** Seed data (projects, process steps, services, and the empty
  quote-requests seed) must match
  `docs/superpowers/specs/2026-09-20-site-construction-design.md` §3/§4 exactly — no invented
  statistics presented as real, no Lorem Ipsum above the fold.
- **Static content must never be gated behind `useLocalCollection`'s hydration**
  (interactive-demo spec §3.1's render-pattern rule) — `PROJECTS`, `PROCESS_STEPS`, and `SERVICES`
  render directly from imported seed data in the server-rendered/static-exported page; only the
  "Your requests" panel and the quote-request form live inside a client component that mounts after
  the static shell is visible.
- Every composed page must render at 320/375/414/768px without horizontal scroll (same rule
  `template-kit` components are already built to, per plan 30's Global Constraints — this plan is
  responsible for not breaking it at the page-composition level: grid/section wrappers, spacing, and
  the masonry `PhotoGallery`'s column count at each breakpoint).
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
- Create: `templates/construction/theme.ts`
- Create: `templates/construction/app/globals.css`
- Create (Hallmark's own working artifacts, per the skill's normal output — moodboard/reference
  notes, wherever the `hallmark` skill places them): no fixed path prescribed here; follow the
  skill's own convention.

**Interfaces:**
- Consumes: `TemplateTheme` type and `assertValidTheme` validator from `@portfolio/template-kit`
  (`template-kit/src/theme.ts`, shipped by plan 30 Task 2) — this site's `theme.ts` must conform to
  that shape and call `assertValidTheme` on its own exported value so a malformed token set fails
  the build loudly instead of shipping `undefined` CSS variables.
- Produces: `templates/construction/theme.ts` (the validated `TemplateTheme` value this site commits
  to) and `templates/construction/app/globals.css` (the `--color-*`/`--font-*`/`--space-*` custom
  properties `template-kit`'s components read at render time, populated with this site's real
  values instead of placeholders).

### Design decision

**(a) This is a real Hallmark session, not a scaffold placeholder.** Per interactive-demo spec §5,
every one of the 29 sites gets its own full `hallmark` skill pass (greenfield path), same rigor as
the `corporate` site's own pass (plan 31) — not a value picked from the parent spec's old 4-cluster
enum (that enum is explicitly overridden, per plan 30 decision (f)). The input to the session is
this plan's own spec, `docs/superpowers/specs/2026-09-20-site-construction-design.md` §5 ("Hallmark
design brief") — industry mood (construction & architecture, capable/precise/substantial), the
non-binding high-contrast-neutral/bold-accent/condensed-sans starting direction, and the 3 reference
directions to research. The session may land anywhere its research supports, including deviating
from that starting direction, as long as the result clears every criterion in master spec §8 at
Task 3 time (particularly #1 anti-generic, #2 typographic craft, #3 color coherence, #10
distinctiveness against the other 28 sites — especially `fitness` and `automotive`, which start from
the same high-contrast-neutral family).

- [ ] **Step 1: Invoke the `hallmark` skill, greenfield path**, supplying it this plan's context:
  the site is a construction & architecture demo landing page (`Hero` → project `PhotoGallery` →
  quote-request section → process `Timeline` → services `ItemGrid` → `Footer`), industry mood per
  spec §5, and the constraint that output must conform to `template-kit`'s `TemplateTheme` shape
  (`accentHue: string`, `displayFont: string`, `bodyFont: string` — plus whatever additional
  `--space-*`/motion tokens the session decides are needed for `globals.css`, which are not
  constrained by `TemplateTheme`'s type since that type only governs the 3 fields `template-kit`'s
  components read directly).
- [ ] **Step 2: Run the session's research phase** — the skill's own process for the 2-3 reference
  directions named in the spec (contemporary architecture-firm portfolio sites, industrial/
  construction-trade branding, technical/engineering-drawing systems), converging on one direction
  with a rationale, not a blend of all three.
- [ ] **Step 3: Produce `templates/construction/theme.ts`** exporting a `TemplateTheme`-conformant
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

- [ ] **Step 4: Produce `templates/construction/app/globals.css`** defining the `--color-*`/
  `--font-*`/`--space-*` (and any motion-duration/easing tokens the session's interaction-polish
  direction needs, per master spec §8 criterion #5) custom properties `template-kit`'s components
  read, with real values matching `theme.ts`'s exported `TemplateTheme` — no ad-hoc hex/OKLCH values
  outside this token file (master spec §8 criterion #3 requires every color trace to a token).
- [ ] **Step 5: Verify WCAG AA contrast** on every real text/background token pairing the session
  defines (criterion #3) — using the Hallmark skill's own audit capability or an equivalent contrast
  checker; record the pass in the session's own notes.
- [ ] **Step 6: Verify `theme.ts` imports and `assertValidTheme` succeeds** —
  `cd templates/construction && npx tsx theme.ts` (or equivalent quick run) exits 0, no thrown
  error.
- [ ] **Step 7: Commit** — `design: Hallmark pass for construction site theme`

**Acceptance criteria for this task:** `templates/construction/theme.ts` exists, type-checks against
`TemplateTheme`, and its module-scope `assertValidTheme` call does not throw; `globals.css` defines
real (non-placeholder) values for every token `template-kit` components consume; the direction is
traceable to the spec's Hallmark brief (§5) and its research phase, not asserted without process.

---

## Task 2: Next.js app scaffold + static page composition

**Files:**
- Create: `templates/construction/package.json`, `templates/construction/tsconfig.json`,
  `templates/construction/next.config.js`
- Create: `templates/construction/app/layout.tsx`, `templates/construction/app/page.tsx`
- Create: `templates/construction/data/seed.ts`
- Create: `templates/construction/public/thumbnail.webp` (placeholder image — see step 6 note)
- Create: `templates/construction/public/projects/*.webp` (8 placeholder project images, one per
  `PROJECTS` entry — see step 7 note)
- Test: `templates/construction/scripts/build-gate.test.mjs`

**Interfaces:**
- Consumes: `Hero`, `PhotoGallery`, `Timeline`, `ItemGrid`, `Footer` from
  `@portfolio/template-kit`'s barrel export (plan 30 Task 5); `theme.ts`/`globals.css` from Task 1;
  `template-kit/scripts/check-thumbnail.mjs` (plan 30 Task 2) wired into this `package.json`'s
  `build` script.
- Produces: the static page at `templates/construction/app/page.tsx` that this plan's own Task 3
  extends with the interactive section; the `npm run build` gate every later Task in this plan (and
  any future maintenance) relies on.

### Design decisions

**(b) `data/seed.ts` holds `PROJECTS`, `PROCESS_STEPS`, and `SERVICES`** exactly as shaped in
`docs/superpowers/specs/2026-09-20-site-construction-design.md` §3.1/§3.2/§3.3 — imported directly
into `page.tsx`, never behind a hook, per the Global Constraints render-pattern rule. `page.tsx`
derives the kit's plain `Photo[]` shape (`{ id, src, alt }`) from `PROJECTS` for the `PhotoGallery`
composition; the full `PROJECTS` array (with `title`/`category`/etc.) is passed separately into
Task 3's `QuoteRequestSection`.

**(c) `public/thumbnail.webp` and the 8 `public/projects/*.webp` files in this step are real, valid
WEBP files (placeholder imagery is acceptable, invalid/missing files are not)** — the build-gate
check (plan 30 Task 2's `checkThumbnail`) asserts real `RIFF`/`WEBP` magic bytes for the thumbnail,
not just a `.webp`-named file; the project photos are not build-gated the same way but must still be
real images so the masonry `PhotoGallery` and the Hallmark pass (Task 1) have real content to design
against, not broken `<img>` tags. Use placeholder WEBP exports (e.g. neutral generated images
matching this site's Task 1 accent color) until an admin uploads the real ones through the media
library, per parent spec §6 — this step's job is to satisfy the build gate and give the layout real
images honestly, not to fake the check.

- [ ] **Step 1: Write the failing build-gate test** — asserts `npm run build` (which runs
  `check-thumbnail.mjs` then `next build`) exits 0 and `out/` (or the configured static-export
  output dir) contains an `index.html`:

```javascript
// templates/construction/scripts/build-gate.test.mjs
import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

describe('construction site build gate', () => {
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

- [ ] **Step 2: Run to verify it fails** — `cd templates/construction && npx vitest run
  scripts/build-gate.test.mjs` (package/app don't exist yet, expect failure).
- [ ] **Step 3: `templates/construction/package.json`**

```json
{
  "name": "construction-template",
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

- [ ] **Step 4: `templates/construction/next.config.js`**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
};

module.exports = nextConfig;
```

- [ ] **Step 5: `templates/construction/tsconfig.json`** — same shape as
  `template-kit/tsconfig.json` (plan 30 Task 2 Step 4) with `jsx: "preserve"` and Next.js's standard
  `plugins`/`paths` additions per the installed Next.js version's own scaffold defaults.
- [ ] **Step 6: Add `public/thumbnail.webp`** — a placeholder WEBP image (any tool capable of
  emitting a real `RIFF`/`WEBP` file; content is not load-bearing for this step, validity is).
- [ ] **Step 7: Add `public/projects/*.webp`** — 8 placeholder WEBP images, one per `PROJECTS` entry
  in §3.1 of the spec, filenames matching each entry's `photo.src` path exactly (e.g.
  `riverside-villas.webp`); real `RIFF`/`WEBP` files, content not load-bearing at this step.
- [ ] **Step 8: `templates/construction/data/seed.ts`** — the `ConstructionProject`/`PROJECTS`,
  `ProcessStep`/`PROCESS_STEPS`, and `ServiceItem`/`SERVICES` arrays exactly as specified in
  `docs/superpowers/specs/2026-09-20-site-construction-design.md` §3.1/§3.2/§3.3 (copy verbatim from
  the spec, including all 8 projects, all 6 process steps, and all 6 services — do not trim or
  invent additional rows).
- [ ] **Step 9: `templates/construction/app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Thiên Trường Construction & Architecture',
  description: 'Residential, commercial, and renovation construction with in-house architectural design.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 10: `templates/construction/app/page.tsx`** — imports `Hero`, `PhotoGallery`,
  `Timeline`, `ItemGrid`, `Footer` from `@portfolio/template-kit`, and `PROJECTS`/`PROCESS_STEPS`/
  `SERVICES` from `../data/seed`; derives `const galleryPhotos = PROJECTS.map((p) => ({ id: p.id,
  src: p.photo.src, alt: p.photo.alt }))` for the `PhotoGallery` composition; composes the sections
  in the exact order from spec §2 (`Hero` → `PhotoGallery`(masonry, lightbox) → [interactive section
  placeholder wired in Task 3] → `Timeline`(horizontal) → `ItemGrid` → `Footer`). Task 3 adds the
  client-component quote-request section between `PhotoGallery` and `Timeline` — this step may leave
  that slot as an explicit, clearly named empty `<section>` comment marker (not a TODO left
  unresolved at plan end — Task 3 fills it in the same plan) so the page composes and builds
  correctly before Task 3 lands.
- [ ] **Step 11: Run `cd templates/construction && npm install && npm run build`, then `npx vitest
  run scripts/build-gate.test.mjs`, verify pass.**
- [ ] **Step 12: Mutation checks**

| # | Revert | Test that must go RED |
|---|---|---|
| M1 | remove `output: 'export'` from `next.config.js` | the static-export `out/index.html` existence assertion |
| M2 | replace `public/thumbnail.webp` with a non-WEBP file of the same name | the thumbnail-valid-WEBP test |
| M3 | drop `check-thumbnail.mjs` from the `build` npm script | the build-gate test (build would succeed on an invalid thumbnail, silently passing when it should fail first) |

- [ ] **Step 13: Commit** — `feat: scaffold construction template Next.js app with static section composition`

---

## Task 3: Quote-request interactive feature + design scoring

**Files:**
- Create: `templates/construction/app/QuoteRequestSection.tsx` (client component)
- Modify: `templates/construction/app/page.tsx` (wire `QuoteRequestSection` into the slot left by
  Task 2 Step 10)
- Test: `templates/construction/app/QuoteRequestSection.test.tsx`

**Interfaces:**
- Consumes: `useLocalCollection`, `InquiryForm` from `@portfolio/template-kit`; `PROJECTS` from
  `../data/seed` (passed in as a prop by `page.tsx`, per design decision (d)).
- Produces: the site's one required interaction test per master spec §7 ("exactly one interaction
  test exercising its `useLocalCollection` feature end-to-end"); the final design-score table that
  marks this plan complete per master spec §8.

### Design decisions

**(d) `QuoteRequestSection` is a client component (`'use client'`)** mounted inside the otherwise
static-exported `page.tsx`, per the Global Constraints render-pattern rule — it receives `PROJECTS`
as a prop from `page.tsx` (so the project list it renders and the static `PhotoGallery` above it
share one source of truth), owns the `useLocalCollection` call, and renders the project picker, the
`InquiryForm`, and the "Your requests" list; the rest of the page (`Hero`, `PhotoGallery`, `Timeline`,
`ItemGrid`, `Footer`) stays server/static-rendered.

**(e) The "Your requests" panel is a plain ordered list, not `SavedItemsPanel`** — per
`docs/superpowers/specs/2026-09-20-site-construction-design.md` §4.3's documented rationale
(`SavedItemsPanel`'s remove-from-catalog contract doesn't fit a visitor-authored form submission).
No new `template-kit` component is added for this — the list is page-local JSX, not a kit export.

**(f) The project picker is also page-local JSX, not a kit component** — per spec §4.3 step 2, it is
a thin wrapper reusing `PROJECTS` (already imported for the static `PhotoGallery`), not a bespoke
`template-kit` addition; `template-kit` is not modified by this plan.

- [ ] **Step 1: Write the failing interaction test**

```tsx
// templates/construction/app/QuoteRequestSection.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuoteRequestSection } from './QuoteRequestSection';
import { PROJECTS } from '../data/seed';

beforeEach(() => {
  window.localStorage.clear();
});

describe('QuoteRequestSection', () => {
  it('shows an empty state before any quote is requested', () => {
    render(<QuoteRequestSection projects={PROJECTS} />);
    expect(screen.getByText(/no requests yet/i)).toBeInTheDocument();
  });

  it('requesting a quote on a project, then submitting the form, adds it to the "Your requests" panel', async () => {
    render(<QuoteRequestSection projects={PROJECTS} />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`request a quote.*${PROJECTS[0].title}`, 'i') }));

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Đỗ Văn Nam' } });
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '0901234567' } });
    fireEvent.click(screen.getByRole('button', { name: /^request a quote$/i }));

    await waitFor(() => {
      expect(screen.getByText('Đỗ Văn Nam')).toBeInTheDocument();
      expect(screen.getByText(new RegExp(PROJECTS[0].title))).toBeInTheDocument();
    });
  });

  it('persists a submitted quote request across remount (simulated reload)', async () => {
    const { unmount } = render(<QuoteRequestSection projects={PROJECTS} />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`request a quote.*${PROJECTS[1].title}`, 'i') }));
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Bùi Thị Lan' } });
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '0912345678' } });
    fireEvent.click(screen.getByRole('button', { name: /^request a quote$/i }));
    await waitFor(() => expect(screen.getByText('Bùi Thị Lan')).toBeInTheDocument());
    unmount();

    render(<QuoteRequestSection projects={PROJECTS} />);
    await waitFor(() => expect(screen.getByText('Bùi Thị Lan')).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `cd templates/construction && npx vitest run
  app/QuoteRequestSection.test.tsx` (module doesn't exist yet).
- [ ] **Step 3: `templates/construction/app/QuoteRequestSection.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { useLocalCollection, InquiryForm } from '@portfolio/template-kit';
import type { ConstructionProject } from '../data/seed';

interface QuoteRequest {
  id: string;
  projectRef: string;
  name: string;
  phone: string;
  requestedAt: string;
}

const QUOTE_SEED: QuoteRequest[] = [];

interface QuoteRequestSectionProps {
  projects: ConstructionProject[];
}

export function QuoteRequestSection({ projects }: QuoteRequestSectionProps) {
  const { items, add, reset } = useLocalCollection<QuoteRequest>(
    'construction-quote-requests',
    QUOTE_SEED,
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  async function handleSubmit(values: Record<string, string>) {
    if (!selectedProjectId) return;
    add({
      id: crypto.randomUUID(),
      projectRef: selectedProjectId,
      name: values.name,
      phone: values.phone,
      requestedAt: new Date().toISOString(),
    });
    setSelectedProjectId(null);
  }

  const sorted = [...items].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  const projectTitle = (id: string) => projects.find((p) => p.id === id)?.title ?? 'Unknown project';

  return (
    <section className="construction-quote-request">
      <h2>Request a quote</h2>
      <ul className="construction-quote-request__projects">
        {projects.map((project) => (
          <li key={project.id}>
            <span>{project.title}</span>
            <button type="button" onClick={() => setSelectedProjectId(project.id)}>
              {`Request a quote for ${project.title}`}
            </button>
          </li>
        ))}
      </ul>

      {selectedProjectId ? (
        <div>
          <p>{`Requesting a quote for: ${projectTitle(selectedProjectId)}`}</p>
          <InquiryForm fields={[]} submitLabel="Request a quote" onSubmit={handleSubmit} />
        </div>
      ) : null}

      <aside aria-label="Your requests">
        <h3>Your requests</h3>
        {sorted.length === 0 ? (
          <p>No requests yet — pick a project above and request a quote to see it here.</p>
        ) : (
          <ol>
            {sorted.map((request) => (
              <li key={request.id}>
                <strong>{request.name}</strong>
                <span>{projectTitle(request.projectRef)}</span>
                <time dateTime={request.requestedAt}>{new Date(request.requestedAt).toLocaleString('vi-VN')}</time>
              </li>
            ))}
          </ol>
        )}
        <button type="button" onClick={reset}>Reset demo data</button>
      </aside>
    </section>
  );
}
```

- [ ] **Step 4: Wire `QuoteRequestSection` into `page.tsx`** — replace Task 2 Step 10's marker with
  `<QuoteRequestSection projects={PROJECTS} />`, positioned between `PhotoGallery` and `Timeline`
  per spec §2.
- [ ] **Step 5: Run `cd templates/construction && npx vitest run`, verify all pass.**
- [ ] **Step 6: Run the full build gate again** — `npm run build`, confirm still green after wiring
  `QuoteRequestSection` in.
- [ ] **Step 7: Mutation checks**

| # | Revert | Test that must go RED |
|---|---|---|
| M4 | make `add()` not include `id`/`requestedAt` (pass raw form values + `projectRef` only) | the submit-adds-to-panel test (assert on `requestedAt`-driven sort order breaking, or on a missing `id` causing duplicate-key issues surfaced as a render/assertion failure across two submits) |
| M5 | seed `QUOTE_SEED` with a non-empty fake request instead of `[]` | the empty-state-before-any-request test |
| M6 | drop the `useEffect`-driven read-from-`localStorage` path (i.e. break `useLocalCollection` usage by seeding from `useState(() => [])` locally instead of calling the hook) | the persists-across-remount test |

- [ ] **Step 8: Commit** — `feat: add quote-request interactive feature to construction site`

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
- [ ] **Step 10: Commit** — `docs: plan 46 complete — construction site design score`

## Self-Review Notes

- **Spec coverage:** `2026-09-20-site-construction-design.md` §2 (Task 2's section composition), §3
  (Task 2's seed data), §4 (Task 3's interactive feature and its `SavedItemsPanel`-vs-plain-list
  rationale), §5 (Task 1's Hallmark brief). Interactive-demo spec §3.1 (Task 3's hook usage), §3.2
  row #16 (the feature itself), §5 (Task 1's per-site Hallmark requirement), §7 (Task 2/3's build +
  interaction test gates), §8 (Task 3's design-score table), §9 (this plan is "plan 46" in that
  section's numbering). Parent spec §3 (this category's distinguishing sections), §4 (Task 2's
  component contracts), §6 (Task 2's folder/thumbnail/`output: 'export'` convention).
- **Explicitly not built here:** any of the other 28 site plans; changes to
  `@portfolio/template-kit` itself (any new component or hook change belongs in a plan-30
  follow-up, not here); CI wiring for this site's static-export deploy (plan 17, parameterized for
  29 sites, unchanged by this plan); real thumbnail/project-photo upload through the admin media
  library (admin action, not a code task).
- **Dependency confirmed:** this plan assumes plan 30's barrel export
  (`template-kit/src/index.ts`) already ships `Hero`, `PhotoGallery`, `Timeline`, `ItemGrid`,
  `Footer`, `InquiryForm`, `useLocalCollection`, `TemplateTheme`, `assertValidTheme` — if plan 30 is
  not yet complete when this plan is executed, Task 2 cannot start; verify plan 30's own commit
  history first.
- **Next step:** once this plan's design score (Task 3) clears every criterion at 9-10/10 (or
  documents an honest trade-off), any later site plan in the 31-59 sequence may reuse this plan's
  structure as its own precedent, the same way this plan reused plan 31's.
