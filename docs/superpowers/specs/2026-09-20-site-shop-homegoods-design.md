# Site Spec — E-commerce Extra Variant: Home Goods/Furniture (`shop-homegoods`)

Date: 2026-09-20
Status: Approved (site #22 of 29 under the interactive-demo templates program)

## 1. Context & Scope

This is a thin, mostly-data/content spec for one of the 29 demo template sites defined by
`2026-09-20-interactive-demo-templates-design.md` (§4.1 — one of the 3 extra e-commerce variants,
§9 execution order — this is plan 52, one of plans 31-59). It does not redefine architecture:
section composition, shared component behavior, the `useLocalCollection` hydration contract, folder
convention, and the build/test gates are all already fixed by that spec and by
`2026-09-20-template-design-system-design.md`. The cart mechanism itself (add/remove/adjust qty,
`CartBadge`/`CartDrawer`, mock checkout summary) is identical to the baseline e-commerce site's —
see `2026-09-20-site-ecommerce-design.md` §4 for the full data-flow description; this spec restates
only what differs for this site (storage key, catalog, theme) and does not duplicate the mechanism
narrative beyond what's needed to state this site's own data shape.

This spec states only:

- the exact section composition for this site (identical to the baseline),
- the seed data shape and sample product rows (home goods/furniture catalog),
- the cart interactive feature's data shape, restricted to what differs from the baseline (storage
  key),
- a Hallmark design brief (warm/serif mood direction + research pointers, not fixed token values).

