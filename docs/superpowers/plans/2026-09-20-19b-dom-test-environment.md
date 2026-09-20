# DOM Test Environment — per-file jsdom for the component tests plans 20–28 need

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a DOM test environment to `frontend/` so the component tests in plans 20, 21, 22, 23
and 28 can run — **without** changing how the 46 existing tests execute.

**Why this plan exists:** plans 20–28 were written assuming `@testing-library/react` was available.
It is not, and neither is any DOM environment. The plan-19 review closed this for plan 19 by
rewriting its two tests to the `renderToString` idiom, and flagged the question as "decide before
plan 22". Re-reading plans 20 and 21 moved the deadline earlier and made the answer clear:

| Test | Needs | `renderToString` enough? |
|---|---|---|
| `RevealOnScroll` (plan 20) | mocks `IntersectionObserver`, reads `parentElement` | **No** — tests client-side observer behaviour |
| `HeroSection`, `AboutSection` (plan 20) | `getByRole`, text assertions | yes |
| `ServicesSection` (plan 21) | `getAllByRole("listitem")` | yes |
| `ContactForm` (plan 21) | `fireEvent.change/click`, `waitFor`, `toBeDisabled` — 8 states | **No** |
| plans 22, 23 | `fireEvent` | **No** |
| plan 28 `InquiryForm` | form interaction | **No** |

You cannot unit-test an `IntersectionObserver` wrapper or an 8-state form by rendering it to a
string. Dropping those tests would gut the coverage the plans exist to provide.

**Architecture decision — per-file, not global.** Do **not** set `environment: "jsdom"` in
`vitest.config.mjs`. `frontend/lib/webgl.test.ts` asserts the SSR path by doing

```ts
delete (globalThis as Record<string, unknown>).window;
delete (globalThis as Record<string, unknown>).document;
expect(isWebGLAvailable()).toBe(false);
```

and restoring from values captured at module load. Under a global jsdom environment those globals
are installed by the environment rather than absent, so that deletion no longer produces the SSR
condition the test is asserting — a green suite would stop meaning what it means today. Opting in
per file with a `// @vitest-environment jsdom` docblock leaves all 11 existing test files running
in Node exactly as they do now.

**Tech Stack:** Vitest per-file environment docblock, jsdom, @testing-library/react,
@testing-library/jest-dom.

**Depends on:** nothing. **Required by:** `2026-09-20-20-landing-hero-about.md`,
`2026-09-20-21-landing-services-contact.md`, `2026-09-20-22-admin-content-editor.md`,
`2026-09-20-23-admin-media-library.md`, `2026-09-20-28-template-design-system-scaffold.md`.

## Global Constraints

- No comments restating what code does; only comments explaining non-obvious "why".
- **Do not change `environment` in `vitest.config.mjs`** — see the architecture note above.
- The 46 existing tests must still pass, and must still run in the Node environment.
- `package-lock.json` must be committed with `package.json`, or `npm ci` in the `test` CI job breaks.

---

### Task 1: Add the three devDependencies

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json` (generated)

- [ ] **Step 1: Install as devDependencies**

```bash
cd frontend
npm install --save-dev jsdom @testing-library/react @testing-library/jest-dom
```

These are the only three. Do not add `@testing-library/user-event` — no plan uses it; `fireEvent`
covers every interaction plans 20–28 assert.

- [ ] **Step 2: Confirm the existing suite is untouched**

Run: `cd frontend && npx vitest run`
Expected: **46/46 PASS**, 11 files. Installing the packages must not change any result — nothing
imports them yet and the environment is still Node.

- [ ] **Step 3: Confirm the lockfile is in sync**

Run: `cd frontend && npm ci --dry-run`
Expected: no "package.json and package-lock.json are not in sync" error. This is the check that
protects the CI `test` job, which runs `npm ci`.

- [ ] **Step 4: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "chore: add jsdom and testing-library for the component tests plans 20-28 need"
```

---

### Task 2: Prove the per-file opt-in works, and leave the proof in the repo

**Files:**
- Create: `frontend/lib/domEnvironment.test.tsx`

**Interfaces:**
- Produces: the copy-paste header every DOM test in plans 20–28 must start with, verified by a test
  that fails if the setup regresses.

- [ ] **Step 1: Write the test**

```tsx
// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// Guards the per-file opt-in itself: if the docblock, the jest-dom import or either package
// regresses, this fails before any feature test has a chance to fail confusingly.
describe("DOM test environment", () => {
  it("renders into a real document and exposes jest-dom matchers", () => {
    render(<p>xin chào</p>);
    expect(screen.getByText("xin chào")).toBeInTheDocument();
  });
});
```

The first two lines are the pattern. **Every** DOM-requiring test file in plans 20, 21, 22, 23 and
28 must open with exactly those two lines; a file without the docblock runs in Node and fails with
`document is not defined`.

- [ ] **Step 2: Run the new test alone**

Run: `cd frontend && npx vitest run lib/domEnvironment.test.tsx`
Expected: PASS.

- [ ] **Step 3: Confirm the Node-environment tests still behave**

Run: `cd frontend && npx vitest run lib/webgl.test.ts`
Expected: PASS. This is the file the global-jsdom approach would have broken, so it is worth
running on its own rather than only inside the full suite.

- [ ] **Step 4: Full suite + build**

Run: `cd frontend && npx vitest run && npm run build`
Expected: **47/47 PASS** across 12 files; build succeeds.

- [ ] **Step 5: Commit**

```bash
git add frontend/lib/domEnvironment.test.tsx
git commit -m "test: pin the per-file jsdom opt-in that plans 20-28 depend on"
```

## Self-Review Notes

- **Scope:** three devDependencies and one test file. No application source changes at all.
- **Why a test for the test setup:** the failure mode being guarded against is a DOM test file that
  silently lacks the docblock. That fails with `document is not defined`, which reads like a bug in
  the component rather than a missing header. One pinned test makes the cause obvious.
- **Rejected alternative:** `environment: "jsdom"` globally, one line instead of a header per file.
  Rejected on evidence, not taste — `lib/webgl.test.ts` deletes `window`/`document` to assert the
  SSR branch, and a global DOM environment reinstates them.
- **Next:** `2026-09-20-20-landing-hero-about.md`.
