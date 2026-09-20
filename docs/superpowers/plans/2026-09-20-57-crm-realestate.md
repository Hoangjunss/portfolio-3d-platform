# CRM Real Estate Demo Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `crm-realestate` demo template site (`templates/crm-realestate/`) — the first
of the interactive-demo templates program's 3 CRM variants (plans 57-59). Unlike the 26 sites
before it, this is an **internal dashboard app**, not a public marketing landing page: a mock
fake-login screen → dashboard shell with a 3-item sidebar (Contacts, Deals/Pipeline, Activity Log)
→ `RecordTable` for Contacts and Activity Log, `KanbanBoard` for Deals/Pipeline, with a shared
cross-screen activity-logging helper wiring all three together.

**Architecture:** This plan is plan 57 in the interactive-demo spec's §9 execution order. It has
one hard prerequisite: `2026-09-20-30-template-kit-scaffold.md` must be complete and committed
(`@portfolio/template-kit` built, tested, exporting `KanbanBoard`, `RecordTable`,
`useLocalCollection`, `TemplateTheme`/`assertValidTheme` from its barrel `src/index.ts`). This plan
does not modify `template-kit` itself — it only consumes it. Because this category has no
`Hero`/marketing-section composition, its task breakdown does not follow the "Hallmark → scaffold →
one interactive feature" 3-task shape used by the 26 landing-page site plans (e.g. plan 31); it has
5 tasks instead, matching the category's larger real scope (3 distinct screens + a shared login
gate + cross-screen activity logging), per master spec §4.3/§9.

**Tech Stack:** Next.js 15 / React 19 static export (`output: 'export'`), TypeScript, Vitest +
Testing Library + jsdom for interaction tests, `@portfolio/template-kit` as a local workspace
dependency. No backend change — this plan touches nothing under `backend/`.

**Spec:** `docs/superpowers/specs/2026-09-20-site-crm-realestate-design.md` (page structure, seed
data for contacts/deals/activity log, session data shape, activity-log auto-append wiring,
Hallmark design brief) plus the two specs it is scoped by:
`docs/superpowers/specs/2026-09-20-interactive-demo-templates-design.md` (§4.3 the CRM category's
complete definition — page structure, data model, fake-login convention — §3.3 `KanbanBoard`/
`RecordTable` prop contracts, §5 per-site Hallmark requirement, §7 the build+interaction test gate,
§8 the 10-criterion design scoring gate, §9 execution order) and
`docs/superpowers/specs/2026-09-20-template-design-system-design.md` (§6 folder/thumbnail/slug
convention, unchanged).

## Global Constraints

- **Hard prerequisite: plan 30 must be committed first.** Do not start Task 2 until
  `@portfolio/template-kit`'s barrel export (`template-kit/src/index.ts`) exists and its own test
  suite passes — this plan imports `KanbanBoard`, `RecordTable`, `useLocalCollection` from it, it
  does not vendor or reimplement any kit component.
- **`slug` = `crm-realestate`, `subdomain` = `crm-realestate`, `display_order` = 27** — fixed by
  plan 30 Task 1's authoritative slug table; do not deviate.
- No comments restating what code does; only comments explaining non-obvious "why" (same rule as
  plans 30/31).
- **No fabricated content.** Seed data (contacts, deals, activity log) must match
  `docs/superpowers/specs/2026-09-20-site-crm-realestate-design.md` §3 exactly — no invented
  statistics presented as real, no Lorem Ipsum, no fake pre-filled visitor history (the fake-login
  session itself always seeds empty, per §2.2 of that spec).
- **This category has no static-content render-pattern exemption** the way marketing sites do —
  every screen here (Contacts, Deals, Activity Log) is inherently a `useLocalCollection`-backed
  mutable view; there is no separate "static marketing content" layer to keep un-gated. The
  seed-data arrays (`CONTACTS`, `DEALS`, `ACTIVITY_LOG`) still live in `data/seed.ts` as plain
  importable constants (not inlined in components) so `useLocalCollection`'s own first-visit-seed
  behavior (interactive-demo spec §3.1) has a single source of truth per collection.
