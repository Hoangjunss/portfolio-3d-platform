# Site Spec — Construction (`construction`)

Date: 2026-09-20
Status: Approved (site #16 of 29 under the interactive-demo templates program)

## 1. Context & Scope

This is a thin, mostly-data/content spec for one of the 29 demo template sites defined by
`2026-09-20-interactive-demo-templates-design.md` (§3.2 row #16, §9 execution order — this is plan
46, one of plans 31-59). It does not redefine architecture: section composition, shared component
behavior, the `useLocalCollection` hydration contract, folder convention, and the build/test gates
are all already fixed by that spec and by `2026-09-20-template-design-system-design.md`. This spec
states only:

- the exact section composition for this site (already implied by the parent spec §3's taxonomy row
  for Construction/Architecture, restated here for the plan to point at),
- the seed data shape and sample rows (projects, process steps, services),
- the interactive feature's exact data flow (per-project "Request a quote"),
- a Hallmark design brief (mood direction + research pointers, not fixed token values).

**Slug:** `construction` — folder `templates/construction/`, `display_order` 16, `category`
`construction` (per plan 30 Task 1's authoritative slug table).

## 2. Section composition

Per interactive-demo spec §1's amended section composition for this site:

```
Hero → PhotoGallery(projects, masonry) → Timeline(process, horizontal) → ItemGrid(services) → Footer
```

- **`Hero`** — firm headline/subhead/CTA (e.g. "See our work" scrolling down to the project gallery,
  not linking to an external page).
- **`PhotoGallery`** — `layout="masonry"`, `lightbox={true}`, photos = the firm's completed/ongoing
  project set (see §3.1 for the richer per-project metadata this site tracks alongside the kit's
  plain `Photo` shape).
- **`Timeline`** — `orientation="horizontal"`, entries = the firm's build process/step sequence
  (see §3.2).
- **`ItemGrid`** — `columns={3}`, items = the firm's service lines (icon+text variant, no images
  required — same pattern as the `corporate` site's services grid).
- **`Footer`** — standard link set (About, Projects, Services, Contact) + social row on.

The interactive quote-request feature (§4 below) is its own client-side section, placed directly
under `PhotoGallery` and above `Timeline` — a visitor who just browsed the project gallery sees the
per-project "Request a quote" action and the resulting form/list immediately below it, not buried at
the bottom of the page. This placement is a content/layout decision this spec fixes; the kit
components' own behavior is unchanged.

## 3. Seed data

All seed data lives in `templates/construction/data/seed.ts` — must be statically importable at
build time per parent spec §3.1's render-pattern rule: static content renders directly from imported
seed data, never gated behind `useLocalCollection`'s hydration.

Content authenticity rule (parent spec §5 / interactive-demo spec §5, both restate the same rule):
sample copy is realistic-but-fictional, no fabricated stats presented as real, no Lorem Ipsum above
the fold. This site uses a fictional Vietnamese construction & architecture firm, **Thiên Trường
Construction & Architecture**, so all names/addresses below are fictional and must not resemble a
real company or a real building.

### 3.1 Projects (`PhotoGallery` items + per-project metadata)

The kit's `PhotoGallery` component only takes `{ id, src, alt }` (plan 30 Task 3 contract). This
site tracks a richer `ConstructionProject` shape in its own seed data; `page.tsx` derives the plain
`Photo[]` array from it for the `PhotoGallery` composition, and the interactive quote section (§4)
reads the full `ConstructionProject[]` directly so each project card can carry a title, category, and
"Request a quote" action alongside its photo.

```ts
interface ConstructionProject {
  id: string;
  title: string;
  category: 'Residential' | 'Commercial' | 'Renovation' | 'Institutional';
  location: string;
  yearCompleted: string;
  description: string;
  photo: { src: string; alt: string };
}

const PROJECTS: ConstructionProject[] = [
  {
    id: 'proj-riverside-villas',
    title: 'Riverside Villas',
    category: 'Residential',
    location: 'Đông Anh, Hà Nội',
    yearCompleted: '2024',
    description: 'A 12-unit low-rise villa compound with shared landscaped courtyards and passive cross-ventilation.',
    photo: { src: '/projects/riverside-villas.webp', alt: 'Riverside Villas — low-rise residential compound with courtyard landscaping' },
  },
  {
    id: 'proj-tan-phu-logistics',
    title: 'Tân Phú Logistics Hub',
    category: 'Commercial',
    location: 'Bình Dương',
    yearCompleted: '2023',
    description: 'A 14,000m² pre-engineered steel warehouse and distribution center with a dedicated loading yard.',
    photo: { src: '/projects/tan-phu-logistics.webp', alt: 'Tân Phú Logistics Hub — steel-frame warehouse exterior' },
  },
  {
    id: 'proj-lotus-community-center',
    title: 'Lotus Community Center',
    category: 'Institutional',
    location: 'Huế',
    yearCompleted: '2022',
    description: 'A multipurpose community hall with a timber-lattice roof structure referencing traditional pagoda framing.',
    photo: { src: '/projects/lotus-community-center.webp', alt: 'Lotus Community Center — timber-lattice roof over a multipurpose hall' },
  },
  {
    id: 'proj-old-quarter-shophouse',
    title: 'Old Quarter Shophouse Renovation',
    category: 'Renovation',
    location: 'Hoàn Kiếm, Hà Nội',
    yearCompleted: '2024',
    description: 'Structural retrofit and façade restoration of a narrow tube house, preserving its original brick front.',
    photo: { src: '/projects/old-quarter-shophouse.webp', alt: 'Old Quarter Shophouse Renovation — restored brick façade of a tube house' },
  },
  {
    id: 'proj-song-hong-office',
    title: 'Sông Hồng Office Tower',
    category: 'Commercial',
    location: 'Cầu Giấy, Hà Nội',
    yearCompleted: '2023',
    description: 'An 8-story office tower with a perforated aluminum sunshade skin cutting solar gain on the west façade.',
    photo: { src: '/projects/song-hong-office.webp', alt: 'Sông Hồng Office Tower — perforated aluminum sunshade façade' },
  },
  {
    id: 'proj-mekong-clinic',
    title: 'Mekong Delta Rural Clinic',
    category: 'Institutional',
    location: 'Cần Thơ',
    yearCompleted: '2021',
    description: 'A flood-resilient single-story clinic raised on a compacted earth plinth with a wraparound covered walkway.',
    photo: { src: '/projects/mekong-clinic.webp', alt: 'Mekong Delta Rural Clinic — raised single-story clinic with covered walkway' },
  },
  {
    id: 'proj-highland-guesthouse',
    title: 'Highland Guesthouse Extension',
    category: 'Renovation',
    location: 'Đà Lạt',
    yearCompleted: '2022',
    description: 'A 6-room timber-clad extension added to an existing guesthouse, matched to the original pitched-roof profile.',
    photo: { src: '/projects/highland-guesthouse.webp', alt: 'Highland Guesthouse Extension — timber-clad addition with pitched roof' },
  },
  {
    id: 'proj-binh-thanh-townhomes',
    title: 'Bình Thạnh Townhome Row',
    category: 'Residential',
    location: 'Bình Thạnh, TP.HCM',
    yearCompleted: '2024',
    description: 'A 6-unit contemporary townhome row with individual rooftop gardens and shared ground-floor parking.',
    photo: { src: '/projects/binh-thanh-townhomes.webp', alt: 'Bình Thạnh Townhome Row — contemporary townhomes with rooftop gardens' },
  },
];
```

Eight projects across all four categories — enough for the masonry layout to show real visual
variety (a deliberate mix of aspect ratios implied by the differing building types) without padding
the grid with filler.

### 3.2 Process / step sequence (`Timeline` entries)

```ts
interface ProcessStep {
  id: string;
  title: string;
  description: string;
}

const PROCESS_STEPS: ProcessStep[] = [
  {
    id: 'step-consultation',
    title: 'Consultation & Site Survey',
    description: 'On-site assessment, soil/structural survey, and a scoped brief matching the client\'s budget and timeline.',
  },
  {
    id: 'step-design',
    title: 'Design & Permitting',
    description: 'Architectural drawings, structural engineering review, and submission for local construction permits.',
  },
  {
    id: 'step-procurement',
    title: 'Material Procurement',
    description: 'Sourcing and quality-checking structural materials, finishes, and MEP fixtures ahead of ground-breaking.',
  },
  {
    id: 'step-construction',
    title: 'Construction & Build',
    description: 'Phased on-site construction with a dedicated site supervisor and weekly progress reporting to the client.',
  },
  {
    id: 'step-inspection',
    title: 'Quality Inspection',
    description: 'Independent structural and finish inspection against the approved drawings before handover.',
  },
  {
    id: 'step-handover',
    title: 'Handover & Warranty',
    description: 'Final walkthrough, as-built documentation, and a 24-month structural warranty on completion.',
  },
];
```

Six steps — matches the parent spec §3 row #16's "process/step sequence" distinguishing section,
horizontal orientation per this spec's §2.

### 3.3 Services (`ItemGrid` items)

```ts
interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: string; // icon token name, not an image path — this category uses icon+text, not image+text
}

const SERVICES: ServiceItem[] = [
  {
    id: 'svc-residential',
    title: 'Residential Construction',
    description: 'Ground-up houses, villas, and low-rise residential compounds, from foundation to finish.',
    icon: 'home',
  },
  {
    id: 'svc-commercial',
    title: 'Commercial Construction',
    description: 'Warehouses, office buildings, and retail fit-outs delivered to a fixed schedule and budget.',
    icon: 'building',
  },
  {
    id: 'svc-architecture',
    title: 'Architectural Design',
    description: 'Concept design, structural engineering coordination, and permit-ready drawing sets.',
    icon: 'compass',
  },
  {
    id: 'svc-renovation',
    title: 'Renovation & Retrofit',
    description: 'Structural retrofits, façade restoration, and additions to existing buildings.',
    icon: 'hammer',
  },
  {
    id: 'svc-project-management',
    title: 'Project Management',
    description: 'Single point of contact coordinating contractors, inspections, and procurement through handover.',
    icon: 'clipboard-check',
  },
  {
    id: 'svc-interior',
    title: 'Interior Fit-out',
    description: 'Turnkey interior build-out — partitions, MEP, flooring, and finishes — for new or renovated spaces.',
    icon: 'ruler',
  },
];
```

Six services — inside `ItemGrid`'s `columns={3}` layout this wraps to an even 3-2-... no, a clean
2x3 grid, a deliberate choice distinct from the `corporate` site's asymmetric 3-2 services grid (a
buyer paging between the two demo sites should not see an identical grid rhythm).

## 4. Interactive feature: "Request a quote"

Per interactive-demo spec §3.2 row #16: a "Request a quote" action on a project (from the §3.1
project gallery), capturing a name/phone/project reference, whose submissions accumulate in a "Your
requests" list visible to the same visitor on return (same browser, same `localStorage`).