**Slug:** `shop-homegoods` — folder `templates/shop-homegoods/`, `display_order` 22, `category`
`shop-homegoods` (per plan 30 Task 1's authoritative slug table).

**Distinct from the baseline `ecommerce` site and from `shop-streetwear`:** this is a niche-vertical
variant (home goods/furniture), not the general/neutral baseline catalog (`ecommerce`) and not the
high-contrast/condensed streetwear variant (`shop-streetwear`). Per interactive-demo spec §4.1, this
site's assigned starting mood direction is "warm anchor hue, serif display" — the opposite register
from `shop-streetwear`'s "high-contrast neutral + bold accent, condensed-sans" and clearly warmer/
more editorial than `ecommerce`'s own open (session-decided) neutral retail mood.

## 2. Section composition

Per parent spec §4's worked example for the e-commerce category, amended by the interactive-demo
spec (§3.2 row #4 / §4.1 — real cart instead of a static no-op), identical structure to the
baseline `ecommerce` site:

```
Hero → PricedItemGrid(products, onSelect → add to cart) → Footer
```

- **`Hero`** — store headline/subhead/CTA (e.g. "Furnish your home", linking down to the product
  grid section on the same page, not to an external page). Copy and tone reflect this site's
  fictional home-goods/furniture brand (§3 below), not the baseline's general-retail brand.
- **`PricedItemGrid`** — `currency="VND"`, items = the product catalog (§3 below), `ctaLabel="Add to
  cart"`, `onSelect` wired to the cart's `add`/`update` mutation (same logic as baseline spec §4.3,
  restated in §4.1 below only for the storage-key difference) — the kit component itself is
  unchanged; only this site's wiring and catalog are real/site-specific.
- **`Footer`** — standard link set (Shop, About, Shipping & Returns, Contact) + social row on.

No other `template-kit` 9-original component is composed on this page. Two §3.3 components are
composed as the cart UI, not as page sections in the Hero/Grid/Footer sense:

- **`CartBadge`** — rendered in the page header/nav (a small persistent element showing total qty
  across all cart lines), visible on every scroll position, not just at the top.
- **`CartDrawer`** — a slide-over panel, closed by default, opened by clicking `CartBadge`; shows
  cart lines, qty controls, subtotal, and a "Checkout" button that opens the mock summary screen
  (same mock-checkout behavior as the baseline site's spec §4.5 — no payment form, "This is a demo —
  no order was placed" notice, cart not cleared).

## 3. Seed data

All seed data lives in `templates/shop-homegoods/data/seed.ts` — must be statically importable at
build time per parent spec §3.1's render-pattern rule: static content renders directly from imported
seed data, never gated behind `useLocalCollection`'s hydration. The product grid itself (names,
prices) is **static content** rendered directly from this seed file at the page-component level;
only the cart's contents go through `useLocalCollection`.

Content authenticity rule (parent spec §5 / interactive-demo spec §5, both restate the same rule):
sample copy is realistic-but-fictional, no fabricated stats presented as real, no Lorem Ipsum above
the fold. This site uses a fictional Vietnamese home-goods/furniture brand, **Mộc Nhà** ("Mộc" =
wood/timber, "Nhà" = home — a warm, materials-forward name evoking solid wood furniture and natural
textures, fitting the warm-anchor-hue/serif-display direction), so all product and brand names below
are fictional and must not resemble a real company or product line.

### 3.1 Products (`PricedItemGrid` items)

```ts
interface ProductItem {
  id: string;
  title: string;
  price: number;   // VND, integer, no decimals
  image?: string;  // omitted in seed data — PricedItemGrid renders without an image per its
                    // existing contract (plan 30 Task 3); a real product photo is an admin/implementer
                    // action out of scope here, same convention as `thumbnail.webp`
}

const PRODUCTS: ProductItem[] = [
  { id: 'prod-oak-dining-table',  title: 'Solid Oak Dining Table, 6-Seat',            price: 8990000 },
  { id: 'prod-rattan-chair',      title: 'Handwoven Rattan Accent Chair',              price: 2490000 },
  { id: 'prod-linen-sofa',        title: '3-Seat Sofa, Natural Linen Slipcover',       price: 12490000 },
  { id: 'prod-walnut-shelf',      title: 'Walnut Veneer Ladder Bookshelf',             price: 3290000 },
  { id: 'prod-ceramic-lamp',      title: 'Hand-Thrown Ceramic Table Lamp, Terracotta', price: 890000 },
  { id: 'prod-wool-rug',          title: 'Hand-Knotted Wool Area Rug, 160x230cm',      price: 4590000 },
  { id: 'prod-teak-console',      title: 'Reclaimed Teak Console Table',               price: 5990000 },
  { id: 'prod-linen-bedding',     title: 'Stonewashed Linen Bedding Set, Queen',       price: 1690000 },
  { id: 'prod-woven-pendant',     title: 'Woven Rattan Pendant Light Shade',           price: 749000 },
  { id: 'prod-ash-side-table',    title: 'Solid Ash Round Side Table',                 price: 1590000 },
  { id: 'prod-clay-vase-set',     title: 'Unglazed Clay Vase Set, 3-Piece',            price: 590000 },
  { id: 'prod-wool-throw',        title: 'Chunky Wool-Blend Throw Blanket',            price: 890000 },
];
```

Twelve items — matches the baseline site's grid density and the `PricedItemGrid` 4-column desktop
layout, giving the Hallmark pass (Task 1 of the plan) a full, evenly-wrapping grid to design
spacing/rhythm for (parent spec §5, master spec §8 criterion #4). Prices span a wider range than the
baseline (small accessories through large case-goods furniture) which is expected and realistic for
a home-goods/furniture catalog — `PricedItemGrid`'s existing `Intl.NumberFormat('vi-VN', ...)`
formatting (plan 30 Task 3) already handles any magnitude.

## 4. Interactive feature: cart

Identical mechanism to the baseline `ecommerce` site's cart (`2026-09-20-site-ecommerce-design.md`
§4) — add/remove/adjust qty, cart badge count, checkout mock summary screen, no real payment, per
interactive-demo spec §3.2 row #4/§4.1 and the non-goal in interactive-demo spec §1 ("no template
gets a real backend"). This section states only the one thing that differs from the baseline: the
storage key (so each site's cart data is isolated in `localStorage`, per interactive-demo spec §3.1's
storageKey-isolation contract).

### 4.1 Data shape

```ts
interface CartLine {
  id: string;     // equals the product's ProductItem.id — a product already in the cart is
                   // re-added by increasing qty, not by creating a duplicate line
  title: string;
  price: number;   // VND, copied from the product at add-time
  qty: number;
}
```

This is exactly `template-kit`'s existing `CartLine` shape (plan 30 Task 5, `CartDrawer.tsx`) — no
new fields, no site-specific extension, matching the baseline site spec's own restatement of this
rule.

**Storage key: `'shop-homegoods-cart'`** — deliberately different from the baseline's
`'ecommerce-cart'` and from the other two extra e-commerce variants' own keys (`shop-streetwear`,
`shop-electronics`), so a visitor's cart on this site never collides with or leaks into another
site's cart, per interactive-demo spec §3.1's isolation contract (verified generically by
`template-kit`'s own `useLocalCollection.test.tsx`, "two hooks with different storageKeys never
share data" — no per-site test of that isolation property is needed here).

### 4.2 Seed value

The hook seeds with an **empty array** — a cart starts empty for every visitor, first-time or
returning-with-cleared-storage, same reasoning as the baseline site spec §4.2.

```ts
const CART_SEED: CartLine[] = [];
```

### 4.3 Data flow — add to cart, qty change, remove, checkout

Identical to the baseline site spec's §4.3 (add-to-cart existing-line qty-increment logic), §4.4
(qty change/remove wired directly to the hook's `update`/`remove`), and §4.5 (mock checkout summary
screen: line items, subtotal, a flat mock shipping fee presented as this fictional storefront's own
content — e.g. a value appropriate to furniture-scale shipping rather than the baseline's small-goods
figure, an implementer choice at Task 3 — a total, "This is a demo — no order was placed" notice,
"Continue shopping" action, cart not cleared). No behavior in this section is bespoke to
`shop-homegoods`; only the storage key (§4.1) and the catalog (§3.1) differ from the baseline.

## 5. Hallmark design brief

**Industry mood:** home goods/furniture — a warm, materials-forward register (solid wood, linen,
rattan, ceramic, wool) that should read as considered and tactile, closer to an independent
design-forward furniture studio than a mass-market big-box furniture retailer. Per interactive-demo
spec §4.1, this site's assigned starting direction is **warm anchor hue, serif display** — a
**non-binding starting point for the real Hallmark session**, not a fixed token commitment; the
session's research should confirm or refine the specific warm hue family and serif pairing, not
invent an unrelated direction. The result must clearly differentiate this site from:

- the baseline `ecommerce` site's own neutral/general-retail mood (which is an open cool-or-warm
  call decided independently in that site's own session — `shop-homegoods` must not read as a
  diluted or niche-flavored copy of whatever `ecommerce` lands on), and
