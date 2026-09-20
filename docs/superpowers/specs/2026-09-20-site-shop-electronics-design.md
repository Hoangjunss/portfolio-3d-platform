# Site Spec — E-commerce Extra Variant: Consumer Electronics (`shop-electronics`)

Date: 2026-09-20
Status: Approved (site #23 of 29 under the interactive-demo templates program)

## 1. Context & Scope

This is a thin, mostly-data/content spec for one of the 29 demo template sites defined by
`2026-09-20-interactive-demo-templates-design.md` (§4.1 — one of the 3 extra e-commerce variants,
§9 execution order — this is plan 53, one of plans 31-59). It does not redefine architecture:
section composition, shared component behavior, the `useLocalCollection` hydration contract, folder
convention, and the build/test gates are all already fixed by that spec and by
`2026-09-20-template-design-system-design.md`. The cart mechanism itself (add/remove/adjust qty,
`CartBadge`/`CartDrawer`, mock checkout) is identical to the BASELINE e-commerce site's own spec
(`2026-09-20-site-ecommerce-design.md` §4) — this spec does not re-derive that mechanism, only
restates the parts that differ for this site: its own catalog, its own theme, and its own
`storageKey`. See that spec's §4 for the full data-flow narrative this site reuses verbatim.

**Slug:** `shop-electronics` — folder `templates/shop-electronics/`, `display_order` 23, `category`
`shop-electronics` (per plan 30 Task 1's authoritative slug table).

**Distinct from the BASELINE `ecommerce` site and the other 2 extra variants**
(`shop-streetwear`, `shop-homegoods` — interactive-demo spec §4.1): this is a consumer-electronics
specialty storefront, with its own cool-hue/grotesque-sans design direction (§5 below) — visually
and topically distinct from `ecommerce`'s neutral general-retail baseline, `shop-streetwear`'s
high-contrast/bold/condensed apparel look, and `shop-homegoods`'s warm/serif furniture look.

## 2. Section composition

Same composition as the baseline e-commerce site (interactive-demo spec §4.1: "same
`CartDrawer`/`PricedItemGrid` components as the baseline, different industry/catalog/theme — purely
content + `theme.ts`, no new code"):

```
Hero → PricedItemGrid(products, onSelect → add to cart) → Footer
```

- **`Hero`** — store headline/subhead/CTA for a fictional consumer-electronics retailer (e.g. a
  line like "Gear that keeps up", linking down to the product grid section on the same page, not to
  an external page).
- **`PricedItemGrid`** — `currency="VND"`, items = the product catalog (§3 below), `ctaLabel="Add to
  cart"`, `onSelect` wired to the cart's `add` mutation (§4).
- **`Footer`** — standard link set (Shop, Support, Warranty & Returns, Contact) + social row on.

- **`CartBadge`** — rendered in the page header/nav (persistent element showing total qty across all
  cart lines), visible on every scroll position.
- **`CartDrawer`** — slide-over panel, closed by default, opened by clicking `CartBadge`; shows cart
  lines, qty controls, subtotal, and a "Checkout" button opening the mock checkout summary.

## 3. Seed data

All seed data lives in `templates/shop-electronics/data/seed.ts` — statically importable at build
time per the interactive-demo spec §3.1 render-pattern rule: the product grid renders directly from
this seed file at the page-component level; only the cart's contents go through
`useLocalCollection`.

Content authenticity rule (parent spec §5 / interactive-demo spec §5): sample copy is
realistic-but-fictional, no fabricated stats presented as real. This site uses a fictional
Vietnamese consumer-electronics retailer, **Vòng Cung Digital** ("Vòng Cung" = "arc/circuit-arc" — a
name evoking circuitry/orbit without resembling any real electronics brand), so all product and
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
  { id: 'prod-earbuds-anc',    title: 'Vòng Cung AirLoop ANC True Wireless Earbuds', price: 1290000 },
  { id: 'prod-charger-65w',    title: '65W GaN 3-Port Fast Charger',                  price: 590000  },
  { id: 'prod-powerbank-20k',  title: '20,000mAh Power Delivery Power Bank',          price: 790000  },
  { id: 'prod-smartwatch',     title: 'Vòng Cung Pulse Fitness Smartwatch',           price: 2490000 },
  { id: 'prod-mech-keyboard',  title: '75% Hot-Swap Mechanical Keyboard',             price: 1690000 },
  { id: 'prod-mouse-wireless', title: 'Ultralight Wireless Gaming Mouse',             price: 890000  },
  { id: 'prod-webcam-1440p',   title: '1440p Webcam with Privacy Shutter',            price: 990000  },
  { id: 'prod-usb-c-hub',      title: '8-in-1 USB-C Docking Hub',                     price: 690000  },
  { id: 'prod-speaker-mini',   title: 'Vòng Cung Orb Mini Bluetooth Speaker',         price: 590000  },
  { id: 'prod-monitor-27',     title: '27" QHD 165Hz IPS Monitor',                    price: 6490000 },
  { id: 'prod-ssd-1tb',        title: '1TB Portable NVMe SSD, USB-C',                 price: 1990000 },
  { id: 'prod-ring-light',     title: 'Adjustable LED Ring Light with Tripod',        price: 450000  },
];
```

Twelve items — matching the baseline site's grid count for a consistent, evenly-wrapping
`PricedItemGrid` at desktop width (4-column-friendly), giving the Hallmark pass (Task 1 of the plan)
a full grid to design spacing/rhythm for (parent spec §5, master spec §8 criterion #4). Spans
audio, wearables, peripherals, and desk-setup accessories so the catalog reads as a genuine
electronics storefront rather than a single-category shop.

## 4. Interactive feature: cart

Identical mechanism to the baseline e-commerce site's cart (`2026-09-20-site-ecommerce-design.md`
§4 — add/remove/adjust qty, `CartBadge`/`CartDrawer`, mock checkout summary, no real payment). Only
the data below differs for this site; the full add-to-cart / qty-change / remove / checkout data
flow narrative in that spec's §4.3-4.5 applies here verbatim, substituting this site's catalog and
storage key.

### 4.1 Data shape

```ts
interface CartLine {
  id: string;     // equals the product's ProductItem.id
  title: string;
  price: number;  // VND, copied from the product at add-time
  qty: number;
}
```

Exactly `template-kit`'s existing `CartLine` shape (plan 30 Task 5, `CartDrawer.tsx`) — no new
fields, no site-specific extension.

**Storage key: `'shop-electronics-cart'`** — deliberately distinct from `ecommerce-cart` and the
other two extra variants' own keys, so each of the 4 e-commerce sites' carts are fully isolated in
`localStorage` (`useLocalCollection`'s storageKey-isolation contract, interactive-demo spec §3.1 /
plan 30 Task 4 mutation M12).

### 4.2 Seed value

The hook seeds with an **empty array** — a cart starts empty for every visitor, same reasoning as
the baseline site's spec §4.2 (a pre-filled cart would misrepresent items the visitor never chose).

```ts
const CART_SEED: CartLine[] = [];
```

### 4.3-4.5 Add to cart / qty change / remove / checkout

Same data flow as `2026-09-20-site-ecommerce-design.md` §4.3-§4.5, verbatim:

- Adding a product already in the cart increments its `qty` rather than duplicating the line.
- `CartDrawer`'s qty input fires `onQtyChange` → hook `update`; Remove fires `onRemove` → hook
  `remove`.
- Every mutation persists to `localStorage` synchronously; reload/return-visit shows the same lines.
- A "Reset demo data" affordance inside `CartDrawer` calls `reset()`, emptying the cart to
  `CART_SEED`.
- Checkout opens a read-only mock summary screen (line items, subtotal, a flat mock shipping fee —
  e.g. 30,000 VND, this site's own fictional content, not a real-world shipping claim — and a total)
  ending in a "This is a demo — no order was placed" notice with a "Continue shopping" action; the
  cart is never cleared by this screen.

## 5. Hallmark design brief

**Industry mood (master spec §4.1's assigned starting direction, non-binding):** cool anchor hue,
grotesque-sans display. Consumer electronics reads as precise, technical, and current — the opposite
register from `shop-homegoods`'s warm/serif furniture-catalog feel, and distinct from
`shop-streetwear`'s high-contrast/bold/condensed apparel energy even though both sit in a
"confident, graphic" register. The direction below is a **starting point for the real Hallmark
session**, not a fixed token commitment — the session must still do real research and make its own
calls, and must clear the design-scoring gate (master spec §8), particularly criterion #10
(distinctiveness against all 28 sibling sites, most pointedly the other 3 e-commerce variants and
any other cool-hue sites in the taxonomy, e.g. `corporate`/`saas`/`blog-tech`/`crm-agency`
—`shop-electronics` must read as its own thing, not a re-skin of any of them).

**Reference directions to research during the Hallmark pass** (starting points, not commitments):
1. Contemporary consumer-tech/gadget retail sites and product-launch pages — the "precision tech"
   register: cool neutrals (graphite/steel/ice-blue family) punctuated by a single saturated accent,
   tight grid discipline, grotesque/neo-grotesque sans display type used at confident scale — useful
   for what separates a genuinely considered electronics storefront from a generic dark-mode SaaS
   template look (would fail criterion #1).
2. Technical/industrial design systems (component datasheets, spec-sheet typography, engineering
   diagram conventions) — a possible source for how to give the flat product grid a "specs-forward"
   feel (e.g. how price/spec callouts are typeset) without turning the page into a literal spec
   sheet, and for restrained, purposeful micro-motion (criterion #5) that reads as responsive UI
   feedback rather than decoration.
3. Southeast Asian / Vietnamese electronics-retail branding — for a locally-grounded visual voice
   (distinct from the generic Western big-box-electronics look) that still reads unmistakably as a
   tech storefront, giving `CartDrawer`'s slide-over panel the same considered visual language
   instead of reading as an unstyled off-the-shelf drawer component.

Actual token values (accent hue, type pairing, spacing scale, motion durations) are Task 1's output,
not this spec's — per master spec §9, this is intentionally deferred to the real Hallmark session.