### 4.1 Data shape

```ts
interface QuoteRequest {
  id: string;          // generated client-side (e.g. crypto.randomUUID()) at submit time
  projectRef: string;  // the ConstructionProject.id the request was made against
  name: string;
  phone: string;
  requestedAt: string; // ISO 8601, set client-side at submit time
}
```

Storage key: `'construction-quote-requests'` (matches the master spec's storage-key convention of
one key per site's interactive feature).

### 4.2 Seed value

The hook seeds with an **empty array**, not fictional pre-filled requests — a "Your requests" panel
pre-populated with fake quote requests the visitor never made would misrepresent the panel as
already containing the visitor's own history, same rationale as the `corporate` site's callback
panel (interactive-demo spec §3.1's hydration contract; parent spec §5's content-authenticity rule).

```ts
const QUOTE_SEED: QuoteRequest[] = [];
```

### 4.3 Data flow

1. Client component (`QuoteRequestSection`) mounts `useLocalCollection<QuoteRequest>(
   'construction-quote-requests', QUOTE_SEED)` and receives the full `PROJECTS` array (§3.1) as a
   prop from the static `page.tsx`, so it can render a project picker without a second data source.
2. The section renders a compact project list — each row shows the project's thumbnail (reusing
   `photo.src`/`photo.alt`), title, and category, plus a **"Request a quote" button**. This list is
   page-local JSX, not a new `template-kit` component — it is a thin, project-aware wrapper around
   the same `PROJECTS` data the static `PhotoGallery` above it already renders from, per the master
   spec's "no new kit component per feature" convention (interactive-demo spec §3.2's closing
   paragraph: reuse `InquiryForm` writing through `useLocalCollection`, not a bespoke component).