- `shop-streetwear`'s high-contrast neutral + bold accent, condensed-sans mood (the opposite
  register entirely — `shop-homegoods` should never be mistaken for a re-skin of that site).

Must clear the design-scoring gate (master spec §8), particularly criterion #10 (distinctiveness
against the other 28 sites, including the other two extra e-commerce variants).

**Reference directions to research during the Hallmark pass** (starting points, not commitments):
1. Independent design-forward furniture and homeware studios' digital storefronts (the "considered
   materials-first" register: warm neutral/terracotta/clay-adjacent palettes, generous whitespace
   that lets natural-material product photography breathe, serif display type used sparingly for
   headlines against a quieter body face) — useful for what separates a genuinely warm, editorial
   furniture brand from a generic "warm beige SaaS template" look (would fail criterion #1).
2. Scandinavian and Japanese-influenced ("Japandi") furniture retail branding — a plausible register
   for restrained warmth without tipping into rustic/farmhouse cliché, and for how to keep a serif
   display face feeling contemporary rather than dated.
3. Editorial home/interiors magazine layouts (print or digital) — a source for how the flat 4x3
   product grid (§3.1) can read as a considered lookbook spread of a home rather than a default
   card-grid, and for how `CartDrawer`'s slide-over panel can carry the same warm/serif visual
   language instead of reading as an unstyled off-the-shelf drawer component.

Actual token values (accent hue, type pairing, spacing scale, motion durations) are this site's own
plan Task 1 output, not this spec's — per master spec §9, intentionally deferred to the real
Hallmark session.
