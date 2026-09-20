# Sub-project 2 — Template Design System

Date: 2026-09-20
Status: Approved (sub-project 2 of the overall portfolio program)

## 1. Context & Scope

The main design spec (`2026-09-19-portfolio-3d-platform-design.md`, §1 and §10) explicitly deferred
this: "Sub-project 2 — Template Design System (not yet written): a shared spec describing the
common structure/tech convention all 20 templates follow (all are static landing pages, same
structure, different theme/content — confirmed with the user, no bespoke per-template features
needed)."

This spec covers the 20 **demo template websites** the company sells — separate codebases from the
portfolio platform itself, each deployed as a static export to `<slug>.portfolio.com` (main spec
§7) and referenced from the `templates` table (main spec §6) by `slug`/`subdomain`/
`thumbnail_media_id`. It does **not** cover the portfolio platform's own landing page (that is
`2026-09-20-landing-page-ui-design.md`) or the admin dashboard.

Out of scope: building all 20 template repos. This spec defines the **shared convention and
component kit** only; each template repo is a separate, later work item that consumes the kit.

## 2. Goals / Success Criteria

- One shared Next.js starter convention that all 20 templates follow byte-for-byte in structure,
  so a new template can be scaffolded in minutes, not designed from scratch.
- Each of the 20 templates reads as visually distinct to a buyer (different industry, different
  mood) while sharing 100% of the underlying component code — no bespoke per-template logic.
- Every template produces a `public/thumbnail.webp` and a `slug` that the portfolio platform's
  `templates` table and 3D carousel (plan 12) can resolve without any per-template special-casing.
- A template's static export lands exactly where the `subdomain` column says it does, with no
  manual bookkeeping between the database row and the deployed files.

## 3. The 20-category taxonomy

Confirmed taxonomy — 20 common demo-website categories, matching real buyer search terms in the
template-marketplace space. Each row names the one section combination that makes that category
recognizably itself; everything else is copy/theme, not new code.

| # | Category | Distinguishing section(s) |
|---|---|---|
| 1 | Corporate / Doanh nghiệp | Services grid + client-logo strip + leadership team grid |
| 2 | Agency / Digital Studio | Portfolio/work grid with filter tabs + capabilities list |
| 3 | SaaS / Startup Landing | Feature grid + pricing table + integration logo strip |
| 4 | E-commerce / Cửa hàng online | Product grid + static cart/checkout mock (no real backend) |
| 5 | Restaurant / Cafe | Menu list (categorised, priced) + table-reservation form (static) |
| 6 | Real Estate / Bất động sản | Property listing grid + static map embed + inquiry form |
| 7 | Blog / Magazine | Article list (paginated static) + category tag cloud |
| 8 | Personal Portfolio / CV cá nhân | Timeline/experience list + skills grid + single project gallery |
| 9 | Medical / Phòng khám / Nha khoa | Services-as-treatments grid + doctor/staff grid + appointment form |
| 10 | Education / Trường học / Khoá học | Course/program grid + curriculum accordion + enrollment CTA |
| 11 | Event / Hội nghị | Schedule/agenda timeline + speaker grid + ticket-tier cards |
| 12 | Wedding / Sự kiện cá nhân | Countdown block + photo gallery + RSVP form |
| 13 | Fitness / Gym | Class schedule table + trainer grid + membership pricing |
| 14 | Nonprofit / Từ thiện / NGO | Cause/program grid + donation CTA (static, no real payment) + impact numbers block |
| 15 | Travel / Khách sạn / Resort | Room/package grid + amenities list + static map + booking-inquiry form |
| 16 | Construction / Kiến trúc | Project gallery grid + process/step sequence + services grid |
| 17 | Beauty / Salon / Spa | Treatment/services grid + price list + booking form |
| 18 | Photography Studio | Full-bleed photo gallery (masonry) + packages/pricing |
| 19 | Automotive / Đại lý xe | Vehicle inventory grid (filterable) + financing-inquiry form |
| 20 | Legal / Văn phòng luật | Practice-areas grid + attorney/staff grid + case-results list |