- Every screen must render at 320/375/414/768px without horizontal scroll (same rule
  `template-kit` components are already built to, per plan 30's Global Constraints) — a dense
  `RecordTable`/`KanbanBoard` UI is the harder case in this program for this constraint; expect the
  Hallmark pass (Task 1) to address horizontal-scroll-within-a-table/board as an explicit
  responsive decision, not an afterthought.
- `next.config.js` must set `output: 'export'` (parent spec §6, unchanged).
- `public/thumbnail.webp` is required and validated by `template-kit/scripts/check-thumbnail.mjs`
  (plan 30 Task 2) wired into this site's own `package.json` `build` script — per interactive-demo
  spec §6, this category's thumbnail is a screenshot of the dashboard shell, not a marketing hero
  image, which is fine.
- Do not fabricate Hallmark token values in this plan document. Task 1 states the process and the
  required output shape; the real hex/font/spacing values only exist after the real session runs.
- Do not fabricate Task 5's design-score numbers in this plan document. The score table is written
  with criterion names and an empty/TBD score column — real scores are filled in by whoever
  executes Task 5, after implementation, per master spec §8.
- Current baseline: re-read `docs/superpowers/STATUS.md`'s own header for the actual current pass
  count before reporting — plans may have landed between this plan's authoring and its execution.

---

## Task 1: Hallmark design pass

**Files:**
- Create: `templates/crm-realestate/theme.ts`
- Create: `templates/crm-realestate/app/globals.css`
- Create (Hallmark's own working artifacts, per the skill's normal output — moodboard/reference
  notes, wherever the `hallmark` skill places them): no fixed path prescribed here; follow the
  skill's own convention.

**Interfaces:**
- Consumes: `TemplateTheme` type and `assertValidTheme` validator from `@portfolio/template-kit`
  (`template-kit/src/theme.ts`, shipped by plan 30 Task 2) — this site's `theme.ts` must conform to
  that shape and call `assertValidTheme` on its own exported value so a malformed token set fails
  the build loudly instead of shipping `undefined` CSS variables.
- Produces: `templates/crm-realestate/theme.ts` (the validated `TemplateTheme` value this site
  commits to) and `templates/crm-realestate/app/globals.css` (the `--color-*`/`--font-*`/
  `--space-*` custom properties `template-kit`'s components read at render time, populated with
  this site's real values instead of placeholders).

### Design decision

**(a) This is a real Hallmark session, not a scaffold placeholder, and its brief is an internal-tool
brief, not a marketing-site brief.** Per interactive-demo spec §5, every one of the 29 sites gets
its own full `hallmark` skill pass (greenfield path), same rigor as the main portfolio site's own
pass. The input to the session is this plan's own spec,
`docs/superpowers/specs/2026-09-20-site-crm-realestate-design.md` §5 ("Hallmark design brief") —
industry mood (internal SaaS back-office for a real-estate agency's own staff, not a public-facing
site), the non-binding cool-hue/humanist-sans starting direction, and the 3 reference directions to
research. Unlike plan 31's corporate brief, this session must explicitly design for information
density (a dense `RecordTable`, a multi-column `KanbanBoard`) rather than generous marketing
whitespace — the session's research phase should treat that as a first-class constraint, not
something to soften into a landing-page look. The session may land anywhere its research supports,
including deviating from the starting direction, as long as the result clears every criterion in
master spec §8 at Task 5 time (particularly #1 anti-generic, #2 typographic craft, #7
accessibility — table/board legibility matters more here than in any of the 26 marketing sites —
and #10 distinctiveness against `crm-agency`/`crm-clinic`, this category's two siblings).

- [ ] **Step 1: Invoke the `hallmark` skill, greenfield path**, supplying it this plan's context:
  the site is an internal CRM dashboard for a real-estate agency (fake-login screen → sidebar shell
  → dense `RecordTable`/`KanbanBoard` screens, no `Hero`/marketing sections), industry mood per
  spec §5, and the constraint that output must conform to `template-kit`'s `TemplateTheme` shape
  (`accentHue: string`, `displayFont: string`, `bodyFont: string` — plus whatever additional
  `--space-*`/motion tokens the session decides are needed for `globals.css`, which are not
  constrained by `TemplateTheme`'s type since that type only governs the 3 fields `template-kit`'s
  components read directly).
- [ ] **Step 2: Run the session's research phase** — the skill's own process for the 2-3 reference
  directions named in the spec (B2B SaaS back-office/admin UI language, real-estate CRM product UI
  distinct from real-estate marketing sites, humanist-sans type systems built for data-dense UI),
  converging on one direction with a rationale, not a blend of all three.
- [ ] **Step 3: Produce `templates/crm-realestate/theme.ts`** exporting a `TemplateTheme`-conformant
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

- [ ] **Step 4: Produce `templates/crm-realestate/app/globals.css`** defining the `--color-*`/
  `--font-*`/`--space-*` (and any motion-duration/easing tokens the session's restrained-motion
  direction needs, per master spec §8 criterion #5 and this spec's §5 "even more restrained than
  the program's general bar") custom properties `template-kit`'s components read, with real values
  matching `theme.ts`'s exported `TemplateTheme` — no ad-hoc hex/OKLCH values outside this token
  file (master spec §8 criterion #3 requires every color trace to a token). Include explicit table
  row/zebra-striping and Kanban-column tokens if the session's direction uses them, since
  `RecordTable`/`KanbanBoard` render plain unstyled markup (`tk-record-table`/`tk-kanban-board`
  class hooks) that this site's own CSS must style.
- [ ] **Step 5: Verify WCAG AA contrast** on every real text/background token pairing the session
  defines (criterion #3), with particular attention to table-row text on any zebra-stripe/hover
  background and Kanban-column header text — using the Hallmark skill's own audit capability or an
  equivalent contrast checker; record the pass in the session's own notes.
- [ ] **Step 6: Verify `theme.ts` imports and `assertValidTheme` succeeds** —
  `cd templates/crm-realestate && npx tsx theme.ts` (or equivalent quick run) exits 0, no thrown
  error.
- [ ] **Step 7: Commit** — `design: Hallmark pass for crm-realestate site theme`

**Acceptance criteria for this task:** `templates/crm-realestate/theme.ts` exists, type-checks
against `TemplateTheme`, and its module-scope `assertValidTheme` call does not throw; `globals.css`
defines real (non-placeholder) values for every token `template-kit` components consume plus this
site's own table/board styling hooks; the direction is traceable to the spec's Hallmark brief (§5)
and its research phase, not asserted without process.

---

## Task 2: Next.js app scaffold + fake-login screen + dashboard shell

**Files:**
- Create: `templates/crm-realestate/package.json`, `templates/crm-realestate/tsconfig.json`,
  `templates/crm-realestate/next.config.js`
- Create: `templates/crm-realestate/app/layout.tsx`, `templates/crm-realestate/app/page.tsx`
- Create: `templates/crm-realestate/app/LoginScreen.tsx` (client component)
- Create: `templates/crm-realestate/app/DashboardShell.tsx` (client component)
- Create: `templates/crm-realestate/public/thumbnail.webp` (placeholder image — see step 7 note)
- Test: `templates/crm-realestate/scripts/build-gate.test.mjs`
- Test: `templates/crm-realestate/app/LoginScreen.test.tsx`

**Interfaces:**
- Consumes: `useLocalCollection` from `@portfolio/template-kit`'s barrel export (plan 30 Task 5);
  `theme.ts`/`globals.css` from Task 1; `template-kit/scripts/check-thumbnail.mjs` (plan 30 Task 2)
  wired into this `package.json`'s `build` script.
- Produces: `templates/crm-realestate/app/page.tsx`, the top-level component that Tasks 3-5 wire
  their own screens into via `DashboardShell`'s sidebar routing; the `CrmSession` local-collection
  usage every later task's own "am I logged in" checks (implicitly, via the shell) depend on.

### Design decisions

**(b) `useLocalCollection<CrmSession>('crm-realestate-session', [])` is the login-state
primitive**, per `docs/superpowers/specs/2026-09-20-site-crm-realestate-design.md` §2.2 — an empty
array means logged out; a single `{ id: 'session', name, loggedIn: true }` row means logged in.
`page.tsx` renders `LoginScreen` when `items.length === 0` and `DashboardShell` otherwise; no
separate routing/middleware layer, no cookie, no expiry — matching the hook's own hydration
contract (interactive-demo spec §3.1) exactly, the same way every other collection in this site
does.

**(c) `DashboardShell` owns the sidebar and the active-screen switch**, via
`useState<'contacts' | 'deals' | 'activity'>('contacts')` (Contacts is the default landing screen
on login, per spec §2.3's nav order) — Tasks 3-5 each add one screen component that `DashboardShell`
renders conditionally; this task creates `DashboardShell` with the sidebar and the 3 nav buttons
wired to that state, plus explicit placeholder markers for the 3 screen slots (not left as
unresolved TODOs at plan end — Tasks 3-5 fill them in the same plan, same convention as plan 31
Task 2 Step 9's interactive-section marker).

**(d) "Reset demo data" resets the session collection too, not just business data** — the shared
control (rendered inside `DashboardShell`, always visible per spec §2.3) calls `reset()` on all 4
`useLocalCollection` instances (session, contacts, deals, activity log) in one click handler, so
the visitor lands back on `LoginScreen` per spec §2.1's logout rule. This task wires the session
half; Tasks 3-5 each add their own collection's `reset()` call to the same shared handler (passed
down as a prop from `page.tsx`, which is the one place all 4 hooks are in scope together — see Task
5 for the final assembly).

- [ ] **Step 1: Write the failing build-gate test**

```javascript
// templates/crm-realestate/scripts/build-gate.test.mjs
import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

describe('crm-realestate site build gate', () => {
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

- [ ] **Step 2: Write the failing login-flow interaction test**

```tsx
// templates/crm-realestate/app/LoginScreen.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CrmApp } from './page';

beforeEach(() => {
  window.localStorage.clear();
});

describe('crm-realestate login flow', () => {
  it('shows the login screen on first visit', () => {
    render(<CrmApp />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.queryByText(/contacts/i)).not.toBeInTheDocument();
  });

  it('any non-empty name logs the visitor in and shows the dashboard shell', async () => {
    render(<CrmApp />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Demo Agent' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /contacts/i })).toBeInTheDocument();
    });
  });

  it('stays logged in across a simulated reload', async () => {
    const { unmount } = render(<CrmApp />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Demo Agent' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /contacts/i })).toBeInTheDocument());
    unmount();

    render(<CrmApp />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /contacts/i })).toBeInTheDocument();
    });
  });

  it('"Reset demo data" logs the visitor back out', async () => {
    render(<CrmApp />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Demo Agent' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /contacts/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /reset demo data/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /contacts/i })).not.toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 3: Run to verify both test files fail** — `cd templates/crm-realestate && npx vitest
  run` (package/app don't exist yet, expect failure).
- [ ] **Step 4: `templates/crm-realestate/package.json`**

```json
{
  "name": "crm-realestate-template",
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

- [ ] **Step 5: `templates/crm-realestate/next.config.js`**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
};

module.exports = nextConfig;
```

- [ ] **Step 6: `templates/crm-realestate/tsconfig.json`** — same shape as
  `template-kit/tsconfig.json` (plan 30 Task 2 Step 4) with `jsx: "preserve"` and Next.js's
  standard `plugins`/`paths` additions per the installed Next.js version's own scaffold defaults.
- [ ] **Step 7: Add `public/thumbnail.webp`** — a placeholder WEBP image representing a screenshot
  of the dashboard shell (per interactive-demo spec §6, this category's thumbnail is a dashboard
  screenshot, not a marketing hero image); any tool capable of emitting a real `RIFF`/`WEBP` file,
  content is not load-bearing for this step, validity is.
- [ ] **Step 8: `templates/crm-realestate/app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Việt Nam Land Partners — CRM',
  description: 'Internal pipeline dashboard demo for a real-estate agency (contacts, deals, activity log).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 9: `templates/crm-realestate/app/LoginScreen.tsx`**

```tsx
'use client';
import { useState, type FormEvent } from 'react';

export interface LoginScreenProps {
  onLogin: (name: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    onLogin(name.trim());
  }

  return (
    <main className="crm-login">
      <form onSubmit={handleSubmit}>
        <h1>Việt Nam Land Partners</h1>
        <p>Internal CRM demo — any name signs you in, nothing is verified.</p>
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <button type="submit">Log in</button>
      </form>
    </main>
  );
}
```

  `email` is captured in local state only to satisfy spec §2.1's optional field, then discarded —
  per spec §2.2, `CrmSession` never persists it.

- [ ] **Step 10: `templates/crm-realestate/app/DashboardShell.tsx`**

```tsx
'use client';
import { useState } from 'react';

export type CrmScreen = 'contacts' | 'deals' | 'activity';

export interface DashboardShellProps {
  onResetAll: () => void;
  contactsScreen: React.ReactNode;
  dealsScreen: React.ReactNode;
  activityScreen: React.ReactNode;
}

const NAV_ITEMS: Array<{ key: CrmScreen; label: string }> = [
  { key: 'contacts', label: 'Contacts' },
  { key: 'deals', label: 'Deals / Pipeline' },
  { key: 'activity', label: 'Activity Log' },
];

export function DashboardShell({ onResetAll, contactsScreen, dealsScreen, activityScreen }: DashboardShellProps) {
  const [active, setActive] = useState<CrmScreen>('contacts');

  return (
    <div className="crm-dashboard-shell">
      <aside className="crm-sidebar">
        <nav>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-current={active === item.key}
              onClick={() => setActive(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button type="button" className="crm-reset" onClick={onResetAll}>Reset demo data</button>
      </aside>
      <main className="crm-main">
        {active === 'contacts' ? contactsScreen : null}
        {active === 'deals' ? dealsScreen : null}
        {active === 'activity' ? activityScreen : null}
      </main>
    </div>
  );
}
```

  Tasks 3-5's own screens fill `contactsScreen`/`dealsScreen`/`activityScreen` — this task leaves
  them as an explicit prop contract (not an unresolved TODO) so `DashboardShell` itself is
  complete, testable, and buildable before those screens exist. Until Task 3 lands, `page.tsx`
  (Step 11) passes small `<p>Coming in Task N</p>` placeholders as those props, replaced in the
  same plan by Tasks 3-5.

- [ ] **Step 11: `templates/crm-realestate/app/page.tsx`**

```tsx
'use client';
import { useLocalCollection } from '@portfolio/template-kit';
import { LoginScreen } from './LoginScreen';
import { DashboardShell } from './DashboardShell';

interface CrmSession {
  id: string;
  name: string;
  loggedIn: true;
}

export function CrmApp() {
  const session = useLocalCollection<CrmSession>('crm-realestate-session', []);

  function handleLogin(name: string) {
    session.add({ id: 'session', name, loggedIn: true });
  }

  function handleResetAll() {
    session.reset();
    // Tasks 3-5 extend this with their own collections' reset() calls (contacts/deals/activityLog)
    // — session reset alone already satisfies spec §2.1's logout behavior for this task.
  }

  if (session.items.length === 0) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <DashboardShell
      onResetAll={handleResetAll}
      contactsScreen={<p>Coming in Task 3</p>}
      dealsScreen={<p>Coming in Task 4</p>}
      activityScreen={<p>Coming in Task 5</p>}
    />
  );
}

export default function Page() {
  return <CrmApp />;
}
```

- [ ] **Step 12: Run `cd templates/crm-realestate && npm install && npm run build`, then `npx
  vitest run`, verify pass.**
- [ ] **Step 13: Mutation checks**

| # | Revert | Test that must go RED |
|---|---|---|
| M1 | remove `output: 'export'` from `next.config.js` | the static-export `out/index.html` existence assertion |
| M2 | replace `public/thumbnail.webp` with a non-WEBP file of the same name | the thumbnail-valid-WEBP test |
| M3 | seed `useLocalCollection('crm-realestate-session', ...)` with a non-empty default row instead of `[]` | the "shows the login screen on first visit" test |
| M4 | make `handleResetAll` not call `session.reset()` | the "Reset demo data logs the visitor back out" test |
| M5 | make `LoginScreen` call `onLogin` even when `name` is empty | would let an empty submission log in silently — the "any non-empty name logs the visitor in" test still asserts on the actually-typed name flow, so this specific mutation is caught by re-running Step 2's test with an empty-name variant added if the implementer chooses; at minimum, `required` on the `name` input plus the `if (!name.trim()) return;` guard must both be present |

- [ ] **Step 14: Commit** — `feat: scaffold crm-realestate Next.js app with fake login and dashboard shell`

---

## Task 3: Contacts screen (`RecordTable`)

**Files:**
- Create: `templates/crm-realestate/data/seed.ts` (contacts portion; Tasks 4-5 extend the same
  file)
- Create: `templates/crm-realestate/lib/logActivity.ts`
- Create: `templates/crm-realestate/app/ContactsScreen.tsx` (client component)
- Modify: `templates/crm-realestate/app/page.tsx` (wire `ContactsScreen` into
  `DashboardShell`'s `contactsScreen` slot, add the contacts + activity-log `useLocalCollection`
  instances, extend `handleResetAll`)
- Test: `templates/crm-realestate/app/ContactsScreen.test.tsx`

**Interfaces:**
- Consumes: `RecordTable`, `useLocalCollection` from `@portfolio/template-kit`; `CONTACTS` seed
  data (this task); `logActivity` helper (this task, also consumed by Task 4).
- Produces: `logActivity(add, entry)` — the shared helper Task 4's Deals screen also imports;
  `ContactsScreen`, which `page.tsx` wires into the shell.

### Design decisions

**(e) `logActivity` is a plain function, not a hook**, per
`docs/superpowers/specs/2026-09-20-site-crm-realestate-design.md` §4 — it takes the Activity Log
collection's own `add` function (from that screen's `useLocalCollection` instance, lifted to
`page.tsx` so both Contacts and Deals screens can call it) plus a partial entry, and fills in
`id`/`at` itself:

```typescript
// templates/crm-realestate/lib/logActivity.ts
export interface ActivityLogEntry {
  id: string;
  contactId?: string;
  dealId?: string;
  type: string;
  note: string;
  at: string;
}

export function logActivity(
  add: (entry: ActivityLogEntry) => void,
  entry: Omit<ActivityLogEntry, 'id' | 'at'>,
): void {
  add({ ...entry, id: crypto.randomUUID(), at: new Date().toISOString() });
}
```

**(f) `ContactsScreen` receives the activity log's `add` as a prop**, not by calling
`useLocalCollection` for activity log itself — per spec §4's "two independent screens' mutation
handlers both write into the third screen's collection through one shared function" rule, the
Activity Log's own `useLocalCollection('crm-realestate-activity-log', ACTIVITY_LOG)` is
instantiated once, in `page.tsx` (the one place all collections are in scope together), and its
`add` is passed down to both `ContactsScreen` and (Task 4's) `DealsScreen`.

**(g) `RecordTable`'s `onEdit`/`onDelete` map directly to `update`/`remove` from the contacts
`useLocalCollection`, wrapped to also call `logActivity`** — `onEdit` here means "open an inline
edit," and since `RecordTable`'s actual contract (plan 30 Task 5) only gives `onEdit(row: T)` (no
built-in edit form), this screen supplies a minimal inline edit affordance: clicking Edit populates
a small edit form (name/company/email/phone) pre-filled from the row; submitting it calls
`update(id, patch)` then `logActivity`. This is page-local, not a new kit component (same
precedent as plan 31's `CallbackSection` not needing a new kit component for its own list).

- [ ] **Step 1: Write the failing interaction test**

```tsx
// templates/crm-realestate/app/ContactsScreen.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContactsScreen } from './ContactsScreen';

beforeEach(() => {
  window.localStorage.clear();
});

describe('ContactsScreen', () => {
  it('renders the seeded contacts', () => {
    render(<ContactsScreen onActivity={() => {}} />);
    expect(screen.getByText('Nguyễn Thị Mai')).toBeInTheDocument();
  });

  it('filters contacts via the search input', () => {
    render(<ContactsScreen onActivity={() => {}} />);
    fireEvent.change(screen.getByLabelText(/search/i), { target: { value: 'hùng' } });
    expect(screen.getByText('Trần Văn Hùng')).toBeInTheDocument();
    expect(screen.queryByText('Nguyễn Thị Mai')).not.toBeInTheDocument();
  });

  it('editing a contact updates the row and logs an activity entry', async () => {
    const onActivity = vi.fn();
    render(<ContactsScreen onActivity={onActivity} />);
    fireEvent.click(screen.getAllByRole('button', { name: /^edit$/i })[0]);
    fireEvent.change(screen.getByLabelText(/^phone$/i), { target: { value: '0900000000' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText('0900000000')).toBeInTheDocument();
      expect(onActivity).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'contact_updated', contactId: 'ct-1' }),
      );
    });
  });

  it('deleting a contact removes the row and logs an activity entry', async () => {
    const onActivity = vi.fn();
    render(<ContactsScreen onActivity={onActivity} />);
    fireEvent.click(screen.getAllByRole('button', { name: /^delete$/i })[0]);

    await waitFor(() => {
      expect(screen.queryByText('Nguyễn Thị Mai')).not.toBeInTheDocument();
      expect(onActivity).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'contact_deleted', contactId: 'ct-1' }),
      );
    });
  });

  it('persists an edit across remount (simulated reload)', async () => {
    const { unmount } = render(<ContactsScreen onActivity={() => {}} />);
    fireEvent.click(screen.getAllByRole('button', { name: /^edit$/i })[0]);
    fireEvent.change(screen.getByLabelText(/^phone$/i), { target: { value: '0900000000' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(screen.getByText('0900000000')).toBeInTheDocument());
    unmount();

    render(<ContactsScreen onActivity={() => {}} />);
    await waitFor(() => expect(screen.getByText('0900000000')).toBeInTheDocument());
  });
});
```

  (`vi` must be imported from `vitest` alongside the other named imports in the real file.)

- [ ] **Step 2: Run to verify it fails** — `cd templates/crm-realestate && npx vitest run
  app/ContactsScreen.test.tsx` (module doesn't exist yet).
- [ ] **Step 3: `templates/crm-realestate/data/seed.ts`** — add the `Contact`/`CONTACTS` export
  exactly as specified in
  `docs/superpowers/specs/2026-09-20-site-crm-realestate-design.md` §3.1 (copy verbatim, all 10
  rows — do not trim or invent additional rows). This file grows in Tasks 4 and 5 with `Deal`/
  `DEALS` and re-exports `ActivityLogEntry`/`ACTIVITY_LOG`.
- [ ] **Step 4: `templates/crm-realestate/lib/logActivity.ts`** — as shown in design decision (e)
  above.
- [ ] **Step 5: `templates/crm-realestate/app/ContactsScreen.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { RecordTable, useLocalCollection } from '@portfolio/template-kit';
import { CONTACTS, type Contact } from '../data/seed';
import { logActivity, type ActivityLogEntry } from '../lib/logActivity';

export interface ContactsScreenProps {
  onActivity: (entry: Omit<ActivityLogEntry, 'id' | 'at'>) => void;
}

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'company', label: 'Company' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
];

export function ContactsScreen({ onActivity }: ContactsScreenProps) {
  const contacts = useLocalCollection<Contact>('crm-realestate-contacts', CONTACTS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Contact>>({});

  function startEdit(row: Contact) {
    setEditingId(row.id);
    setDraft(row);
  }

  function saveEdit() {
    if (!editingId) return;
    contacts.update(editingId, draft);
    onActivity({ contactId: editingId, type: 'contact_updated', note: `Updated contact ${draft.name}` });
    setEditingId(null);
  }

  function deleteContact(id: string) {
    const row = contacts.items.find((c) => c.id === id);
    contacts.remove(id);
    if (row) onActivity({ contactId: id, type: 'contact_deleted', note: `Removed contact ${row.name}` });
  }

  return (
    <section className="crm-contacts-screen">
      <h2>Contacts</h2>
      <RecordTable columns={COLUMNS} rows={contacts.items} onEdit={startEdit} onDelete={deleteContact} />
      {editingId ? (
        <div className="crm-edit-panel">
          <label>
            Name
            <input value={draft.name ?? ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </label>
          <label>
            Company
            <input value={draft.company ?? ''} onChange={(e) => setDraft({ ...draft, company: e.target.value })} />
          </label>
          <label>
            Email
            <input value={draft.email ?? ''} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
          </label>
          <label>
            Phone
            <input value={draft.phone ?? ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
          </label>
          <button type="button" onClick={saveEdit}>Save</button>
        </div>
      ) : null}
    </section>
  );
}
```

  `logActivity`'s two-argument form (`add`, `entry`) is used at the `page.tsx` wiring level (Step
  7 below); `ContactsScreen` itself takes the simpler `onActivity(entry)` callback so its own tests
  don't need a real activity-log `useLocalCollection` instance in scope — `page.tsx` closes over
  `logActivity(activityLog.add, entry)` when it builds the `onActivity` prop it passes down.

- [ ] **Step 6: Export `ActivityLogEntry`/`ACTIVITY_LOG` from `data/seed.ts`** re-using the shape
  from `lib/logActivity.ts` (import the type there, don't redefine it) — add the `ACTIVITY_LOG`
  seed rows from spec §3.3 now, even though the Activity Log screen itself is Task 5, so
  `page.tsx`'s Step 7 wiring (below) has a real seed to instantiate the hook with.
- [ ] **Step 7: Wire `ContactsScreen` into `page.tsx`** — instantiate
  `useLocalCollection<ActivityLogEntry>('crm-realestate-activity-log', ACTIVITY_LOG)` in `CrmApp`,
  pass `contactsScreen={<ContactsScreen onActivity={(entry) => logActivity(activityLog.add, entry)} />}`
  into `DashboardShell`, and extend `handleResetAll` to also call `activityLog.reset()` (contacts'
  own reset is added in this same step: instantiate
  `useLocalCollection<Contact>('crm-realestate-contacts', CONTACTS)` is actually owned inside
  `ContactsScreen` itself per Step 5 above — `page.tsx` cannot call `.reset()` on a hook instance it
  doesn't hold; see Step 8 note).
- [ ] **Step 8: Resolve the reset-ownership seam** — because `ContactsScreen` (Step 5) owns its own
  `useLocalCollection('crm-realestate-contacts', ...)` instance, `page.tsx`'s `handleResetAll`
  cannot directly call `.reset()` on it. Lift the contacts hook to `page.tsx` as well (matching how
  the activity-log hook is lifted in Step 7) and pass `contacts.items`/`contacts.update`/
  `contacts.remove`/`contacts.add` down as props to `ContactsScreen`, replacing Step 5's internal
  `useLocalCollection` call with props. Update `ContactsScreen.test.tsx` accordingly if its
  component signature changed (props-based version takes `contacts: UseLocalCollectionResult
  <Contact>` instead of calling the hook itself). This keeps exactly one call site per
  `storageKey`'s `useLocalCollection` (in `page.tsx`), consistent with how Task 2's `session` hook
  and Task 4's `deals` hook are also instantiated at that single top level — the same seam Task 4
  reuses for `deals.reset()`.
- [ ] **Step 9: Run `cd templates/crm-realestate && npx vitest run`, verify all pass.**
- [ ] **Step 10: Run the full build gate again** — `npm run build`, confirm still green after
  wiring `ContactsScreen` in.
- [ ] **Step 11: Mutation checks**

| # | Revert | Test that must go RED |
|---|---|---|
| M6 | make `RecordTable`'s search filter only match the `name` column (bypassing the kit component's own cross-column contract at the seed/props level, e.g. by passing a `columns` array with only `name`) | the search-filters-contacts test |
| M7 | drop the `onActivity` call inside `saveEdit` | the editing-logs-an-activity-entry test |
| M8 | drop the `onActivity` call inside `deleteContact` | the deleting-logs-an-activity-entry test |
| M9 | make `saveEdit` not call `contacts.update` (only close the edit panel) | the persists-an-edit-across-remount test |

- [ ] **Step 12: Commit** — `feat: add Contacts screen with RecordTable and activity logging to crm-realestate`

---

## Task 4: Deals / Pipeline screen (`KanbanBoard`)

**Files:**
- Modify: `templates/crm-realestate/data/seed.ts` (add `Deal`/`DEALS`)
- Create: `templates/crm-realestate/app/DealsScreen.tsx` (client component)
- Modify: `templates/crm-realestate/app/page.tsx` (wire `DealsScreen` into `DashboardShell`'s
  `dealsScreen` slot, lift the deals `useLocalCollection` to the top level per Task 3 Step 8's
  pattern, extend `handleResetAll`)
- Test: `templates/crm-realestate/app/DealsScreen.test.tsx`

**Interfaces:**
- Consumes: `KanbanBoard`, `useLocalCollection` from `@portfolio/template-kit`; `DEALS` seed data
  (this task); `logActivity` helper (Task 3).
- Produces: `DealsScreen`, wired into the shell; the deals `useLocalCollection` instance at the
  `page.tsx` level, following the same lifted-hook seam Task 3 Step 8 established.

### Design decisions

**(h) `KanbanBoard`'s `onMove(id, newStage)` is this screen's only mutation path** — per
`docs/superpowers/specs/2026-09-20-site-crm-realestate-design.md` §3.2/§4, moving a deal card
between columns via the kit's move-select control is the deal-stage-change trigger; this screen
maps `onMove` to `deals.update(id, { stage: newStage, updatedAt: new Date().toISOString() })` then
`logActivity` with `type: 'deal_stage_changed'`.

**(i) `renderItem` formats `valueVnd` as VND currency**, per spec §3.2's formatter note — using the
same `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })` pattern already used
inside `template-kit`'s own `CartDrawer`/`PricedItemGrid` (plan 30 Task 5), duplicated here at the
page level since `KanbanBoard` takes a `renderItem` callback rather than a fixed-shape item (kit
components stay presentational/generic per plan 30 design decision (i); currency formatting is
this site's own content concern, not the kit's).

**(j) The stage-label lookup for the activity-log note (`{stageLabel}` in spec §4's template) comes
from the same `columns` array `KanbanBoard` itself renders from** — `DealsScreen` defines
`STAGE_COLUMNS` once (the 5-row table from spec §3.2) and both passes it to `KanbanBoard` and looks
up the target column's `label` when building the `logActivity` note, so the two never drift apart.

- [ ] **Step 1: Write the failing interaction test**

```tsx
// templates/crm-realestate/app/DealsScreen.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DealsScreen } from './DealsScreen';

beforeEach(() => {
  window.localStorage.clear();
});

describe('DealsScreen', () => {
  it('renders seeded deals grouped under their stage column', () => {
    render(<DealsScreen onActivity={() => {}} />);
    expect(screen.getByText(/Mai — 2BR apartment/)).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Won')).toBeInTheDocument();
  });

  it('moving a deal to a new stage via the move-select persists the change and logs activity', async () => {
    const onActivity = vi.fn();
    render(<DealsScreen onActivity={onActivity} />);
    fireEvent.change(screen.getByLabelText(/move mai — 2br apartment.*vinhomes grand park/i), {
      target: { value: 'won' },
    });

    await waitFor(() => {
      expect(onActivity).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'deal_stage_changed', dealId: 'dl-1' }),
      );
    });
  });

  it('persists a stage move across remount (simulated reload)', async () => {
    const { unmount } = render(<DealsScreen onActivity={() => {}} />);
    fireEvent.change(screen.getByLabelText(/move mai — 2br apartment.*vinhomes grand park/i), {
      target: { value: 'won' },
    });
    await waitFor(() => {
      expect(screen.getByLabelText(/move mai — 2br apartment.*vinhomes grand park/i)).toHaveValue('won');
    });
    unmount();

    render(<DealsScreen onActivity={() => {}} />);
    await waitFor(() => {
      expect(screen.getByLabelText(/move mai — 2br apartment.*vinhomes grand park/i)).toHaveValue('won');
    });
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `cd templates/crm-realestate && npx vitest run
  app/DealsScreen.test.tsx` (module doesn't exist yet).
- [ ] **Step 3: Add `Deal`/`DEALS` to `templates/crm-realestate/data/seed.ts`** exactly as
  specified in `docs/superpowers/specs/2026-09-20-site-crm-realestate-design.md` §3.2 (copy
  verbatim, all 8 rows across all 5 stages — do not trim or invent additional rows).
- [ ] **Step 4: `templates/crm-realestate/app/DealsScreen.tsx`**

```tsx
'use client';
import { KanbanBoard } from '@portfolio/template-kit';
import type { Deal } from '../data/seed';
import type { ActivityLogEntry } from '../lib/logActivity';
import type { UseLocalCollectionResult } from '@portfolio/template-kit';

export interface DealsScreenProps {
  deals: UseLocalCollectionResult<Deal>;
  onActivity: (entry: Omit<ActivityLogEntry, 'id' | 'at'>) => void;
}

const STAGE_COLUMNS = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'negotiating', label: 'Negotiating' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
];

const formatVnd = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export function DealsScreen({ deals, onActivity }: DealsScreenProps) {
  function handleMove(id: string, newStage: string) {
    deals.update(id, { stage: newStage, updatedAt: new Date().toISOString() });
    const deal = deals.items.find((d) => d.id === id);
    const stageLabel = STAGE_COLUMNS.find((c) => c.key === newStage)?.label ?? newStage;
    if (deal) {
      onActivity({ dealId: id, type: 'deal_stage_changed', note: `Moved "${deal.title}" to ${stageLabel}` });
    }
  }

  return (
    <section className="crm-deals-screen">
      <h2>Deals / Pipeline</h2>
      <KanbanBoard
        columns={STAGE_COLUMNS}
        items={deals.items}
        renderItem={(deal: Deal) => `${deal.title} — ${formatVnd(deal.valueVnd)}`}
        onMove={handleMove}
      />
    </section>
  );
}
```

  `DealsScreen` takes `deals` as a prop (the `UseLocalCollectionResult<Deal>` from `page.tsx`'s
  lifted hook, per Task 3 Step 8's established seam), not by calling `useLocalCollection` itself —
  this is the same reset-ownership resolution Task 3 landed on, applied consistently rather than
  reinvented per screen.

- [ ] **Step 5: Update `DealsScreen.test.tsx`'s render calls to supply a `deals` prop** backed by a
  real `useLocalCollection` test harness (a thin wrapper component in the test file that calls
  `useLocalCollection<Deal>('crm-realestate-deals', DEALS)` and renders `<DealsScreen deals={...}
  onActivity={onActivity} />`), matching how `ContactsScreen.test.tsx` was updated in Task 3 Step 8.
- [ ] **Step 6: Wire `DealsScreen` into `page.tsx`** — instantiate
  `const deals = useLocalCollection<Deal>('crm-realestate-deals', DEALS)` in `CrmApp` (alongside
  `session`/`contacts`/`activityLog`), pass
  `dealsScreen={<DealsScreen deals={deals} onActivity={(entry) => logActivity(activityLog.add, entry)} />}`
  into `DashboardShell`, and extend `handleResetAll` to also call `deals.reset()`.
- [ ] **Step 7: Run `cd templates/crm-realestate && npx vitest run`, verify all pass.**
- [ ] **Step 8: Run the full build gate again** — `npm run build`, confirm still green after wiring
  `DealsScreen` in.
- [ ] **Step 9: Mutation checks**

| # | Revert | Test that must go RED |
|---|---|---|
| M10 | make `handleMove` not call `deals.update` (only call `onActivity`) | the persists-a-stage-move-across-remount test |
| M11 | drop the `onActivity` call inside `handleMove` | the moving-a-deal-logs-activity test |
| M12 | hardcode `stageLabel` to the raw `newStage` key instead of looking it up in `STAGE_COLUMNS` | none of the current tests assert on the note's exact `stageLabel` text — add an assertion on `onActivity`'s `note` containing `"to Won"` (not `"to won"`) to the moving-a-deal-logs-activity test so this mutation is actually caught |

- [ ] **Step 10: Commit** — `feat: add Deals/Pipeline screen with KanbanBoard to crm-realestate`

---

## Task 5: Activity Log screen (`RecordTable`) + manual notes + design scoring

**Files:**
- Create: `templates/crm-realestate/app/ActivityLogScreen.tsx` (client component)
- Modify: `templates/crm-realestate/app/page.tsx` (wire `ActivityLogScreen` into
  `DashboardShell`'s `activityScreen` slot — the last unfilled slot)
- Test: `templates/crm-realestate/app/ActivityLogScreen.test.tsx`

**Interfaces:**
- Consumes: `RecordTable` from `@portfolio/template-kit`; the activity-log `useLocalCollection`
  instance already lifted to `page.tsx` in Task 3 Step 7 (this task adds the manual-note UI on top
  of the same instance, passed down as a prop the same way `deals` was in Task 4).
- Produces: the site's one required interaction test per master spec §7 ("exactly one interaction
  test exercising its `useLocalCollection` feature end-to-end" — satisfied across Tasks 2-5
  collectively, since this category's spec §4 explicitly requires cross-screen coverage; this
  task's own test covers the Activity Log screen's manual-note path plus a read of the
  auto-appended entries from Tasks 3-4); the final design-score table that marks this plan
  complete per master spec §8.

### Design decisions

**(k) `RecordTable`'s `onEdit`/`onDelete` are both no-ops (passed as `() => {}`) for this screen**
— per spec §3.3/§4, activity-log entries are append-only history; the screen does not expose edit
or delete for existing rows (only the "no fabricated visitor history" seed content and new
auto/manual entries). `RecordTable`'s contract requires both callbacks (plan 30 Task 5), so they
are supplied but deliberately inert — this is documented here rather than silently omitted so a
future maintainer doesn't assume it's a bug.

**(l) The manual "Add note" affordance is a single-field form, not `InquiryForm`** — per spec §4,
this category doesn't compose `InquiryForm` (a marketing-form component) at all; the note field is
plain page-local JSX (a `<textarea>` + submit button), calling `logActivity(activityLog.add, {
type: 'note', note })` with no `contactId`/`dealId`.

- [ ] **Step 1: Write the failing interaction test**

```tsx
// templates/crm-realestate/app/ActivityLogScreen.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useLocalCollection } from '@portfolio/template-kit';
import { ActivityLogScreen } from './ActivityLogScreen';
import { ACTIVITY_LOG, type ActivityLogEntry } from '../data/seed';

beforeEach(() => {
  window.localStorage.clear();
});

function Harness() {
  const activityLog = useLocalCollection<ActivityLogEntry>('crm-realestate-activity-log', ACTIVITY_LOG);
  return <ActivityLogScreen activityLog={activityLog} />;
}

describe('ActivityLogScreen', () => {
  it('renders the seeded activity history', () => {
    render(<Harness />);
    expect(screen.getByText(/Added contact Nguyễn Thị Mai/)).toBeInTheDocument();
  });

  it('filters activity entries via the search input', () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText(/search/i), { target: { value: 'won' } });
    expect(screen.getByText(/Moved "Thu Hà/)).toBeInTheDocument();
    expect(screen.queryByText(/Added contact Nguyễn Thị Mai/)).not.toBeInTheDocument();
  });

  it('adding a manual note appends it to the log', async () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText(/add a note/i), { target: { value: 'Followed up by phone' } });
    fireEvent.click(screen.getByRole('button', { name: /add note/i }));

    await waitFor(() => {
      expect(screen.getByText('Followed up by phone')).toBeInTheDocument();
    });
  });

  it('a manual note persists across remount (simulated reload)', async () => {
    const { unmount } = render(<Harness />);
    fireEvent.change(screen.getByLabelText(/add a note/i), { target: { value: 'Followed up by phone' } });
    fireEvent.click(screen.getByRole('button', { name: /add note/i }));
    await waitFor(() => expect(screen.getByText('Followed up by phone')).toBeInTheDocument());
    unmount();

    render(<Harness />);
    await waitFor(() => expect(screen.getByText('Followed up by phone')).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `cd templates/crm-realestate && npx vitest run
  app/ActivityLogScreen.test.tsx` (module doesn't exist yet).
- [ ] **Step 3: `templates/crm-realestate/app/ActivityLogScreen.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { RecordTable } from '@portfolio/template-kit';
import type { UseLocalCollectionResult } from '@portfolio/template-kit';
import type { ActivityLogEntry } from '../lib/logActivity';
import { logActivity } from '../lib/logActivity';

export interface ActivityLogScreenProps {
  activityLog: UseLocalCollectionResult<ActivityLogEntry>;
}

const COLUMNS = [
  { key: 'type', label: 'Type' },
  { key: 'note', label: 'Note' },
  { key: 'at', label: 'When' },
];

export function ActivityLogScreen({ activityLog }: ActivityLogScreenProps) {
  const [draft, setDraft] = useState('');

  function addNote() {
    if (!draft.trim()) return;
    logActivity(activityLog.add, { type: 'note', note: draft.trim() });
    setDraft('');
  }

  const rows = activityLog.items.map((entry) => ({
    ...entry,
    at: new Date(entry.at).toLocaleString('vi-VN'),
  }));

  return (
    <section className="crm-activity-log-screen">
      <h2>Activity Log</h2>
      <RecordTable columns={COLUMNS} rows={rows} onEdit={() => {}} onDelete={() => {}} />
      <div className="crm-add-note">
        <label>
          Add a note
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} />
        </label>
        <button type="button" onClick={addNote}>Add note</button>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Wire `ActivityLogScreen` into `page.tsx`** — pass
  `activityScreen={<ActivityLogScreen activityLog={activityLog} />}` into `DashboardShell`,
  replacing the last `Coming in Task 5` placeholder from Task 2 Step 11.
- [ ] **Step 5: Run `cd templates/crm-realestate && npx vitest run`, verify all pass** (all 4
  screen/login test files plus the build-gate test).
- [ ] **Step 6: Run the full build gate one final time** — `npm run build`, confirm green with all
  3 screens and the login flow wired together.
- [ ] **Step 7: Manually verify the cross-screen wiring end-to-end** (not a new automated test —
  the individual screens' own tests already cover each trigger in isolation; this step is a sanity
  pass confirming they compose): log in → edit a contact → switch to Activity Log → confirm the
  `contact_updated` entry appears → switch to Deals → move a card → switch back to Activity Log →
  confirm the `deal_stage_changed` entry appears → click "Reset demo data" → confirm all 4
  collections (session, contacts, deals, activity log) are back to their seed values and the login
  screen is shown again.
- [ ] **Step 8: Mutation checks**

| # | Revert | Test that must go RED |
|---|---|---|
| M13 | make the manual-note `addNote` submit even when `draft` is empty/whitespace | none of the current tests assert on this directly — add an assertion that submitting an empty note does not grow `activityLog.items.length` to the adding-a-manual-note test |
| M14 | make `RecordTable`'s search filter only match the `type` column instead of all 3 columns | the filters-activity-entries test |
| M15 | drop the `logActivity` call inside `addNote` (write directly to `activityLog.add` without `id`/`at`) | would break rendering `at` as a formatted date (raw `undefined` would throw `Invalid Date`) — the adding-a-manual-note test's `waitFor` would fail to find the row rendered correctly |

- [ ] **Step 9: Commit** — `feat: add Activity Log screen and manual notes to crm-realestate`

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

- [ ] **Step 10: Run the Hallmark `audit` capability** against the built site, score each criterion
  honestly, fill in the table above, and fix/re-score any criterion below 9/10 before considering
  this plan complete.
- [ ] **Step 11: Commit** — `docs: plan 57 complete — crm-realestate site design score`

## Self-Review Notes

- **Spec coverage:** `2026-09-20-site-crm-realestate-design.md` §2 (Task 2's login screen and
  dashboard shell), §3 (Tasks 3-5's seed data), §4 (Tasks 3-5's activity-log auto-append wiring),
  §5 (Task 1's Hallmark brief). Interactive-demo spec §4.3 (this plan's entire structure — page
  structure, fake-login convention, data model), §3.3 (`KanbanBoard`/`RecordTable` prop contracts
  consumed by Tasks 4/3/5), §5 (Task 1's per-site Hallmark requirement), §7 (build + interaction
  test gates across Tasks 2-5), §8 (Task 5's design-score table), §9 (this plan is "plan 57" in
  that section's numbering). Parent spec §6 (Task 2's folder/thumbnail/`output: 'export'`
  convention, plus the CRM-specific "thumbnail is a dashboard screenshot" note).
- **Explicitly not built here:** the other 2 CRM variants (`crm-agency`, `crm-clinic` — plans 58-59,
  each their own Hallmark pass and seed data over the identical structure this plan establishes);
  changes to `@portfolio/template-kit` itself (any new component or hook change belongs in a
  plan-30 follow-up, not here); multi-user, real auth, permissions, any data leaving the browser, or
  reporting/analytics beyond the three screens (explicitly out of scope per interactive-demo spec
  §4.3); CI wiring for this site's static-export deploy (plan 17, parameterized for 29 sites,
  unchanged by this plan); real thumbnail upload through the admin media library (admin action, not
  a code task); a plain "Log out" control that preserves business data (noted as an optional
  enhancement in the spec, not required).
- **Type consistency checked:** `Contact`/`Deal`/`ActivityLogEntry` all satisfy
  `useLocalCollection`'s `T extends { id: string }` constraint (plan 30 Task 4); `Deal.stage`
  satisfies `KanbanBoard`'s `KanbanItem` constraint (`{ id: string; stage: string }`, plan 30 Task
  5); `RecordTable`'s row shape (`T extends { id: string; [key: string]: unknown }`) is satisfied
  by all 3 record types used with it (Contacts, and the formatted-`at` row objects in
  `ActivityLogScreen`).
- **Reset-ownership seam documented explicitly (Task 3 decision, reused by Tasks 4-5):** every
  `useLocalCollection` instance in this site is instantiated exactly once, at `page.tsx`'s top
  level (`session`, `contacts`, `deals`, `activityLog`), and passed down to its screen as a prop —
  never called a second time inside a screen component. This is what lets `handleResetAll` call
  `.reset()` on all 4 collections from one place and is the concrete resolution of the
  cross-screen-logging requirement (master spec §4.3) without any screen importing another
  screen's component.
- **Next step:** once this plan's design score (Task 5) clears every criterion at 9-10/10 (or
  documents an honest trade-off), plans 58-59 (`crm-agency`, `crm-clinic`) may reuse this plan's
  structure (5-task shape, lifted-hook seam, `logActivity` helper pattern) as their own precedent,
  the same way this plan reused plan 30/31's conventions.
