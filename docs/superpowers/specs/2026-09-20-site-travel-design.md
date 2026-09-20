# Site Spec — Travel / Resort (`travel`)

Date: 2026-09-20
Status: Approved (site #15 of 29 under the interactive-demo templates program)

## 1. Context & Scope

This is a thin, mostly-data/content spec for one of the 29 demo template sites defined by
`2026-09-20-interactive-demo-templates-design.md` (§3.2 row #15, §9 execution order — this is plan
45, one of plans 31-59). It does not redefine architecture: section composition, shared component
behavior, the `useLocalCollection` hydration contract, folder convention, and the build/test gates
are all already fixed by that spec and by `2026-09-20-template-design-system-design.md` (§3 row
#15's category description: "Room/package grid + amenities list + static map + booking-inquiry
form"). This spec states only:

- the exact section composition for this site (already implied by the parent spec §3 row #15,
  restated here for the plan to point at),
- the seed data shape and sample rows,
- the trip-planner interactive feature's exact data flow,
- a Hallmark design brief (mood direction + research pointers, not fixed token values).

**Slug:** `travel` — folder `templates/travel/`, `display_order` 15, `category` `travel` (per plan
30 Task 1's authoritative slug table).

## 2. Section composition

Per parent spec §3 row #15's category description, and interactive-demo spec §3.2 row #15's
interactive feature:

```
Hero → PricedItemGrid(rooms/packages) → ItemGrid(amenities, incl. static map placeholder) → InquiryForm(booking inquiry) → Footer
```

- **`Hero`** — resort headline/subhead/CTA (e.g. "Check availability", linking down to the booking
  inquiry form, not to an external page).
- **`PricedItemGrid`** — `currency="VND"`, `ctaLabel="Add to trip"`, items = the resort's room
  types and multi-night packages (§3.1). This is the interactive card grid: each card's CTA calls
  the trip-planner's `add` mutation (§4) instead of being a static no-op, per interactive-demo spec
  §3.2 row #15.
- **`ItemGrid`** — `columns={3}`, items = the resort's amenities (icon+text variant, §3.2), plus a
  **static map placeholder block** rendered directly beneath the amenities grid inside this same
  section (not a new kit component — same convention parent spec §4 already uses for Real Estate:
  "map embed lives inside `ItemGrid`'s detail variant, not a tenth component"). The placeholder is
  a static, non-interactive image/caption block ("Resort location — Vịnh Ngọc Bay, Khánh Hòa") that
  a later pass can swap for a real static map tile image; it carries no `useLocalCollection` state
  and is not part of the design-scoring interaction criterion.
- **`InquiryForm`** — the booking inquiry form (§5), placed after the amenities/map section and
  before `Footer`.
- **`Footer`** — standard link set (About, Rooms & Packages, Amenities, Contact) + social row on.

The trip-planner panel ("My trip", §4) renders directly beneath the `PricedItemGrid` section, as
the visible result of clicking "Add to trip" on any card — same placement logic as parent spec §4's
Real Estate example (the interactive result sits next to the grid it acts on, not buried at the
page's end).

## 3. Seed data

All seed data lives in `templates/travel/data/seed.ts` (must be statically importable at build time
per parent spec §3.1's render-pattern rule: static content renders directly from imported seed
data, never gated behind `useLocalCollection`'s hydration — only the trip-planner's *mutable* view
of the same catalog reads from `useLocalCollection`).

Content authenticity rule (parent spec §5 / interactive-demo spec §5, both restate the same rule):
sample copy is realistic-but-fictional, no fabricated stats presented as real, no Lorem Ipsum above
the fold. This site uses a fictional Vietnamese coastal resort, **Vịnh Ngọc Resort & Spa**, on a
fictional bay (Vịnh Ngọc Bay, Khánh Hòa) — all names below are fictional and must not resemble a
real property.

### 3.1 Rooms & packages (`PricedItemGrid` items)

```ts
interface RoomPackage {
  id: string;
  title: string;
  price: number; // VND, per-night for rooms, per-stay for packages — unit stated in `title`/description text, not a separate field (PricedItemGrid's existing prop contract has no unit field)
  image?: string;
}

const ROOMS: RoomPackage[] = [
  {
    id: 'room-garden',
    title: 'Garden View Room (per night)',
    price: 1850000,
  },
  {
    id: 'room-ocean-deluxe',
    title: 'Ocean View Deluxe (per night)',
    price: 2950000,
  },
  {
    id: 'room-family-suite',
    title: 'Family Suite (per night)',
    price: 4200000,
  },
  {
    id: 'room-honeymoon-villa',
    title: 'Honeymoon Pool Villa (per night)',
    price: 6800000,
  },
  {
    id: 'pkg-weekend-getaway',
    title: 'Weekend Getaway Package — 2 nights, breakfast + spa voucher',
    price: 5400000,
  },
  {
    id: 'pkg-beach-escape',
    title: '3-Night Beach Escape Package — all-day dining included',
    price: 9900000,
  },
  {
    id: 'pkg-business-retreat',
    title: 'Business Retreat Package — 2 nights, private meeting room',
    price: 7200000,
  },
  {
    id: 'pkg-family-fun',
    title: 'Family Fun Package — 4 nights, kids club included',
    price: 15600000,
  },
];
```

Eight items (4 room types + 4 multi-night packages) — inside `PricedItemGrid`'s grid layout this
gives the Hallmark pass (Task 1 of the plan) a mixed price range (~1.85M to ~15.6M VND) to design
a legible price hierarchy for, not a flat/uniform set.

### 3.2 Amenities (`ItemGrid` items)

```ts
interface AmenityItem {
  id: string;
  title: string;
  description: string;
  icon: string; // icon token name, not an image path — icon+text variant, same as parent spec's Corporate services precedent
}

const AMENITIES: AmenityItem[] = [
  { id: 'amenity-pool', title: 'Infinity Pool', description: 'Overlooking the bay, open sunrise to sunset.', icon: 'waves' },
  { id: 'amenity-beach', title: 'Private Beach Access', description: 'Direct resort access to Vịnh Ngọc Bay\'s white-sand shoreline.', icon: 'umbrella' },
  { id: 'amenity-spa', title: 'Full-Service Spa & Wellness', description: 'Traditional and modern treatments, open daily.', icon: 'flower' },
  { id: 'amenity-dive', title: 'Dive & Snorkeling Center', description: 'Guided reef trips and equipment rental on-site.', icon: 'anchor' },
  { id: 'amenity-kids', title: 'Kids Club & Family Pool', description: 'Supervised activities for ages 4-12.', icon: 'users' },
  { id: 'amenity-fitness', title: '24/7 Fitness Center', description: 'Full equipment, ocean-facing studio.', icon: 'dumbbell' },
  { id: 'amenity-dining', title: 'Three On-Site Restaurants', description: 'Vietnamese, seafood, and international menus.', icon: 'utensils' },
  { id: 'amenity-shuttle', title: 'Airport Shuttle Service', description: 'Scheduled transfers, booked at check-in.', icon: 'car' },
  { id: 'amenity-bikes', title: 'Free Bicycle Rental', description: 'Explore the coastal town at your own pace.', icon: 'bike' },
  { id: 'amenity-bar', title: 'Rooftop Sunset Bar', description: 'Open-air bar with bay views, evenings only.', icon: 'martini' },
];
```

Ten items — `columns={3}` per §2, wraps to an asymmetric 3-3-3-1 grid, same deliberate
non-uniform-layout rationale as the Corporate site's 5-item services grid.

### 3.3 Static map placeholder

Rendered directly beneath the amenities `ItemGrid`, inside the same page section, as static markup
(no props/data model of its own beyond a caption string):

```ts
const MAP_PLACEHOLDER_CAPTION = 'Vịnh Ngọc Resort & Spa — Vịnh Ngọc Bay, Khánh Hòa';
```

This spec fixes only that a static (non-interactive) map image or embed placeholder occupies this
slot — it does not fix a map provider, tile source, or real coordinates; the implementing plan may
use any static placeholder image (matching the site's Hallmark accent color, same convention as
`thumbnail.webp`) until a real static map asset is supplied.

## 4. Interactive feature: "Add to trip" trip planner

Per interactive-demo spec §3.2 row #15: an "Add to trip" action on each `PricedItemGrid` card,
backed by a `SavedItemsPanel` (relabeled "My trip" for this site) showing a running subtotal.

### 4.1 Data shape

```ts
interface TripItem {
  id: string;       // same id as the RoomPackage the visitor added — re-adding the same room/package updates nothing new (see §4.3 step 2)
  title: string;
  price: number;     // VND, copied from the RoomPackage at add-time
  addedAt: string;    // ISO 8601, set client-side at add time
}
```

Storage key: `'travel-my-trip'` (matches the master spec's exact key).

### 4.2 Seed value

The hook seeds with an **empty array** — a "My trip" panel pre-populated with rooms the visitor
never selected would misrepresent the panel as already reflecting a real choice, the same
misleading-UX concern the Corporate site's callback-requests panel avoids (§4.2 of that site's
spec). First-time visitors see `SavedItemsPanel`'s own empty state (`emptyLabel`); the panel only
ever shows rooms/packages that visitor actually added.

```ts
const MY_TRIP_SEED: TripItem[] = [];
```

### 4.3 Data flow

1. A client component (`TripPlannerSection`) receives the static `ROOMS` array as a prop (imported
   from `data/seed.ts` at the page level, per the render-pattern rule — the room/package *content*
   is never itself behind `useLocalCollection`, only the trip selection is) and mounts
   `useLocalCollection<TripItem>('travel-my-trip', MY_TRIP_SEED)`.
2. `PricedItemGrid` (kit component) is rendered with `items={ROOMS}`, `currency="VND"`,
   `ctaLabel="Add to trip"`, and an `onSelect` handler that:
   - checks whether a `TripItem` with the same `id` already exists in the hook's `items` (if so, no
     duplicate add — the card's CTA is idempotent per room/package, since "add to trip" reads as a
     selection, not a cart-style quantity increment; this is the one deliberate behavioral
     divergence from `CartDrawer`'s qty-based model, appropriate because a trip-planner slot for one
     room type doesn't need multiple quantities the way a retail cart line does),
   - otherwise builds a `TripItem` from the selected `RoomPackage` (`id`, `title`, `price`,
     `addedAt: new Date().toISOString()`) and calls the hook's `add(item)`.
3. `SavedItemsPanel` (kit component, §3.3 of the master interactive-demo spec) is rendered below the
   grid, relabelled via its own props (not a new component): `items={items}`, `emptyLabel="Your
   trip is empty — add a room or package above"`, `onRemove={remove}` (the hook's `remove`,
   removing by `id`), `renderItem` formatting each `TripItem` as its `title` + formatted VND price.
   The section heading/aria-label reads "My trip", not "Saved items" — a page-local label choice,
   not a `SavedItemsPanel` prop change.
4. **Running subtotal** is derived, not stored — computed at render time in `TripPlannerSection` as
   `items.reduce((sum, item) => sum + item.price, 0)`, formatted the same `Intl.NumberFormat('vi-VN',
   { style: 'currency', currency: 'VND' })` helper `PricedItemGrid` itself uses, and displayed above
   or below the `SavedItemsPanel` list (page-local markup, not a kit prop) so it updates on every
   add/remove without a second `localStorage` read.
5. Reload persistence: per the hook's hydration contract (interactive-demo spec §3.1), a page reload
   reads the same `localStorage` key and "My trip" shows every room/package the visitor has added in
   this browser, subtotal recomputed from the persisted list.
6. "Reset demo data" affordance (per hook contract, interactive-demo spec §3.1's `reset()` rule):
   small, non-prominent control near the panel that calls `reset()`, returning "My trip" to empty
   and the subtotal to 0.

## 5. Booking inquiry form field set

`InquiryForm` (kit component) rendered after the amenities/map section, per §2. Base fields
(`name`, `email`, `phone`, `message`, all from `InquiryForm`'s own existing contract) plus the
category's two allowed extra fields (parent spec §4: "up to 2 extra fields"):

```ts
const BOOKING_INQUIRY_FIELDS = [
  { name: 'checkInDate', label: 'Check-in date', type: 'text', required: true },
  { name: 'guestCount', label: 'Number of guests', type: 'number', required: true },
];
```

`submitLabel="Send booking inquiry"`. The base `message` textarea is where a visitor states
check-out date, room/package preference, or special requests — this spec does not add a third extra
field for check-out date, staying within the kit's 2-extra-field contract; a fuller
date-range/room-preference flow is explicitly out of scope (no real backend, no real availability
check, per the master spec's non-goal).

This form is a separate submission flow from the trip planner (§4) — it does not read or write
`localStorage`; per parent spec §4, `InquiryForm` submissions are not required to persist anywhere
for this category (unlike categories in interactive-demo spec §3.2 whose named feature *is* an
inquiry-form panel, e.g. Real Estate/Legal). Travel's persisted interactive feature is the trip
planner; the booking form uses `InquiryForm`'s existing pending/success state only.

## 6. Hallmark design brief

**Industry mood:** resort/hospitality — needs to read as relaxed, premium, and coastal without
tipping into a generic stock-photo "beach vacation" template look. Parent spec §5's starting-family
suggestion for Restaurant/Beauty/Wedding/Photography (the nearest documented mood cluster) is a warm
anchor hue (terracotta/rose) with a serif display — this is a **non-binding starting direction
only**; the real Hallmark session (Task 1 of the implementation plan) may deviate from it if
research supports a different resort-appropriate direction (e.g. a deep teal/sand duotone, or a
sun-bleached warm-neutral base with one saturated coral accent) as long as it clears the
design-scoring gate (master spec §8), particularly criterion #10 (distinctiveness against the other
28 sites — several of which also start from a warm anchor hue per parent spec §5, so `travel` must
not read as a re-skin of `restaurant`, `beauty`, or `blog-food`).

**Reference directions to research during the Hallmark pass** (starting points, not commitments):
1. Boutique/independent coastal resort hospitality sites (not major hotel-chain aggregator sites,
   which trend generic/booking-engine-default) — useful for how a premium resort earns trust through
   restrained, high-quality imagery framing and type, not badge/star clutter.
2. Vietnamese coastal-town and island-tourism visual branding — for a locally-grounded palette and
   typographic voice that avoids the generic "infinity pool at golden hour" stock look most
   resort-mood sites default to.
3. Editorial travel-magazine layout systems (image-forward but with real typographic hierarchy) — a
   possible source for how to make the 8-item room/package grid (§3.1) and the 10-item amenities
   grid (§3.2) feel curated rather than a default e-commerce catalog grid.

Actual token values (accent hue, type pairing, spacing scale, motion durations) are Task 1's output,
not this spec's — per master spec §9, this is intentionally deferred to the real Hallmark session.
