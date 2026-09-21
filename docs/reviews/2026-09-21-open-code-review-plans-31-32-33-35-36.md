# OpenCodeReview (Alibaba `ocr`, delegate mode) — plans 31, 32, 33, 35, 36

**Ngày:** 2026-09-21
**Scope:** plan 31 (corporate), 32 (agency), 33 (saas), 35 (restaurant), 36 (realestate).
Plan 34 (ecommerce) is out of scope — not requested.
**Commit range:** `eb8b54a^..HEAD` (base `eb8b54a` = "feat(templates): add restaurant and realestate
templates (plan 35 & 36)", through `4e7c286`).
**Method:** `ocr delegate preview/rule` (Alibaba open-code-review CLI, delegation mode — OCR selects
files and supplies the review checklist, the review itself is done by reading every diff by hand
against that checklist). No LLM API key is configured for `ocr`'s own standalone review mode, so
`/review` fell back to `/delegate-review`, which needs no external provider.
**Files reviewed:** 61 (see file list below), all `.ts`/`.tsx`/`.js`/`.mjs`/`.json`/`.css` sources
changed by these 5 plans; `package-lock.json`, binaries, and `*.test.tsx` were excluded by OCR's own
default rules (`default_path` / `binary`).
Review-only run — **no fixes were applied**, this file is the only change committed.

## Summary

| Site | Plan | Files reviewed | High | Medium |
|---|---|---|---|---|
| Corporate | 31 | 13 | 0 | 1 |
| Agency | 32 | 15 | 0 | 0 |
| SaaS | 33 | 12 | 0 | 0 |
| Restaurant | 35 | 11 | 0 | 2 |
| Realestate | 36 | 14 | 1 | 2 |
| **template-kit** (shared, cross-cutting) | — | 2 | 0 | 0 |

Low-confidence / nitpick comments were discarded per the OCR filtering rule and are not listed.

---

## Realestate (plan 36)

### H-01 (High) — Contact form silently discards every submission

`templates/realestate/app/InquirySection.tsx:5-7`

```ts
async function handleSubmit(values: Record<string, string>) {
  // Inquiry submission handler
}
```

`handleSubmit` is an empty stub passed straight into `<InquiryForm onSubmit={handleSubmit} />`.
`InquiryForm` (`template-kit/src/components/InquiryForm.tsx:38-42`) awaits `onSubmit`, and since the
stub resolves without throwing, the form renders `role="status"`/`Sent` — the user is told their
inquiry went through. Nothing is persisted, logged, or surfaced anywhere; the data is thrown away.

Every sibling demo site that collects the same kind of lead does persist it: corporate's
`CallbackSection` and restaurant's `ReservationSection` both call `useLocalCollection().add(...)`, and
realestate's own `SaveListingsSection` (same file's neighbor) already uses that hook correctly. This
is the one form on this site (and across all 5 plans) that regressed to a no-op — a clear, easily
fixed mistake, not a design choice.

**Fix:** wire it into `useLocalCollection` the same way `CallbackSection`/`ReservationSection` do,
e.g.:
```ts
const { items, add } = useLocalCollection<Inquiry>('realestate-inquiries', []);
async function handleSubmit(values: Record<string, string>) {
  add({ id: crypto.randomUUID(), ...values, submittedAt: new Date().toISOString() });
}
```

### M-01 (Medium) — Deep-imports into `template-kit`'s internal `src/`, no `paths` alias

`templates/realestate/app/InquirySection.tsx:2`, `SaveListingsSection.tsx:2-3`, `page.tsx:1-3`,
`data/seed.ts:1-2` all import as `@portfolio/template-kit/src/components/InquiryForm`,
`@portfolio/template-kit/src/useLocalCollection`, etc., instead of the package barrel
`@portfolio/template-kit` (`main: src/index.ts`) that corporate/agency/saas use exclusively.
`templates/realestate/tsconfig.json` also has no `paths` entry for `@portfolio/template-kit` (compare
`templates/corporate/tsconfig.json:24-26` / `templates/agency/tsconfig.json:19-21`, both of which do),
so this resolution works only by accident, through Node's default `node_modules` traversal into the
`file:` workspace link. Any future rename/reorg inside `template-kit/src/` (which is exactly what
happened to `ItemGrid.tsx`/`PricedItemGrid.tsx` in this same diff — see Cross-cutting section) would
silently break realestate without touching template-kit's declared public API.

