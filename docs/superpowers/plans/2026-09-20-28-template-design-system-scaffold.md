# Template Design System — Shared Kit Scaffold + Seed Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two things.
1. Give the platform's `templates` table 20 real seed rows — one per demo-website category — so the
   3D carousel (plan 12) and the admin templates screen have real data to develop/test against
   instead of a hand-typed mock (task 1).
2. Scaffold the shared `template-kit` component package the 20 individual template repos will
   depend on — 9 components, theming config, and a build-time `thumbnail.webp` guard (task 2).
   **This plan does not build any of the 20 template repos themselves** — that is later, separate
   work per the design spec's explicit scope cut.

**Architecture:** Task 1 is a Flyway migration + nothing else (no new entity fields, no new
endpoints — `Template`/`TemplateDto`/`AdminTemplateController` already exist per plan 05). Task 2
is a new local workspace package `template-kit/` (its own `package.json`, own Vitest config),
consumed by `frontend/` only insofar as the admin templates screen (plan 14) may eventually preview
a template's theme — no such dependency exists yet, so `template-kit` starts standalone.

**Tech Stack:** Next.js/React 19 components (framework-agnostic enough to run in a template repo's
`app/` tree), Vitest + Testing Library, TypeScript. No backend changes beyond the migration.

**Spec:** `docs/superpowers/specs/2026-09-20-template-design-system-design.md` (this plan's source
of truth for the 9-component kit and the 20-category taxonomy) and
`docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md` §6/§7 (schema, static-export
deploy convention).

**Depends on:** plan 05 (`Template` entity, `AdminTemplateController`, slug/subdomain uniqueness
validation), plan 11 task 2 (`Template` TypeScript type, twelve fields), plan 12 (3D carousel reads
`thumbnailUrl` resolved from `thumbnailMediaId` — the seed rows in task 1 intentionally leave
`thumbnail_media_id` NULL; see decision (a)).

> **DOM test environment + CI (2026-09-20).** Two corrections found while reviewing this plan.
>
> 1. **This plan does NOT depend on `2026-09-20-19b-dom-test-environment.md`.** That plan adds
>    jsdom and Testing Library to `frontend/`, and `template-kit/` is a separate workspace package
>    with its own `package.json` and its own `vitest.config.ts` (Step 3). Add the DOM dependencies
>    to `template-kit/package.json` and set `environment: "jsdom"` **globally** in
>    `template-kit/vitest.config.ts` — the per-file docblock that `frontend/` needs exists only to
>    protect `frontend/lib/webgl.test.ts`, which has no counterpart here.
> 2. **CI will not run any of these tests as things stand.** The `test` job in
>    `.github/workflows/deploy.yml` runs `mvn -B -f backend/pom.xml test` and then, in `frontend/`,
>    `npm ci && npx vitest run && npm run build`. Nothing touches `template-kit/`. Nine components
>    with tests that no pipeline executes are not covered, they are only believed to be. This plan
>    must add a `template-kit` step to that job — `npm ci` and `npx vitest run` in
>    `template-kit/` — in the same commit that creates the package.

## Global Constraints

- Backend must run within `-Xmx350m` — no unbounded in-memory collections; this plan adds no new
  list endpoint, so no new pagination concern.
- **Backend layout follows spec 5.1.** No new backend code in task 1 beyond the migration file
  itself — do not touch `model/Template.java`, it already has every column this plan needs.
- No comments restating what code does; only comments explaining non-obvious "why".
- `template-kit` components carry **no fabricated metrics or testimonials** in their own default
  props/story fixtures — `StatBlock`'s default export must not ship a made-up number (design spec
  §5).
- Every `template-kit` component must render at 320/375/414/768px without horizontal scroll —
  it will be reused by 20 templates the platform doesn't control the content length of.
- `next.config.js` in a template repo requires `output: 'export'` — task 2's build-time check
  enforces this belongs to the *template*, not to `template-kit` itself (the kit is a component
  library, not a page).

---

## Task 1: Seed 20 template rows

**Files:**
- Create: `backend/src/main/resources/db/migration/V4__seed_template_categories.sql`
- Test: `backend/src/test/java/com/portfolio/platform/repository/TemplateRepositoryFlywaySeedTest.java`

### Design decisions

**(a) Seed rows carry `thumbnail_media_id = NULL` and `is_active = true`.** No `Media` row exists
yet for any of these — uploading real thumbnails is an admin action, out of scope for a migration.
`TemplateServiceImpl`'s existing thumbnail-resolution code (plan 12 task 1) already handles a NULL
`thumbnailMediaId` by leaving `thumbnailUrl` null, so the carousel renders the coloured-plane
fallback (plan 12 decision (i)) for all 20 until an admin uploads real images — this is the correct
placeholder behaviour, not a bug to fix here.

**(b) `slug` and `subdomain` follow a fixed, predictable pattern.** `slug = 'demo-<NN>-<category-
key>'`, `subdomain` identical to `slug` (matches the design spec §6 "slug MUST equal ... subdomain"
convention read literally — for these placeholder rows subdomain and slug are the same string,
since no real DNS/CI wiring exists yet for any of them). Example: `demo-01-corporate`.

