# Site Spec — E-commerce Extra Variant: Streetwear (`shop-streetwear`)

Date: 2026-09-20
Status: Approved (site #21 of 29 under the interactive-demo templates program)

## 1. Context & Scope

This is a thin, mostly-data/content spec for one of the 29 demo template sites defined by
`2026-09-20-interactive-demo-templates-design.md` (§4.1 — the first of 3 extra e-commerce variants,
§9 execution order — this is plan 51, one of plans 31-59). It does not redefine architecture:
section composition, shared component behavior, the `useLocalCollection` hydration contract, folder
convention, and the build/test gates are all already fixed by that spec and by
`2026-09-20-template-design-system-design.md`. It also does not redefine the cart mechanism itself —
that is identical to the baseline e-commerce site's spec
(`2026-09-20-site-ecommerce-design.md` §4), referenced here rather than repeated, with only the
`storageKey` and catalog changed. This spec states only:

- the exact section composition for this site (same as baseline),
- the seed data shape and sample product rows (streetwear/apparel catalog, this site's own),
- the cart interactive feature's data flow, pointing at the baseline spec for the mechanism and
  stating only what differs (`storageKey`, catalog),
- a Hallmark design brief (mood direction + research pointers, not fixed token values) for the
  high-contrast neutral + bold-accent, condensed-sans direction assigned to this site.

**Slug:** `shop-streetwear` — folder `templates/shop-streetwear/`, `display_order` 21, `category`
`shop-streetwear` (per plan 30 Task 1's authoritative slug table).

**Distinct from the baseline `ecommerce` site and the other 2 extra variants**
(`shop-homegoods`, `shop-electronics` — interactive-demo spec §4.1): this is a niche streetwear/
apparel storefront, not the general/neutral baseline catalog. It shares the baseline's exact
architecture (`Hero` → `PricedItemGrid` → `Footer`, `CartDrawer`/`CartBadge`, `useLocalCollection`)
but must read as a clearly different industry/mood — assigned direction: "High-contrast neutral +
bold accent, condensed-sans" (master spec §4.1) — versus the baseline's "clean/trustworthy general
store" mood and versus `shop-homegoods`'s warm/serif and `shop-electronics`'s cool/grotesque-sans
directions.

## 2. Section composition

Identical to the baseline e-commerce site (`2026-09-20-site-ecommerce-design.md` §2):

```
Hero → PricedItemGrid(products, onSelect → add to cart) → Footer
```

- **`Hero`** — store headline/subhead/CTA (e.g. a drop/collection framing appropriate to streetwear
  retail — "Shop the drop", linking down to the product grid section on the same page).
- **`PricedItemGrid`** — `currency="VND"`, items = the product catalog (§3 below), `ctaLabel="Add to
  cart"`, `onSelect` wired to the cart's `add` mutation (§4). Same kit component, same `onSelect`
  contract as the baseline (plan 30 Task 3, `PricedItemGridProps`) — only this site's catalog/theme
  differ.
- **`Footer`** — standard link set (Shop, About, Shipping & Returns, Contact) + social row on.

Two §3.3 components compose as the cart UI, not as page sections:

- **`CartBadge`** — rendered in the page header/nav, total qty across all cart lines, visible on
  every scroll position.
- **`CartDrawer`** — slide-over panel, closed by default, opened by clicking `CartBadge`; shows cart
  lines, qty controls, subtotal, and a "Checkout" button opening the mock summary screen (same
  mechanism as baseline spec §4.5 — no payment form, "This is a demo — no order was placed").

## 3. Seed data

All seed data lives in `templates/shop-streetwear/data/seed.ts`, statically importable at build
time per parent spec §3.1's render-pattern rule: the product grid renders directly from this seed
file at the page-component level; only the cart's contents go through `useLocalCollection`.

Content authenticity rule (parent spec §5 / interactive-demo spec §5): sample copy is
realistic-but-fictional, no fabricated stats presented as real, no Lorem Ipsum above the fold. This
site uses a fictional streetwear/apparel label, **BLKOUT Studio** (deliberately terse,
condensed-feeling brand name matching the assigned condensed-sans/high-contrast direction), so all
product and brand names below are fictional and must not resemble a real company or product line.

### 3.1 Products (`PricedItemGrid` items)

Streetwear/apparel rows carry size/color as part of the product title (this site's `ProductItem`
shape has no separate variant-selector field — `PricedItemGrid`'s existing kit contract (plan 30
Task 3) takes a flat `title`/`price` per item, so a size/colorway is encoded into a distinct row's
title, consistent with how a simple demo catalog — not a full variant-matrix e-commerce system —
represents attributes; this matches the baseline site's "no new kit capability invented locally"
rule, interactive-demo spec §5).

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
  { id: 'prod-hoodie-blk-m',   title: 'BLKOUT Heavyweight Hoodie — Black, M',         price: 890000 },
  { id: 'prod-hoodie-blk-l',   title: 'BLKOUT Heavyweight Hoodie — Black, L',         price: 890000 },
  { id: 'prod-tee-graphic',    title: 'BLKOUT Boxy Graphic Tee — Off-White',          price: 450000 },
  { id: 'prod-tee-plain',      title: 'BLKOUT Core Tee — Washed Grey',                price: 380000 },
  { id: 'prod-cargo-pants',    title: 'BLKOUT Utility Cargo Pants — Charcoal',        price: 1190000 },
  { id: 'prod-track-jacket',   title: 'BLKOUT Track Jacket — Black/Red Trim',         price: 990000 },
  { id: 'prod-beanie',         title: 'BLKOUT Ribbed Beanie — Black',                 price: 250000 },
  { id: 'prod-crewneck',       title: 'BLKOUT Overdyed Crewneck — Stone',             price: 750000 },
  { id: 'prod-cap',            title: 'BLKOUT 6-Panel Cap — Black/White',             price: 320000 },
  { id: 'prod-shorts',         title: 'BLKOUT Mesh Basketball Shorts — Black',        price: 420000 },
  { id: 'prod-crossbody-bag',  title: 'BLKOUT Nylon Crossbody Bag — Black',           price: 590000 },
  { id: 'prod-socks-pack',     title: 'BLKOUT Crew Socks, 3-Pack — Black/Grey/White', price: 190000 },
];
```

Twelve items — a clean 4-column-friendly count for `PricedItemGrid` at desktop width, matching the
baseline site's evenly-wrapping grid rationale (parent spec §5, master spec §8 criterion #4).

## 4. Interactive feature: cart

Per interactive-demo spec §3.2 row #4, §4.1, and §3.3 (`CartDrawer`/`CartBadge`): real cart —
add/remove/adjust qty, cart badge count, checkout mock summary screen. **The full mechanism (data
shape, add/qty/remove flow, checkout mock, reset affordance) is identical to the baseline
`ecommerce` site's spec** (`2026-09-20-site-ecommerce-design.md` §4.1–§4.5) — not repeated here.
This section states only what differs for `shop-streetwear`.

### 4.1 Data shape

Same `CartLine` shape as the baseline — `template-kit`'s existing `CartLine` (plan 30 Task 5,
`CartDrawer.tsx`), no new fields:

```ts
interface CartLine {
  id: string;
  title: string;
  price: number;
  qty: number;
}
```

**Storage key: `'shop-streetwear-cart'`** — deliberately different from the baseline's
`'ecommerce-cart'` and from the other 2 extra variants' own keys, so each site's cart is isolated in
`localStorage` per `useLocalCollection`'s storageKey-isolation contract (interactive-demo spec §3.1,
plan 30 Task 4's mutation-check M12) — a visitor touring multiple demo sites in the same browser
never sees one site's cart bleed into another's.

### 4.2 Seed value

Empty array, same rationale as the baseline spec §4.2 (a pre-filled cart misrepresents items the
visitor never chose):

```ts
const CART_SEED: CartLine[] = [];
```

### 4.3 Data flow

Identical to the baseline spec's §4.3 (add-to-cart: existing line increments qty instead of
duplicating), §4.4 (qty change/remove/reload persistence/reset), and §4.5 (checkout mock summary:
subtotal + fixed mock shipping fee + total, "This is a demo — no order was placed", cart not
cleared on view). No streetwear-specific business rule is added (e.g. no per-size stock limits) —
this remains a thin content variant, not a bespoke extension, per interactive-demo spec §5's "what
stays shared" rule.

## 5. Hallmark design brief

**Assigned mood family (master spec §4.1, non-binding starting point for the real Hallmark
session):** high-contrast neutral + bold accent, condensed-sans display. Unlike the baseline
`ecommerce` site's open cool-vs-warm call, this site's direction is fixed by the interactive-demo
spec's §4.1 table — the Hallmark session's job is to interpret and execute this direction with real
research and token authoring (spec §5's greenfield process), not to re-litigate the direction
itself.

- **High-contrast neutral base:** a near-black/near-white foundation (not a mid-grey "safe" palette)
  that reads as stark and graphic rather than soft or pastel — the opposite register from the
  baseline `ecommerce` site's approachable general-store warmth.
- **Bold accent:** a single, saturated accent color used sparingly and deliberately (CTA buttons,
  price emphasis, active states) against the high-contrast base — not a rainbow of accent colors,
  and not a muted/desaturated accent that would undercut the "bold" mandate.
- **Condensed-sans display type:** the display/heading font should be a genuinely condensed
  grotesque or industrial sans (not just a regular-width sans set slightly smaller) — this is the
  clearest lever for reading as "streetwear" rather than generic e-commerce, and must clear master
  spec §8 criterion #2 (real type hierarchy, 2+1 font-pairing rule, no banned default stacks like
  Inter/Roboto alone).
- Must clear master spec §8 criterion #10 (distinctiveness) against the baseline `ecommerce` site
  and both sibling extra variants (`shop-homegoods`'s warm/serif, `shop-electronics`'s
  cool/grotesque-sans) — this site should be immediately identifiable as streetwear/apparel and
  never a re-skin of any sibling e-commerce site.

**Reference directions to research during the Hallmark pass** (starting points, not commitments):
1. Contemporary streetwear/skate-brand e-commerce sites and lookbooks — the high-contrast
   black/white-plus-one-accent register, oversized condensed wordmarks, grid layouts that let
   product photography and negative space do the work instead of decorative chrome (useful for
   avoiding the generic Shopify-theme default that would fail criterion #1).
2. Print-era zine and flyer design (photocopier contrast, bold condensed display type, raw/DIY
   layout grids) — a possible source for how the high-contrast/bold-accent direction can feel
   considered and referential rather than a flat "invert the baseline's colors" move.
3. Athletic/technical-wear digital catalogs that use condensed grotesque type systems at scale
   (size charts, spec sheets, tag-style microcopy) — useful for how `PricedItemGrid`'s flat product
   grid and `CartDrawer`'s slide-over panel can carry consistent condensed-sans typographic voice
   throughout, not just in the `Hero` headline.

Actual token values (accent hue, exact condensed-sans/body-font pairing, spacing scale, motion
durations) are the implementation plan's Task 1 output, not this spec's — per master spec §9, this
is intentionally deferred to the real Hallmark session.
