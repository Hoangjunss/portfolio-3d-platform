# Site Spec — Personal Portfolio (`portfolio`)

Date: 2026-09-20
Status: Approved (site #8 of 29 under the interactive-demo templates program)

## 1. Context & Scope

This is a thin, mostly-data/content spec for one of the 29 demo template sites defined by
`2026-09-20-interactive-demo-templates-design.md` (§3.2 row #8, §9 execution order — this is plan
38). It does not redefine architecture: section composition, shared component behavior, the
`useLocalCollection` hydration contract, folder convention, and the build/test gates are all
already fixed by that spec and by `2026-09-20-template-design-system-design.md`. This spec states
only:

- the exact section composition for this site (already implied by the parent spec §4 worked
  example — `Hero` → `Timeline`(experience) → `PhotoGallery`(single project set) → `Footer`),
- the seed data shape and sample rows (a fictional persona, experience timeline, project photos),
- the interactive feature's exact data flow, reusing the `CommentThread` kit component,
- a Hallmark design brief (mood direction + research pointers, not fixed token values).

**Slug:** `portfolio` — folder `templates/portfolio/`, `display_order` 8, `category` `portfolio`
(per plan 30 Task 1's authoritative slug table).

## 2. Section composition

Per parent spec §4's own worked example for this category, unchanged:

```
Hero → Timeline(experience, vertical) → PhotoGallery(single project set) → Footer
```

- **`Hero`** — the persona's name/one-line bio as headline/subhead, CTA links down to the project
  gallery (not to an external page).
- **`Timeline`** — `orientation="vertical"`, entries = the persona's work-experience history
  (newest first), per parent spec §4's kit table row ("Personal Portfolio (experience)").
- **`PhotoGallery`** — `layout="grid"`, `lightbox={true}`, photos = a single project's gallery
  (per parent spec §3 row #8: "single project gallery" — one coherent body of work, not a
  multi-project catalog; see §3.3 for the "leave feedback" placement relative to this gallery).
- **`Footer`** — standard link set (About, Work, Contact) + social row on.

No other `template-kit` component is composed on this page. The interactive feature (§4 below) is
its own client-side section, placed directly under the `PhotoGallery` (a visitor leaves feedback
after having actually looked at the project, not before) — this placement is a content/layout
decision this spec fixes; component behavior is unchanged from the kit.

## 3. Seed data

All seed data lives in `templates/portfolio/data/seed.ts` — must be statically importable at build
time per parent spec §3.1's render-pattern rule: static content renders directly from imported
seed data, never gated behind `useLocalCollection`'s hydration.

Content authenticity rule (parent spec §5 / interactive-demo spec §5, both restate the same rule):
sample copy is realistic-but-fictional, no fabricated stats presented as real, no Lorem Ipsum above
the fold. This site's persona is **Mai Khánh Linh**, a fictional freelance product designer — the
name, employers, and project below are all invented and must not resemble a real person or company.

### 3.1 Persona

```ts
interface Persona {
  name: string;
  role: string;
  bio: string; // one line, realistic but fictional — no invented awards/press/client counts
}

const PERSONA: Persona = {
  name: 'Mai Khánh Linh',
  role: 'Product Designer',
  bio: 'I design calm, usable interfaces for fintech and logistics teams in Ho Chi Minh City.',
};
```

`PERSONA.name`/`role`/`bio` feed `Hero`'s `headline`/`subhead` props directly (`ctaLabel`/`ctaHref`
point at the `PhotoGallery` section anchor, e.g. `"See my work"` → `#project`).

### 3.2 Experience (`Timeline` entries)

```ts
interface ExperienceEntry {
  id: string;
  title: string;       // role + company
  description: string; // one or two sentences, concrete scope, no invented metrics
  date: string;         // e.g. "2023 — Present"
}

const EXPERIENCE: ExperienceEntry[] = [
  {
    id: 'exp-freelance',
    title: 'Freelance Product Designer',
    description: 'Independent design practice for early-stage fintech and logistics startups across Vietnam.',
    date: '2023 — Present',
  },
  {
    id: 'exp-vantix',
    title: 'Senior Product Designer, Vantix Software',
    description: 'Led end-to-end design for a B2B payables platform, from research through a full design-system rebuild.',
    date: '2021 — 2023',
  },
  {
    id: 'exp-lotus',
    title: 'Product Designer, Lotus Logistics Tech',
    description: 'Designed the driver and dispatcher mobile apps for a last-mile delivery network.',
    date: '2019 — 2021',
  },
  {
    id: 'exp-junior',
    title: 'Junior UI Designer, Sông Hàn Digital Agency',
    description: 'Delivered marketing sites and UI kits for local SME clients across retail and hospitality.',
    date: '2017 — 2019',
  },
  {
    id: 'exp-intern',
    title: 'Design Intern, Sông Hàn Digital Agency',
    description: 'Supported the design team with icon sets, landing-page variants, and QA against handoff specs.',
    date: '2016 — 2017',
  },
];
```

Five entries, newest first (`Timeline` renders in array order — the seed data itself is
pre-sorted, the component does not sort) — enough for the Hallmark pass to design a real vertical
rhythm, not a token 2-3 item list.

### 3.3 Project gallery (`PhotoGallery` photos)

A single project — **"Ledger", a mobile expense-tracking app** for the fictional "Vantix Software"
employer named in §3.2 — shown as one coherent gallery, per parent spec §3 row #8's "single project
gallery" (not a multi-project portfolio grid; that pattern belongs to Agency, not this category).

```ts
interface ProjectPhoto {
  id: string;
  src: string;  // /projects/ledger/<file>.webp — placeholder imagery, real asset is a later upload
  alt: string;  // real, descriptive alt text — required by master spec §8 criterion #7
  caption: string;
}

const PROJECT_PHOTOS: ProjectPhoto[] = [
  { id: 'ledger-1', src: '/projects/ledger/01-onboarding.webp', alt: 'Ledger app onboarding screen showing a three-step account setup flow', caption: 'Onboarding — a three-step setup flow, no account required to try the app.' },
  { id: 'ledger-2', src: '/projects/ledger/02-dashboard.webp', alt: 'Ledger app home dashboard with a weekly spending summary chart', caption: 'Dashboard — weekly spend at a glance, with category breakdown below the fold.' },
  { id: 'ledger-3', src: '/projects/ledger/03-add-expense.webp', alt: 'Ledger app add-expense screen with a numeric keypad and category picker', caption: 'Add expense — a one-handed flow tuned for the most common action in the app.' },
  { id: 'ledger-4', src: '/projects/ledger/04-categories.webp', alt: 'Ledger app category management screen with color-coded tags', caption: 'Categories — color-coded tags carried through charts, lists, and notifications.' },
  { id: 'ledger-5', src: '/projects/ledger/05-reports.webp', alt: 'Ledger app monthly report screen with a bar chart comparing categories', caption: 'Monthly reports — a simple bar comparison, deliberately not a full BI dashboard.' },
  { id: 'ledger-6', src: '/projects/ledger/06-budget-alert.webp', alt: 'Ledger app budget alert notification shown on a lock screen', caption: 'Budget alerts — a gentle nudge before a category goes over, not after.' },
  { id: 'ledger-7', src: '/projects/ledger/07-dark-mode.webp', alt: 'Ledger app dashboard shown in dark mode', caption: 'Dark mode — the full palette re-mapped, not just inverted.' },
  { id: 'ledger-8', src: '/projects/ledger/08-design-system.webp', alt: 'Ledger design system sheet showing type scale, color tokens, and component states', caption: 'Design system — the token sheet delivered alongside the shipped app.' },
];
```

Eight photos — inside the taxonomy's suggested range of 6-10; enough for a real grid/lightbox
layout without padding the set with filler images. Placeholder image files at the `src` paths
above are a build-time asset task (same convention as `thumbnail.webp` — a valid placeholder image
now, a real upload later), not something this spec fabricates content for.

## 4. Interactive feature: "Leave feedback" on the project

Per interactive-demo spec §3.2 row #8: a "leave feedback" affordance on the project gallery, whose
submissions accumulate in a feedback list under that project, visible to the same visitor on
return (same browser, same `localStorage`).

### 4.1 Component reuse: `CommentThread`, not a new component

This feature is built by **reusing `CommentThread`** — the exact same `template-kit` component the
blog/magazine category (parent spec §3 row #7, interactive-demo spec §3.3) uses for per-post
comments — with different labels/props, not a new kit component:

- Blog's `CommentThread` instance: labelled around "comments" on an article (e.g. empty-state text
  "No comments yet", textarea labelled "Add a comment", submit button "Post").
- This site's `CommentThread` instance: same component, re-labelled around "feedback" on the
  project (empty-state text "No feedback yet — be the first to leave some", textarea labelled
  "Leave feedback", submit button "Send feedback"). `CommentThread`'s props (`comments`,
  `onSubmit`) are unchanged — only the surrounding copy this site supplies differs; no fork, no
  prop added to the kit component for this site's wording (any relabeling need goes through
  `CommentThread`'s existing prop surface — verify at implementation time whether label text is
  already a prop per plan 30 Task 5, or is a fixed English string in the kit component; if the
  latter, this site accepts the kit's fixed copy rather than forking the component, per the
  parent spec §3's "no bespoke per-template logic" rule).
