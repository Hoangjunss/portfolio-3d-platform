# Site Spec — Beauty/Salon (`beauty`)

Date: 2026-09-20
Status: Approved (site #17 of 29 under the interactive-demo templates program)

## 1. Context & Scope

This is a thin, mostly-data/content spec for one of the 29 demo template sites defined by
`2026-09-20-interactive-demo-templates-design.md` (§3.2 row #17, §9 execution order — this is plan
47, part of plans 31-59). It does not redefine architecture: section composition, shared component
behavior, the `useLocalCollection` hydration contract, folder convention, and the build/test gates
are all already fixed by that spec and by `2026-09-20-template-design-system-design.md`. This spec
states only:

- the exact section composition for this site (already implied by the parent spec §3 taxonomy row
  #17, restated here for the plan to point at),
- the seed data shape and sample rows,
- the interactive feature's exact data flow,
- a Hallmark design brief (mood direction + research pointers, not fixed token values).

**Slug:** `beauty` — folder `templates/beauty/`, `display_order` 17, `category` `beauty` (per plan
30 Task 1's authoritative slug table).

## 2. Section composition

Per parent spec §3's taxonomy row #17 ("Treatment/services grid + price list + booking form"):

```
Hero → PricedItemGrid(treatments/services) → InquiryForm(booking) → Footer
```

- **`Hero`** — salon headline/subhead/CTA (e.g. "Book your visit"), linking down to the booking
  form section, not to an external page.
- **`PricedItemGrid`** — `currency="VND"`, items = the salon's treatments/services with a price
  each; `ctaLabel` is omitted (`onSelect` not wired) since this is a static price list, not a cart
  — booking happens through the separate `InquiryForm` section below, per parent spec §4's
  behavioral contract (`PricedItemGrid`'s `onSelect` is optional and this category doesn't need it).
- **`InquiryForm`** — the booking form (§4 below); base fields (name/email/phone/message) plus
  three extra fields (preferred treatment, preferred date, preferred time) via its `fields` prop.
- **`Footer`** — standard link set (About, Treatments, Booking, Contact) + social row on.

No other `template-kit` component is composed on this page. The booking form is its own
client-side section (owns `useLocalCollection`), placed directly below `PricedItemGrid` and above
`Footer` — a visitor browses the price list first, then books, matching how a real salon site is
read top to bottom. This placement is a content/layout decision this spec fixes; component
behavior is unchanged from the kit.

## 3. Seed data

All seed data lives in `templates/beauty/data/seed.ts`, statically importable at build time per
parent spec §3.1's render-pattern rule: static content (the treatment/price list) renders directly
from imported seed data, never gated behind `useLocalCollection`'s hydration. Only the booking
form's own submissions ("Your bookings") are `useLocalCollection`-backed.

Content authenticity rule (parent spec §5 / interactive-demo spec §5, both restate the same rule):
sample copy is realistic-but-fictional, no fabricated stats presented as real, no Lorem Ipsum
above the fold. This site uses a fictional Vietnamese beauty salon/spa, **Mộc Lan Spa & Beauty
Lounge**, so all names below are fictional and must not resemble a real business.

### 3.1 Treatments/services (`PricedItemGrid` items)

```ts
interface TreatmentItem {
  id: string;
  title: string;
  price: number; // VND
  image?: string; // omitted in seed data — PricedItemGrid renders without an image per its existing contract
}

const TREATMENTS: TreatmentItem[] = [
  { id: 'tr-facial-classic', title: 'Chăm sóc da mặt cơ bản (Classic Facial)', price: 350000 },
  { id: 'tr-facial-hydra', title: 'Hydra Facial chuyên sâu', price: 890000 },
  { id: 'tr-facial-acne', title: 'Điều trị mụn & phục hồi da', price: 650000 },
  { id: 'tr-massage-swedish', title: 'Massage toàn thân thư giãn (60 phút)', price: 500000 },
  { id: 'tr-massage-hotstone', title: 'Massage đá nóng (Hot Stone, 90 phút)', price: 780000 },
  { id: 'tr-manicure', title: 'Chăm sóc móng tay (Manicure)', price: 180000 },
  { id: 'tr-pedicure', title: 'Chăm sóc móng chân (Pedicure)', price: 220000 },
  { id: 'tr-hair-cut-style', title: 'Cắt & tạo kiểu tóc', price: 250000 },
  { id: 'tr-hair-color', title: 'Nhuộm tóc toàn phần', price: 950000 },
  { id: 'tr-eyebrow', title: 'Phun mày điêu khắc (Ombré Brows)', price: 1200000 },
  { id: 'tr-waxing', title: 'Tẩy lông toàn thân (Full Body Waxing)', price: 420000 },
  { id: 'tr-package-bridal', title: 'Gói chăm sóc cô dâu (Bridal Package)', price: 2500000 },
];
```

Twelve items — inside `PricedItemGrid`'s default flow layout this is a real, uneven price list
(not a clean 3x4 grid of identical categories), a deliberate choice so the Hallmark pass (Task 1
of the plan) has real hierarchy to design for (facials, massage, nails, hair, and one premium
bridal package spanning a very different price point).

## 4. Interactive feature: "Book your visit" → "Your bookings"

Per interactive-demo spec §3.2 row #17: a booking form whose submissions accumulate in a small
"Your bookings" panel, visible to the same visitor on return (same browser, same `localStorage`).

### 4.1 Data shape

```ts
interface BeautyBooking {
  id: string;            // generated client-side (crypto.randomUUID()) at submit time
  name: string;
  phone: string;
  treatment: string;     // the chosen treatment's title (free text, matches InquiryForm's field contract)
  preferredDate: string; // combined "DD/MM/YYYY HH:mm" — see §4.3 for why date+time are merged
}
```

Storage key: `'beauty-bookings'` (matches interactive-demo spec §3.2 row #17's storageKey intent).

### 4.2 Seed value

The hook seeds with an **empty array**, not fictional pre-filled bookings — a "Your bookings"
panel pre-populated with fake bookings the visitor never made would misrepresent the panel as
already containing the visitor's own history. First-time visitors see the panel's empty state; the
panel only ever shows bookings that visitor actually submitted.

```ts
const BOOKING_SEED: BeautyBooking[] = [];
```

### 4.3 Data flow

1. Client component mounts `useLocalCollection<BeautyBooking>('beauty-bookings', BOOKING_SEED)`.
2. `InquiryForm` (kit component) is rendered with three extra fields via its `fields` prop, in
   addition to its own base name/email/phone/message fields:
   ```ts
   const BOOKING_FIELDS: InquiryField[] = [
     { name: 'treatment', label: 'Preferred treatment', type: 'text', required: true },
     { name: 'preferredDate', label: 'Preferred date', type: 'text', required: true },
     { name: 'preferredTime', label: 'Preferred time', type: 'text', required: true },
   ];
   ```
   `type: 'text'` is used for the date/time fields because `InquiryForm`'s `InquiryField.type`
   union (`'text' | 'email' | 'tel' | 'number'`, fixed by `template-kit`, plan 30 Task 3) has no
   `'date'`/`'time'` variant — a free-text field with a placeholder like `DD/MM/YYYY` /
   `HH:mm` is the correct fit within the existing kit contract, not a reason to add a new
   component or field type for this one site.
3. `onSubmit` handler:
   - reads `values.name`, `values.phone`, `values.treatment`, `values.preferredDate`,
     `values.preferredTime` from the form's submitted values,
   - **merges `preferredDate` + `preferredTime` into one `preferredDate` string** (e.g.
     `"12/10/2026 14:30"`) before storing — the booking hook's persisted shape (per the master
     spec's row #17: `{id, name, phone, treatment, preferredDate}`) has no separate time field, so
     the two form inputs the visitor filled are combined at submit time rather than the hook shape
     being widened to carry a field the master spec didn't ask for,
   - builds a `BeautyBooking` (`id: crypto.randomUUID()`),
   - calls the hook's `add(booking)`,
   - relies on `InquiryForm`'s own existing pending/success state (kit behavior, unchanged) to show
     confirmation. (`email` and `message` are collected by the form per its fixed base-field
     contract but are not part of the persisted `BeautyBooking` shape — same
     collect-more-than-you-persist pattern already used by other sites in this program where the
     kit's fixed base fields exceed what a given site's own record needs.)
4. **Panel: a simple ordered list, not `SavedItemsPanel`** — same rationale as every other
   form-driven site in this program (see e.g. `2026-09-20-site-corporate-design.md` §4.3):
   `SavedItemsPanel` is for "visitor marked/saved an existing catalog item" (favorite a listing,
   shortlist a portfolio piece); a booking is a new record the visitor authored via a form, with no
   pre-existing catalog entry to remove it from. This site renders `items` from the hook directly
   as a small ordered list (treatment + name + the merged preferred date/time, most recent first)
   inside its own section — no new kit component, no misuse of `SavedItemsPanel`'s
   remove-from-catalog semantics.
5. Reload persistence: per the hook's hydration contract (interactive-demo spec §3.1), a page
   reload reads the same `localStorage` key and the "Your bookings" list shows every booking the
   visitor has submitted in this browser, in order.
6. "Reset demo data" affordance (per hook contract, interactive-demo spec §3.1's `reset()` rule):
   small, non-prominent control near the panel that calls `reset()`, returning the list to empty.

## 5. Hallmark design brief

**Industry mood:** warm, calming, and a little indulgent — a beauty salon/spa buyer wants their
demo site to feel inviting and premium without tipping into cold clinical (that register belongs
to `medical`, not `beauty`) or loud/trendy streetwear energy. Parent spec §5's starting-family
suggestion for this category is a warm anchor hue (terracotta/rose) with a serif display — this is
a **non-binding starting direction only**; the real Hallmark session (Task 1 of the implementation
plan) may deviate from it if research supports a different direction, as long as it clears the
design-scoring gate (master spec §8), particularly criterion #10 (distinctiveness against the
other 28 sites — `restaurant`, `wedding`, and `photography` also start from the warm-hue/serif
family per parent spec §5, so `beauty` must not read as a re-skin of any of them).

**Reference directions to research during the Hallmark pass** (starting points, not commitments):
1. Contemporary independent spa/wellness studio branding (the "quiet luxury" register: soft
   neutrals, restrained texture, generous whitespace) — useful for what to emulate selectively, not
   to copy wholesale (would read as generic/template-y, failing criterion #1).
2. Vietnamese/Southeast Asian beauty and wellness brand identities — for a locally-grounded
   typographic and color voice that avoids the generic pastel-and-cursive-script look most Western
   beauty-brand templates default to.
3. Editorial beauty/lifestyle print design (soft-serif headlines, considered price-list
   typesetting) — a possible source for how to make the 12-item, uneven-price treatment list (§3.1)
   read as a considered menu rather than a default e-commerce grid.

Actual token values (accent hue, type pairing, spacing scale, motion durations) are Task 1's
output, not this spec's — per master spec §9, this is intentionally deferred to the real Hallmark
session.
