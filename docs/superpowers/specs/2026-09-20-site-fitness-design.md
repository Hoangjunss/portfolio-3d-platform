# Fitness/Gym Demo Site — Content & Data Spec

Date: 2026-09-20
Status: Approved (site spec for interactive-demo templates program, plan 43)

## 1. Scope

Thin, data/content-focused spec for the `fitness` demo site (interactive-demo spec §9: plan 43,
one of plans 31-59; master spec §3.2 row #13). The architecture — section composition, component
kit, `useLocalCollection` contract, folder convention — is already fixed by
`2026-09-20-interactive-demo-templates-design.md` and `2026-09-20-template-design-system-design.md`.
This spec states only: this site's specific seed data shape/content, its theme pick's starting
direction, the section composition it commits to, and its interactive-feature data flow.

- Slug: `fitness` (folder `templates/fitness/`), `subdomain` = `fitness`, `display_order` = 13,
  `category` = `fitness` — fixed by plan 30 Task 1's authoritative slug table, not to be deviated
  from.

## 2. Section composition

`Hero` → class schedule table (§3.1) → `PeopleGrid`(trainers, `roleLabel="Trainers"`, §3.2) →
`PricedItemGrid`(membership tiers, §3.3) → `Footer`.

### 2.1 Class schedule table: reuse of `RecordTable`

Master spec §3 fixes this category's distinguishing section as "class schedule table + trainer
grid + membership pricing." No new kit component is added for the schedule table — this site
composes the existing `RecordTable` component (interactive-demo spec §3.3, shipped by plan 30
Task 5) in a **read-only presentation**:

- **Columns:** `[{ key: 'className', label: 'Class' }, { key: 'time', label: 'Day / Time' },
  { key: 'trainer', label: 'Trainer' }]` — three columns, matching the "class name/time/trainer"
  composition named in the master spec's row for this category.
- **`onEdit`/`onDelete`:** `RecordTable`'s props require both callbacks (plan 30 Task 5's
  interface: `columns`, `rows`, `onEdit`, `onDelete`). This site passes no-op functions
  (`() => {}`) for both — `RecordTable`'s own built-in search filter (already tested in
  `template-kit`) stays available to a visitor browsing the schedule, but no destructive/edit
  affordance is exposed since class rows are not visitor-owned records. This is a page-composition
  choice, not a change to `RecordTable` itself.
- **The "Book" action is NOT `RecordTable`'s `onEdit`.** It is a separate per-row control the page
  renders alongside the table (§4) — kept out of `RecordTable`'s own row actions because "book"
  is additive (write a new booking record) rather than edit-in-place on the schedule row, so
  reusing `onEdit`'s single-row-mutation semantics for it would misrepresent what the action does.
  Concretely: the schedule table and the "Book" buttons are two elements composed together in one
  page section, not one component with an extra prop.

### 2.2 Trainers: `PeopleGrid`

`roleLabel="Trainers"`; 3-5 trainer profiles per §3.4, each rendered as a `Person` (`id, name,
role, photo?`) — `role` holds the trainer's specialty (e.g. "Strength & Conditioning Coach"), not
a repeated "Trainer" label, so the grid reads as distinct people.

### 2.3 Membership: `PricedItemGrid`