3. Clicking "Request a quote" on a project row sets that project as the section's selected
   `projectRef` and reveals an `InquiryForm`-style capture (kit `InquiryForm`, `fields=[]` — the
   base `name`/`phone` fields plus the always-present `message` textarea are exactly what this
   feature needs; `email` is left blank/unused by the visitor since it isn't required content here
   but stays available since it's a base field the kit always renders) with a submit handler that:
   - builds a `QuoteRequest` from the form values plus the selected `projectRef`
     (`id: crypto.randomUUID()`, `requestedAt: new Date().toISOString()`),
   - calls the hook's `add(request)`,
   - relies on `InquiryForm`'s own existing pending/success state (kit behavior, unchanged) to show
     confirmation.
4. **"Your requests" panel: a simple list, not `SavedItemsPanel`.** Same rationale as the `corporate`
   site's callback panel (`2026-09-20-site-corporate-design.md` §4.3): `SavedItemsPanel` is
   specified for the "visitor marked/saved an existing catalog item" pattern, where removing an item
   un-marks it from a catalog the visitor is curating a subset of. A quote request is not a marked
   catalog item; it is a new record the visitor authored via a form, referencing a project by id —
   there is no "un-request a quote" action that makes sense for this demo. This site therefore
   renders `items` from the hook directly as a small ordered list (project title, requester name,
   `requestedAt`, most recent first) inside its own section — no new kit component, no misuse of
   `SavedItemsPanel`'s remove-from-catalog semantics. The project title shown in the list is
   resolved by looking up `projectRef` against the `PROJECTS` array passed in as a prop (not
   duplicated into the stored `QuoteRequest`, keeping the persisted record minimal per its §4.1
   shape).
5. Reload persistence: per the hook's hydration contract (interactive-demo spec §3.1), a page reload
   reads the same `localStorage` key and the "Your requests" list shows every quote request the
   visitor has submitted in this browser, in order.
6. "Reset demo data" affordance (per hook contract, interactive-demo spec §3.1's `reset()` rule):
   small, non-prominent control near the panel that calls `reset()`, returning the list to empty.

## 5. Hallmark design brief

**Industry mood:** construction & architecture — needs to read as capable, precise, and
substantial to a buyer evaluating a builder, leaning industrial/structural rather than soft or
decorative. Parent spec §5's starting-family suggestion for this category is high-contrast neutral +
one bold accent, condensed-sans display — this is a **non-binding starting direction only**; the
real Hallmark session (Task 1 of the implementation plan) may deviate from it if research supports a
different direction (e.g. a raw-concrete/steel material-driven palette, or a blueprint/technical-
drawing-inspired accent system) as long as it clears the design-scoring gate (master spec §8),
particularly criterion #10 (distinctiveness against the other 28 sites — `fitness` and `automotive`
also start from the same high-contrast-neutral family per parent spec §5, so `construction` must not
read as a re-skin of either).

**Reference directions to research during the Hallmark pass** (starting points, not commitments):
1. Contemporary architecture-firm portfolio sites (the "studio" register: large-format project
   photography, restrained type, generous negative space around imagery) — useful for how the
   masonry `PhotoGallery` should feel premium rather than a generic stock-photo grid (failing
   criterion #1 otherwise).
2. Industrial/construction-trade branding (structural steel, concrete, blueprint-line motifs) —
   a possible source for a distinctive accent system and iconography for the `ItemGrid` services
   that avoids the generic "corporate blue" look most B2B service grids default to.
3. Technical/engineering-drawing systems (orthographic line-work, dimension marks, grid-paper
   texture) — a possible source for how the horizontal `Timeline`'s six-step process sequence could
   read as an actual construction schedule rather than a generic numbered-circle stepper.

Actual token values (accent hue, type pairing, spacing scale, motion durations) are Task 1's output,
not this spec's — per master spec §9, this is intentionally deferred to the real Hallmark session.