- **What `CommentThread` does not collect: an author name.** Per plan 30 Task 5's component
  contract, `CommentThread.onSubmit` is called with the textarea's text value only (`(text: string)
  => Promise<void>`) — there is no author input field in the kit component. This site's feedback
  data shape (§4.2 below) still carries an `author` field (per the master spec's row #8 storageKey
  shape), so the wrapping page component supplies a fixed placeholder author (`'Portfolio
  visitor'`) when building the stored record from `CommentThread`'s `onSubmit(text)` callback —
  the same "wrap the kit component's narrower callback into this site's richer stored shape"
  pattern the corporate site's plan used for `InquiryForm` (see plan 31 §4.3). If a future kit
  change adds an optional name field to `CommentThread` itself (a `template-kit`-level change, out
  of scope for this plan), this site would pass the visitor's typed name through instead — not
  something this spec asks for now.

### 4.2 Data shape

```ts
interface ProjectFeedback {
  id: string;     // generated client-side (e.g. crypto.randomUUID()) at submit time
  author: string; // fixed 'Portfolio visitor' placeholder — see §4.1, CommentThread collects no name field
  text: string;   // CommentThread's onSubmit(text) value, unmodified
  at: string;     // ISO 8601, set client-side at submit time
}
```

Storage key: `'portfolio-project-feedback'` (matches the master spec's exact key).

### 4.3 Seed value

The hook seeds with an **empty array**, not fictional pre-filled feedback — a feedback list
pre-populated with fake entries would misrepresent real project reception, which is a content-
authenticity violation (parent spec §5), not just misleading UX. First-time visitors see
`CommentThread`'s own empty state; the list only ever shows feedback actual visitors left.

```ts
const FEEDBACK_SEED: ProjectFeedback[] = [];
```

### 4.4 Data flow

1. Client component (e.g. `ProjectFeedbackSection`) mounts
   `useLocalCollection<ProjectFeedback>('portfolio-project-feedback', FEEDBACK_SEED)`.
2. `CommentThread` (kit component, re-labelled per §4.1) is rendered with `comments={items}` and an
   `onSubmit={handleSubmit}` handler that:
   - builds a `ProjectFeedback` record from the submitted `text` (`id: crypto.randomUUID()`,
     `author: 'Portfolio visitor'`, `at: new Date().toISOString()`),
   - calls the hook's `add(record)`,
   - relies on `CommentThread`'s own existing pending/empty-state behavior (kit behavior,
     unchanged) — no bespoke loading UI added by this site.
