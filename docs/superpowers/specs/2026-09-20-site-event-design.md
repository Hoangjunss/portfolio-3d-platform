# Site Spec — Event (`templates/event/`)

Date: 2026-09-20
Status: Approved
Scope: Site #11 of the interactive-demo templates program (`display_order = 11`, `slug = event`,
`subdomain = event`, `category = event`, per plan 30 Task 1's authoritative slug table).

This is a thin, data/content-focused spec per master spec (`2026-09-20-interactive-demo-templates-design.md`)
§9 — the architecture (component kit, `useLocalCollection` contract, folder convention, testing
strategy, design-scoring gate) is already fixed by that spec and by the parent spec
(`2026-09-20-template-design-system-design.md`). This document states only: this site's section
composition, its seed content, its interactive-feature data flow, and its Hallmark design brief.

## 1. Section composition

Per parent spec §3, category #11 ("Event / Hội nghị"): "Schedule/agenda timeline + speaker grid +
ticket-tier cards" — and per parent spec §4's worked combination example for this category:

`Hero` → `Timeline`(agenda, `orientation="horizontal"`) → `PeopleGrid`(speakers,
`roleLabel="Speakers"`) → `PricedItemGrid`(ticket tiers) → `Footer`

The Task 3 interactive section ("Add to my schedule" + "My schedule" panel) is composed between
`Hero` and `Timeline`, following plan 31/40's precedent of inserting the interactive block right
after the hero so a returning visitor sees their saved schedule before scrolling into the full
agenda.

No other `template-kit` component is composed on this page — the agenda, speakers, and tickets are
the three distinguishing sections named by parent spec §3 row #11, and nothing else is needed for
this category to read as distinct.

## 2. Fictional conference (seed data)

