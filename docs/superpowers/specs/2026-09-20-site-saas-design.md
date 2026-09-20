# Site Spec — SaaS / Startup (`saas`)

Date: 2026-09-20
Status: Approved (site #3 of 29 under the interactive-demo templates program)

## 1. Context & Scope

This is a thin, mostly-data/content spec for one of the 29 demo template sites defined by
`2026-09-20-interactive-demo-templates-design.md` (§3.2 row #3, §9 execution order — this is plan
33, the third of plans 31-59). It does not redefine architecture: section composition, shared
component behavior, the `useLocalCollection` hydration contract, folder convention, and the
build/test gates are all already fixed by that spec and by
`2026-09-20-template-design-system-design.md`. This spec states only:

- the exact section composition for this site,
- the seed data shape and sample rows (features, pricing tiers, integration logos, stat callouts),
- the interactive feature's exact data flow,
- a Hallmark design brief (mood direction + research pointers, not fixed token values).

**Slug:** `saas` — folder `templates/saas/`, `display_order` 3, `category` `saas` (per plan 30
Task 1's authoritative slug table).

## 2. Section composition

Per the parent spec §3 taxonomy row #3 ("Feature grid + pricing table + integration logo strip")
and interactive-demo spec §3.2 row #3:

```
Hero → ItemGrid(feature grid) → PricedItemGrid(pricing table) → StatBlock(feature callouts)
     → ItemGrid(integration logo strip, compact icon-only variant) → Footer
```

- **`Hero`** — product headline/subhead/CTA (primary CTA links down to the pricing table, e.g.
  "See pricing", not to an external signup page — this demo has no real signup backend).
- **`ItemGrid`** (feature grid) — `columns={3}`, items = the product's headline features (icon+text
  variant). This is the first `ItemGrid` instance on the page.
- **`PricedItemGrid`** (pricing table) — `currency="USD"`, three tiers, `ctaLabel="Start free
  trial"`. This is where the interactive feature (§4) attaches: the `onSelect` callback fires the
  trial-selection flow.
- **`StatBlock`** (feature callouts) — per parent spec §4's `StatBlock` row ("numbers must be real
  per-template content authored by the buyer, never invented at scaffold time") and interactive-demo
  spec §5 ("no fabricated stats presented as real"). Every stat below is explicitly labelled as
  illustrative demo content, not a claimed metric of a real company — see §3.4.
- **`ItemGrid`** (integration logo strip) — a **second, differently-configured instance of the same
  `ItemGrid` component**, not a new kit component. Documented choice (§3.5): `columns={6}`, items
  carry only `icon` + `title` (no `description` body copy rendered visually beyond an accessible
  label), giving a compact icon-only strip. This reuses `ItemGrid`'s existing `icon`/`image` prop
  surface from plan 30 Task 3 — no change to the kit component itself.
- **`Footer`** — standard link set (Product, Pricing, Docs, Contact) + social row on.

No other `template-kit` component is composed on this page. `PricedItemGrid` doubles as both the
pricing display and the interactive feature's trigger surface — this is the one place on the page
where a kit component's existing `onSelect` prop (plan 30 Task 3, `PricedItemGridProps.onSelect`)
is wired to a `useLocalCollection`-backed handler instead of a no-op.

## 3. Seed data

All seed data lives in `templates/saas/data/seed.ts` (statically importable at build time per
parent spec §3.1's render-pattern rule: static content renders directly from imported seed data,
never gated behind `useLocalCollection`'s hydration).

Content authenticity rule (parent spec §5 / interactive-demo spec §5): sample copy is
realistic-but-fictional, no fabricated stats presented as real, no Lorem Ipsum above the fold. This
site uses a fictional B2B SaaS product, **Loopwire** (a team-workflow/automation platform), so all
names, pricing, and stats below are fictional and must not resemble a real company or product.

### 3.1 Features (`ItemGrid` items — feature grid)

```ts
interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon: string; // icon token name, not an image path
}

const FEATURES: FeatureItem[] = [
  {
    id: 'feat-automations',
    title: 'Visual Automations',
    description: 'Build multi-step workflows with a drag-and-drop canvas — no code required.',
    icon: 'workflow',
  },
  {
    id: 'feat-integrations',
    title: 'Two-Way Sync',
    description: 'Keep records in sync across every connected tool, in both directions, in real time.',
    icon: 'refresh-cw',
  },
  {
    id: 'feat-collab',
    title: 'Shared Workspaces',
    description: 'Invite your team into one workspace with role-based access and activity history.',
    icon: 'users',
  },
  {
    id: 'feat-insights',
    title: 'Pipeline Insights',
    description: 'Live dashboards surface bottlenecks before they become missed deadlines.',
    icon: 'bar-chart-2',
  },
  {
    id: 'feat-api',
    title: 'Open API',
    description: 'A documented REST API and webhooks for anything the built-in integrations miss.',
    icon: 'code',
  },
  {
    id: 'feat-security',
    title: 'SSO & Audit Logs',
    description: 'SAML single sign-on and a full audit trail, ready for your security review.',
    icon: 'shield',
  },
];
```

Six items in a `columns={3}` grid — a clean 3-3 wrap (deliberately even, unlike `corporate`'s 3-2 —
the Hallmark pass may still introduce asymmetry via card sizing/emphasis, but the grid math itself
is not the source of visual interest for this category).

### 3.2 Pricing tiers (`PricedItemGrid` items — pricing table)

```ts
interface PricingTier {
  id: string;
  title: string;   // plan name
  price: number;   // monthly, USD, minor-unit-free (e.g. 29 means $29)
  image?: string;  // omitted — PricedItemGrid renders without an image per its existing contract
}

const PRICING_TIERS: PricingTier[] = [
  { id: 'plan-starter', title: 'Starter', price: 29 },
  { id: 'plan-team', title: 'Team', price: 79 },
  { id: 'plan-scale', title: 'Scale', price: 199 },
];
```

Three tiers, realistic-but-fictional monthly USD pricing for a mid-market B2B SaaS product
(`$29` / `$79` / `$199` — a plausible starter→team→scale ladder, not a real Loopwire price list
since Loopwire is fictional). `currency="USD"` at the `PricedItemGrid` call site. `ctaLabel="Start
free trial"` is shared across all three cards per `PricedItemGridProps.ctaLabel` (plan 30 Task 3 —
one label for the whole grid, not per-item) — this is fine because the interactive feature (§4)
reads which specific card was clicked from the `onSelect(item)` callback's `item` argument, not
from a per-card label.

Each tier's feature-inclusion copy (the 3-5 bullet points a real pricing card would show under the
price) is layout content owned by the Hallmark pass's card design, not part of this data shape —
if the implementer wants bullet copy, it is authored as additional static JSX/props alongside this
seed array in `page.tsx`, not modeled as a new field here, since `PricedItemGridProps` (plan 30
Task 3) has no such field and this spec does not ask for a kit change.

### 3.3 Integration logos (`ItemGrid` items — compact icon-only strip)

```ts
interface IntegrationItem {
  id: string;
  title: string;       // integration/tool name — rendered as the accessible label, not display copy
  description: string; // intentionally empty string; ItemGrid always renders a <p>, kept empty for this variant
  icon: string;
}

const INTEGRATIONS: IntegrationItem[] = [
  { id: 'int-slack', title: 'Slack', description: '', icon: 'slack' },
  { id: 'int-gsuite', title: 'Google Workspace', description: '', icon: 'google' },
  { id: 'int-notion', title: 'Notion', description: '', icon: 'notion' },
  { id: 'int-salesforce', title: 'Salesforce', description: '', icon: 'salesforce' },
  { id: 'int-github', title: 'GitHub', description: '', icon: 'github' },
  { id: 'int-zapier', title: 'Zapier', description: '', icon: 'zapier' },
];
```

Six fictional-in-context integration references (these are real third-party product names used
only as an "integrates with" icon strip, the same way any real SaaS marketing site names the tools
it connects to — not a claim that Loopwire itself is real or that these integrations exist in a
shipped product). If the Hallmark pass or a future content review prefers fully fictional
integration names to avoid any real-brand association, that is a content substitution at
implementation time, not a change to this shape.

### 3.4 Stat callouts (`StatBlock` items)

Per parent spec §4 ("numbers must be real per-template content authored by the buyer, never
invented at scaffold time") and interactive-demo spec §5 ("no fabricated stats presented as real"),
every value below is written as an explicitly illustrative, labelled demo figure — not phrased as a
claimed metric of a real company:

```ts
interface StatItem {
  label: string;
  value: string;
}

const STATS: StatItem[] = [
  { label: 'Sample dashboard — automations run per workspace (illustrative)', value: '1,200+/mo' },
  { label: 'Sample dashboard — average setup time (illustrative)', value: '< 15 min' },
  { label: 'Sample dashboard — integrations available (illustrative)', value: '40+' },
];
```

The `label` text itself carries the "illustrative demo figure" framing so the rendered page never
reads as a real, unqualified performance claim — this satisfies criterion #8 of the master spec §8
scoring gate without requiring a separate visual disclaimer element outside `StatBlock`'s existing
contract.

### 3.5 Documented choice: integration strip reuses `ItemGrid`, not a new component

The parent spec's taxonomy row for this category names "integration logo strip" as a distinguishing
section, but interactive-demo spec §3.3's list of *new* kit components does not include a
logo-strip component, and master spec §4's component table has no dedicated logo-grid primitive.
`ItemGrid` already accepts `items: GridItem[]` with optional `icon`/`image` and a `columns` prop
(plan 30 Task 3) — a second `ItemGrid` instance configured with `columns={6}`, `icon`-only items,
and empty `description` strings produces the compact icon-grid a logo strip needs, with zero new
kit code. This mirrors the parent spec §3's rule ("if two categories both need... they use the same
component with different props, not two components") applied within a single page rather than
across categories. The implementer's `page.tsx` renders this second `ItemGrid` with a distinct
section heading/wrapper (e.g. "Works with the tools you already use") so it is visually and
semantically distinct from the feature grid above it, even though both call the same component.

## 4. Interactive feature: "Start free trial" plan-selection persistence

Per interactive-demo spec §3.2 row #3: a "Start free trial" CTA on each pricing card whose click
persists the visitor's plan selection; the pricing table highlights the selected plan on return.

### 4.1 Data shape

```ts
interface TrialSelection {
  id: string;         // generated client-side (e.g. crypto.randomUUID()) at selection time
  planId: string;      // matches a PricingTier.id from §3.2
  selectedAt: string;  // ISO 8601, set client-side at selection time
}
```

Storage key: `'saas-trial-selection'` (matches the master spec's exact key, interactive-demo spec
§3.2 row #3).

### 4.2 Seed value

```ts
const TRIAL_SELECTION_SEED: TrialSelection[] = [];
```

Empty array — no plan is pre-selected for a first-time visitor; the pricing table's default
(unhighlighted) state is what every new visitor sees, matching the hook's hydration contract
(interactive-demo spec §3.1: first visit returns `seedData` unchanged).

### 4.3 At-most-one-selection handling: `reset()` + `add()`

The interactive-demo spec's brief for this site explicitly calls out that "at most one selection
makes sense" and asks the implementer to document the re-selection strategy. This site uses
**`reset()` followed by `add()`** on every click, not `update()`:

- `useLocalCollection<TrialSelection>('saas-trial-selection', TRIAL_SELECTION_SEED)` is mounted
  once by a client component wrapping the pricing section.
- On `PricedItemGrid`'s `onSelect(item)` callback firing (i.e. the visitor clicked "Start free
  trial" on a specific card):
  1. `reset()` is called first — this clears the collection back to `[]` (re-seeding from the empty
     `TRIAL_SELECTION_SEED` closure, per the hook's existing `reset()` contract, plan 30 Task 4),
     removing any prior selection.
  2. `add({ id: crypto.randomUUID(), planId: item.id, selectedAt: new Date().toISOString() })` is
     called immediately after, inserting the new (and now only) selection.
- **Why `reset()` + `add()` over `update()`:** `useLocalCollection.update(id, patch)` (plan 30 Task
  4) patches an existing item *by id* — it requires already knowing the id of the record being
  changed. A plan re-selection is not an edit of the same record (the visitor is not correcting a
  field on their existing selection); it is replacing which plan is chosen entirely, and the first
  selection's `id` is not meaningfully reusable for a semantically different selection event
  (`selectedAt` changes, and reusing the old `id` would misrepresent *when* this selection was
  made if any future feature ever displayed selection history). `reset()` + `add()` keeps the
  collection's invariant ("array has 0 or 1 items") trivially enforced by construction, rather than
  requiring the calling code to remember to `remove()` every other item before `update()`-ing one.
  This is a documented product decision for this site's own feature wiring, not a `useLocalCollection`
  API change.
- The two calls are sequential synchronous state updates within the same click handler; no debounce
  or loading state is needed since neither call is async (matches the hook's synchronous-mutation
  contract, plan 30 Task 4 design decision (m)).

### 4.4 Highlight rendering on return

1. The client component reads `items` from the hook (`items[0]?.planId`, since the collection holds
   at most one entry) after mount.
2. The pricing section passes a `selectedPlanId` (or equivalent) value down to however the plan
   renders each `PricedItemGrid` card's highlighted state — since `PricedItemGridProps` (plan 30
   Task 3) has no built-in "selected" visual variant, this site's `page.tsx` renders its own
   highlight treatment (e.g. a wrapping `<div data-selected>` per card, or a small "Your plan"
   badge rendered as sibling content keyed to `selectedPlanId`) around/alongside the shared
   `PricedItemGrid` output — this is content/layout wiring in the site's own page, not a kit
   component change, consistent with §2's rule that no new kit component is introduced here.
3. Per the hook's hydration contract (interactive-demo spec §3.1): on a reload, the hook's
   `useEffect` reads the same `localStorage` key and returns the previously selected
   `TrialSelection`, so the previously-clicked plan's highlight reappears without any additional
   client-side bookkeeping beyond reading `items[0]?.planId` again after mount.
4. First paint (before the hook's post-mount effect resolves) renders the pricing table with no
   highlight — matching the render-pattern rule (interactive-demo spec §3.1: static/marketing
   content never waits on `useLocalCollection`'s hydration; only the mutated/selected state is
   client-hydrated).
5. "Reset demo data" affordance (hook contract, interactive-demo spec §3.1's `reset()` rule): a
   small, non-prominent control near the pricing table that calls the hook's `reset()` directly,
   clearing the selection and its highlight — distinct from, but implemented with the same
   underlying `reset()` call as, the internal re-selection flow in §4.3 (calling it a second time
   here simply leaves the collection empty since nothing is `add()`-ed after it).

## 5. Hallmark design brief

**Industry mood:** B2B SaaS/startup product marketing — needs to read as modern, competent, and
fast-moving to a buyer evaluating a workflow-automation tool, credible enough for a paid trial
decision without tipping into generic "SaaS template" territory. Parent spec §5's starting-family
suggestion for this category is a cool anchor hue (blue/teal) with a grotesque-sans display — this
is a **non-binding starting direction only**; the real Hallmark session (Task 1 of the
implementation plan) may deviate from it if research supports a different direction, as long as it
clears the design-scoring gate (master spec §8), particularly criterion #1 (anti-generic — cool
blue + grotesque-sans is the single most common SaaS-template default, so this site is at the
highest risk of criterion #1 failure among all 29 and needs a genuinely considered, non-default
execution of that family, or a documented deviation from it) and criterion #10 (distinctiveness
against `corporate`, `legal`, and the other cool-anchor-hue sites).

**Reference directions to research during the Hallmark pass** (starting points, not commitments):
1. Developer-tool and workflow-automation product sites that have moved away from the flat
   "gradient blob + Inter" SaaS default (e.g. more editorial/technical type systems, restrained
   motion tied to the product's own automation/workflow metaphor) — useful for what to emulate
   selectively, not to copy wholesale (would fail criterion #1).
2. Pricing-table craft specifically — since `PricedItemGrid` is this page's primary conversion
   surface and the interactive feature's trigger point, its visual treatment (card hierarchy,
   how the "Start free trial" CTA and the post-selection highlight state read together) deserves
   focused research, not a default three-equal-boxes layout.
3. A technical/product-focused type voice (monospace or semi-condensed accents alongside the
   grotesque-sans display) as a way to signal "built by people who ship software" without resorting
   to literal terminal/code-block motifs, which would read as a cliché rather than a considered
   choice.

Actual token values (accent hue, type pairing, spacing scale, motion durations) are Task 1's output,
not this spec's — per master spec §9, this is intentionally deferred to the real Hallmark session.