`currency="VND"`, `ctaLabel` not wired to a mutation for this site (membership sign-up is out of
scope — the interactive feature is booking, not purchase, per master spec §3.2 row #13); the grid
renders the 3 tiers as static priced items.

## 3. Seed data

All names, trainers, and businesses below are realistic-but-fictional (master spec §5 content
authenticity rule) — no fabricated statistics presented as real.

### 3.1 Class schedule (12 entries)

| Class | Day / Time | Trainer |
|---|---|---|
| Sunrise HIIT | Mon 06:00–06:45 | Minh Quân |
| Power Vinyasa Yoga | Mon 18:00–19:00 | Thảo Chi |
| Strength Foundations | Tue 07:00–08:00 | Đức Anh |
| Spin & Burn | Tue 17:30–18:15 | Ngọc Hà |
| Boxing Conditioning | Wed 06:30–07:30 | Minh Quân |
| Mobility & Recovery | Wed 12:00–12:45 | Thảo Chi |
| Olympic Lifting Clinic | Thu 18:30–19:45 | Đức Anh |
| Core & Glutes Sculpt | Fri 06:00–06:45 | Ngọc Hà |
| Saturday Bootcamp | Sat 08:00–09:00 | Minh Quân |
| Restorative Yoga | Sat 10:00–10:45 | Thảo Chi |
| Functional Circuit | Sun 09:00–09:45 | Đức Anh |
| Youth Athletics | Sun 11:00–11:45 | Ngọc Hà |

### 3.2 Trainer profiles (4)

| Name | Specialty (`role`) |
|---|---|
| Minh Quân | Strength & Conditioning Coach |
| Thảo Chi | Yoga & Mobility Instructor |
| Đức Anh | Olympic Weightlifting Coach |
| Ngọc Hà | Group Fitness & Spin Instructor |

Each trainer maps 1:1 to the `trainer` value used across the schedule table (§3.1) so the two
sections read as one coherent staff, not disconnected sample data.

### 3.3 Membership tiers (3, VND)

| Tier | Price (VND/month) | What's included |
|---|---|---|
| Basic | 590,000 | Gym floor access, 2 group classes/month |
| Standard | 990,000 | Unlimited group classes, gym floor access, 1 PT session/month |
| Premium | 1,690,000 | Unlimited group classes + gym floor, 4 PT sessions/month, sauna/recovery room access |

## 4. Interactive feature: "Book a class" → "My bookings"

Per interactive-demo spec §3.2 row #13 and §3.3 (`SavedItemsPanel`).

### 4.1 Data flow

1. The class schedule section is a client component wrapping the static `RecordTable`
   presentation (§2.1). Alongside each schedule row, the page renders a **"Book" button** (page-
   local control, not a `RecordTable` prop) keyed to that row's class/time/trainer values.
2. Clicking "Book" calls `add()` from a `useLocalCollection<Booking>('fitness-bookings', [])`
   instance held by this client component, where:
   ```typescript
   interface Booking {
     id: string;
     className: string;
     time: string;
     bookedAt: string;
   }
   ```
3. **Seed is empty (`[]`)** — per the task brief: a first-time visitor has made no bookings; the
   schedule itself (§3.1) is the only pre-populated content, rendered statically and never gated
   behind the hook's hydration (interactive-demo spec §3.1's render-pattern rule).
4. The `SavedItemsPanel` component (interactive-demo spec §3.3), relabeled in this site's copy as
   **"My bookings"**, renders `items` from the hook: each row shows `className`, `time`, and a
   formatted `bookedAt`; `SavedItemsPanel`'s `onRemove` wires to the hook's `remove(id)` — this is
   the "cancel" action for a booking.
5. `reset()` is exposed as this site's "Reset demo data" affordance (interactive-demo spec §3.1
   convention), clearing all bookings back to `[]`.
6. Persistence: `localStorage` under the key `fitness-bookings`; a page reload re-reads existing
   bookings (not the empty seed) per the hook's hydration contract — a booking made in a prior
   visit survives a reload, and is only removed by an explicit "cancel"/remove click or "Reset
   demo data."

### 4.2 Why `SavedItemsPanel` fits (vs. a page-local list)

Unlike the corporate site's callback-request panel (plan 31's documented exception — a form-
submission list, not a fit for `SavedItemsPanel`'s "list of items the visitor marked" contract),
a class booking genuinely is "the visitor marked this schedule row as theirs, and may unmark it" —
exactly `SavedItemsPanel`'s designed shape (id + renderItem + onRemove). This site uses the kit
component directly, per the task brief's instruction, rather than a bespoke list.

## 5. Hallmark design brief

**Mood (non-binding starting direction — parent spec §5's fitness cluster, Hallmark may
deviate):** high-contrast neutral (near-black / near-white base) + one bold accent color, paired
with a condensed-sans display face — read as energetic, disciplined, physical, not soft or
corporate.

**Reference directions to research (not fixed token values — Hallmark's research phase picks one,
with rationale, per master spec §8 criterion #1's anti-generic bar):**

1. **Boutique strength/CrossFit-box branding** — the raw, high-contrast, industrial-type systems
   used by independent strength gyms (concrete/steel textures, stencil or condensed grotesque
   display type, minimal color beyond one signal accent) as opposed to big-box gym-chain visual
   cliches.
2. **Athletic apparel / performance-wear digital campaigns** — bold condensed display type at
   large scale, tight grid, motion-forward hover states, a single saturated accent against a
   near-monochrome base.
3. **Editorial sports-photography layouts** — high-contrast black-and-white or duotone photography
   treatment with a restrained accent color reserved for CTAs/interactive states only, avoiding
   the visual noise of stock "smiling people at a gym" imagery.

Hallmark's session should converge on one direction (or a deliberate synthesis) with a stated
rationale, verified against master spec §8's 10-criterion scoring gate (particularly #1
anti-generic, #3 color coherence/WCAG AA, #10 distinctiveness against the other 28 sites) before
the site's plan (plan 43) is marked complete.
