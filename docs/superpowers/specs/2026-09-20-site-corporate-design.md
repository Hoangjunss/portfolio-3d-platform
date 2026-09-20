# Site Spec — Corporate (`corporate`)

Date: 2026-09-20
Status: Approved (site #1 of 29 under the interactive-demo templates program)

## 1. Context & Scope

This is a thin, mostly-data/content spec for one of the 29 demo template sites defined by
`2026-09-20-interactive-demo-templates-design.md` (§3.2 row #1, §9 execution order — this is plan
31, the first of plans 31-59). It does not redefine architecture: section composition, shared
component behavior, the `useLocalCollection` hydration contract, folder convention, and the
build/test gates are all already fixed by that spec and by
`2026-09-20-template-design-system-design.md`. This spec states only:

- the exact section composition for this site (already implied by the parent spec §4 example, restated here for the plan to point at),
- the seed data shape and sample rows,
- the interactive feature's exact data flow,
- a Hallmark design brief (mood direction + research pointers, not fixed token values).

**Slug:** `corporate` — folder `templates/corporate/`, `display_order` 1, `category` `corporate`
(per plan 30 Task 1's authoritative slug table).

## 2. Section composition

Per parent spec §4's own worked example for this category, unchanged:

```
Hero → ItemGrid(services) → PeopleGrid(leadership) → Footer
```

- **`Hero`** — company headline/subhead/CTA (e.g. "request a callback" or "talk to us", linking down
  to the interactive feature's form, not to an external page).
- **`ItemGrid`** — `columns={3}`, items = the company's service lines (icon+text variant, no images
  required — see seed shape below).
- **`PeopleGrid`** — `roleLabel="Leadership"`, items = leadership team members.
- **`Footer`** — standard link set (About, Services, Careers, Contact) + social row on.

No other `template-kit` component is composed on this page. The interactive feature (§4 below) is
its own client-side section, placed directly under `Hero` and above `ItemGrid` (a visitor sees the
callback form early, not buried at the bottom) — this placement is a content/layout decision this
spec fixes; component behavior is unchanged from the kit.

## 3. Seed data

All seed data lives in `templates/corporate/data/seed.ts` (or `.json`, implementer's call — must be
statically importable at build time per parent spec §3.1's render-pattern rule: static content
renders directly from imported seed data, never gated behind `useLocalCollection`'s hydration).

Content authenticity rule (parent spec §5 / interactive-demo spec §5, both restate the same rule):
sample copy is realistic-but-fictional, no fabricated stats presented as real, no Lorem Ipsum above
the fold. This site uses a fictional Vietnamese corporate-services company, **Thăng Long Consulting
Group**, so all names below are fictional and must not resemble a real company.

### 3.1 Services (`ItemGrid` items)

```ts
interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: string; // icon token name, not an image path — this category uses icon+text, not image+text
}

const SERVICES: ServiceItem[] = [
  {
    id: 'svc-strategy',
    title: 'Business Strategy',
    description: 'Market entry, growth planning, and operating-model design for mid-market and enterprise clients.',
    icon: 'compass',
  },
  {
    id: 'svc-finance',
    title: 'Financial Advisory',
    description: 'Budgeting, cost optimization, and investment-readiness support for scaling organizations.',
    icon: 'chart-line',
  },
  {
    id: 'svc-hr',
    title: 'HR & Organization Design',
    description: 'Org structure, compensation benchmarking, and change-management programs.',
    icon: 'users',
  },
  {
    id: 'svc-it',
    title: 'IT & Digital Transformation',
    description: 'Systems modernization roadmaps and vendor selection support for legacy enterprises.',
    icon: 'cpu',
  },
  {
    id: 'svc-legal',
    title: 'Regulatory & Compliance',
    description: 'Licensing, corporate governance, and cross-border compliance advisory.',
    icon: 'shield-check',
  },
];
```

Five items — inside `ItemGrid`'s `columns={3}` layout this wraps to a 3-2 grid, a deliberate choice
so the Hallmark pass (Task 1 of the plan) has a real asymmetric layout to design for, not a clean
even multiple.

### 3.2 Leadership (`PeopleGrid` items)

```ts
interface LeaderItem {
  id: string;
  name: string;
  role: string;
  photo?: string; // omitted in seed data — PeopleGrid renders without a photo per its existing contract
}

const LEADERSHIP: LeaderItem[] = [
  { id: 'lead-1', name: 'Nguyễn Minh Anh', role: 'Managing Partner' },
  { id: 'lead-2', name: 'Trần Quốc Bảo', role: 'Head of Financial Advisory' },
  { id: 'lead-3', name: 'Lê Thị Hương', role: 'Head of People & Culture' },
  { id: 'lead-4', name: 'Phạm Đức Long', role: 'Head of Digital Transformation' },
];
```

Four leaders — no photos in seed data (`PeopleGrid` already renders correctly without `photo` per
its existing prop contract from plan 30 Task 3); a real photo upload is an admin action out of
scope here, same convention as `thumbnail.webp`.

## 4. Interactive feature: "Request a callback"

Per interactive-demo spec §3.2 row #1: a callback-request form whose submissions accumulate in a
small "Your requests" panel, visible to the same visitor on return (same browser, same
`localStorage`).

### 4.1 Data shape

```ts
interface CallbackRequest {
  id: string;          // generated client-side (e.g. crypto.randomUUID()) at submit time
  name: string;
  email: string;
  phone: string;
  message: string;
  submittedAt: string; // ISO 8601, set client-side at submit time
}
```

Storage key: `'corporate-callback-requests'` (matches the master spec's exact key).

### 4.2 Seed value

The hook seeds with an **empty array**, not fictional pre-filled requests — a "Your requests" panel
pre-populated with fake requests the visitor never submitted would misrepresent the panel as
already containing the visitor's own history, which is misleading UX, not just a content-authenticity
nitpick. First-time visitors see the panel's empty state; the panel only ever shows requests that
visitor actually submitted.

```ts
const CALLBACK_SEED: CallbackRequest[] = [];
```

### 4.3 Data flow

1. Client component mounts `useLocalCollection<CallbackRequest>('corporate-callback-requests', CALLBACK_SEED)`.
2. `InquiryForm` (kit component, `fields=[]` — the base name/email/phone/message fields are exactly
   what this feature needs, no extra fields) is rendered with an `onSubmit` handler that:
   - builds a `CallbackRequest` from the form values (`id: crypto.randomUUID()`, `submittedAt: new
     Date().toISOString()`),
   - calls the hook's `add(request)`,
   - relies on `InquiryForm`'s own existing pending/success state (kit behavior, unchanged) to show
     confirmation.
3. **Panel choice: a simple list, not `SavedItemsPanel`.** `SavedItemsPanel` (parent's interactive
   spec §3.3) is specified for the "visitor marked/saved an existing catalog item" pattern (favorite
   a listing, shortlist a portfolio piece) — its `renderItem`/`onRemove` contract assumes items came
   from a pre-existing catalog the visitor is curating a subset of. A callback request is not a
   marked catalog item; it's a new record the visitor authored via a form, with no "catalog" to
   remove it from (removing a past request the company already has doesn't make sense for a demo of
   this feature). This site therefore renders `items` from the hook directly as a small ordered list
   (name + submittedAt, most recent first) inside its own section — no new kit component, no misuse
   of `SavedItemsPanel`'s remove-from-catalog semantics.
4. Reload persistence: per the hook's hydration contract (interactive-demo spec §3.1), a page reload
   reads the same `localStorage` key and the "Your requests" list shows every request the visitor
   has submitted in this browser, in order.
5. "Reset demo data" affordance (per hook contract, interactive-demo spec §3.1's `reset()` rule):
   small, non-prominent control near the panel that calls `reset()`, returning the list to empty.

## 5. Hallmark design brief

**Industry mood:** professional B2B consulting/corporate-services — needs to read as trustworthy,
established, and competent to a buyer evaluating vendors, not flashy or consumer-facing. Parent
spec §5's starting-family suggestion for this category is a cool anchor hue (blue/teal) with a
grotesque-sans display — this is a **non-binding starting direction only**; the real Hallmark
session (Task 1 of the implementation plan) may deviate from it if research supports a different
direction (e.g. a more distinctive navy+brass combination, or a warmer neutral base with a single
saturated accent) as long as it clears the design-scoring gate (master spec §8), particularly
criterion #10 (distinctiveness against the other 28 sites — several of which also start from a cool
anchor hue per parent spec §5, so `corporate` must not read as a re-skin of `saas` or `legal`).

**Reference directions to research during the Hallmark pass** (starting points, not commitments):
1. Established international consulting firms' digital presence (the "big firm" register: dense
   information hierarchy, restrained motion, high-trust typography) — useful for what to emulate
   selectively, not to copy wholesale (would read as generic/template-y, failing criterion #1).
2. Contemporary Vietnamese/Southeast Asian corporate-services branding — for a locally-grounded
   typographic and color voice that avoids the generic "Silicon Valley SaaS" look most cool-hue
   corporate sites default to.
3. Editorial/business-publication design systems (data-dense but still warm) — a possible source for
   how to make the 3-2 asymmetric services grid (§3.1) and the leadership grid feel considered rather
   than default-Bootstrap.

Actual token values (accent hue, type pairing, spacing scale, motion durations) are Task 1's output,
not this spec's — per master spec §9, this is intentionally deferred to the real Hallmark session.
