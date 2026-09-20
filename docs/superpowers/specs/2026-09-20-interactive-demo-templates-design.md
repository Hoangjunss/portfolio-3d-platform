# Interactive Demo Templates — Data-Layer & Taxonomy Extension (Sub-project 2b)

Date: 2026-09-20
Status: Approved (extends Sub-project 2 — `2026-09-20-template-design-system-design.md`)

## 1. Context & Scope

Sub-project 2 (`2026-09-20-template-design-system-design.md`) defines a 20-category taxonomy of
static demo templates and a shared `template-kit` component package. **As of this spec, none of it
is built** — plan 28 (kit scaffold + seed data) has zero commits, so `template-kit` and all 20
template repos start from scratch.

This spec amends Sub-project 2, and explicitly **overrides one of its decisions**:

- The 9 shared components' *behavior* (what data each takes, what it does) and the folder
  convention (§6 of the original spec) stay as designed.
- **Reversed: the original spec's §5 "No Hallmark run per template — one shared 4-cluster token
  contract" is overridden.** Every one of the 29 sites (not just the theme-cluster pick) gets its
  own full `hallmark` design pass — its own token set, its own take on section layout/spacing
  within the shared component kit's behavioral contract, reviewed and approved like any other
  Hallmark-driven design in this program. This is a deliberate, informed scope increase (confirmed
  with the user, who chose per-site Hallmark over a shared design system after being shown the
  cost trade-off) — see §5 for what stays shared (component *behavior*/data contracts) versus what
  is now bespoke per site (visual design).
- Two further things are added: (a) every template gets a **real, persisted interactive piece**
  instead of a static no-op mock, via one shared client-side data layer (§3); (b) the taxonomy
  grows from 20 to **29 sites** — the original 20, plus 3 extra e-commerce variants, 3 extra
  blog/magazine variants, and a brand-new 3-variant **CRM** category (an internal dashboard app,
  not a public landing page — see §4).

**Non-goal, unchanged from the parent spec:** no template gets a real backend. Every interactive
feature in this spec is client-only, backed by the browser's `localStorage`, seeded from a JSON
file bundled at build time. There is no server, no database, no API call, for any of the 29 sites.

## 2. Goals / Success Criteria

- A demo visitor can actually *use* the interactive piece of every site (add to cart, submit a
  contact form, drag a CRM deal card) and see it persist across a page reload / return visit, on
  the same browser — with zero added infrastructure and zero backend code.
- First paint is never blocked by, or waiting on, the data layer: static content (the page's real
  copy — product names, blog post excerpts, CRM sample records) renders immediately from the
  bundled seed JSON; only the *mutated* state (what the visitor added/changed) reads from
  `localStorage`, and only after mount.
- One shared hook, reused by all 29 sites, so "genuinely interactive but no backend" is not
  reinvented per template — matching the parent spec's "no bespoke per-template logic" rule.
- The 3 extra e-commerce, 3 extra blog, and 3 CRM variants each read as a distinct product (buyer
  in a different industry/mood), the same way the original 20 categories differ only in
  theme/copy/section composition, not in bespoke code.

## 3. Shared client-side data layer

### 3.1 `useLocalCollection` hook (new addition to `template-kit`)

One hook, `useLocalCollection<T>(storageKey, seedData)`, added to `template-kit`'s existing
package. Every interactive feature across all 29 sites is built on this one primitive — carts,
blog comments/post CRUD, CRM contacts/deals/activity log all call it with a different `storageKey`
and `T` shape, never a bespoke storage mechanism.

- **Backing store: `localStorage`, not IndexedDB.** Chosen over IndexedDB after evaluating both:
  at demo-data scale (tens to low hundreds of records per site), `localStorage`'s synchronous
  read/write has no measurable performance disadvantage, and its simplicity (no async
  connection-open step, no version-upgrade handling) outweighs IndexedDB's only real advantage
  (large-dataset capacity), which no demo site needs. Revisit only if a specific site's
  user-generated data volume is later shown to actually exceed `localStorage`'s ~5-10MB practical
  limit.