**(c) `display_order` matches the taxonomy table's `#` column (1–20), so the admin templates screen
and the 3D carousel show them in the same recognizable order as the design spec's table** — useful
for anyone cross-checking seed data against the spec by eye.

**(d) `category` stores the short English category key (`"corporate"`, `"agency"`, …), not the
bilingual display label from the spec table.** The bilingual label is presentation-layer copy for
an eventual admin filter UI (not built by this plan) — the DB column stays a stable machine key.

**(e) This migration must be idempotent-safe the way `V1`–`V3` are: Flyway runs it exactly once per
environment.** No `INSERT ... ON CONFLICT` needed — Flyway's own versioning is the guard; do not
add defensive SQL that duplicates what Flyway already guarantees.

- [ ] **Step 1: Write the failing test**
  - `TemplateRepositoryFlywaySeedTest` (`@DataJpaTest`, real Flyway migration run — same pattern as
    any existing repository test that boots the full migration chain; if no such precedent exists
    in this codebase, use `@SpringBootTest` instead and say so in the commit body):
    - `seedMigration_insertsExactlyTwentyTemplates`
    - `seedMigration_allSlugsAreUnique` (guards against a copy-paste typo across 20 rows)
    - `seedMigration_allAreActiveWithNullThumbnail`
    - `seedMigration_displayOrderCoversOneToTwentyWithNoGaps`
- [ ] **Step 2: Run to verify it fails** — `V4` doesn't exist yet.
- [ ] **Step 3: Write `V4__seed_template_categories.sql`** — 20 `INSERT` statements, one per
  taxonomy row, `name`/`description` in Vietnamese matching the taxonomy table's category label.
- [ ] **Step 4: Run the full backend suite** — report the real pass count against the current
  baseline (126 per `STATUS.md` at time of writing; **re-read `STATUS.md`'s own header for the
  actual current number before reporting, since other plans may have landed first**).
- [ ] **Step 5: Mutation checks**

| # | Revert | Test that must go RED |
|---|---|---|
| M1 | seed only 19 rows | `seedMigration_insertsExactlyTwentyTemplates` |
| M2 | duplicate one `slug` across two rows | `seedMigration_allSlugsAreUnique` |
| M3 | set one row's `thumbnail_media_id` to a non-null placeholder value | `seedMigration_allAreActiveWithNullThumbnail` |

- [ ] **Step 6: Commit** — `feat: seed 20 template category rows via Flyway V4`

---

## Task 2: `template-kit` shared component package

**Files:**
- Create: `template-kit/package.json`, `template-kit/tsconfig.json`, `template-kit/vitest.config.ts`
- Create: `template-kit/src/theme.ts`, `template-kit/src/theme.test.ts`
- Create: `template-kit/src/components/Hero.tsx` + `.test.tsx`
- Create: `template-kit/src/components/ItemGrid.tsx` + `.test.tsx`
- Create: `template-kit/src/components/PricedItemGrid.tsx` + `.test.tsx`
- Create: `template-kit/src/components/PeopleGrid.tsx` + `.test.tsx`
- Create: `template-kit/src/components/Timeline.tsx` + `.test.tsx`
- Create: `template-kit/src/components/PhotoGallery.tsx` + `.test.tsx`
- Create: `template-kit/src/components/InquiryForm.tsx` + `.test.tsx`
- Create: `template-kit/src/components/StatBlock.tsx` + `.test.tsx`
- Create: `template-kit/src/components/Footer.tsx` + `.test.tsx`
- Create: `template-kit/src/index.ts` (barrel export)
- Create: `template-kit/scripts/check-thumbnail.mjs` (build-time guard, decision (i))

### Design decisions

**(f) `theme.ts` exports exactly 4 named mood clusters, not a free-form config object.** Design
spec §5: "4 pre-approved free pairings... a template picks from via one `theme.ts` config file; it
does not invent a fifth." `type MoodCluster = 'cool-corporate' | 'warm-hospitality' | 'bold-
energetic' | 'soft-caring'`; each maps to a fixed `{ accentHue, displayFont, bodyFont }` object. A
template's own `theme.ts` imports one cluster and may override `accentHue` only (brand colour), never
the font pair — keeps the 2+1 font rule enforceable centrally instead of per-template.

**(g) Every component takes a `variant` prop where the design spec's table implies one, and no
component reaches into `fetch` or any backend call.** These are pure presentational components —
content is always passed in via props from the template's own `page.tsx`. This is what makes "no
bespoke per-template logic" true: the kit has zero knowledge of which of the 20 categories is
calling it.

**(h) `StatBlock` requires its `stats` prop and renders nothing (not a zero, not a dash) when the
array is empty** — refusing to synthesize a placeholder number is the enforcement mechanism for the
"no fabricated metrics" rule (design spec §5); a template author must pass real numbers or omit the
component, never get a default `0` that looks like real data.

