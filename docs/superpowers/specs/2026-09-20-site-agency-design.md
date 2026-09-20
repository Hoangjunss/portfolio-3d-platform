# Site Spec — Agency / Digital Studio (`agency`)

Date: 2026-09-20
Status: Approved (site #2 of 29; thin per-site spec under `2026-09-20-interactive-demo-templates-design.md` §9)

## 1. Context

This is a thin, mostly-data/content spec for one of the 29 demo template sites. Architecture,
component behavior, the `useLocalCollection` hydration contract, and the design-scoring gate are
already fixed by:

- `2026-09-20-template-design-system-design.md` (parent spec — §3 taxonomy row #2, §4 kit
  component behavior, §6 folder convention)
- `2026-09-20-interactive-demo-templates-design.md` (amendment spec — §3.1 `useLocalCollection`,
  §3.2 row #2 interactive feature, §3.3 `SavedItemsPanel`, §5 per-site Hallmark convention, §8
  scoring gate)

This spec states only: the section composition instantiation, the seed data shape/content, the
theme starting direction, and the interactive feature's exact data flow. It does not redefine any
component's behavior or the hook's contract.

- **Slug:** `agency` (folder: `templates/agency/`)
- **`display_order`:** 2 (seeded by plan 30's migration, row `agency` / `agency` / `Agency /
  Digital Studio`)
- **Category key (DB `category` column):** `agency`

## 2. Section composition

Per parent spec §4's kit table row for Agency:

```
Hero → ItemGrid (work, filter tabs) → ItemGrid (capabilities) → Footer
```

- **`Hero`** — standard kit props (`headline`, `subhead`, `ctaLabel`, `ctaHref`,
  `backgroundImage?`). CTA points at the work section (`ctaHref="#work"`).
- **`ItemGrid` #1 — "work" grid.** Renders the studio's portfolio items (§3 below), image+text
  item shape, `columns={3}`. **Filter tabs are a page-level composition behavior, not a kit prop.**
  `template-kit`'s `ItemGrid` (as scaffolded by plan 30 Task 3) takes only `items` and `columns` —
  it has no `category`/`filterable` prop, and per the parent spec's "no bespoke per-template
  component" rule this site must not fork or extend the kit component to add one. Instead:
  - the site's own `page.tsx` work section is a small client component that holds
    `activeCategory` state (`'all' | WorkCategory`),
  - renders a row of plain `<button>` filter-tab controls above the grid (one per category present
    in the seed data, plus "All"),
  - and passes `ItemGrid` a **filtered subset** of the full seed array (`items.filter(i =>
    activeCategory === 'all' || i.category === activeCategory).map(toGridItem)`), where
    `toGridItem` strips the site-only `category` field down to the kit's `GridItem` shape
    (`{id, title, description, image}`) before handing it to `ItemGrid`.
  - This keeps `ItemGrid` itself untouched and kit-owned; "filter tabs" is composition logic that
    lives in `templates/agency/app/` only, same as any other site-specific data wiring.
- **`ItemGrid` #2 — "capabilities" grid.** Second, differently-configured instance: icon+text item
  shape, `columns={4}`, no filter tabs, no `category` field on its seed items (capabilities are a
  fixed list, not filterable).
- **`Footer`** — standard kit props (`links`, `showSocial`).

## 3. Seed data

### 3.1 Work items (`templates/agency/data/work.ts`)

```typescript
export interface WorkCategory {
  key: 'branding' | 'web-design' | 'product' | 'motion' | 'strategy';
  label: string;
}

export const WORK_CATEGORIES: WorkCategory[] = [
  { key: 'branding', label: 'Branding' },
  { key: 'web-design', label: 'Web Design' },
  { key: 'product', label: 'Product' },
  { key: 'motion', label: 'Motion' },
  { key: 'strategy', label: 'Strategy' },
];

export interface WorkItem {
  id: string;
  title: string;
  description: string;
  category: WorkCategory['key'];
  image: string;
}

export const WORK_ITEMS: WorkItem[] = [
  {
    id: 'harborline-rebrand',
    title: 'Harborline Rebrand',
    description:
      "Full identity system for a Pacific Northwest ferry operator, from wordmark to wayfinding signage.",
    category: 'branding',
    image: '/work/harborline-rebrand.webp',
  },
  {
    id: 'nimbus-app-redesign',
    title: 'Nimbus Weather App Redesign',
    description:
      'UX overhaul and design system for a 2M-user weather app, cutting onboarding time roughly in half.',
    category: 'product',
    image: '/work/nimbus-app-redesign.webp',
  },
  {
    id: 'cascade-coffee-site',
    title: 'Cascade Coffee Roasters Site',
    description:
      'E-commerce storefront and subscription flow for a specialty coffee roaster.',
    category: 'web-design',
    image: '/work/cascade-coffee-site.webp',
  },
  {
    id: 'lumen-launch-film',
    title: 'Lumen Health Launch Film',
    description:
      "A 60-second brand film for a telehealth startup's Series A launch.",
    category: 'motion',
    image: '/work/lumen-launch-film.webp',
  },
  {
    id: 'greenline-transit-strategy',
    title: 'Greenline Transit Brand Strategy',
    description:
      "Positioning and naming for a regional transit authority's new express line.",
    category: 'strategy',
    image: '/work/greenline-transit-strategy.webp',
  },
  {
    id: 'fieldnote-packaging',
    title: 'Fieldnote Journal Packaging',
    description:
      "Packaging and retail display system for a stationery brand's flagship notebook line.",
    category: 'branding',
    image: '/work/fieldnote-packaging.webp',
  },
  {
    id: 'orbit-fitness-platform',
    title: 'Orbit Fitness Platform',
    description:
      'Cross-platform design system for a boutique fitness studio booking app.',
    category: 'product',
    image: '/work/orbit-fitness-platform.webp',
  },
];
```

Seven items, five categories (`branding` ×2, `product` ×2, `web-design` ×1, `motion` ×1,
`strategy` ×1) — enough for the filter tabs to visibly change grid contents without every tab
showing a single lonely card. Business/project names are realistic-but-fictional per parent spec
§5 (no real studios, no real clients); no fabricated stats accompany any item (no "40% growth"
claims, no client logos presented as real).

### 3.2 Capabilities (`templates/agency/data/capabilities.ts`)

```typescript
export interface Capability {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const CAPABILITIES: Capability[] = [
  {
    id: 'brand-strategy',
    title: 'Brand Strategy',
    description: 'Positioning, naming, and messaging frameworks grounded in real audience research.',
    icon: 'compass',
  },
  {
    id: 'visual-identity',
    title: 'Visual Identity',
    description: 'Logo systems, typography, color, and the guidelines that keep them consistent at scale.',
    icon: 'palette',
  },
  {
    id: 'web-product-design',
    title: 'Web & Product Design',
    description: 'Marketing sites, design systems, and end-to-end product UX for web and mobile.',
    icon: 'layout',
  },
  {
    id: 'motion-film',
    title: 'Motion & Film',
    description: 'Brand films, product explainers, and motion systems for launch and social.',
    icon: 'film',
  },
];
```

Four items — `ItemGrid` #2 renders `columns={4}` so each capability gets its own column on
desktop, distinct from the work grid's `columns={3}`.

## 4. Interactive feature: "Save to shortlist"

Per interactive-demo spec §3.2 row #2, backed by `useLocalCollection` (§3.1 of that spec) with:

```typescript
useLocalCollection<{ id: string; title: string; savedAt: string }>('agency-shortlist', [])
```

- **Seed is `[]`, not pre-populated.** This is visitor save-state, not page content — per this
  task's brief and the parent hook contract, a save-state collection starts empty so a first-time
  visitor never sees a fake "someone already saved this" signal.
- **Data flow:**
  1. `templates/agency/app/page.tsx`'s work section is a client component. It calls
     `useLocalCollection('agency-shortlist', [])` once, at the top of that component (not inside
     the grid item map — one hook instance for the whole shortlist, per the hook's `storageKey`
     isolation contract).
  2. Each rendered work-item card gets a "Save" button, rendered by the site (not inside
     `ItemGrid` itself, since `ItemGrid`'s `GridItem` has no action-button slot) — either as a
     sibling overlay positioned per item, or by rendering the work grid as the site's own
     `<ul>`/`<li>` wrapper around individual `ItemGrid`-shaped cards is out of scope; the simplest
     conforming approach is a small `WorkGridWithShortlist` wrapper component **local to
     `templates/agency/app/`** (site-level composition code, not a kit component) that renders the
     filtered `WorkItem[]` as its own list matching `ItemGrid`'s visual shape but with a save
     affordance — see plan Task 3 design decision for the exact implementation choice.
  3. Clicking "Save" on a work item calls `add({ id: item.id, title: item.title, savedAt: new
     Date().toISOString() })` — guarded so clicking an already-saved item's "Saved" state instead
     calls `remove(item.id)` (toggle, not duplicate-add).
  4. A `SavedItemsPanel<{ id, title, savedAt }>` renders below the work grid (or in a persistent
     side panel — Hallmark's layout call, Task 1), fed `items` from the same hook instance,
     `emptyLabel="Nothing saved yet — tap Save on a project you like"`, `onRemove={remove}`,
     `renderItem={(saved) => saved.title}`.
  5. Reload: `useLocalCollection`'s hydration contract (spec §3.1) reads the visitor's
     `localStorage['agency-shortlist']` on mount and shows their prior saves — no reset, no flash.
  6. The kit's standard "Reset demo data" affordance (spec §3.1) clears the shortlist back to `[]`.

## 5. Hallmark design brief

**Industry mood:** creative digital agency / design studio — confident, editorial, a little bold.
Buyers touring this template are evaluating whether it reads as "an agency I'd trust with my
brand," so the site's own design is itself part of the pitch (more than any other category on this
list, a generic/templated look here is actively disqualifying).

**Starting direction (non-binding, per parent spec §5 as amended by the interactive-demo spec —
Task 1 of the plan runs a real Hallmark pass and may deviate):** cool anchor hue (blue/teal) or
bold-energetic, grotesque-sans display.

**2-3 reference directions to research in the real Hallmark session (not fixed choices):**

1. **Swiss/International-Style editorial** — large grotesque display type, tight grid discipline,
   restrained color (near-mono + one accent), generous negative space. Think contemporary studio
   sites that lean typographic rather than illustrative.
2. **Bold maximal-grid** — oversized type crossing grid lines, saturated single accent hue against
   near-black/near-white, asymmetric section layouts, more visual noise/energy than direction 1 —
   fits the "bold-energetic" alternative named in the parent spec §5 mood family.
3. **Warm-neutral studio craft** — off-white/paper background, a single confident accent (not
   necessarily cool), humanist touches (subtle grain/texture, softer corners) — a deliberate
   counter-direction if research suggests "every agency demo site defaults to cool-blue-tech" and
   distinctiveness (design-scoring criterion #10) is better served by not doing that.

Whichever direction the real Hallmark session picks, it must still clear all 10 criteria in the
interactive-demo spec §8 scoring table, including #10 (standing next to the other 28 sites, this
one reads as its own thing) — since "agency" and several other categories (SaaS, Corporate, the
e-commerce/blog cool-hue variants) all start from the same cool-anchor-hue family, criterion #10 is
a real risk for this specific site and should be weighted accordingly during direction selection.

## 6. Explicitly out of scope

- Any component behavior change to `template-kit`'s `ItemGrid`, `SavedItemsPanel`, or
  `useLocalCollection` — this site composes them as-is (§2, §4).
- Real client testimonials, logos, or performance metrics — none are included in the seed data;
  none should be added later without being genuinely real and attributable.
- Any backend, API, or persistence beyond the visitor's own browser `localStorage`.
