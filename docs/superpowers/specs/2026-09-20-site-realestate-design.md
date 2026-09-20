# Site Spec — Real Estate (`realestate`)

Date: 2026-09-20
Status: Approved (site #6 of 29 under the interactive-demo templates program)

## 1. Context & Scope

This is a thin, mostly-data/content spec for one of the 29 demo template sites defined by
`2026-09-20-interactive-demo-templates-design.md` (§3.2 row #6, §9 execution order — this is plan
36, the sixth of plans 31-59). It does not redefine architecture: section composition, shared
component behavior, the `useLocalCollection` hydration contract, folder convention, and the
build/test gates are all already fixed by that spec and by
`2026-09-20-template-design-system-design.md`. This spec states only:

- the exact section composition for this site (already implied by the parent spec §4 worked
  example for this category, restated here for the plan to point at),
- the seed data shape and sample listing rows,
- the save/favorite ("Save listing") interactive feature's exact data flow,
- a Hallmark design brief (mood direction + research pointers, not fixed token values).

**Slug:** `realestate` — folder `templates/realestate/`, `display_order` 6, `category`
`realestate` (per plan 30 Task 1's authoritative slug table).

## 2. Section composition

Per parent spec §4's own worked example for this category, unchanged:

```
Hero → ItemGrid(listings) → InquiryForm → Footer
```

- **`Hero`** — headline/subhead/CTA for a fictional real-estate agency (e.g. "Find your next home",
  linking down to the listings grid, not to an external page).
- **`ItemGrid`** — `columns={3}`, items = the agency's property listings (image+text variant — see
  seed shape below; each card's `image` is a static map-placeholder graphic for that listing, per
  §4.4).
- **`InquiryForm`** — `fields=[{ propertyInterest: text }]` (see §5), a general "talk to an agent"
  form, separate from the per-listing "Save listing" toggle.
- **`Footer`** — standard link set (Listings, About, Agents, Contact) + social row on.

No other `template-kit` component is composed on the static page. Per the parent spec's own note
("map embed lives inside `ItemGrid`'s detail variant, not a tenth component"), the static map is
not a new component — it is the `image` shown on each `ItemGrid` card (§4.4). The "Save listing"
interactive layer (§4) is a separate client-side overlay mounted alongside `ItemGrid`, plus a
`SavedItemsPanel` section placed directly under `Hero` and above `ItemGrid`, mirroring corporate's
precedent of placing the interactive section early rather than at the page bottom.

## 3. Seed data

All seed data lives in `templates/realestate/data/seed.ts` (statically importable at build time per
parent spec §3.1's render-pattern rule: static content renders directly from imported seed data,
never gated behind `useLocalCollection`'s hydration).

Content authenticity rule (parent spec §5 / interactive-demo spec §5, both restate the same rule):
sample copy is realistic-but-fictional, no fabricated stats presented as real, no Lorem Ipsum above
the fold. This site uses a fictional Vietnamese real-estate agency, **Sông Hồng Real Estate**, and
all addresses/prices/agent names below are fictional and must not resemble a real listing.

### 3.1 Property listings (`ItemGrid` items, mapped from `PropertyListing`)

```ts
interface PropertyListing {
  id: string;
  address: string;          // street + ward/district + city
  priceVnd: number;          // asking price in VND, whole units (e.g. 4200000000 = 4.2 billion VND)
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
  propertyType: 'apartment' | 'townhouse' | 'villa' | 'land';
  mapPlaceholderNote: string; // e.g. "Static map placeholder — district-level pin, no live map tiles"
  mapPlaceholderImage: string; // path to a static, neutral map-style placeholder graphic
}

const LISTINGS: PropertyListing[] = [
  {
    id: 'listing-1',
    address: '12 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
    priceVnd: 8500000000,
    bedrooms: 3,
    bathrooms: 2,
    areaSqm: 110,
    propertyType: 'apartment',
    mapPlaceholderNote: 'Static map placeholder — Quận 1 riverside district pin, no live map tiles',
    mapPlaceholderImage: '/listings/map-placeholder-01.webp',
  },
  {
    id: 'listing-2',
    address: '45 Đường Trần Não, Phường An Khánh, TP. Thủ Đức, TP.HCM',
    priceVnd: 5200000000,
    bedrooms: 2,
    bathrooms: 2,
    areaSqm: 78,
    propertyType: 'apartment',
    mapPlaceholderNote: 'Static map placeholder — Thủ Đức riverside pin, no live map tiles',
    mapPlaceholderImage: '/listings/map-placeholder-02.webp',
  },
  {
    id: 'listing-3',
    address: '8 Ngõ 12 Đường Nguyễn Đình Chiểu, Phường Đống Đa, Hà Nội',
    priceVnd: 6800000000,
    bedrooms: 4,
    bathrooms: 3,
    areaSqm: 95,
    propertyType: 'townhouse',
    mapPlaceholderNote: 'Static map placeholder — Đống Đa inner-city pin, no live map tiles',
    mapPlaceholderImage: '/listings/map-placeholder-03.webp',
  },
  {
    id: 'listing-4',
    address: '21 Đường Lê Văn Việt, Phường Tăng Nhơn Phú A, TP. Thủ Đức, TP.HCM',
    priceVnd: 3950000000,
    bedrooms: 3,
    bathrooms: 2,
    areaSqm: 120,
    propertyType: 'townhouse',
    mapPlaceholderNote: 'Static map placeholder — Thủ Đức eastern-district pin, no live map tiles',
    mapPlaceholderImage: '/listings/map-placeholder-04.webp',
  },
  {
    id: 'listing-5',
    address: '3 Đường Nguyễn Văn Hưởng, Phường Thảo Điền, TP. Thủ Đức, TP.HCM',
    priceVnd: 32000000000,
    bedrooms: 5,
    bathrooms: 5,
    areaSqm: 380,
    propertyType: 'villa',
    mapPlaceholderNote: 'Static map placeholder — Thảo Điền villa-compound pin, no live map tiles',
    mapPlaceholderImage: '/listings/map-placeholder-05.webp',
  },
  {
    id: 'listing-6',
    address: '67 Đường Hoàng Hoa Thám, Phường Vĩnh Trung, Đà Nẵng',
    priceVnd: 4400000000,
    bedrooms: 3,
    bathrooms: 2,
    areaSqm: 88,
    propertyType: 'apartment',
    mapPlaceholderNote: 'Static map placeholder — Đà Nẵng coastal-district pin, no live map tiles',
    mapPlaceholderImage: '/listings/map-placeholder-06.webp',
  },
  {
    id: 'listing-7',
    address: 'Lô B14 Khu dân cư Him Lam, Phường Tân Hưng, Quận 7, TP.HCM',
    priceVnd: 2100000000,
    bedrooms: 0,
    bathrooms: 0,
    areaSqm: 100,
    propertyType: 'land',
    mapPlaceholderNote: 'Static map placeholder — Quận 7 residential-plot pin, no live map tiles',
    mapPlaceholderImage: '/listings/map-placeholder-07.webp',
  },
  {
    id: 'listing-8',
    address: '9 Đường Điện Biên Phủ, Phường Vĩnh Ninh, Huế',
    priceVnd: 3100000000,
    bedrooms: 3,
    bathrooms: 2,
    areaSqm: 105,
    propertyType: 'townhouse',
    mapPlaceholderNote: 'Static map placeholder — Huế riverside district pin, no live map tiles',
    mapPlaceholderImage: '/listings/map-placeholder-08.webp',
  },
];
```

Eight listings, spanning apartment/townhouse/villa/land and three cities (TP.HCM, Hà Nội, Đà Nẵng,
Huế) — a deliberate spread so the Hallmark pass (Task 1 of the plan) has real price/size variance
(2.1B–32B VND, 0–5 bedrooms, 78–380 sqm) to design a card layout for, not uniform filler rows.
`bedrooms: 0` / `bathrooms: 0` on the `land` listing is real content (a land plot has none), not a
missing-data placeholder — the card layout must render this legibly (e.g. omit the bed/bath line
for `propertyType: 'land'` rather than show "0 bedrooms").

### 3.2 Mapping to `ItemGrid`'s `GridItem` shape

`ItemGrid` (kit component, plan 30 Task 3) takes `{ id, title, description, image? }` — it has no
bedroom/price/sqm fields of its own, so `page.tsx` maps each `PropertyListing` to a `GridItem` at
render time (a pure formatting function, not a new component):

```ts
function toGridItem(listing: PropertyListing): GridItem {
  return {
    id: listing.id,
    title: listing.address,
    description: formatListingSummary(listing), // "8.5 tỷ VND · 3 PN · 2 WC · 110 m²" (or the
    // land-listing variant without the bed/bath segment), plus listing.mapPlaceholderNote appended
    // on its own line so the map-placeholder disclosure is always visible, not just in alt text
    image: listing.mapPlaceholderImage,
  };
}
```

`formatPrice`-equivalent for VND full billions/millions is this site's own small formatter (not
`PricedItemGrid`'s currency formatter, since `ItemGrid` is not `PricedItemGrid` — the price appears
as formatted text inside `description`, per `ItemGrid`'s existing shape, not as a separate prop).

## 4. Interactive feature: "Save listing" (favorite) toggle

Per interactive-demo spec §3.2 row #6 and §3.3: a per-listing "Save" toggle backed by
`useLocalCollection`, surfaced in a `SavedItemsPanel` (the kit component built for exactly this
"visitor marked an existing catalog item" pattern — unlike corporate's callback-request feature,
this *is* a `SavedItemsPanel` case, since a saved listing is a reference to an existing catalog row
the visitor can un-save, not an authored record).

### 4.1 Data shape

```ts
interface SavedListing {
  id: string;      // same id as the PropertyListing it references
  title: string;    // denormalized copy of the listing's address, so the panel/reload never needs
                    // to re-join against LISTINGS to render a label
  savedAt: string;  // ISO 8601, set client-side at save time
}
```

Storage key: `'realestate-saved'` (matches the master spec's per-category convention: category-slug
prefix + feature noun).

### 4.2 Seed value

The hook seeds with an **empty array** — a visitor's saved-listings panel pre-populated with
fictional saved rows would misrepresent the panel as already containing the visitor's own picks,
the same misleading-UX reasoning as corporate's callback-requests seed (§4.2 of that site's spec).

```ts
const SAVED_SEED: SavedListing[] = [];
```

### 4.3 Data flow

1. A client component (`SavedListingsSection`, mounted once per page, not per card) calls
   `useLocalCollection<SavedListing>('realestate-saved', SAVED_SEED)`.
2. **Per-listing "Save" toggle:** each `ItemGrid` card needs its own toggle button, but `ItemGrid`
   itself has no per-item action slot (unlike `PricedItemGrid`, which exposes `onSelect`). Per the
   interactive-demo spec §3.1 render pattern ("`useLocalCollection` only takes over, client-side,
   for the mutable view... mounted inside a client component that hydrates after the static shell
   is already visible"), this site keeps `ItemGrid` untouched (rendering the static catalog: address,
   price/size summary, map placeholder) and overlays a second, client-only list
   (`SaveToggleOverlay`) that renders one "Save"/"Saved" button per listing `id`, positioned to align
   visually with the corresponding `ItemGrid` card (same `LISTINGS` order, same column count as
   `ItemGrid`'s `columns={3}` — the exact CSS alignment mechanism, e.g. a matching-grid absolutely
   positioned sibling vs. a per-card portal, is a Task 1/2 Hallmark+implementation decision, not
   fixed by this spec). This keeps the kit's `ItemGrid` component untouched, matching the "shared
   behavior, bespoke visual design" rule (master spec §5) the same way corporate kept `PeopleGrid`
   untouched.
3. Clicking "Save" on listing X calls `add({ id: X.id, title: X.address, savedAt: new
   Date().toISOString() })`; clicking "Saved" (i.e. already in the collection) calls `remove(X.id)`
   — a true toggle, not an add-only button.
4. `SavedItemsPanel` (kit component, plan 30 Task 5) renders the `items` from the hook:
   `renderItem={(s: SavedListing) => s.title}`, `emptyLabel="No saved listings yet — tap Save on a
   listing to add it here"`, `onRemove={(id) => remove(id)}` — so a visitor can also un-save directly
   from the panel, not only from the card overlay; both call the same hook `remove`.
5. Reload persistence: per the hook's hydration contract (interactive-demo spec §3.1), a page reload
   reads the same `localStorage` key; both the panel and the per-card toggle state (derived by
   checking whether a given listing `id` is present in `items`) reflect the visitor's prior saves.
6. "Reset demo data" affordance (per hook contract, interactive-demo spec §3.1's `reset()` rule):
   a small, non-prominent control inside `SavedItemsPanel`'s section that calls `reset()`, clearing
   all saves back to empty.

### 4.4 Static map placeholder (not the interactive feature — static content)

Each listing's card shows a static map-placeholder graphic (`mapPlaceholderImage`) as its `image`,
plus the `mapPlaceholderNote` text appended to `description` (§3.2) — this is ordinary static seed
content, rendered directly by `ItemGrid`, not gated behind any hook. It exists so the page reads as
a real listings site (every real-estate listing implies "where is this") without pretending to embed
a live map tile provider, which parent spec §5's "no fabricated content"/no third-party-service rule
this program has followed since plan 30 implicitly rules out (no template gets a real backend or
live external API call).

## 5. General inquiry form

`InquiryForm`'s base fields (name/email/phone/message) plus one extra field:

```ts
const INQUIRY_EXTRA_FIELDS = [
  { name: 'propertyInterest', label: 'Property of interest (address or listing ID)', type: 'text', required: false },
];
```

Submitted separately from the "Save listing" feature (this form does not write through
`useLocalCollection` — no interactive-demo spec row assigns this site two persisted collections;
per §3.2 row #6, "Save listing" is the one required `useLocalCollection` feature for this category).
The form's own submit handling (toast/confirmation only, no persistence) is a Task 2/3 implementation
detail, not new data shape.

## 6. Hallmark design brief

**Industry mood:** soft cool or neutral, humanist-sans display — the non-binding starting direction
per interactive-demo spec's per-category table and parent spec §5's "Medical / Education /
Nonprofit → soft cool or green anchor, humanist-sans" family (real estate sits closer to this
trust-driven, approachable register than to `corporate`'s or `legal`'s harder cool-blue register).
This is a **non-binding starting direction only** — the real Hallmark session (Task 1 of the
implementation plan) may deviate from it if research supports a different direction, as long as it
clears the design-scoring gate (master spec §8), particularly criterion #10 (distinctiveness against
the other 28 sites — several of which also start from a cool/neutral anchor hue, so `realestate`
must not read as a re-skin of `corporate`, `medical`, or `travel`).

**Reference directions to research during the Hallmark pass** (starting points, not commitments):
1. Contemporary Vietnamese real-estate brokerage/listing-portal design (the "trustworthy local
   agent" register: legible price/size data hierarchy on the card, warm-but-professional imagery
   treatment) — useful for what to emulate selectively, not to copy wholesale (would read as a
   generic listing-portal template, failing criterion #1).
2. Boutique international real-estate/property-marketing sites (large-format photography, generous
   whitespace, confident restrained typography) — a source for how to make the listing grid feel
   editorial and considered rather than a default classifieds-site density.
3. Wayfinding/map-adjacent design systems (transit maps, static cartography posters) — since this
   site's "map" is deliberately a static placeholder graphic (§4.4), not a live map, this direction
   is a source for how to make a *stylized, static* map-style graphic read as intentional design
   rather than as a broken/missing map embed.

Actual token values (accent hue, type pairing, spacing scale, motion durations) are Task 1's output,
not this spec's — per master spec §9, this is intentionally deferred to the real Hallmark session.
