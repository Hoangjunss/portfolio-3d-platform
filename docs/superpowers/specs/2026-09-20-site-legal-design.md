# Site Spec — Legal (`legal`)

Date: 2026-09-20
Status: Approved (site #20 of 20 original categories, last of the interactive-demo templates program's plans 31-50)

## 1. Context & Scope

This is a thin, mostly-data/content spec for one of the 29 demo template sites defined by
`2026-09-20-interactive-demo-templates-design.md` (§3.2 row #20, §9 execution order — this is plan
50, the last of plans 31-59's first block, 31-50). It does not redefine architecture: section
composition, shared component behavior, the `useLocalCollection` hydration contract, folder
convention, and the build/test gates are all already fixed by that spec and by
`2026-09-20-template-design-system-design.md` (§3's taxonomy row: "Legal / Văn phòng luật —
Practice-areas grid + attorney/staff grid + case-results list"). This spec states only:

- the exact section composition for this site,
- the seed data shape and sample rows (practice areas, attorneys, case results),
- the interactive feature's exact data flow,
- a Hallmark design brief (mood direction + research pointers, not fixed token values).

**Slug:** `legal` — folder `templates/legal/`, `display_order` 20, `category` `legal` (per plan 30
Task 1's authoritative slug table).

## 2. Section composition

```
Hero → ItemGrid(practice areas) → PeopleGrid(attorneys) → ItemGrid(case results) → InquiryForm(case inquiry) → Footer
```

- **`Hero`** — firm headline/subhead/CTA (e.g. "Schedule a consultation", linking down to the
  case-inquiry form, not to an external page).
- **`ItemGrid`(practice areas)** — `columns={3}`, items = the firm's practice areas (icon+text
  variant, no images required — see seed shape below).
- **`PeopleGrid`(attorneys)** — `roleLabel="Attorneys"`, items = attorney/staff profiles.
- **`ItemGrid`(case results)** — a second `ItemGrid` instance, reused rather than a new component
  (see §4.4 "Component reuse rationale" below), `columns={2}`, items = illustrative case-result
  summaries. Text-focused: no `icon`/`image` field populated, relying on `ItemGrid`'s existing
  "renders fine without `icon`/`image`" contract (parent spec §4's `ItemGrid` prop table already
  allows this — `icon`/`image` are optional).
- **`InquiryForm`(case inquiry)** — the interactive feature's form (see §4), with one extra field
  (`caseType`) beyond the base name/email/phone/message set.
- **`Footer`** — standard link set (About, Practice Areas, Attorneys, Contact) + social row on.

The interactive feature's "Your inquiries" list is its own client-side section, placed directly
below the `InquiryForm` section (not interleaved elsewhere) — a visitor submits the case-inquiry
form and sees their own submission history right there, mirroring the corporate site's placement
convention of keeping form + result panel adjacent.

## 3. Seed data

All seed data lives in `templates/legal/data/seed.ts`, statically importable at build time per
parent spec §3.1's render-pattern rule: static content (practice areas, attorneys, case results)
renders directly from imported seed data, never gated behind `useLocalCollection`'s hydration.

Content authenticity rule (parent spec §5 / interactive-demo spec §5, both restate the same rule):
sample copy is realistic-but-fictional, no fabricated stats/outcomes presented as real, no Lorem
Ipsum above the fold. This site uses a fictional Vietnamese law office, **Bạch Dương & Cộng Sự Law
Office** ("Bạch Dương & Partners"), so all names, cases, and outcomes below are fictional and must
not resemble a real firm, real litigants, or real case citations.

### 3.1 Practice areas (`ItemGrid` items)

```ts
interface PracticeAreaItem {
  id: string;
  title: string;
  description: string;
  icon: string; // icon token name, not an image path — icon+text variant
}

const PRACTICE_AREAS: PracticeAreaItem[] = [
  {
    id: 'pa-corporate',
    title: 'Corporate & M&A',
    description: 'Entity formation, joint ventures, and merger/acquisition due diligence for domestic and foreign-invested companies.',
    icon: 'briefcase',
  },
  {
    id: 'pa-realestate',
    title: 'Real Estate & Construction',
    description: 'Land-use rights, development contracts, and dispute resolution for commercial and residential projects.',
    icon: 'building',
  },
  {
    id: 'pa-labor',
    title: 'Labor & Employment',
    description: 'Employment contracts, workplace policy compliance, and termination/dispute advisory for employers and employees.',
    icon: 'users',
  },
  {
    id: 'pa-ip',
    title: 'Intellectual Property',
    description: 'Trademark and copyright registration, licensing agreements, and infringement enforcement.',
    icon: 'shield-check',
  },
  {
    id: 'pa-family',
    title: 'Family & Civil Matters',
    description: 'Divorce, inheritance, and civil contract disputes handled with discretion and a clear procedural roadmap.',
    icon: 'scale',
  },
  {
    id: 'pa-litigation',
    title: 'Litigation & Arbitration',
    description: 'Representation before courts and arbitration centers for commercial and civil disputes.',
    icon: 'gavel',
  },
];
```

Six items — inside `ItemGrid`'s `columns={3}` layout this wraps to an even 3-3 grid, a deliberate
choice (contrast with `corporate`'s intentional 3-2 asymmetric grid) so the Hallmark pass has a
different rhythm to design for on this site.

### 3.2 Attorneys (`PeopleGrid` items)

```ts
interface AttorneyItem {
  id: string;
  name: string;
  role: string;
  photo?: string; // omitted in seed data — PeopleGrid renders without a photo per its existing contract
}

const ATTORNEYS: AttorneyItem[] = [
  { id: 'atty-1', name: 'Đặng Thị Bạch Dương', role: 'Managing Partner, Corporate & M&A' },
  { id: 'atty-2', name: 'Vũ Hoàng Nam', role: 'Senior Associate, Litigation & Arbitration' },
  { id: 'atty-3', name: 'Ngô Thị Kim Chi', role: 'Partner, Real Estate & Construction' },
  { id: 'atty-4', name: 'Trịnh Minh Khoa', role: 'Associate, Labor & Employment' },
];
```

Four attorneys — no photos in seed data (`PeopleGrid` already renders correctly without `photo`
per its existing prop contract from plan 30 Task 3); a real photo upload is an admin action out of
scope here, same convention as `thumbnail.webp`.

### 3.3 Case results (`ItemGrid` items, text-focused variant)

**These are illustrative fictional examples, not real case outcomes or statistics.** Each entry
must read unambiguously as a fictional sample, avoiding a real court name, real case number
format, or a specific monetary figure presented as an actual settlement/verdict.

```ts
interface CaseResultItem {
  id: string;
  title: string;
  description: string;
  // no icon/image — text-focused variant per §2's ItemGrid reuse
}

const CASE_RESULTS: CaseResultItem[] = [
  {
    id: 'case-1',
    title: 'Illustrative example: Joint-venture dispute resolved via negotiated settlement',
    description: 'A sample scenario in which our corporate team helped two joint-venture partners reach a negotiated exit agreement without proceeding to arbitration.',
  },
  {
    id: 'case-2',
    title: 'Illustrative example: Land-use rights dispute — mediated outcome',
    description: 'A sample scenario illustrating how our real estate practice guided a commercial tenant through a mediated resolution with a landlord over lease-term interpretation.',
  },
  {
    id: 'case-3',
    title: 'Illustrative example: Wrongful-termination claim — favorable settlement',
    description: 'A sample scenario demonstrating our labor practice representing an employee in a termination dispute that concluded with a negotiated severance settlement.',
  },
  {
    id: 'case-4',
    title: 'Illustrative example: Trademark infringement — cease-and-desist success',
    description: 'A sample scenario in which our IP team secured a cease-and-desist agreement protecting a client\'s registered trademark from an infringing competitor.',
  },
  {
    id: 'case-5',
    title: 'Illustrative example: Family inheritance dispute — amicable division',
    description: 'A sample scenario illustrating our family-law practice facilitating an amicable estate division among heirs, avoiding prolonged litigation.',
  },
];
```

Five items — inside a `columns={2}` `ItemGrid` this wraps to a 2-2-1 layout, giving the Hallmark
pass a text-dense section to design typography and card rhythm for, distinct from the icon-driven
practice-areas grid above it.

### 3.4 Component reuse rationale (`ItemGrid` for case results, not a new component)

Per this repo's master spec (`2026-09-20-interactive-demo-templates-design.md` §3, unchanged rule:
"no bespoke per-template features" / "no new component for what an existing one already covers"),
a list of case-result summaries is structurally identical to `ItemGrid`'s existing `GridItem`
shape (`id`, `title`, `description`, optional `icon`/`image`) — it needs a title and a body of
text per entry, nothing `ItemGrid` doesn't already provide. Rather than adding a new kit component
for "text-only card list," this site composes a second `ItemGrid` instance with `icon`/`image`
omitted from every item, which `ItemGrid`'s existing prop contract already renders correctly (both
are optional per parent spec §4). This mirrors the same reuse discipline the parent spec applies
elsewhere (e.g. Real Estate's map embed living inside `ItemGrid`'s detail variant instead of a
tenth component).

## 4. Interactive feature: "Case inquiry" → "Your inquiries"

Per interactive-demo spec §3.2 row #20: a case-inquiry form (with a case-type field, beyond the
base `InquiryForm` fields) whose submissions accumulate in a small "Your inquiries" panel, visible
to the same visitor on return (same browser, same `localStorage`).

### 4.1 Data shape

```ts
interface CaseInquiry {
  id: string;          // generated client-side (e.g. crypto.randomUUID()) at submit time
  name: string;
  phone: string;
  caseType: string;    // extra InquiryForm field, e.g. 'Corporate & M&A' | 'Real Estate & Construction' | ...
  submittedAt: string; // ISO 8601, set client-side at submit time
}
```

Storage key: `'legal-inquiries'` (matches the master spec's naming convention, mirroring
`'corporate-callback-requests'`).

### 4.2 Seed value

The hook seeds with an **empty array**, not fictional pre-filled inquiries — a "Your inquiries"
panel pre-populated with fake inquiries the visitor never submitted would misrepresent the panel
as already containing the visitor's own history. First-time visitors see the panel's empty state;
the panel only ever shows inquiries that visitor actually submitted.

```ts
const INQUIRY_SEED: CaseInquiry[] = [];
```

### 4.3 Data flow

1. Client component mounts `useLocalCollection<CaseInquiry>('legal-inquiries', INQUIRY_SEED)`.
2. `InquiryForm` (kit component) is rendered with `fields={[{ name: 'caseType', label: 'Case type', type: 'text', required: true }]}` — the base name/email/phone/message fields plus this one extra
   field is exactly what this feature needs (parent spec §4: `InquiryForm`'s field set is "up to 2
   extra fields," this site uses 1). `onSubmit` handler:
   - builds a `CaseInquiry` from the form values (`id: crypto.randomUUID()`, `name`, `phone`,
     `caseType`, `submittedAt: new Date().toISOString()`) — `email` and `message` are collected by
     the base form per its existing contract but are not part of this site's stored record shape
     (they are used for the (mock, non-persisted) "Sent" confirmation `InquiryForm` already shows;
     only the fields the "Your inquiries" list actually displays are persisted),
   - calls the hook's `add(inquiry)`,
   - relies on `InquiryForm`'s own existing pending/success state (kit behavior, unchanged) to show
     confirmation.
3. **Panel choice: a simple list, not `SavedItemsPanel`.** Same rationale as the corporate site's
   §4.3 precedent: `SavedItemsPanel` is specified for the "visitor marked/saved an existing catalog
   item" pattern; a case inquiry is a new record the visitor authored via a form, not a catalog item
   being curated. This site renders `items` from the hook directly as a small ordered list (name +
   case type + submittedAt, most recent first) inside its own section — no new kit component.
4. Reload persistence: per the hook's hydration contract (interactive-demo spec §3.1), a page
   reload reads the same `localStorage` key and the "Your inquiries" list shows every inquiry the
   visitor has submitted in this browser, in order.
5. "Reset demo data" affordance (per hook contract, interactive-demo spec §3.1's `reset()` rule):
   small, non-prominent control near the panel that calls `reset()`, returning the list to empty.

## 5. Hallmark design brief

**Industry mood:** professional legal-services trust and gravitas — needs to read as credible,
discreet, and precise to a prospective client evaluating counsel, without tipping into the
"corporate consultancy" register already claimed by the `corporate` site (both start from the same
parent-spec cool-hue/grotesque-sans family, so distinctiveness matters here specifically — see
below). Parent spec §5's starting-family suggestion for this category is a cool anchor hue
(blue/teal) with a grotesque-sans display — this is a **non-binding starting direction only**; the
real Hallmark session (Task 1 of the implementation plan) may deviate from it if research supports
a different direction (e.g. a deep navy + warm brass/gold accent pairing more specific to legal
tradition, or a near-monochrome ink palette with one precise accent) as long as it clears the
design-scoring gate (master spec §8), particularly criterion #10 (distinctiveness against the
other 28 sites — `legal` is the second-to-last site sharing the cool-anchor-hue starting family
alongside `corporate` and `saas`, so it must read as its own thing, not a re-skin of either).

**Reference directions to research during the Hallmark pass** (starting points, not commitments):
1. Established law-firm digital presence (the register of restrained, high-trust typography, dense
   but orderly information hierarchy, minimal decorative motion) — useful for what to emulate
   selectively, not to copy wholesale (would read as generic/template-y, failing criterion #1).
2. Editorial/legal-publication design systems (case-law digests, bar-association journals) — a
   possible source for how to typeset the case-results section (§3.3) so it reads as considered
   editorial content rather than a default marketing card grid.
3. Vietnamese notarial/legal-office signage and print branding conventions — for a locally-grounded
   typographic and color voice distinct from the generic Western "big law" blue-suit look, and
   distinct from `corporate`'s own Southeast-Asian-corporate research direction (per that site's
   spec §5).

Actual token values (accent hue, type pairing, spacing scale, motion durations) are Task 1's
output, not this spec's — per master spec §9, this is intentionally deferred to the real Hallmark
session.
