# Site Spec — Nonprofit (`nonprofit`)

Date: 2026-09-20
Status: Approved (site #14 of 29 under the interactive-demo templates program)

## 1. Context & Scope

This is a thin, mostly-data/content spec for one of the 29 demo template sites defined by
`2026-09-20-interactive-demo-templates-design.md` (§3.2 row #14, §9 execution order — this is plan
44, one of plans 31-59). It does not redefine architecture: section composition, shared component
behavior, the `useLocalCollection` hydration contract, folder convention, and the build/test gates
are all already fixed by that spec and by `2026-09-20-template-design-system-design.md`. This spec
states only:

- the exact section composition for this site (per parent spec §3 row #14's distinguishing
  sections: cause/program grid + donation CTA (static, no real payment) + impact numbers block),
- the seed data shape and sample rows,
- the interactive feature's exact data flow (donation-intent pledge form → running total),
- a Hallmark design brief (mood direction + research pointers, not fixed token values).

**Slug:** `nonprofit` — folder `templates/nonprofit/`, `display_order` 14, `category` `nonprofit`
(per plan 30 Task 1's authoritative slug table).

## 2. Section composition

```
Hero → ItemGrid(causes/programs) → StatBlock(impact numbers) → InquiryForm(donation-intent, pledge) → Footer
```

- **`Hero`** — org headline/subhead/CTA (e.g. "Make a pledge" or "See our programs", linking down to
  the pledge form, not to an external payment page — this site never claims to process a real
  donation).
- **`ItemGrid`** — `columns={3}`, items = the org's causes/programs (icon+text variant, no images
  required — see seed shape below).
- **`StatBlock`** — impact numbers. **These are explicitly labeled, in the section's own copy, as
  illustrative example numbers for a fictional organization, not presented as real claims** — per
  parent spec §5's "no fabricated stats presented as real" rule and `StatBlock`'s own design
  decision (master spec §4: "numbers must be real per-template content authored by the buyer, never
  invented at scaffold time"). Because no real buyer has supplied numbers for this scaffold-stage
  demo, the section heading itself carries a visible qualifier (e.g. "Illustrative impact — example
  data for this demo, not a live report") so `StatBlock`'s numeric content is never mistaken for an
  actual claim about a real charity.
- **`InquiryForm`** — donation-intent / pledge form, extended with a pledge-amount field (see §4).
  Explicitly labeled in its surrounding copy as "no real payment is processed" — this is a
  donation-*intent* capture, not a checkout flow.
- **`Footer`** — standard link set (About, Programs, Impact, Contact) + social row on.

No other `template-kit` component is composed on this page. The interactive feature (§4 below) is
its own client-side section, placed directly under the `StatBlock` impact numbers and above the
`Footer` — a visitor sees the cause grid and the (illustrative) impact numbers first, then is asked
to pledge, which is the natural narrative order for a nonprofit page. This placement is a
content/layout decision this spec fixes; component behavior is unchanged from the kit.

## 3. Seed data

All seed data lives in `templates/nonprofit/data/seed.ts` (or `.json`, implementer's call — must be
statically importable at build time per parent spec §3.1's render-pattern rule: static content
renders directly from imported seed data, never gated behind `useLocalCollection`'s hydration).

Content authenticity rule (parent spec §5 / interactive-demo spec §5, both restate the same rule):
sample copy is realistic-but-fictional, no fabricated stats presented as real, no Lorem Ipsum above
the fold. This site uses a fictional Vietnamese nonprofit, **Mái Ấm Bình Minh Foundation**, so all
names, programs, and figures below are fictional and must not resemble a real organization.

### 3.1 Causes / programs (`ItemGrid` items)

```ts
interface CauseItem {
  id: string;
  title: string;
  description: string;
  icon: string; // icon token name, not an image path — this category uses icon+text, not image+text
}

const CAUSES: CauseItem[] = [
  {
    id: 'cause-education',
    title: 'School Scholarships',
    description: 'Tuition and school-supply support for children from low-income households in rural provinces.',
    icon: 'graduation-cap',
  },
  {
    id: 'cause-nutrition',
    title: 'Child Nutrition Program',
    description: 'Daily meal support and nutrition monitoring for children under 6 in underserved communes.',
    icon: 'heart',
  },
  {
    id: 'cause-shelter',
    title: 'Emergency Shelter Repair',
    description: 'Rapid home-repair grants for families affected by seasonal flooding.',
    icon: 'home',
  },
  {
    id: 'cause-healthcare',
    title: 'Mobile Health Clinics',
    description: 'Free basic health checkups and medicine for elderly residents in remote villages.',
    icon: 'stethoscope',
  },
  {
    id: 'cause-clean-water',
    title: 'Clean Water Access',
    description: 'Well and filtration-system installation for communes without reliable clean water.',
    icon: 'droplet',
  },
];
```

Five items — inside `ItemGrid`'s `columns={3}` layout this wraps to a 3-2 grid, a deliberate choice
so the Hallmark pass (Task 1 of the plan) has a real asymmetric layout to design for, not a clean
even multiple.

### 3.2 Impact numbers (`StatBlock` items)

```ts
interface Stat {
  label: string;
  value: string;
}

// EXAMPLE DATA — illustrative numbers for the fictional Mái Ấm Bình Minh Foundation, authored for
// this demo scaffold only. NOT a real claim about any actual organization's impact. The section's
// own heading copy must carry this qualifier visibly (see §2 above) alongside these values.
const IMPACT_STATS: Stat[] = [
  { label: 'Children supported (example)', value: '1,240+' },
  { label: 'Communes reached (example)', value: '38' },
  { label: 'Meals provided this year (example)', value: '86,000+' },
  { label: 'Volunteer hours logged (example)', value: '5,300+' },
];
```

Four stats — matches `StatBlock`'s existing "renders nothing for an empty array" contract (plan 30
Task 3 decision (j)); since this array is non-empty, the block renders normally, with the
example-data qualifier carried in the surrounding section copy rather than inside `StatBlock` itself
(the kit component's prop contract is unchanged — it takes `{label, value}` pairs only).

## 4. Interactive feature: donation-intent pledge form + running total

Per interactive-demo spec §3.2 row #14: "Donation-intent form (static, no payment) → running (fake)
total + donor's own pledge shown."

### 4.1 Data shape

```ts
interface Pledge {
  id: string;          // generated client-side (e.g. crypto.randomUUID()) at submit time
  name: string;
  amountVnd: number;   // pledge amount in VND, from the form's extra field
  pledgedAt: string;   // ISO 8601, set client-side at submit time
}
```

Storage key: `'nonprofit-pledges'` (matches the master spec's exact key).

### 4.2 Seed value

The hook seeds with **2-3 example pledges, so the running total is not zero on first visit** — per
the master spec's explicit instruction for this feature. Donor names in the seed are clearly
fictional (matching the site's fictional-org convention) and never resemble real people; the seed
data's role is purely to make the running-total mechanic legible to a first-time visitor, not to
imply real donors exist.

```ts
const PLEDGE_SEED: Pledge[] = [
  { id: 'seed-pledge-1', name: 'Trần Thị Mai (example donor)', amountVnd: 500000, pledgedAt: '2026-08-01T09:00:00.000Z' },
  { id: 'seed-pledge-2', name: 'Nguyễn Văn Phúc (example donor)', amountVnd: 1200000, pledgedAt: '2026-08-14T14:30:00.000Z' },
  { id: 'seed-pledge-3', name: 'Lê Thị Hạnh (example donor)', amountVnd: 300000, pledgedAt: '2026-08-27T11:15:00.000Z' },
];
```

The `(example donor)` suffix on each seed name is deliberate and load-bearing — it keeps the
running-total feature's seed rows from ever being mistaken for real pledges, the same authenticity
concern §3.2 raises for the impact `StatBlock`.

### 4.3 Data flow

1. Client component mounts `useLocalCollection<Pledge>('nonprofit-pledges', PLEDGE_SEED)`.
2. `InquiryForm` (kit component) is rendered with one extra field beyond the base name/email/phone/
   message set — a pledge-amount field:
   ```ts
   const PLEDGE_FIELDS = [
     { name: 'amountVnd', label: 'Pledge amount (VND)', type: 'number', required: true },
   ];
   ```
   `InquiryForm`'s `fields` prop takes this array; the base `name` field (already part of
   `InquiryForm`'s fixed base fields) supplies the donor's display name.
3. `onSubmit` handler:
   - builds a `Pledge` from the form values (`id: crypto.randomUUID()`, `amountVnd:
     Number(values.amountVnd)`, `pledgedAt: new Date().toISOString()`),
   - calls the hook's `add(pledge)`,
   - relies on `InquiryForm`'s own existing pending/success state (kit behavior, unchanged) to show
     confirmation.
4. **Running total is a derived value, not stored state.** The section computes
   `items.reduce((sum, p) => sum + p.amountVnd, 0)` on every render from the hook's current `items`
   — never a separately-persisted counter, so it can never drift from the sum of the actual pledge
   records (avoids a classic double-bookkeeping bug in a demo feature).
5. **The visitor's own most recent pledge is highlighted.** The section identifies "the visitor's
   own" pledge as the most recently `add()`-ed item in the current browser session (tracked via a
   local `useState<string | null>` holding the last-added pledge's `id`, set inside the `onSubmit`
   handler right after `add()` succeeds — not derived from `pledgedAt` sorting alone, since a seed
   pledge could otherwise appear "most recent" before the visitor submits anything). Before any
   submission in the current session, no pledge is highlighted; after a submission, that pledge's row
   renders with a distinct highlighted treatment (Hallmark-authored — a background tint or border
   token, not a fixed color decided by this spec) in the running list.
6. Reload persistence: per the hook's hydration contract (interactive-demo spec §3.1), a page reload
   reads the same `localStorage` key — the running total and the full pledge list persist. The
   "visitor's own pledge" highlight is session-local UI state (§4.3 step 5), not persisted data, so
   it resets on reload (the pledge itself still shows in the list, just without the highlight) —
   this is an intentional, minor UX simplification, not a hydration-contract violation, since the
   contract (§3.1) governs `items`, not this section's local highlight state.
7. "Reset demo data" affordance (per hook contract, interactive-demo spec §3.1's `reset()` rule):
   small, non-prominent control near the running total that calls `reset()`, returning the pledge
   list (and therefore the running total) to the 3-row seed state.

## 5. Hallmark design brief

**Industry mood:** nonprofit / charitable-cause — needs to read as warm, trustworthy, and
mission-driven, never transactional or salesy (the donation CTA should feel like an invitation to
participate in a cause, not a checkout funnel). Parent spec §5's starting-family suggestion for this
category is a soft cool or green anchor hue with a humanist-sans display — this is a **non-binding
starting direction only**; the real Hallmark session (Task 1 of the implementation plan) may deviate
from it if research supports a different direction (e.g. a warm earth-tone palette instead of cool/
green, or a serif display paired with a humanist-sans body) as long as it clears the design-scoring
gate (master spec §8), particularly criterion #10 (distinctiveness against the other 28 sites —
several of which also start from a soft cool/green anchor per parent spec §5, so `nonprofit` must
not read as a re-skin of `medical` or `education`).

**Reference directions to research during the Hallmark pass** (starting points, not commitments):
1. Established international and Vietnamese NGO/charity digital presences — for the register of
   warmth-without-sentimentality that avoids both corporate coldness and manipulative "sad-child
   stock photo" charity-marketing clichés (which would fail criterion #1 and #8).
2. Community-impact/civic-tech reporting design (the way transparent, data-forward nonprofits present
   impact numbers as earned trust rather than a marketing stat) — useful for how the `StatBlock`
   section's "illustrative example data" framing (§2/§3.2) can still feel credible and considered
   rather than like a disclaimer bolted onto a fake number.
3. Editorial/documentary photography-led nonprofit sites — a possible source for how the cause/
   program `ItemGrid` (§3.1) and the donation section can feel human and specific (real program
   names, real-sounding outcomes) without relying on stock imagery clichés.

Actual token values (accent hue, type pairing, spacing scale, motion durations) are Task 1's output,
not this spec's — per master spec §9, this is intentionally deferred to the real Hallmark session.