- **Hydration contract:**
  1. On first visit for a given `storageKey` (nothing in `localStorage` yet), the hook writes
     `seedData` into `localStorage` under `storageKey` and returns it synchronously — no loading
     flash, no empty state on first paint.
  2. On every subsequent visit, the hook reads whatever is in `localStorage` (the visitor's
     accumulated edits), ignoring `seedData` entirely — so nothing is ever silently reset.
  3. Mutation functions (`add`, `update`, `remove`, `reset`) write straight back to
     `localStorage` and update React state synchronously (no optimistic-update complexity needed
     since there is no server round-trip to reconcile against).
  4. `reset()` re-seeds from the original `seedData` — every site's interactive UI exposes this as
     a small, clearly-labelled "Reset demo data" affordance (not prominent, not blocking), so a
     visitor who breaks their own demo state isn't stuck.
- **Render pattern (perf-critical — applies to every site):** the page's static, marketing-facing
  content (product grid, blog post list, CRM sample dashboard on first load) renders directly from
  the imported seed JSON at the page-component level — this is what appears in the static HTML
  export and on first paint. `useLocalCollection` only takes over, client-side, for the
  *mutable* view of the same data (cart contents, "your submitted inquiries", CRM records after
  edits) — mounted inside a client component that hydrates after the static shell is already
  visible. A template must never gate its initial visible content behind
  `useLocalCollection`'s hydration.
- Ships with its own Vitest unit test suite in `template-kit` (seed-on-first-visit,
  persist-on-mutation, reset, storageKey isolation between two hooks in the same page) — per the
  parent spec's §7 testing convention ("`template-kit` components: unit test per component/hook,
  not per template").

### 3.2 Per-category interactive feature (the 20 original categories)

Every one of the 20 original categories (parent spec §3) keeps its exact section composition and
theme; each gains exactly one `useLocalCollection`-backed feature, chosen to be the one thing a
real buyer touring that category would actually expect to try:

| # | Category | Interactive feature (storageKey) |
|---|---|---|
| 1 | Corporate | "Request a callback" form → list of submitted requests, visible in a small "Your requests" panel |
| 2 | Agency | "Save to shortlist" on portfolio items → a shortlist panel |
| 3 | SaaS/Startup | "Start free trial" CTA → visitor's plan selection persists, pricing table highlights it on return |
| 4 | E-commerce (baseline) | Real cart: add/remove/adjust qty, cart badge count, checkout mock summary screen |
| 5 | Restaurant/Cafe | Reservation form → "Your reservations" list |
| 6 | Real Estate | "Save listing" (favorite) toggle → saved-listings panel |
| 7 | Blog/Magazine (baseline) | Comment box per post → comments persist per post, listed under the article |
| 8 | Personal Portfolio | "Leave feedback" on a project → feedback list under that project |
| 9 | Medical/Clinic | Appointment request form → "Your appointments" list |
| 10 | Education | "Enroll" on a course card → "My courses" panel |
| 11 | Event/Conference | "Add to my schedule" on agenda items → personal schedule view |
| 12 | Wedding | RSVP form → guest list count updates live |
| 13 | Fitness/Gym | "Book a class" on the schedule table → "My bookings" list |
| 14 | Nonprofit | Donation-intent form (static, no payment) → running (fake) total + donor's own pledge shown |
| 15 | Travel/Resort | "Add to trip" on room/package cards → trip-planner panel |
| 16 | Construction | "Request a quote" on a project → quote-request list |
| 17 | Beauty/Salon | Booking form → "Your bookings" list |
| 18 | Photography | "Favorite" toggle on gallery photos → favorites lightbox filter |
| 19 | Automotive | "Add to compare" on vehicle cards → comparison table (up to 3) |
| 20 | Legal | Case-inquiry form → "Your inquiries" list |

No new component is added to the kit for any of these — every feature above is `InquiryForm` (already
in the kit) writing through `useLocalCollection`, or a small new `SavedItemsPanel`/`CompareTray`
component (added to the kit in §3.3, reused across the several categories that need a
save/shortlist/compare pattern rather than a form).

