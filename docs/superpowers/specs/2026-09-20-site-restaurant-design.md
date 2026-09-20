# Site Spec — Restaurant / Cafe (`restaurant`)

Date: 2026-09-20
Status: Approved (site spec for interactive-demo taxonomy #5, `docs/superpowers/specs/2026-09-20-interactive-demo-templates-design.md` §3.2 row 5; parent taxonomy `docs/superpowers/specs/2026-09-20-template-design-system-design.md` §3 row 5)

## 1. Scope

This is a thin, mostly-data/content spec. Architecture, the shared component kit, the
`useLocalCollection` hook contract, the folder convention, and the scoring gate are all fixed by
the two parent documents above — this file states only: the section composition (already fixed,
restated for traceability), the seed data shape/content for this one site, the theme starting
direction, and the reservation feature's exact field set and data flow. It does not re-derive or
override anything from the parent specs.

- **Slug:** `restaurant` (folder: `templates/restaurant/`)
- **Category key:** `restaurant`, `display_order`: 5 (per plan 30's authoritative slug table)
- **Depends on:** `@portfolio/template-kit` (plan 30 — `Hero`, `PricedItemGrid`, `InquiryForm`,
  `Footer`, `useLocalCollection`, `TemplateTheme`/`assertValidTheme`)

## 2. Section composition

Per parent spec §4's combination example for Restaurant, unchanged:

```
Hero → PricedItemGrid(menu, categorised) → InquiryForm(reservation) → Footer
```

- **`Hero`** — restaurant name/tagline, a CTA that scrolls/links to the reservation section.
- **`PricedItemGrid`(menu)** — rendered as **multiple `PricedItemGrid` instances, one per menu
  category**, each preceded by a category heading (`<h2>`) the page itself renders (not a kit
  component prop — `PricedItemGrid` takes a flat `items` array with no grouping/category field in
  its own prop shape per plan 30 task 3). The page's `page.tsx` groups the single seed `menu` array
  by each item's `category` field (client-side `Array.prototype.filter`/`reduce`, done once at
  build/render time since the menu is static content, not `useLocalCollection` state) and renders
  one `<section>` + heading + `<PricedItemGrid items={itemsInThatCategory} currency="VND" />` per
  distinct category, in the category order given in §3.2 below. This is the documented mechanism
  for "categorised" — no new kit prop, no bespoke component.
- **`InquiryForm`(reservation)** — see §4.
- **`Footer`** — standard link set (Menu, Reservations, About/Hours placeholder-free real copy),
  social row on.

## 3. Seed data

All seed data lives in one file, `templates/restaurant/data/seed.ts` (imported directly by
`page.tsx` for the static menu/hero content — per interactive-demo spec §3.1's render pattern,
this is the data that renders in the static export and on first paint, never gated behind
`useLocalCollection`).

### 3.1 Restaurant identity

```typescript
export const restaurant = {
  name: 'Ember & Sage',
  tagline: 'Modern hearth cooking, seasonal plates, and a wood-fired kitchen you can watch work.',
  heroImage: '/hero.jpg',
  address: '48 Nguyen Hue, District 1, Ho Chi Minh City',
  hours: 'Tue–Sun, 17:00–23:00 (closed Mondays)',
};
```

`address`/`hours` are realistic-but-fictional placeholders for a fictional business, not fabricated
metrics — they carry no claimed statistic and are exempt from the parent spec §5 "no fabricated
stats" rule the same way any demo business's street address is (the rule targets invented
numbers/testimonials presented as real evidence, not scene-setting copy for a fictional shop).

### 3.2 Menu — 11 items across 4 categories

`category` values, in the render order fixed by §2:

| Order | `category` |
|---|---|
| 1 | `Starters` |
| 2 | `Mains` |
| 3 | `Desserts` |
| 4 | `Bar` |