**(i) `check-thumbnail.mjs` is a Node script a template's own `package.json` `build` script runs
before `next build`.** It asserts `public/thumbnail.webp` exists and is a valid WEBP (reuse the
byte-sniffing approach already proven in the backend's media upload validation, plan 06 finding
C-03, if a comparable check needs porting — otherwise a minimal magic-byte check is sufficient here
since this runs at build time against a trusted local file, not an untrusted upload). Exits non-zero
with a message naming the missing file if absent — enforces design spec §6's "mandatory, validated
at build time" without needing a human to remember it per template.

**(j) `InquiryForm`'s field set is data, not markup variants.** `fields: Array<{name, label,
type, required}>` plus a fixed trailing `message` textarea — this is how one component serves Real
Estate/Medical/Travel/Automotive/Beauty with different extra fields (design spec's kit table)
without five near-duplicate form components.

- [ ] **Step 1: Write the failing tests**
  - `theme.test.ts`: exactly 4 clusters exported; each cluster's font pair is on the typography
    allowlist (hard-code the 4 approved pairs and assert equality — do not re-derive from Hallmark's
    reference files at runtime)
  - `StatBlock.test.tsx`: renders nothing for `stats={[]}`; renders one block per entry for a
    non-empty array; **never renders a literal `0` for a missing `value`** (assert the component
    requires `value` as a required prop, not optional-with-default)
  - `InquiryForm.test.tsx`: renders exactly the base 4 fields (name/email/phone/message) when
    `fields=[]`; renders base + extra fields when `fields` has entries; submit is disabled while an
    `onSubmit` promise is pending (loading state) and re-enabled after it resolves or rejects
  - `Hero.test.tsx`, `ItemGrid.test.tsx`, `PricedItemGrid.test.tsx`, `PeopleGrid.test.tsx`,
    `Timeline.test.tsx`, `PhotoGallery.test.tsx`, `Footer.test.tsx`: each renders its required props
    without throwing, and each has one test asserting it renders correctly with an **empty items
    array** (no items) without crashing — every one of these components will eventually receive
    real content from 20 different, independently-authored templates; a crash on empty/missing data
    in one template must not be a surprise discovered at their build time
  - `check-thumbnail.mjs`: a small script test (Vitest against a temp directory) — missing file exits
    non-zero; a non-WEBP file with a `.webp` extension exits non-zero; a real WEBP exits 0
- [ ] **Step 2: Run to verify all fail.**
- [ ] **Step 3: `template-kit/package.json`, `tsconfig.json`, `vitest.config.ts`.**
- [ ] **Step 4: `theme.ts`** — the 4 clusters per decision (f).
- [ ] **Step 5: `Hero.tsx`, `Footer.tsx`** — the two components every one of the 20 categories uses.
- [ ] **Step 6: `ItemGrid.tsx`, `PricedItemGrid.tsx`, `PeopleGrid.tsx`** — the three grid variants.
- [ ] **Step 7: `Timeline.tsx`, `PhotoGallery.tsx`** — the two sequence/gallery components.
- [ ] **Step 8: `InquiryForm.tsx`** — decision (j), full 8-state interaction coverage (default/
  hover/focus-visible/active/disabled/loading/error/success) per the shared UI discipline already
  used in plan 14's admin forms.
- [ ] **Step 9: `StatBlock.tsx`** — decision (h).
- [ ] **Step 10: `check-thumbnail.mjs`** — decision (i).
- [ ] **Step 11: `index.ts` barrel export.**
- [ ] **Step 12: `cd template-kit && npm install && npx vitest run`** — report the real result.
- [ ] **Step 13: Mutation checks**

| # | Revert | Test that must go RED |
|---|---|---|
| M4 | add a 5th mood cluster | the exactly-4-clusters assertion |
| M5 | make `StatBlock`'s `value` prop default to `0` | the never-renders-literal-`0` test |
| M6 | render base fields even when `fields=[]` is passed without the base set | the exactly-4-base-fields test |
| M7 | drop the loading-disabled state from `InquiryForm`'s submit button | the pending-submit test |
| M8 | let `check-thumbnail.mjs` exit 0 on a missing file | the missing-file-exits-non-zero test |

- [ ] **Step 14: Commit** — `feat: scaffold template-kit shared component package for the 20 demo templates`

## Self-Review Notes

- **Spec coverage:** `2026-09-20-template-design-system-design.md` §4 (component kit), §5
  (theming), §6 (folder/thumbnail/export convention) task 2; §3 (taxonomy) + main spec §6 (schema)
  task 1.
- **Explicitly not built here:** any of the 20 template repos themselves, CI wiring for their
  deploy (plan 17), real thumbnail uploads (an admin action against the existing media library, plan
  06).
- **Type consistency:** task 1's seed `category` values are the machine keys design spec §3 assumes
  an eventual admin filter UI would use — no such filter UI exists yet; do not build one as a side
  effect of this task.
- **Next step:** once a first real template repo is built against `template-kit` (separate,
  later work), its `package.json`/`next.config.js` should be diffed against §6 of the design spec
  to confirm the convention actually held up outside the kit's own package boundary.