3. Reload persistence: per the hook's hydration contract (interactive-demo spec §3.1), a page
   reload reads the same `localStorage` key and `CommentThread` shows every feedback entry the
   visitor has left in this browser, in submission order.
4. "Reset demo data" affordance (per hook contract, interactive-demo spec §3.1's `reset()` rule):
   small, non-prominent control near the feedback list that calls `reset()`, returning the list to
   empty.

## 5. Hallmark design brief

**Industry mood:** individual/personal-brand — this is the one category where the "product" being
sold is a person's own taste and craft, not a company's service catalog, so the design needs to
read as authored and specific to Khánh Linh rather than as a generic "portfolio template." Parent
spec §5 gives this category no fixed starting-family assignment (it is not named in any of the four
listed clusters), so this is genuinely open: the Hallmark session (Task 1 of the implementation
plan) may lean toward a quiet, minimal/neutral register (letting the project photos and timeline
carry the visual weight) or a more expressive, personality-forward direction (a distinctive accent
and type voice that reads as "this specific designer's site"), whichever the research phase
supports — as long as it clears the design-scoring gate (master spec §8), particularly criterion
#10 (distinctiveness — several other categories in this program also skew minimal/neutral, so
`portfolio` must not read as an unbranded default).

**Reference directions to research during the Hallmark pass** (starting points, not commitments):
1. Independent product/UX designers' own portfolio sites (the "case study as narrative" register —
   restrained chrome, photography/screens doing the talking) — useful for what makes a timeline +
   gallery feel like a real practice rather than a template's placeholder sections.
2. Editorial personal-site typography (a single strong display voice paired with a quiet workhorse
   body face) — a possible source for how the persona's name/bio in `Hero` can carry personality
   without illustration or photography of the person themself (no headshot is specified in this
   spec's seed data — the session should decide whether one belongs, and if so treat it the same
   way `thumbnail.webp`/project photos are treated: a valid placeholder now, a real upload later).
3. Small-studio/freelancer sites in the Vietnamese design community — for a locally-grounded
   typographic and color voice that avoids the generic international "designer portfolio template"
   look (large hero photo, centered serif headline, muted earth tones) most starter kits default
   to.

Actual token values (accent hue, type pairing, spacing scale, motion durations) are Task 1's
output, not this spec's — per master spec §9, this is intentionally deferred to the real Hallmark
session.
