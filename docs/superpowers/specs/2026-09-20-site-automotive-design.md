# Site Spec — Automotive (`automotive`)

Date: 2026-09-20
Status: Approved (site #19 of 29 under the interactive-demo templates program)

## 1. Context & Scope

This is a thin, mostly-data/content spec for one of the 29 demo template sites defined by
`2026-09-20-interactive-demo-templates-design.md` (§3.2 row #19, §9 execution order — this is plan
49, one of plans 31-59). It does not redefine architecture: section composition, shared component
behavior, the `useLocalCollection` hydration contract, folder convention, and the build/test gates
are all already fixed by that spec and by `2026-09-20-template-design-system-design.md`. This spec
states only:

- the exact section composition for this site (parent spec §3 row #19),
- the seed data shape and sample rows (fictional dealership inventory),
- the client-side filter behavior (page-level state, not a new kit component),
- the "Add to compare" interactive feature's exact data flow and its 3-item cap UX,
- a Hallmark design brief (mood direction + research pointers, not fixed token values).

**Slug:** `automotive` — folder `templates/automotive/`, `display_order` 19, `category`
`automotive` (per plan 30 Task 1's authoritative slug table).

## 2. Section composition

Per parent spec §3 row #19 ("Vehicle inventory grid (filterable) + financing-inquiry form") and
interactive-demo spec §3.2 row #19 ("Add to compare" on vehicle cards):

```
Hero → ItemGrid(vehicle inventory, filterable) → InquiryForm(financing inquiry) → Footer
```

- **`Hero`** — dealership headline/subhead/CTA (e.g. "Browse our inventory" or "Get financing"),
  linking down to the inventory grid, not to an external page.
- **`ItemGrid`** — `columns={3}`, items = the dealership's vehicle inventory (image+text variant —
  every vehicle has a real `image` per its existing prop contract). `ItemGrid` itself is unmodified
  kit code: it does not gain a filter prop or a per-item action prop (parent spec §3's "no bespoke
  per-template logic" rule, and interactive-demo spec §3.1's "kit components stay
  pure/presentational" rule from plan 30 decision (i)). Filtering and the compare action are both
  page-level concerns, composed around `ItemGrid`, described in §3 and §4 below.
- **`InquiryForm`** — `fields` extended with 2 automotive-specific extras (`vehicleOfInterest`,
  `budgetRange`), `submitLabel="Request financing info"`. This is the financing-inquiry form named
  in the parent spec's taxonomy row; it is a plain, non-persisted form per component contract (no
  `useLocalCollection` wired to it in this spec — the persisted interactive feature for this
  category is the compare tray, per interactive-demo spec §3.2 row #19, not a submissions panel).
- **`Footer`** — standard link set (Inventory, Financing, Service, Contact) + social row on.

### 2.1 Design decision: filter and compare are page-level, not kit changes

`ItemGrid`'s existing contract (plan 30 Task 3) is `{ items: GridItem[], columns?: 2 | 3 | 4 }` —
no filter-tab prop, no per-item action slot. Rather than extend the kit component (out of scope —
this spec's implementation plan does not touch `template-kit`), this site:

1. **Filter:** keeps the full `VEHICLES` array as page-level static seed data; a client component
   holds `{ typeFilter, priceRangeFilter }` as local `useState`, derives a filtered array via
   `.filter()`, and passes only the filtered array's items (mapped to `GridItem` shape) into
   `ItemGrid`. `ItemGrid` itself never sees the unfiltered set or the filter controls — it just
   renders whatever `items` it is given, exactly per its existing contract.
2. **Compare action:** since `ItemGrid` has no per-item action slot, the "Add to compare" control is
   NOT rendered inside `ItemGrid`'s own cards. Instead, a client component (`InventorySection`)
   renders the filter controls, the static `ItemGrid` (read-only catalog, kit component unchanged),
   and — directly beneath it, in a matching per-vehicle grid (same order/count as the currently
   filtered `ItemGrid` items) — one compact "Add to compare" button per visible vehicle, wired to
   `CompareTray`'s backing hook (§4). This keeps `template-kit` untouched while still delivering a
   card-adjacent compare action, matching the "shared behavior, bespoke per-site composition" rule
   (interactive-demo spec §5).

## 3. Seed data

All seed data lives in `templates/automotive/data/seed.ts`, statically importable at build time per
parent spec §3.1's render-pattern rule: static content renders directly from imported seed data,
never gated behind `useLocalCollection`'s hydration.

Content authenticity rule (parent spec §5 / interactive-demo spec §5): sample copy is
realistic-but-fictional, no fabricated stats presented as real. This site uses a fictional
Vietnamese dealership, **Đông Á Motors**, so all names/models below are fictional/generic and must
not resemble a real dealership or use a real automaker's protected model naming 1:1 (generic
in-family model names are used below, e.g. "Odyssey 5" rather than a real trademarked model).

### 3.1 Vehicle inventory (`ItemGrid` items, filter/compare source)

```ts
interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;        // VND
  type: 'sedan' | 'suv' | 'pickup' | 'hatchback';
  image: string;
  specs: {
    engine: string;
    seats: number;
    fuel: 'xăng' | 'dầu' | 'điện' | 'hybrid';
    transmission: 'số tự động' | 'số sàn';
  };
}

const VEHICLES: Vehicle[] = [
  { id: 'veh-01', make: 'Hakura', model: 'Cursa 1.5G', year: 2025, price: 585_000_000, type: 'hatchback', image: '/vehicles/hakura-cursa.webp', specs: { engine: '1.5L I4', seats: 5, fuel: 'xăng', transmission: 'số tự động' } },
  { id: 'veh-02', make: 'Hakura', model: 'Solara 1.6E', year: 2025, price: 689_000_000, type: 'sedan', image: '/vehicles/hakura-solara.webp', specs: { engine: '1.6L I4', seats: 5, fuel: 'xăng', transmission: 'số tự động' } },
  { id: 'veh-03', make: 'Vantor', model: 'Ridge 2.0T', year: 2024, price: 845_000_000, type: 'suv', image: '/vehicles/vantor-ridge.webp', specs: { engine: '2.0L Turbo I4', seats: 5, fuel: 'xăng', transmission: 'số tự động' } },
  { id: 'veh-04', make: 'Vantor', model: 'Highline 2.5', year: 2025, price: 1_120_000_000, type: 'suv', image: '/vehicles/vantor-highline.webp', specs: { engine: '2.5L I4 Hybrid', seats: 7, fuel: 'hybrid', transmission: 'số tự động' } },
  { id: 'veh-05', make: 'Orinth', model: 'Volt EV', year: 2025, price: 969_000_000, type: 'sedan', image: '/vehicles/orinth-volt.webp', specs: { engine: 'Động cơ điện 150kW', seats: 5, fuel: 'điện', transmission: 'số tự động' } },
  { id: 'veh-06', make: 'Orinth', model: 'Trekker EV', year: 2025, price: 1_350_000_000, type: 'suv', image: '/vehicles/orinth-trekker.webp', specs: { engine: 'Động cơ điện 210kW', seats: 5, fuel: 'điện', transmission: 'số tự động' } },
  { id: 'veh-07', make: 'Marchetta', model: 'Odyssey 5', year: 2024, price: 712_000_000, type: 'sedan', image: '/vehicles/marchetta-odyssey.webp', specs: { engine: '1.8L I4', seats: 5, fuel: 'xăng', transmission: 'số tự động' } },
  { id: 'veh-08', make: 'Marchetta', model: 'Bastion Pro', year: 2024, price: 899_000_000, type: 'pickup', image: '/vehicles/marchetta-bastion.webp', specs: { engine: '2.4L Turbo Diesel', seats: 5, fuel: 'dầu', transmission: 'số sàn' } },
  { id: 'veh-09', make: 'Kestrion', model: 'Alto 1.2', year: 2025, price: 468_000_000, type: 'hatchback', image: '/vehicles/kestrion-alto.webp', specs: { engine: '1.2L I3', seats: 5, fuel: 'xăng', transmission: 'số sàn' } },
  { id: 'veh-10', make: 'Kestrion', model: 'Ranger XT', year: 2024, price: 958_000_000, type: 'pickup', image: '/vehicles/kestrion-ranger.webp', specs: { engine: '2.2L Turbo Diesel', seats: 5, fuel: 'dầu', transmission: 'số tự động' } },
];
```

Ten vehicles across all 4 `type` values and a price spread from ~468M to ~1.35B VND — a deliberate
mix so the filter (§3.2) has a real, uneven distribution to design and test against, not a clean
even split.

### 3.2 Filter behavior (page-level state, not a kit component)

- **`typeFilter`**: `'all' | 'sedan' | 'suv' | 'pickup' | 'hatchback'` — rendered as a small set of
  toggle buttons/tabs above the grid; `'all'` is the default and initial state.
- **`priceRangeFilter`**: `'all' | 'under-700m' | '700m-1b' | 'over-1b'` — rendered as a second
  control (e.g. a `<select>` or a second tab row) next to the type filter.
  - `under-700m`: `price < 700_000_000`
  - `700m-1b`: `700_000_000 <= price <= 1_000_000_000`
  - `over-1b`: `price > 1_000_000_000`
- Both filters apply together (AND, not OR) — a visitor can narrow to "SUV" + "over 1B" and see
  only `veh-06` (Orinth Trekker EV).
- Filtering never touches `localStorage` — it is transient page state (`useState`, reset on reload),
  distinct from the compare tray's persisted state (§4). This mirrors the parent spec's existing
  distinction between static/derived view state and `useLocalCollection`-backed mutable state.
- Empty-result state: if a filter combination matches zero vehicles, the grid area shows a plain
  "No vehicles match these filters" message instead of an empty `ItemGrid` with no explanation.

## 4. Interactive feature: "Add to compare"

Per interactive-demo spec §3.2 row #19 and §3.3's `CompareTray` component: an "Add to compare"
action per vehicle card, backed by a `CompareTray` showing up to 3 vehicles side by side.

### 4.1 Data shape

```ts
interface CompareEntry {
  id: string;      // same id as the source Vehicle
  title: string;   // "Hakura Cursa 1.5G" (make + model)
  price: number;    // VND, copied at add-time from the vehicle's current price
  specs: {
    engine: string;
    seats: number;
    fuel: string;
    transmission: string;
  };
}
```

Storage key: `'automotive-compare'` (matches the master spec §3.2 row #19's `storageKey`
convention).

### 4.2 Seed value

The hook seeds with an **empty array** — the compare tray is not pre-populated with vehicles the
visitor never chose (same rationale as the corporate site's callback-requests panel, spec
`2026-09-20-site-corporate-design.md` §4.2): a pre-filled tray would misrepresent it as the
visitor's own prior activity.

```ts
const COMPARE_SEED: CompareEntry[] = [];
```

### 4.3 Data flow

1. `InventorySection` (client component) mounts
   `useLocalCollection<CompareEntry>('automotive-compare', COMPARE_SEED)`.
2. Each visible vehicle (after filtering, §3.2) renders an "Add to compare" button
   (`InventorySection`'s own markup, per §2.1's design decision — not inside `ItemGrid`).
3. **Clicking "Add to compare" on a vehicle:**
   - If the vehicle's `id` is already in the tray: no-op (button reads "Added" / is visually marked
     active, not clickable again for the same vehicle).
   - Else if the tray already holds 3 items (**the cap**): the button for every vehicle NOT already
     in the tray is disabled, with its label changed to "Compare full (3/3)" and a small inline
     message rendered once near the compare tray itself: "Compare is full — remove a vehicle below
     to add another." This is the documented 3-item-cap UX for this site: **disable, do not silently
     drop or silently replace the oldest entry** — a visitor who tries a 4th vehicle gets a clear,
     immediate reason rather than a confusing no-op or an unexpected swap.
   - Else: calls the hook's `add({ id, title: \`${make} ${model}\`, price, specs })`, built from the
     source `Vehicle` at click time.
4. **`CompareTray`** (kit component, §3.3 of the interactive-demo spec) renders the current `items`
   from the hook, one column per vehicle (up to 3), using its existing `renderItem`/`onRemove`
   contract — `renderItem` formats each `CompareEntry` as make/model, price, and the 4 spec fields;
   `onRemove(id)` is wired straight to the hook's `remove(id)`.
5. **Removing a vehicle** from `CompareTray` (its own remove control, kit behavior unchanged) calls
   `remove(id)`, which drops it from `localStorage` and re-enables every other vehicle's "Add to
   compare" button if the tray was previously full (i.e. the disabled/full state in step 3 is
   derived live from `items.length`, not a separately tracked flag, so it clears itself the instant
   the count drops below 3 — no extra state to keep in sync).
6. **Reload persistence:** per the hook's hydration contract (interactive-demo spec §3.1), a page
   reload reads the same `localStorage` key and `CompareTray` shows the same up-to-3 vehicles the
   visitor had added, in the same order.
7. "Reset demo data" affordance (hook contract's `reset()` rule): a small, non-prominent control near
   `CompareTray` that calls `reset()`, returning the tray to empty and re-enabling every "Add to
   compare" button.

## 5. Hallmark design brief

**Industry mood:** high-contrast neutral + one bold accent, condensed-sans display — per parent
spec §5's starting family for Automotive/Fitness/Construction. This is a **non-binding starting
direction only**; the real Hallmark session (Task 1 of the implementation plan) may deviate from it
if research supports a different direction, as long as it clears the design-scoring gate (master
spec §8), particularly criterion #10 (distinctiveness against the other 28 sites — Fitness and
Construction share the same starting family, so `automotive` must not read as a re-skin of either).

**Reference directions to research during the Hallmark pass** (starting points, not commitments):
1. Contemporary automaker/dealer digital showrooms (large-format vehicle photography, confident
   condensed display type for spec callouts, dark or high-contrast chrome around bright product
   imagery) — useful for what reads as "premium inventory browsing" rather than a generic classifieds
   listing site.
2. Motorsport/performance editorial design (bold numeral-driven layouts, spec-sheet typography,
   diagonal/angular accents used sparingly) — a possible source for how the compare table (§4.4) and
   the price/spec callouts on each vehicle card can feel considered rather than a plain data table.
3. Vietnamese auto-dealer branding conventions (how price is presented — VND formatting, financing
   messaging prominence) — for a locally-grounded voice that avoids reading as a translated US/EU
   dealer template.

Actual token values (accent hue, type pairing, spacing scale, motion durations) are Task 1's output,
not this spec's — per master spec §9, this is intentionally deferred to the real Hallmark session.