```typescript
export interface MenuItem {
  id: string;
  category: 'Starters' | 'Mains' | 'Desserts' | 'Bar';
  title: string;
  description: string;
  price: number; // VND
}

export const menu: MenuItem[] = [
  { id: 'starter-1', category: 'Starters', title: 'Roasted Beet & Burrata Salad', description: 'Heirloom beets, whipped burrata, toasted hazelnut, aged balsamic', price: 145000 },
  { id: 'starter-2', category: 'Starters', title: 'Charred Octopus', description: 'Smoked paprika aioli, fingerling potato, chili oil', price: 185000 },
  { id: 'starter-3', category: 'Starters', title: 'Wild Mushroom Toast', description: 'Sourdough, whipped ricotta, thyme, brown butter', price: 120000 },
  { id: 'main-1', category: 'Mains', title: 'Herb-Crusted Lamb Rack', description: 'Rosemary jus, roasted root vegetables, potato gratin', price: 385000 },
  { id: 'main-2', category: 'Mains', title: 'Pan-Seared Duck Breast', description: 'Cherry reduction, celeriac puree, charred endive', price: 320000 },
  { id: 'main-3', category: 'Mains', title: 'Slow-Braised Short Rib', description: '18-hour braise, red wine jus, parsnip mash', price: 350000 },
  { id: 'main-4', category: 'Mains', title: 'Charcoal Grilled Sea Bass', description: 'Citrus butter, fennel salad, chili crisp', price: 295000 },
  { id: 'dessert-1', category: 'Desserts', title: 'Dark Chocolate Fondant', description: 'Molten center, salted caramel, vanilla bean ice cream', price: 95000 },
  { id: 'dessert-2', category: 'Desserts', title: 'Burnt Honey Panna Cotta', description: 'Toasted almond, seasonal berries', price: 85000 },
  { id: 'bar-1', category: 'Bar', title: 'House Spiced Old Fashioned', description: 'Bourbon, cardamom syrup, orange bitters', price: 165000 },
  { id: 'bar-2', category: 'Bar', title: 'Smoked Rosemary Lemonade', description: 'Non-alcoholic, fresh lemon, rosemary smoke', price: 65000 },
];
```

No fabricated stats/testimonials anywhere on this page — the menu is the only content block beyond
`Hero`/`Footer` copy, and none of it claims a number that isn't a real menu price.

### 3.3 Reservation seed