**Decision confirmed with the user (do not deviate):** categories differ only in (a) sample
copy/imagery, (b) theme variables (accent hue + font pairing tuned to the industry's mood), and
(c) which subset/order of the shared section kit (§4) is composed together. No category gets a
bespoke section component written only for it — if two categories both need "a grid of things with
a price," they use the same `PricedItemGrid` component with different props, not two components.

## 4. Shared component kit

One package, `template-kit/`, published as a local workspace package (`@portfolio/template-kit`)
that every template repo depends on. ~9 components cover all 20 categories:

| Component | Used by (examples) | Variant prop drives |
|---|---|---|
| `Hero` | all 20 | headline/subhead/background-image/CTA-label |
| `ItemGrid` | Corporate (services), Agency (work), Real Estate (listings), Automotive (inventory), Construction (projects), Education (courses) | item shape (icon+text / image+text), columns, filter tabs on/off |
| `PricedItemGrid` | SaaS (pricing), Restaurant (menu), Fitness (membership), Beauty (treatments), Photography (packages), Travel (room packages) | currency, per-item CTA label |
| `PeopleGrid` | Corporate (leadership), Medical (doctors), Legal (attorneys), Education (instructors) | role label field |
| `Timeline` | Personal Portfolio (experience), Event (agenda), Construction (process) | orientation (vertical list / horizontal steps) |
| `PhotoGallery` | Agency, Wedding, Photography, Construction | layout (grid / masonry), lightbox on/off |
| `InquiryForm` | Real Estate, Medical, Travel, Automotive, Beauty | field set (name/email/phone/message + up to 2 extra fields), submit-label |
| `StatBlock` | Nonprofit (impact numbers), SaaS (feature callouts) | number/label pairs — **numbers must be real per-template content authored by the buyer, never invented at scaffold time** |
| `Footer` | all 20 | link set, social row on/off |

Section **combination examples** (5 representative categories):

- **Corporate:** `Hero` → `ItemGrid`(services) → `PeopleGrid`(leadership) → `Footer`
- **E-commerce:** `Hero` → `PricedItemGrid`(products, static "Add to cart" no-op) → `Footer`
- **Restaurant:** `Hero` → `PricedItemGrid`(menu) → `InquiryForm`(reservation) → `Footer`
- **Real Estate:** `Hero` → `ItemGrid`(listings) → `InquiryForm` → `Footer` (map embed lives inside `ItemGrid`'s detail variant, not a tenth component)
- **Personal Portfolio:** `Hero` → `Timeline`(experience) → `PhotoGallery`(single project set) → `Footer`

Every template composes 4–5 of these 9 components; none needs all 9, and none needs anything
outside this set. If a 21st category is ever added and it doesn't fit this kit, that is a signal to
extend the kit, not to write a one-off component in that template's own repo.

## 5. Theming convention (per template, not per-component)

- No Hallmark run per template. One shared token contract — same `--color-*`, `--font-*`,
  `--space-*` variable **names** as `template-kit`'s CSS expects — but each template supplies its
  own values in its own `app/globals.css`, tuned to the category's mood:
  - Corporate / SaaS / Legal → cool anchor hue (blue/teal), grotesque-sans display.
  - Restaurant / Beauty / Wedding / Photography → warm anchor hue (terracotta/rose), serif display.
  - Fitness / Automotive / Construction → high-contrast neutral + one bold accent, condensed-sans display.
  - Medical / Education / Nonprofit → soft cool or green anchor, humanist-sans display.
  - These are starting families, not a rule per category — the buyer's actual brand (if supplied)
    overrides the mood default.
- Font pairing still obeys the global 2+1 rule and the banned-defaults list (no Inter/Roboto as the
  only stack) — `template-kit` ships 4 pre-approved free pairings (one per mood cluster above) that
  a template picks from via one `theme.ts` config file; it does not invent a fifth.
- **No fabricated content.** Every `StatBlock`, testimonial, or "trusted by" claim in a template's
  sample content is either marked as placeholder (`— metric to confirm —`) or left out entirely
  until the buyer supplies their real numbers. Sample copy for demo purposes uses realistic but
  clearly fictional business names, never blank Lorem Ipsum for anything above the fold.

## 6. Shared Next.js template starter convention

- **Folder convention** (every template repo):
  ```
  <template-repo>/
  ├── app/
  │   ├── layout.tsx
  │   ├── page.tsx
  │   └── globals.css        # imports template-kit's base tokens, overrides values per §5
  ├── theme.ts                # picks a mood cluster + accent hue override
  ├── public/
  │   └── thumbnail.webp      # REQUIRED — 3D carousel (plan 12) reads this via thumbnailMediaId → MediaDto.url
  ├── next.config.js          # output: 'export'
  ├── package.json            # depends on @portfolio/template-kit (workspace or published package)
  └── package-lock.json
  ```
- **`public/thumbnail.webp` is mandatory and validated at build time** (§7 of this spec, plan
  task). The portfolio platform's `templates.thumbnail_media_id` points at a `Media` row uploaded
  through the admin media library (main spec §4/§6) — the *deployed* `thumbnail.webp` inside the
  template repo is the source image an admin uploads there; the two are related by the admin's
  manual upload step, not an automated sync. This spec fixes the **file path/name convention** so
  that step is unambiguous.
- **`next.config.js` must set `output: 'export'`.** Confirmed by main spec §7: "each of the 20
  templates is built as a static export ... deployed to `/var/www/templates/<slug>/`." A template
  repo that does not export statically cannot be deployed by the existing CI/Nginx convention (main
  spec §7, plan 16 — nginx/subdomains).
- **Build/deploy convention:** the `slug` column value in `templates` (main spec §6) MUST equal the
  template repo's own `<slug>` used in its build output path and CI job name. This is the identity
  key connecting three otherwise-independent systems: the database row, the deployed static files
  (`/var/www/templates/<slug>/`), and the DNS subdomain (`subdomain` column, main spec §7's
  wildcard `*.portfolio.com`). A mismatch between `slug` and the CI publish path is a silent
  broken-demo bug — the admin UI would show a template as active with no way to notice the static
  files live somewhere else. Enforce this at admin-write time: `AdminTemplateController`'s
  create/update validation (already governed by plan 05) should treat `slug` as the single source
  of truth the CI job name and deploy path must match — this is a **process convention** documented
  here, not new backend code (the backend already validates `slug` uniqueness per plan 05; nothing
  in this spec asks for a new validation rule).

## 7. Testing Strategy

- `template-kit` components: unit/component tests (Vitest + Testing Library) per component, one
  test file per component in the kit — not per template, since templates carry no component logic
  of their own to test.
- Each template repo: a single `npm run build` gate (static export succeeds, no missing
  `thumbnail.webp` — see the scaffold plan's build-time check) is sufficient; no bespoke test suite
  per template, consistent with "no bespoke per-template features."
- Manual/visual check: one desktop + one mobile browser pass per template before it goes live,
  same bar as the main portfolio site (main spec §9).

## 8. Open items

- The actual 20 template repos are **not** built by this spec or its plan — only the shared kit and
  one seed-data migration (see the scaffold plan) that gives the platform's `templates` table 20
  real rows to develop and test the 3D carousel against, using placeholder thumbnails until real
  ones are uploaded.
- CI job wiring for 20 independent template repos (main spec §7, "For the 20 static templates:
  build step syncs... to `/var/www/templates/<slug>/`") is covered by plan 17 (cicd) — this spec
  only fixes the `slug` convention plan 17 must key off of.