**Đồng Vọng Tech Summit** — a fictional one-day conference in Đà Nẵng, Vietnam, for engineers and
technologists working at the edge of AI systems, robotics, climate/materials engineering, and
creative/interactive technology. "Đồng Vọng" (roughly "resonance/echo") frames the event as
practitioners across disciplines building on each other's work. All names, companies, and figures
below are fictional; no invented statistics are presented as real (master spec §5/§8 criterion #8).

### 2.1 Agenda (`Timeline` entries)

`TimelineEntry` shape per plan 30 Task 3: `{ id, title, description, date? }` — `date` here carries
the session's time slot (a string, not a calendar date), and `orientation="horizontal"` per the
assignment.

| # | `id` | Time (`date`) | `title` | `description` |
|---|---|---|---|---|
| 1 | `agenda-registration` | 08:30–09:00 | Registration & Coffee | Badge pickup and informal networking in the main atrium before the program opens. |
| 2 | `agenda-opening` | 09:00–09:15 | Opening Remarks | Welcome from the organizing team and a short framing of this year's program themes. |
| 3 | `agenda-keynote` | 09:15–10:00 | Keynote: Building at the Edge of Frontier Tech | Opening keynote on the shared challenges of shipping AI, robotics, and climate-tech systems from prototype to production. |
| 4 | `agenda-ai-track` | 10:15–11:00 | Track: AI Systems for Production | Lessons from running large model-serving systems reliably outside the demo environment. |
| 5 | `agenda-robotics-track` | 11:00–11:45 | Track: Robotics & Physical Computing | Bridging simulation and the physical world — sensor fusion, control loops, and field-testing failures. |
| 6 | `agenda-climate-track` | 13:00–13:45 | Track: Climate & Materials Engineering | Engineering trade-offs in low-carbon materials and monitoring systems for real deployments. |
| 7 | `agenda-panel` | 13:45–14:30 | Panel: Building Teams That Ship Frontier Tech | Engineering leads discuss hiring, org design, and pacing for teams working on unproven technology. |
| 8 | `agenda-workshop` | 14:45–15:30 | Workshop: Rapid Prototyping With Generative Tools | Hands-on session on using generative design/code tools to compress the prototype-to-test loop. |
| 9 | `agenda-creative-track` | 15:45–16:30 | Track: Creative Coding & Interactive Installations | Case studies from artists and engineers building interactive, sensor-driven installations. |
| 10 | `agenda-closing` | 17:00–18:00 | Closing Keynote & Networking Reception | Closing keynote followed by an open networking reception in the atrium. |

Ten entries — enough for a real horizontal-scroll/wrap layout, giving the Hallmark pass (Task 1 of
the implementation plan) a genuine dense-timeline problem to design for, not a token 3-item strip.

### 2.2 Speakers (`PeopleGrid` items, `roleLabel="Speakers"`)

`Person` shape per plan 30 Task 3: `{ id, name, role, photo? }` — no photos in seed data
(`PeopleGrid` already renders correctly without `photo`); a real photo upload is an admin action out
of scope here, same convention as `thumbnail.webp`.

| `id` | `name` | `role` |
|---|---|---|
| `speaker-quan` | Đặng Minh Quân | Founder & CTO, Lạc Hồng Systems (opening keynote) |
| `speaker-tram` | Hoàng Bảo Trâm | Lead AI Engineer, Tinh Vân Labs |
| `speaker-the-anh` | Vũ Thế Anh | Robotics Researcher, Viện Kỹ thuật Ứng dụng |
| `speaker-diem-my` | Ngô Diễm My | Climate Tech Engineer, Sông Xanh Materials |
| `speaker-gia-huy` | Lâm Gia Huy | Creative Technologist, independent artist-engineer |

Five speakers — matches the assignment's 4-6 range.

### 2.3 Ticket tiers (`PricedItemGrid` items, `currency="VND"`)

`PricedItem` shape per plan 30 Task 3: `{ id, title, price, image? }`; `price` is a plain number of
VND (the kit's `formatPrice` helper formats it via `Intl.NumberFormat('vi-VN', { style: 'currency',
currency })`).

| `id` | `title` | `price` (VND) | Notes (not a separate prop — folded into `title`/copy at implementation time if the site wants tier detail, `PricedItem` has no separate description field) |
|---|---|---|---|
| `ticket-startup` | Startup & Student Pass | 590,000 | Full-day access to all tracks and the workshop; requires a valid student ID or startup team badge at check-in. |
| `ticket-standard` | Standard Pass | 1,500,000 | Full-day access to all tracks, the workshop, and the closing reception. |
| `ticket-premium` | Premium Pass | 3,200,000 | Everything in Standard, plus a reserved front-section seat, the speaker networking dinner, and session recordings. |

Three tiers, ascending price order — matches the assignment's 3-tier requirement.

## 3. Interactive feature: "Add to my schedule"

Per master spec §3.2 row #11: **"Add to my schedule" on agenda items → personal schedule view.**

### 3.1 Data shape

```ts
interface ScheduleEntry {
  id: string;       // matches the agenda entry's id from §2.1 (data/seed.ts's AGENDA array)
  title: string;    // denormalized copy of the agenda entry's title at add time
  addedAt: string;  // ISO 8601, set client-side at add time
}
```

Storage key: `'event-my-schedule'` (matches the master spec assignment's exact key), backed by
`useLocalCollection<ScheduleEntry>('event-my-schedule', [])` — **seeded empty**, same rationale as
Corporate's callback list and Education's enrollments: a visitor has added nothing to their personal
schedule on first visit, so the panel must not pre-populate with fictional "already added" sessions.

### 3.2 Why a page-local "Add" row, not a prop on `Timeline` itself

`Timeline` (plan 30 Task 3) is a fixed kit component with props `{ entries, orientation }` and no
per-item action slot, and this spec does not ask for (nor is it in scope to request) a `template-kit`
change — per parent spec §3's rule, no category gets a bespoke prop added to a shared component for
its sole benefit unless the kit itself is being extended (out of scope for a site plan). Because the
assignment explicitly requires "an 'Add' button per `Timeline` agenda entry," this site renders:

1. The unmodified `Timeline` component, statically, exactly as speced (§1) — the visual agenda
   display, read-only, matching every other site's static-content render pattern.
2. A page-local, client-rendered **"Add to my schedule" control row**, one row per agenda entry
   (same `AGENDA` array `Timeline` reads from, so the two never drift), each row showing the entry's
   time + title and an "Add" button — analogous to Education's `CurriculumAccordion`
   `renderAction` pattern (plan 40 Task 2 decision (c)), except here the control row sits directly
   alongside `Timeline` rather than replacing a kit component's own per-item slot, since `Timeline`
   itself has none to extend.

This keeps `Timeline` itself unmodified and reusable exactly as plan 30 shipped it, while still
giving every agenda entry a real, working "Add" affordance, per the assignment.

### 3.3 Data flow

1. A client component (`'use client'`) mounts `useLocalCollection<ScheduleEntry>('event-my-schedule',
   [])` and renders both §3.2's per-entry "Add" control row and the "My schedule" panel, positioned
   per §1 (between `Hero` and the static `Timeline`).
2. Clicking "Add" on a given agenda entry calls the hook's `add()` with `{ id: entry.id, title:
   entry.title, addedAt: new Date().toISOString() }`.
3. **Idempotency:** clicking "Add" again on an entry already in the visitor's schedule must not
   create a duplicate row — check `items.some(i => i.id === entry.id)` before calling `add`, same
   requirement as Education's enroll handler (plan 40 §4).
4. **"My schedule" panel: `SavedItemsPanel`, relabeled**, per the assignment — `emptyLabel` set to
   something like `"Your schedule is empty — add sessions from the agenda below."`, `renderItem`
   rendering the entry's `title` plus a human-readable `addedAt`. This is the same
   save-from-a-fixed-catalog shape Education used (plan 40 §4's rationale: adding a session to one's
   personal schedule, and later removing it, is exactly `SavedItemsPanel`'s intended pattern — not
   Corporate's "visitor-authored form submission" case, which used a plain list instead).
5. **Remove:** `SavedItemsPanel`'s built-in `onRemove(id)` calls the hook's `remove(id)` — a visitor
   changing their mind about a session removes it from `event-my-schedule` and the panel.
6. **Reload persistence:** per the hook's hydration contract (master spec §3.1), a page reload reads
   the same `localStorage` key and "My schedule" shows every session the visitor has added in this
   browser.
7. **"Reset demo data" affordance** (per hook contract, master spec §3.1's `reset()` rule): a small,
   non-prominent control near the panel that calls `reset()`, returning the schedule to empty.
8. **Render-pattern compliance (master spec §3.1):** `AGENDA`/`SPEAKERS`/`TICKETS` render directly
   from `data/seed.ts` in the static-exported page; only the "My schedule" panel and the "Add"
   buttons' added-state live inside the client component that mounts after the static shell is
   visible — matching Corporate's `CallbackSection` and Education's `EnrollmentSection` precedent.

## 4. Hallmark design brief

**Field/mood call:** this site's fictional conference (§2) is about frontier/emerging engineering —
AI systems, robotics, climate tech, and creative technology — presented to a practitioner audience
who wants a program that reads as sharp, current, and a little irreverent, not a stiff enterprise
B2B conference. Given the master spec's non-binding choice between bold-energetic and cool-corporate
for this category, this spec calls **bold-energetic**: several other sites already anchor on a cool
hue and a restrained corporate register (Corporate #1, SaaS #3, Legal #20, the CRM variants), and a
tech-conference-for-builders audience differentiates better with a high-contrast neutral base plus
one bold, saturated accent and a condensed or grotesque display face — closer to the parent spec's
Fitness/Automotive/Construction starting family than its cool-corporate one, adapted for an editorial
conference-program context rather than a product-inventory one. This is a **non-binding starting
direction only** — the real Hallmark session (Task 1 of the implementation plan) may land elsewhere
if its research supports it, as long as the result clears every criterion in master spec §8,
particularly #1 (anti-generic), #10 (distinctiveness against the other 28 sites, especially the
other bold/high-contrast starting-cluster sites: Fitness, Automotive, Construction), and #4
(layout/spacing rhythm — this site's ten-entry horizontal `Timeline` plus its own per-entry "Add"
control row is a real dense-layout problem, not a token list).

**Reference directions to research (2-3, not fixed token values):**

1. **Independent/practitioner-run tech conferences' event sites** (the register of a conference run
   by and for engineers, not a vendor trade show) — for how they typeset a dense one-day agenda
   without it reading as a plain HTML table, and how they handle a bold accent without tipping into
   a "hackathon flyer" look (which would fail criterion #1's anti-generic bar in the other
   direction).
2. **Editorial/print conference-program design** (printed festival or summit programs, which have
   decades of precedent for timetable typography under real space constraints) — a strong source for
   how to make the horizontal agenda timeline and the per-entry "Add" control genuinely legible and
   well-composed rather than a default flexbox row.
3. **Contemporary Vietnamese design/tech-community event branding** — for a locally-grounded bold
   accent and type voice that avoids the generic "Silicon Valley meetup" poster look most
   English-language tech-conference templates default to, consistent with this program's existing
   preference (per Corporate's own brief) for locally-grounded reference research over wholesale
   Western-template copying.

The session should converge on **one** direction with a rationale (per plan 31 Task 1's process),
not a blend of all three, and must independently clear master spec §8's scoring criteria at
implementation time.

## 5. Explicitly out of scope

- Any real ticket purchase/payment flow — per master spec §1's unchanged non-goal, this site has no
  backend; "getting a ticket" is presentational only (`PricedItemGrid`'s existing `onSelect`/CTA
  behavior, if wired at all, is not a checkout).
- Speaker photos, session recordings, or any asset beyond what §2 specifies — admin/content actions
  out of scope for this spec, same convention as `thumbnail.webp`.
- Any change to `template-kit`'s `Timeline` component (e.g. adding a native per-item action slot) —
  §3.2 explicitly works around this with a page-local control row instead of requesting a kit change.
- Multi-day agenda, session filtering/search, or per-track color coding beyond what the Hallmark
  session's type/color system naturally provides — not part of this category's distinguishing
  composition per parent spec §3 row #11.