`useLocalCollection` is seeded **empty** (master spec's explicit instruction) — nothing to show a
first-time visitor beyond the form itself; the "Your reservations" list only ever shows what the
current visitor has actually submitted in this browser.

```typescript
export const reservationSeed: Reservation[] = [];
```

## 4. Reservation feature — exact field set and data flow

Interactive feature per interactive-demo spec §3.2 row 5: **Reservation form → "Your reservations"
list**, built from `InquiryForm` + `useLocalCollection`.

### 4.1 Stored shape

```typescript
export interface Reservation {
  id: string;
  name: string;
  phone: string;
  partySize: number;
  date: string; // 'YYYY-MM-DD', free-text input, not a native date input
  time: string; // 'HH:MM', free-text input, not a native time input
}
```

Matches the master spec's exact instruction:
`useLocalCollection<{id, name, phone, partySize, date, time}>('restaurant-reservations', [])`.

### 4.2 `InquiryForm` field configuration

`InquiryForm`'s base fields (name/email/phone/message, per plan 30 task 3) are fixed by the kit and
cannot be removed. The extra `fields` prop (kit's `InquiryField[]`, `type` constrained to
`'text' | 'email' | 'tel' | 'number'` — no native `date`/`time` field type exists in the kit as
specified by plan 30) supplies the reservation-specific inputs:

```typescript
const reservationFields: InquiryField[] = [
  { name: 'partySize', label: 'Party size', type: 'number', required: true },
  { name: 'date', label: 'Date (YYYY-MM-DD)', type: 'text', required: true },
  { name: 'time', label: 'Time (HH:MM)', type: 'text', required: true },
];
```

`date`/`time` are plain labelled text inputs with a format hint in the label — not native
`<input type="date">`/`<input type="time">` — because `InquiryForm`'s `InquiryField.type` union
does not include those HTML input types (plan 30 task 3, `InquiryForm.tsx`). Extending the kit's
type union is out of scope for a site plan (kit changes are plan 30's territory, already shipped);
this is a content-level accommodation, not a workaround needing a kit change.

### 4.3 Data flow (submit → list → reload)

1. Visitor fills the form (`name`, `email`, `phone` from the base fields; `partySize`, `date`,
   `time` from the extra fields above; `message` from the fixed trailing textarea, used for
   optional notes and not persisted into `Reservation` — same "form collects more than the stored
   shape needs" pattern the master spec's `Reservation` type already implies by omitting `email`
   and `message` from the stored fields).
2. `page.tsx`'s reservation section owns `const { items, add } = useLocalCollection<Reservation>('restaurant-reservations', reservationSeed)`.
3. `InquiryForm`'s `onSubmit={async (values) => { add({ id: crypto.randomUUID(), name: values.name, phone: values.phone, partySize: Number(values.partySize), date: values.date, time: values.time }); }}` — `email`/`message` from `values` are read by the submit handler (e.g. to no-op or to display a "Sent" confirmation copy) but not passed into `add()`.
4. A "Your reservations" list renders directly below the form from `items`, one row per
   reservation (`name` — `partySize` guests — `date` at `time`), including a small, unobtrusive
   "Reset demo data" control per interactive-demo spec §3.1's hydration contract (calls `reset()`).
5. On reload, `useLocalCollection`'s hydration contract (interactive-demo spec §3.1, plan 30
   task 4) reads the visitor's own `localStorage` under `restaurant-reservations` instead of the
   empty seed — the submitted reservation is still there.

## 5. Hallmark design brief (non-binding starting direction)

Per interactive-demo spec §5, this site gets its own full `hallmark` skill pass (greenfield path) —
the values below are a **starting direction for that session to research and either confirm or
deviate from**, not fixed tokens. Concrete token values are Task 1 of the implementation plan, not
this spec.

- **Industry mood:** an intimate, contemporary bistro — warm, tactile, evening-dining atmosphere;
  should read as a real chef-driven restaurant's site, not a generic "food delivery app" or a
  chain-restaurant corporate template.
- **Starting anchor:** warm anchor hue (terracotta/rose family), serif display face for headings
  paired with a humanist-sans body face (parent spec §5's starting family for this mood cluster,
  taken as a direction to research, not a locked pick).
- **2-3 reference directions to research during the real Hallmark session** (for moodboard/
  direction-setting, not literal cloning):
  1. Independent chef-driven restaurant sites with large, moody food photography and a confident,
     minimal nav (the "one hero image says more than a menu of icons" school).
  2. Editorial/magazine-adjacent restaurant sites that treat the menu itself as a typographic
     centerpiece (large serif menu titles, generous line-height, price set quietly off to the
     side rather than in a bold competing weight).
  3. Warm, low-saturation "golden hour" palettes used by wine-bar/bistro brands — terracotta,
     burnt sienna, deep olive, cream — as a counter-reference to keep the accent hue from reading
     as generic "restaurant red."
- **What the Hallmark pass must decide (not this spec):** the actual `--color-*` token values,
  the exact display/body font pairing (must obey the global 2+1 rule and banned-defaults list —
  no Inter/Roboto-only stack), spacing scale, motion durations/easings, and how the 4 menu
  categories are visually separated within the single-column section flow from §2.

## 6. Non-goals

Unchanged from the parent specs: no real backend, no real payment/booking confirmation email, no
table-availability logic (the form always accepts a submission), no multi-restaurant/location
switcher. Reservation data never leaves the visitor's own browser.