**Fix:** import from `@portfolio/template-kit` everywhere (as corporate/agency/saas already do), and
add the same `paths` mapping to `tsconfig.json`.

### M-02 (Medium) — Stray Windows-only optional dependency + duplicated React-resolution workaround

`templates/realestate/package.json:26-28` adds:
```json
"optionalDependencies": {
  "@rolldown/binding-win32-x64-msvc": "^1.2.9"
}
```
This key exists in no other site's `package.json` (agency/corporate/saas don't have it). It reads as
an artifact of `npm install` having been run on a Windows machine rather than a deliberate site
dependency, and — being an `optionalDependencies` entry — will silently no-op on Linux/macOS CI while
still shipping stray platform-specific metadata in the lockfile.

This correlates with `templates/realestate/vitest.config.ts` and `templates/restaurant/vitest.config.ts`
(byte-identical to each other) both hand-rolling a `resolve.alias` that force-resolves `react`/
`react-dom` to `node_modules/react` via `path.resolve(__dirname, ...)`, whereas agency/corporate/saas
solve the same "don't load two copies of React" problem with the standard `resolve.dedupe: ['react',
'react-dom']`. The manual alias workaround, appearing only on these two sites, suggests an unresolved
duplicate-React/module-resolution issue in their dependency tree that was patched around locally
instead of fixed at the root (same class of problem `optionalDependencies` hints at).

**Fix:** drop the platform-specific `optionalDependencies` entry, regenerate the lockfile on a clean
install, and align `vitest.config.ts` on both sites with the `resolve.dedupe` pattern used elsewhere
unless there's a concrete reason `dedupe` doesn't work for them (if so, that reason belongs in a
comment).

---

## Restaurant (plan 35)

### M-03 (Medium) — Same deep-import pattern as realestate

`templates/restaurant/app/ReservationSection.tsx:1-3`, `page.tsx:1-3` import
`@portfolio/template-kit/src/components/InquiryForm`, `@portfolio/template-kit/src/useLocalCollection`,
`@portfolio/template-kit/src/components/Hero`, `@portfolio/template-kit/src/components/PricedItemGrid`,
`@portfolio/template-kit/src/components/Footer` directly, and `templates/restaurant/tsconfig.json` has
no `@portfolio/template-kit` `paths` entry either. Same risk and same fix as M-01 above — restaurant and
realestate are the only two of the five sites built this way; corporate/agency/saas both use the
package barrel consistently.

### M-04 (Medium) — `add()` not wrapped in error handling, unlike the sibling that does the same job

`templates/restaurant/app/ReservationSection.tsx:23-31` calls `add({...})` directly with no try/catch.
`useLocalCollection`'s own header comment (`template-kit/src/useLocalCollection.ts:29-31`) explicitly
documents that writes are meant to propagate so **the caller** can catch a quota/private-mode failure
and tell the user — but `ReservationSection` doesn't catch it. `InquiryForm`'s internal try/catch
(`InquiryForm.tsx:38-42`) will still turn the exception into a generic `role="alert"` "Something went
wrong", so this isn't a silent failure, but the reservation is lost with no reservation-specific
messaging, while `templates/saas/app/PricedItemGridSection.tsx:16-30` demonstrates the intended
pattern for this exact scenario (wrap `add`/`reset`, `setMessage(...)` on failure). Corporate's
`CallbackSection.tsx:19-27` has the identical gap. Not High because the failure mode requires
localStorage quota exhaustion or private browsing, which is rare for a demo site, and the user does
see *some* error state.

**Fix:** follow the saas pattern — wrap the `add(...)` call in try/catch and surface a
reservation-specific error message instead of relying solely on InquiryForm's generic one.

---

## Corporate (plan 31)

### M-04 (Medium, same finding as restaurant's M-04)

`templates/corporate/app/CallbackSection.tsx:19-27` — `add({...})` inside `handleSubmit` has no
try/catch, same gap and same fix as restaurant's ReservationSection above. See M-04 for detail; listed
once against both sites since it's one recurring pattern, not two independent bugs.

No other High/Medium findings on corporate. `layout.tsx`'s font loading, `theme.ts`'s
`assertValidTheme` usage, and `CallbackSection`'s sort-by-`submittedAt` are all correctly done and
consistent with the rest of the codebase.

---

## Agency (plan 32)

