# Site Spec — Education (`templates/education/`)

Date: 2026-09-20
Status: Approved
Scope: Site #10 of the interactive-demo templates program (`display_order = 10`, `slug = education`,
`subdomain = education`).

This is a thin, data/content-focused spec per master spec (`2026-09-20-interactive-demo-templates-design.md`)
§9 — the architecture (component kit, `useLocalCollection` contract, folder convention, testing
strategy, design-scoring gate) is already fixed by that spec and by the parent spec
(`2026-09-20-template-design-system-design.md`). This document states only: this site's section
composition, its seed content, its interactive-feature data flow, and its Hallmark design brief.

## 1. Section composition

Per parent spec §3, category #10 ("Education / Trường học / Khoá học"): "Course/program grid +
curriculum accordion + enrollment CTA."

`Hero` → `ItemGrid`(courses/programs) → curriculum accordion (page-level detail, see §4) → `Footer`

The Task 3 interactive section ("Enroll" + "My courses" panel) is composed between `Hero` and
`ItemGrid`, following plan 31's precedent of inserting the interactive block right after the hero
so a returning visitor sees their enrollment state before scrolling into the catalog.

## 2. Fictional courses/programs (seed data)

Institution name for `layout.tsx` metadata and `Hero` copy: **Sông Hồng Academy** — a fictional
continuing-education academy offering short professional courses and longer certificate programs.
All content below is realistic-but-fictional; no invented statistics are presented as real (master
spec §5/§8 criterion #8).

Each course/program below has: `title`, `description` (includes duration, since `template-kit`'s
`GridItem` shape — `{ id, title, description, icon?, image? }`, per plan 30 Task 3 — has no
separate duration field), and a `curriculum` outline (module titles) used by the page-level
accordion (§4), not by `ItemGrid` itself.

| # | Title | Description (rendered in `ItemGrid`) | Curriculum modules |
|---|---|---|---|
| 1 | Data Analytics Foundations | 10-week evening course. From spreadsheets to SQL and dashboards — for career switchers with no prior data background. | 1. Data Literacy & Spreadsheets · 2. Introduction to SQL · 3. Data Cleaning & Validation · 4. Dashboards with Looker Studio · 5. Capstone: Analyze a Real Dataset |
| 2 | UX/UI Design Certificate | 16-week part-time program. Research, wireframing, prototyping, and a portfolio-ready capstone project. | 1. User Research Methods · 2. Information Architecture · 3. Wireframing & Low-Fidelity Prototypes · 4. Visual Design Systems · 5. High-Fidelity Prototyping in Figma · 6. Usability Testing · 7. Capstone Portfolio Project |
| 3 | Full-Stack Web Development | 24-week intensive. HTML/CSS through to a deployed full-stack application, project-based throughout. | 1. HTML, CSS & Responsive Layout · 2. JavaScript Fundamentals · 3. Frontend Frameworks (React) · 4. Backend & REST APIs (Node.js) · 5. Databases & Persistence · 6. Authentication & Deployment · 7. Final Project: Deployed Full-Stack App |
| 4 | Digital Marketing Essentials | 8-week evening course. SEO, paid social, and content strategy for small-business marketers. | 1. Marketing Fundamentals & Funnels · 2. SEO Basics · 3. Paid Social Campaigns · 4. Content Strategy & Copywriting · 5. Analytics & Reporting |
| 5 | Business English for Professionals | 12-week course, twice weekly. Email, meetings, and presentation English for the modern workplace. | 1. Professional Email Writing · 2. Meeting & Negotiation Language · 3. Presentation Skills · 4. Cross-Cultural Communication · 5. Final Presentation Assessment |
| 6 | Project Management Fundamentals | 6-week course. Agile and traditional PM frameworks, aimed at first-time project leads. | 1. PM Frameworks: Waterfall vs. Agile · 2. Scoping & Planning · 3. Scrum in Practice · 4. Risk & Stakeholder Management · 5. Capstone: Run a Mock Sprint |
| 7 | Graphic Design Bootcamp | 10-week intensive. Typography, layout, and brand identity design using industry-standard tools. | 1. Design Principles & Typography · 2. Color Theory & Composition · 3. Brand Identity Design · 4. Print & Digital Layout · 5. Portfolio Review |
| 8 | Financial Literacy & Personal Investing | 6-week evening course. Budgeting, saving, and investing basics for working professionals. | 1. Budgeting & Cash Flow · 2. Saving & Emergency Funds · 3. Investing Basics: Stocks & Funds · 4. Retirement Planning · 5. Building a Personal Financial Plan |

## 3. Curriculum accordion — page-level detail (not a kit addition)

Per the assignment's constraint and master spec §3.3's closed component list (no new kit component
for this site): each course card's curriculum outline renders as a plain HTML
`<details>`/`<summary>` element, one per course, positioned in its own section directly below the
`ItemGrid`. This is deliberately **not** a new `template-kit` component — it is page-local JSX in
`templates/education/app/page.tsx` (or a small page-local, non-kit component file such as
`CurriculumAccordion.tsx` that only this site imports), because:

- `<details>`/`<summary>` gives native disclosure semantics (keyboard-operable, no JS required,
  passes master spec §8 criterion #7 "Accessibility" for free) — no interactive state library is
  needed.
- The master spec's closed kit-component list (§3.3) adds exactly six new components
  (`SavedItemsPanel`, `CompareTray`, `CartDrawer`+`CartBadge`, `CommentThread`, `KanbanBoard`,
  `RecordTable`); an accordion is not among them, and per parent spec §3's rule ("no category gets
  a bespoke section component written only for it... if two categories both need X, they use the
  same component"), only Education needs a curriculum accordion — no other site's interactive
  feature or listed section needs disclosure/accordion behavior, so there is no reuse case that
  would justify promoting it into the kit.
- Content: one `<details>` per course from §2, `<summary>` showing the course title, its body
  listing the course's curriculum modules as an ordered list (`<ol><li>...</li></ol>`), sourced
  from the same `data/seed.ts` array `ItemGrid` reads (`curriculum: string[]` field on each course
  object, alongside the `id`/`title`/`description` fields `GridItem` requires).

## 4. Enroll interactive feature — data flow

Per master spec §3.2 row #10: **"Enroll" on a course card → "My courses" panel.**

- **Trigger:** an "Enroll" button rendered per course, in the curriculum-accordion section (each
  `<details>` block includes an "Enroll" button alongside its module list — not inside `ItemGrid`
  itself, since `ItemGrid`'s `GridItem`/`ItemGridProps` contract, per plan 30 Task 3, has no
  per-item action-button slot). Clicking "Enroll" on a given course calls `add()` on the
  `useLocalCollection` hook described below, writing that course's `id`, `title`, and the current
  timestamp as `enrolledAt`.
- **Storage:** `useLocalCollection<EducationEnrollment>('education-enrollments', [])` — seeded
  **empty** (per the assignment; a visitor has enrolled in nothing on first visit, unlike
  `SavedItemsPanel`'s catalog-favoriting sites which may reuse the same pattern with different
  seeds).

  ```typescript
  interface EducationEnrollment {
    id: string;        // matches the enrolled course's id from data/seed.ts
    title: string;      // denormalized copy of the course title at enroll time
    enrolledAt: string;  // ISO-8601 timestamp, set by the enroll handler
  }
  ```

- **Display:** `SavedItemsPanel<EducationEnrollment>` (kit component, plan 30 Task 5), relabeled
  "My courses" via its `emptyLabel` prop (e.g. `"You haven't enrolled in any courses yet — pick one
  below."`) and `renderItem` prop (renders `title` plus a human-readable `enrolledAt`). Unlike
  Corporate's plan-31 precedent (which used a plain list because a callback request isn't
  "removable from a catalog"), Education's enrollment **is** exactly the save/shortlist shape
  `SavedItemsPanel` was built for — enrolling is choosing an item from a fixed catalog, and
  unenrolling (via `SavedItemsPanel`'s built-in `onRemove`) is a legitimate, expected action (a
  visitor changing their mind), so `SavedItemsPanel` is used directly rather than page-local JSX.
- **Unenroll:** `SavedItemsPanel`'s `onRemove(id)` calls the hook's `remove(id)` — removes that
  enrollment from `education-enrollments` and the panel.
- **Idempotency:** the enroll handler should not add a duplicate row if the visitor clicks
  "Enroll" again on a course they're already enrolled in (check `items.some(i => i.id ===
  course.id)` before calling `add`); the implementing plan's interaction test (plan 40 Task 3)
  covers enroll → appears → persists across reload → unenroll → gone, not the duplicate-click case,
  but the idempotency check is a straightforward, non-optional part of the handler regardless.
- **Render-pattern compliance (master spec §3.1):** `COURSES`/curriculum data renders directly from
  `data/seed.ts` in the static-exported page; only the "My courses" panel and its "Enroll" buttons'
  live enrolled-state live inside a client component (`'use client'`) that mounts after the static
  shell is visible — matching plan 31's `CallbackSection` precedent.

## 5. Hallmark design brief

**Mood:** approachable, academic, trustworthy — a continuing-education academy that feels credible
to a working adult considering a career-change course, not a children's-school illustration style
and not a stiff corporate-training portal. Warmth without being twee; clarity without being sterile.

**Non-binding starting direction** (parent spec §5's original cluster for Education: "soft cool or
green anchor, humanist-sans display" — confirmed as a starting point only; the real Hallmark
session, per master spec §5, may land elsewhere if its research supports it):

- A soft cool hue (muted blue or teal) or a soft sage/green anchor, paired with a humanist sans
  display face — approachable geometry without the coldness of a pure grotesque.

**Reference directions to research (2-3, not fixed token values):**

1. **Modern continuing-education / bootcamp platforms** — sites in the adult-professional-education
   space (career-change bootcamps, professional certificate platforms) that balance credibility
   (this is a real investment of time/money) with approachability (this is achievable, not
   intimidating). Look at how they typography-differentiate course titles from body copy and how
   they present curriculum/syllabus information without it reading as a wall of text.
2. **University/institutional continuing-ed and extension-school sites** — the more established,
   slightly more formal end of the spectrum; useful for the "credible institution" half of the
   mood, particularly around how they typeset structured curriculum/module lists.
3. **Editorial/publication-adjacent education brands** (e.g. long-form learning content platforms,
   knowledge publications) — useful for a warmer, more human typographic voice than a typical SaaS
   dashboard aesthetic, since this site's content (course descriptions, curriculum modules) is
   read, not scanned like a pricing table.

The session should converge on **one** direction with a rationale (per plan 31 Task 1's process),
not a blend of all three, and must independently clear master spec §8's scoring criteria at
implementation time — particularly #1 (anti-generic), #2 (typographic craft — the `<details>`
accordion's `<summary>` styling is a real typographic decision, not a browser default), and #10
(distinctiveness against the other 28 sites, especially the other "soft cool/green, humanist-sans"
starting-cluster sites: Medical and Nonprofit).

## 6. Explicitly out of scope

- Any real enrollment/payment flow, LMS integration, or account system — per master spec §1's
  unchanged non-goal, this site has no backend; "enrolling" only ever writes to `localStorage`.
- A dedicated instructor/faculty grid (`PeopleGrid`) — parent spec §3's distinguishing-sections row
  for Education lists only "course/program grid + curriculum accordion + enrollment CTA"; adding a
  faculty section is a scope increase not requested here and not needed for this site to read as
  distinct.
- Course filtering/search/category tabs — not part of this category's distinguishing composition;
  8 courses fit on one page without filtering UI.