### 3.3 New shared components (additions to `template-kit`, not per-site)

| Component | Used by | Purpose |
|---|---|---|
| `SavedItemsPanel` | Agency, Real Estate, Travel, Photography (favorites/shortlist/saved) | Generic "list of items the visitor marked", reads a `useLocalCollection` of item IDs |
| `CompareTray` | Automotive | Up to-N side-by-side comparison, same underlying hook |
| `CartDrawer` + `CartBadge` | E-commerce (baseline + all 3 extra variants) | Slide-over cart UI, qty controls, mock checkout summary |
| `CommentThread` | Blog/Magazine (baseline + all 3 extra variants) | Per-post comment list + submit box |
| `KanbanBoard` | CRM (all 3 variants) | Drag-and-drop columns (e.g. New → Contacted → Won/Lost), backed by `useLocalCollection` |
| `RecordTable` | CRM (all 3 variants) | Sortable/filterable table for contacts/activity log, with row-level edit/delete |

Every one of these is a **kit** component (built once, tested once in `template-kit`), never
reimplemented per template — same rule as the original 9.

## 4. E-commerce, Blog, and CRM: extra variants

### 4.1 Three extra E-commerce variants

Same `CartDrawer`/`PricedItemGrid` components as the baseline (#4), different industry/catalog/theme
— purely content + `theme.ts`, no new code:

| Slug | Industry | Mood/theme cluster (parent spec §5) |
|---|---|---|
| `shop-streetwear` | Streetwear/apparel | High-contrast neutral + bold accent, condensed-sans |
| `shop-homegoods` | Home goods/furniture | Warm anchor hue, serif display |
| `shop-electronics` | Consumer electronics | Cool anchor hue, grotesque-sans display |

### 4.2 Three extra Blog/Magazine variants

Same `CommentThread`/article-list pattern as the baseline (#7), different subject/theme:

| Slug | Subject | Mood/theme cluster |
|---|---|---|
| `blog-tech` | Tech/startup commentary | Cool anchor hue, grotesque-sans |
| `blog-lifestyle` | Lifestyle/travel magazine | Warm anchor hue, serif display |
| `blog-food` | Food/recipe blog | Warm anchor hue, serif display, image-forward layout |

### 4.3 CRM — a new, structurally different category

The 20 original categories (plus the 6 extra e-commerce/blog variants) are all **public marketing
landing pages** — a visitor arrives, browses, optionally converts. CRM is not that: it is an
**internal dashboard app** a buyer's own team would use, so it does not compose from `Hero` +
marketing sections at all.

- **Page structure:** a simple mock "login" screen (any input accepted, no real auth — it exists
  only so the demo *feels* like an internal tool, not a public site) → a dashboard shell with a
  sidebar (Contacts, Deals/Pipeline, Activity Log) → `RecordTable` for Contacts and Activity Log,
  `KanbanBoard` for Deals/Pipeline.
  - **Fake login and its data are both `localStorage`-only** — no session, no cookie, no expiry;
    reloading without clearing storage stays "logged in", clearing storage returns to the login
    screen. This is explicit in the seed/reset UX (§3.1's "Reset demo data" also logs the visitor
    out) so it never reads as a real security boundary.
- **Data model (`useLocalCollection` shapes):**
  - `contacts`: `{ id, name, company, email, phone, tags[] }`
  - `deals`: `{ id, contactId, title, valueVnd, stage, updatedAt }` — `stage` drives `KanbanBoard`
    columns
  - `activityLog`: `{ id, contactId?, dealId?, type, note, at }` — auto-appended on any
    contact/deal mutation, plus manually addable
- **Three variants** (industry-flavored seed data + theme only, identical structure/components):

| Slug | Industry flavor | Mood/theme cluster |
|---|---|---|
| `crm-realestate` | Real-estate agency pipeline | Cool anchor hue, humanist-sans |
| `crm-agency` | Creative agency client pipeline | Cool anchor hue, grotesque-sans |
| `crm-clinic` | Clinic/patient-relationship pipeline | Soft cool/green anchor, humanist-sans |

- **Explicitly out of scope:** multi-user, real auth, permissions, any data leaving the browser,
  reporting/analytics beyond what's directly visible in the three screens above. If a future
  request wants any of these, it is a new spec, not an extension of this one.

## 5. Design convention: shared behavior, bespoke visual design per site

This section replaces the parent spec's §5 for all 29 sites in this document's scope (the original
§5 no longer applies to any of them; it would only still describe a template built outside this
spec's 29, which does not exist).

- **What stays shared (kit-level, not touched by Hallmark):** every component's *behavioral*
  contract — `template-kit`'s 9 original + 6 new (§3.3) components, and `useLocalCollection` (§3.1)
  — props, data shape, interaction logic (what a click/drag/submit does). A site's Hallmark pass
  restyles these components (spacing, color, type, layout arrangement within a section) but does
  not change what they *do* or what data they need. This is what keeps 29 independent Hallmark
  passes from becoming 29 independent codebases with duplicated logic — only the presentation
  layer is bespoke.
- **What is now bespoke per site (Hallmark-driven):** each site's own token set (color, type,
  spacing, motion), its own section-level layout decisions within the shared component kit's
  constraints, and its own moodboard/reference-driven design direction — run as a full `hallmark`
  skill pass (greenfield path) per site, same rigor as the main portfolio landing page's own
  Hallmark pass, output committed as that site's own `app/globals.css` token values and `theme.ts`
  (file locations per §6, unchanged).
- **Content authenticity rule carries over unchanged from the parent spec:** no fabricated stats
  presented as real; realistic-but-fictional sample business names/content.
- **Practical consequence for execution (see §9):** because each site's design is a real Hallmark
  session (research, direction, review), the 29 site plans in §9 are not "thin, mostly-content"
  plans as originally scoped in this spec's first draft — each one's plan includes its own Hallmark
  design phase before implementation, and is authored/reviewed one site (or a small batch) at a
  time, not all 29 in a single pass.

## 6. Folder & naming convention

Unchanged from parent spec §6, applied to all 29 slugs. All 29 template repos live under this
repo's `templates/<slug>/`, each an independent Next.js app (`output: 'export'`) depending on
`@portfolio/template-kit` as a local workspace package:

```
templates/
├── corporate/            # #1-20 keep the original spec's implied slugs
├── ...
├── ecommerce/             # baseline #4
├── shop-streetwear/       # §4.1 extra
├── shop-homegoods/
├── shop-electronics/
├── blog/                  # baseline #7
├── blog-tech/              # §4.2 extra
├── blog-lifestyle/
├── blog-food/
├── crm-realestate/         # §4.3
├── crm-agency/
└── crm-clinic/
```

`thumbnail.webp` and the `slug`-must-match-CI-and-DB convention (parent spec §6) apply identically
to all 29 — CRM's "thumbnail" is a screenshot of its dashboard shell, not a marketing hero image,
which is fine: the 3D carousel/admin `templates` table treat it as opaque.

## 7. Testing strategy addendum

- `useLocalCollection` and the new §3.3 components: unit-tested once in `template-kit`, per parent
  spec §7's existing rule — not per site.
- Each of the 29 sites keeps the parent spec's build gate (`npm run build` succeeds,
  `thumbnail.webp` present) **plus exactly one interaction test** exercising its
  `useLocalCollection` feature end-to-end (e.g. e-commerce: add item → cart badge count updates →
  reload → item still in cart; CRM: drag a deal card → stage persists after reload). This is the
  one deliberate departure from "no bespoke test suite per template" in the parent spec — justified
  because, unlike the original static-mock templates, these sites now have real state logic whose
  regression would be invisible to a build-only gate.

## 8. Design evaluation & scoring gate (per site)

Every site's Hallmark pass (§5) is not "done" on visual approval alone — it must clear a scored
self-audit before its plan is marked complete, using Hallmark's own `audit` capability against a
detailed, multi-criteria rubric, scored 0-10 per criterion. The bar is **maximum achievable score
on every criterion**, not a passing minimum — if a criterion scores below 9/10, the site's plan is
not done; fix and re-score before moving to the next site.

| # | Criterion | What "10/10" looks like |
|---|---|---|
| 1 | Anti-generic / anti-AI-slop | No default-framework look (no unstyled shadcn/Bootstrap/Tailwind-default silhouette); a person could not mistake it for a template-generator output |
| 2 | Typographic craft | Real type hierarchy (not just size steps), the 2+1 font-pairing rule honored, no banned default stacks (Inter/Roboto alone) |
| 3 | Color system coherence | Every color traces to a token (no ad-hoc hex/OKLCH), palette reads as one deliberate mood matching the industry, passes WCAG AA contrast on all text/background pairs |
| 4 | Layout/spacing rhythm | Consistent spacing scale (token-driven), intentional whitespace, no accidental alignment drift between sections |
| 5 | Motion & interaction polish | Purposeful, restrained animation (hover/focus/transition states all present, using token durations/easings), never decorative-only motion that adds latency |
| 6 | Responsive integrity | Correct, considered layout at mobile/tablet/desktop breakpoints — not just "doesn't break," genuinely designed for each |
| 7 | Accessibility | Semantic HTML, keyboard-navigable interactive elements (cart, forms, Kanban drag), visible focus states, alt text on all real content images |
| 8 | Content authenticity | No fabricated stats/testimonials presented as real (§5); sample copy realistic and industry-appropriate, not filler/Lorem Ipsum |
| 9 | Interaction correctness | The site's `useLocalCollection` feature (§3.2/§4) behaves exactly per its hydration contract (§3.1) — verified against the §7 interaction test, not just visually |
| 10 | Brand/industry distinctiveness | Standing next to the other 28 sites, this one is immediately identifiable as its own industry/mood — not a re-skin that reads the same as its siblings |

- Scoring is self-assessed by whoever implements the site (claude or the agy-delegated worker),
  recorded in that site's own plan file as a final "Design score" table before the plan is marked
  complete — same place/convention this repo already uses for its `docs: plan N complete` commits
  and code-review verdicts.
- A criterion that cannot reach 9-10/10 without a real trade-off (e.g. #5 motion polish vs. a hard
  performance budget) must say so explicitly in the score table with a one-line reason, rather than
  silently inflating the number — an honest 7 beats a fabricated 10.

## 9. Execution order (for the implementation plans)

This spec does not itself build anything. The implementation plans continue this repo's existing
`docs/superpowers/plans/2026-09-20-NN-<slug>.md` numbering **sequentially from 30** (plans 01-28
already exist; 29 is intentionally skipped to keep this sub-project's numbering block visually
distinct from Sub-project 1's original plans in the log). Required order:

1. **Plan 30 — kit + hook scaffold** (supersedes/redoes the never-run plan 28): scaffolds
   `template-kit` per parent spec §4/§6 **and** this spec's §3.1 hook + §3.3 components, plus the
   `templates` table seed migration (29 rows, not 20). **Hard prerequisite for every site below** —
   none of the 29 sites can be built before this lands.
2. **Plans 31-59 — one plan + one spec per site, 29 total** (§3.2's 20 categories, §4.1's 3
   e-commerce variants, §4.2's 3 blog variants, §4.3's 3 CRM variants, in that order), each a thin,
   mostly-data/content spec (the architecture is already fixed by this document — a site's own spec
   only needs to state its specific seed data shape/content, theme pick, and which §3.3 components
   it composes). Sites are independent of each other once plan 30 lands, so they may be built and
   reviewed in any order or in parallel — the 31-59 numbering is sequence-of-authoring, not a
   dependency order.

## 10. Open items

- Real product/content copy for all 29 sites' seed JSON still needs authoring per-site (this spec
  fixes data *shape*, not the actual sample copy) — same "no fabricated stats" rule as parent spec
  §5 applies: realistic but clearly fictional names, no invented metrics presented as real.
- CI/Nginx wiring for 29 (not 20) static exports is a parameter change to the existing plan
  17 pipeline, not a new design — out of scope for this spec.