No High or Medium findings. `WorkSection.tsx`'s category filter, shortlist toggle via
`useLocalCollection`, and `ShortlistPanel`'s use of the shared `SavedItemsPanel` are all correct;
`add`/`remove` calls are safe here because `WorkSection` doesn't attempt to show a save-specific error
state (a Low-severity nit, not worth a Medium — losing a shortlist toggle has no data-loss consequence
the way losing a reservation or callback request does).

---

## SaaS (plan 33)

No High or Medium findings. `PricedItemGridSection.tsx` is the one site that gets the
try/catch-around-`useLocalCollection`-writes pattern right (see M-04 above) — worth calling out as the
reference implementation other sites should match, not just an absence of bugs.

---

## Cross-cutting observations (`template-kit`, shared by all 5 sites)

- `template-kit/src/components/ItemGrid.tsx`: `columns` widened from `2 | 3 | 4` to `2 | 3 | 4 | 6` to
  support saas's 6-column integrations grid (`templates/saas/app/page.tsx:17`, `INTEGRATIONS` with 6
  items). Purely additive, no regression risk for the other 4 sites' existing `columns={3}`/`columns={4}`
  usages.
- `template-kit/src/components/PricedItemGrid.tsx`: added optional `selectedItemId` prop and a
  `data-selected`/"Your plan" badge, consumed only by saas's pricing section. Backward compatible —
  `selectedItemId` defaults to `undefined`, so restaurant's `<PricedItemGrid items={categoryItems}
  currency="VND" />` (no `selectedItemId` passed) renders unchanged.
- Both `template-kit` changes are small, additive, and were reviewed clean. They are the reason M-01/
  M-03 matter: this file has already moved once during these 5 plans, and realestate/restaurant's deep
  imports into it aren't insulated from the next move.
- Import-style split confirmed exactly along the lines above: corporate, agency, saas → barrel import
  + `paths` alias in `tsconfig.json`. Restaurant, realestate → deep `src/...` imports, no `paths`
  alias. This is consistent enough within each pair that it looks like restaurant/realestate were
  built from an earlier or different scaffold than the other three, rather than three independent
  mistakes — worth fixing once, for both sites, in one pass.

---

## File list reviewed

```
template-kit/src/components/ItemGrid.tsx
template-kit/src/components/PricedItemGrid.tsx
templates/agency/app/ShortlistPanel.tsx
templates/agency/app/WorkSection.tsx
templates/agency/app/globals.css
templates/agency/app/layout.tsx
templates/agency/app/page.tsx
templates/agency/app/tokens.css
templates/agency/data/capabilities.ts
templates/agency/data/work.ts
templates/agency/next.config.js
templates/agency/package.json
templates/agency/theme.ts
templates/agency/tsconfig.json
templates/agency/vitest.config.ts
templates/corporate/app/CallbackSection.tsx
templates/corporate/app/globals.css
templates/corporate/app/layout.tsx
templates/corporate/app/page.tsx
templates/corporate/data/seed.ts
templates/corporate/next.config.js
templates/corporate/package.json
templates/corporate/scripts/build-gate.test.mjs
templates/corporate/theme.ts
templates/corporate/tsconfig.json
templates/corporate/vitest.config.ts
templates/realestate/app/InquirySection.tsx
templates/realestate/app/SaveListingsSection.tsx
templates/realestate/app/globals.css
templates/realestate/app/layout.tsx
templates/realestate/app/page.tsx
templates/realestate/data/seed.ts
templates/realestate/next.config.js
templates/realestate/package.json
templates/realestate/scripts/build-gate.test.mjs
templates/realestate/theme.ts
templates/realestate/tsconfig.json
templates/realestate/vitest.config.ts
templates/restaurant/app/ReservationSection.tsx
templates/restaurant/app/globals.css
templates/restaurant/app/layout.tsx
templates/restaurant/app/page.tsx
templates/restaurant/data/seed.ts
templates/restaurant/next.config.js
templates/restaurant/package.json
templates/restaurant/scripts/build.test.mjs
templates/restaurant/theme.ts
templates/restaurant/tsconfig.json
templates/restaurant/vitest.config.ts
templates/saas/app/PricedItemGridSection.tsx
templates/saas/app/globals.css
templates/saas/app/layout.tsx
templates/saas/app/page.tsx
templates/saas/data/seed.ts
templates/saas/next.config.js
templates/saas/package.json
templates/saas/scripts/build-gate.test.mjs
templates/saas/theme.ts
templates/saas/tokens.css
templates/saas/tsconfig.json
```
