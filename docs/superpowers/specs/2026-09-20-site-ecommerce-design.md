# Site Spec — E-commerce Baseline (`ecommerce`)

Date: 2026-09-20
Status: Approved (site #4 of 29 under the interactive-demo templates program)

## 1. Context & Scope

This is a thin, mostly-data/content spec for one of the 29 demo template sites defined by
`2026-09-20-interactive-demo-templates-design.md` (§3.2 row #4 — the BASELINE e-commerce category,
§9 execution order — this is plan 34, one of plans 31-59). It does not redefine architecture:
section composition, shared component behavior, the `useLocalCollection` hydration contract, folder
convention, and the build/test gates are all already fixed by that spec and by
`2026-09-20-template-design-system-design.md`. This spec states only:

- the exact section composition for this site,
- the seed data shape and sample product rows,
- the cart interactive feature's exact data flow,
- a Hallmark design brief (mood direction + research pointers, not fixed token values).

**Slug:** `ecommerce` — folder `templates/ecommerce/`, `display_order` 4, `category` `ecommerce`
(per plan 30 Task 1's authoritative slug table).

**Distinct from the 3 extra e-commerce variants** (`shop-streetwear`, `shop-homegoods`,
`shop-electronics` — interactive-demo spec §4.1): this is the general/neutral BASELINE retail
catalog, not a niche vertical. Those 3 variants are separate later plans and reuse this same
architecture with different catalogs/themes; nothing in this spec is written for them.

## 2. Section composition

Per parent spec §4's own worked example for this category, amended by the interactive-demo spec
(§3.2 row #4 — real cart instead of a static no-op):

```
Hero → PricedItemGrid(products, onSelect → add to cart) → Footer
```

- **`Hero`** — store headline/subhead/CTA (e.g. "Shop the collection", linking down to the product
  grid section on the same page, not to an external page).
- **`PricedItemGrid`** — `currency="VND"`, items = the product catalog (§3 below), `ctaLabel="Add to
  cart"`, `onSelect` wired to the cart's `add` mutation (§4.3) — this replaces the parent spec's
  original static no-op "Add to cart" button described in `2026-09-20-template-design-system-design.md`
  §4's worked example; the kit component itself is unchanged (its `onSelect` prop already exists per
  plan 30 Task 3's `PricedItemGridProps`), only this site's wiring is real.
- **`Footer`** — standard link set (Shop, About, Shipping & Returns, Contact) + social row on.

No other `template-kit` 9-original component is composed on this page. Two §3.3 components are
composed as the cart UI, not as page sections in the Hero/Grid/Footer sense:

- **`CartBadge`** — rendered in the page header/nav (a small persistent element showing total qty
  across all cart lines), visible on every scroll position, not just at the top.
- **`CartDrawer`** — a slide-over panel, closed by default, opened by clicking `CartBadge`; shows
  cart lines, qty controls, subtotal, and a "Checkout" button that opens the mock summary screen
  (§4.5).

## 3. Seed data

All seed data lives in `templates/ecommerce/data/seed.ts` (or `.json`, implementer's call — must be
statically importable at build time per parent spec §3.1's render-pattern rule: static content
renders directly from imported seed data, never gated behind `useLocalCollection`'s hydration). The
product grid itself (names, prices, descriptions) is **static content** rendered directly from this
seed file at the page-component level; only the cart's contents (§4) go through
`useLocalCollection`.

Content authenticity rule (parent spec §5 / interactive-demo spec §5, both restate the same rule):
sample copy is realistic-but-fictional, no fabricated stats presented as real, no Lorem Ipsum above
the fold. This site uses a fictional Vietnamese general-retail storefront, **Cội Nguồn Mart**
("Cội Nguồn" = "roots/origin" — a neutral, trustworthy, general-retail name, deliberately not tied
to any single niche so it reads as the baseline category, not a specialty shop), so all product and
brand names below are fictional and must not resemble a real company or product line.

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
  { id: 'prod-tumbler',      title: 'Cội Nguồn Steel Tumbler 500ml',        price: 189000 },
  { id: 'prod-tote',         title: 'Canvas Market Tote — Natural',          price: 129000 },
  { id: 'prod-candle',       title: 'Sandalwood & Cedar Soy Candle',         price: 249000 },
  { id: 'prod-notebook',     title: 'Dotted A5 Notebook, Linen Cover',       price: 99000 },
  { id: 'prod-mug',          title: 'Stoneware Mug, Sand Glaze',             price: 159000 },
  { id: 'prod-throw',        title: 'Cotton Waffle-Knit Throw Blanket',      price: 459000 },
  { id: 'prod-diffuser',     title: 'Ceramic Reed Diffuser Set',             price: 329000 },
  { id: 'prod-cutting-board',title: 'Acacia Wood Cutting Board, Large',      price: 279000 },
  { id: 'prod-teaset',       title: '4-Piece Porcelain Tea Cup Set',         price: 399000 },
  { id: 'prod-basket',       title: 'Woven Seagrass Storage Basket',         price: 219000 },
  { id: 'prod-soap',         title: 'Coconut Milk Bar Soap, 3-Pack',         price: 89000 },
  { id: 'prod-umbrella',     title: 'Compact Windproof Umbrella, Charcoal',  price: 169000 },
];
```

Twelve items — a clean 4-column-friendly count for `PricedItemGrid` at desktop width, giving the
Hallmark pass (Task 1 of the plan) a full, evenly-wrapping grid to design spacing/rhythm for (parent
spec §5, master spec §8 criterion #4).

## 4. Interactive feature: cart

Per interactive-demo spec §3.2 row #4 and §3.3 (`CartDrawer`/`CartBadge`): add/remove/adjust qty,
cart badge count, checkout mock summary screen — no real payment, per interactive-demo spec §3.3's
`CartDrawer` purpose ("mock checkout summary") and the non-goal in interactive-demo spec §1 ("no
template gets a real backend").

### 4.1 Data shape

```ts
interface CartLine {
  id: string;     // equals the product's ProductItem.id — a product already in the cart is
                   // re-added by increasing qty, not by creating a duplicate line (§4.3)
  title: string;
  price: number;   // VND, copied from the product at add-time (a real store might reprice; this
                    // demo has no backend to reprice from, so the add-time price is authoritative
                    // for the life of the cart, matching CartDrawer's existing kit contract)
  qty: number;
}
```

This is exactly `template-kit`'s existing `CartLine` shape (plan 30 Task 5, `CartDrawer.tsx`) — no
new fields, no site-specific extension.

Storage key: `'ecommerce-cart'` (matches the master spec's exact key from the "Interactive feature"
section of this task's brief).

### 4.2 Seed value

The hook seeds with an **empty array** — a cart starts empty for every visitor, first-time or
returning-with-cleared-storage. A pre-filled cart would misrepresent items the visitor never chose
as already selected, which is misleading UX, the same reasoning the `corporate` site spec (§4.2)
applies to its own empty-seed panel.

```ts
const CART_SEED: CartLine[] = [];
```

### 4.3 Data flow — add to cart

1. Client component mounts `useLocalCollection<CartLine>('ecommerce-cart', CART_SEED)`.
2. `PricedItemGrid`'s `onSelect(item: PricedItem)` fires when a visitor clicks "Add to cart" on a
   product card.
3. The site's handler checks the hook's current `items` for an existing line with
   `id === item.id`:
   - **Not present:** calls `add({ id: item.id, title: item.title, price: item.price, qty: 1 })`.
   - **Already present:** calls `update(item.id, { qty: existingLine.qty + 1 })` — clicking "Add to
     cart" again on a product already in the cart increases its quantity rather than creating a
     second line for the same product, which is the behavior a real shopper expects and is what
     keeps `CartBadge`'s "total qty across lines" (plan 30 Task 5) meaningful as a running count
     rather than a line-count.
4. `CartBadge`'s displayed total updates immediately (same render pass — no reload needed) because
   it reads the same hook's `items`.

### 4.4 Data flow — qty change and remove

1. Opening `CartDrawer` (via clicking `CartBadge`) renders the hook's current `items` as cart lines.
2. **Qty change:** `CartDrawer`'s per-line quantity input (kit behavior, plan 30 Task 5) fires
   `onQtyChange(id, qty)`, wired directly to the hook's `update(id, { qty })`. No minimum-qty
   business rule beyond `CartDrawer`'s existing `min={1}` input constraint (kit behavior, unchanged)
   — a visitor wanting qty 0 uses Remove instead, matching common cart UX and avoiding a redundant
   "qty 0 auto-removes" special case this spec does not need to invent.
3. **Remove:** `CartDrawer`'s per-line Remove button (kit behavior) fires `onRemove(id)`, wired
   directly to the hook's `remove(id)`.
4. Every mutation writes through to `localStorage` synchronously per the hook's contract
   (interactive-demo spec §3.1) — `CartBadge`'s count and `CartDrawer`'s line list are always in
   sync with each other and with what a page reload will show.
5. **Reload persistence:** reloading the page (or returning later, same browser) reads the same
   `localStorage` key; cart lines and quantities are exactly as the visitor left them, per the
   hook's hydration contract (interactive-demo spec §3.1, item 2).
6. "Reset demo data" affordance (per hook contract, interactive-demo spec §3.1's `reset()` rule): a
   small, non-prominent control inside `CartDrawer`'s own panel (e.g. below the line list) that
   calls `reset()`, emptying the cart back to `CART_SEED` (i.e. empty).

### 4.5 Checkout mock summary screen

Clicking `CartDrawer`'s "Checkout" button (kit behavior, `onCheckout` callback, plan 30 Task 5)
does **not** call any API and does **not** clear the cart — per interactive-demo spec §1's
no-backend non-goal and master spec §3.3's "mock checkout summary" framing, this is a read-only
confirmation-style screen demonstrating the interactive feature end-to-end, not a functioning
purchase flow.

- The site's `onCheckout` handler navigates to (or opens, implementer's choice of an in-page state
  toggle vs. a route) a **checkout summary screen** showing:
  - every current cart line (title, qty, unit price, line total),
  - the subtotal (sum of line totals — same figure `CartDrawer` already computes and displays, kit
    behavior),
  - a flat, clearly-labeled **mock shipping fee** (a fixed demo value, e.g. 30,000 VND — must be
    presented as part of this fictional storefront's own content, not a fabricated real-world
    shipping-rate claim; the "content authenticity" rule (§5, parent spec §5) concerns real-world
    facts/stats, not a demo site's own fictional pricing content),
  - a total (subtotal + shipping fee),
  - **no payment form of any kind** — no card fields, no "Pay now" button that pretends to charge
    anything; the screen ends with a static "This is a demo — no order was placed" notice and a
    single action to return to shopping (e.g. "Continue shopping", closing the summary and leaving
    the cart untouched).
- The cart is **not** cleared by viewing this screen — a visitor can reload or return to `CartDrawer`
  and see the same lines, consistent with §4.4 item 5's persistence guarantee; nothing in this
  demo's scope invents an "order placed, cart emptied" side effect that would require state this
  spec has no backend to reconcile against.

## 5. Hallmark design brief

**Industry mood:** general/neutral retail — a broad-appeal storefront (home goods, small
accessories, everyday items), not a specific niche like streetwear, electronics, or furniture (those
are the 3 extra variants' job, interactive-demo spec §4.1). The design should read as approachable,
clean, and trustworthy to a wide range of shoppers — closer to a well-run independent general store
than a hyper-specialized boutique. Parent spec §5's starting-family suggestion for e-commerce
generally doesn't name one specific cluster (the category sits across multiple mood families
depending on niche); for this baseline, a **cool or warm anchor hue is an open call for the real
Hallmark session** — this is a **non-binding starting direction only**, not a fixed pick. The
session should choose based on what reads as genuinely neutral/general-retail rather than defaulting
to either extreme, and must clear the design-scoring gate (master spec §8), particularly criterion
#10 (distinctiveness against the other 28 sites, including the 3 extra e-commerce variants that
*do* commit to specific hue families per interactive-demo spec §4.1 — `ecommerce` must not read as
a diluted version of any of them, nor as a re-skin of unrelated cool-hue sites like `corporate` or
`saas`).

**Reference directions to research during the Hallmark pass** (starting points, not commitments):
1. Independent general-goods/lifestyle retailers' digital storefronts (the "curated general store"
   register: warm-neutral base palettes, product photography as the visual anchor, restrained UI
   chrome that doesn't compete with the products) — useful for what makes a baseline retail site
   feel considered rather than a generic Shopify-theme default (would fail criterion #1).
2. Southeast Asian / Vietnamese contemporary retail branding — for a locally-grounded visual voice
   distinct from the generic "Western DTC brand" look most baseline e-commerce demos default to.
3. Editorial product-catalog layouts (print or digital lookbooks) — a possible source for how to
   make the flat 4x3 product grid (§3.1) feel like a considered catalog spread rather than a default
   card-grid, and for how `CartDrawer`'s slide-over panel can carry the same visual language instead
   of reading as an unstyled off-the-shelf drawer component.

Actual token values (accent hue, type pairing, spacing scale, motion durations) are Task 1's output,
not this spec's — per master spec §9, this is intentionally deferred to the real Hallmark session.
