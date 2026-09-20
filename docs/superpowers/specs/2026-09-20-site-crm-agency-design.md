# CRM Agency Demo Site — Design Spec

Date: 2026-09-20
Status: Approved (scoped by `2026-09-20-interactive-demo-templates-design.md` §4.3)

Slug: `crm-agency` — folder `templates/crm-agency/` — display_order 28 per plan 30 Task 1's
authoritative slug table. Industry flavor: creative agency client/deal pipeline (master spec §4.3
row 2). This spec is thin and data/content-focused per master spec §9 — the CRM category's
architecture (page structure, data model, hydration contract) is already fixed by master spec §4.3
and §3.1; this document only supplies this site's specific seed content, screen wiring detail, and
Hallmark design brief.

## 1. Page structure (master spec §4.3, applied to this site)

This is an **internal dashboard app**, not a marketing landing page — it does not compose
`Hero`/`ItemGrid`/`Footer` or any of the other public-site kit components. Two top-level states:

1. **Login screen** (`/`, unauthenticated state) — a centered card: agency wordmark/logotype,
   "Email" and "Password" text inputs (any value accepted, not validated against anything, no
   password masking requirement beyond a normal `type="password"` input), one "Sign in" button.
   Submitting with any non-empty email (password may be empty — only email is required, matching
   "any input accepted") flips the app into the logged-in state. No forgot-password link, no SSO
   buttons, no real auth of any kind — a one-line caption under the form states this plainly
   ("Demo login — any email signs you in").
2. **Dashboard shell** (logged-in state) — a persistent sidebar with exactly 3 nav items, in this
   order: **Contacts**, **Deals** (labelled "Pipeline" in the nav, routes to the deals screen),
   **Activity Log**. A "Reset demo data" link/button sits at the bottom of the sidebar, always
   visible while logged in. The main content area renders whichever of the 3 screens is selected;
   default screen on login is Contacts.

### 1.1 Fake-login behavior (exact, per master spec §4.3)

- Login state is stored in `localStorage` only, via `useLocalCollection`-style persistence (see
  plan Task 2 for the exact hook usage) — no cookie, no session, no expiry, no server call.
- Reloading the page while "logged in" (valid `localStorage` flag present) goes straight to the
  dashboard shell, skipping the login screen.
- Clearing browser storage (or a fresh browser/incognito session) returns to the login screen.
- "Reset demo data" does two things in one action: (a) re-seeds `contacts`, `deals`, and
  `activityLog` back to this spec's seed arrays, discarding any visitor edits, and (b) logs the
  visitor out (clears the login flag), returning them to the login screen. This is the documented
  behavior from master spec §4.3 ("the 'Reset demo data' affordance also logs the visitor out") —
  it is not optional or a later enhancement.
- There is no logout button separate from "Reset demo data" — this site does not need one; the
  reset action is the only way back to the login screen once logged in (besides clearing storage
  manually), which is an intentional simplification consistent with "no real auth."

## 2. Sidebar navigation structure

| Order | Label | Screen | Kit component used |
|---|---|---|---|
| 1 | Contacts | Contacts list | `RecordTable` |
| 2 | Pipeline | Deals/Kanban | `KanbanBoard` |
| 3 | Activity Log | Activity log list | `RecordTable` |

The sidebar is always visible in the dashboard shell (not collapsible — no requirement in master
spec §4.3 for a collapse affordance, and adding one would be scope beyond §4.3). Active screen is
visually indicated (current-item styling, real design values come from Task 1's Hallmark pass, not
this spec). Sidebar also shows a static "Signed in as demo@{agency name}" line and the "Reset demo
data" action described in §1.1.

## 3. Seed data

### 3.1 `contacts` — 10 rows

Shape: `{ id, name, company, email, phone, tags[] }`. Ten realistic-but-fictional creative-agency
clients, spanning industries a mid-size creative/branding agency in Vietnam would plausibly serve
(local and international, B2B and consumer brands) — no real companies, no invented statistics.

| id | name | company | email | phone | tags |
|---|---|---|---|---|---|
| `c1` | Mai Anh Nguyễn | Chiêu Fashion House | mai.nguyen@chieufashion.vn | 090 812 3456 | Fashion, Retainer |
| `c2` | David Tran | Bloom Coffee Co. | david@bloomcoffee.co | 091 234 5678 | F&B, New Business |
| `c3` | Hương Lê | Vinova Digital Bank | huong.le@vinova.vn | 093 322 1100 | Fintech, Rebrand |
| `c4` | James Whitfield | Whitfield & Rowe Law | james@whitfieldrowe.com | 090 555 1234 | Legal, One-off |
| `c5` | Ngọc Trần | Sunrise Realty Group | ngoc.tran@sunriserealty.vn | 097 788 9900 | Real Estate, Retainer |
| `c6` | Sofia Reyes | Amara Skincare | sofia@amaraskincare.com | 090 112 2334 | Beauty, Campaign |
| `c7` | Quang Phạm | EduNext Learning | quang.pham@edunext.vn | 096 655 4433 | EdTech, Retainer |
| `c8` | Linh Đặng | Cánh Buồm Logistics | linh.dang@canhbuomlogistics.vn | 094 455 6677 | Logistics, Pitch |
| `c9` | Marco Rossi | Trattoria Bella | marco@trattoriabella.vn | 092 211 3344 | F&B, One-off |
| `c10` | Yến Vũ | GreenTech Solar | yen.vu@greentechsolar.vn | 095 566 7788 | CleanTech, New Business |

Phone values above are the *content* (human-readable format); the committed seed data stores them
as plain strings exactly as shown (no formatting logic required in code).

### 3.2 `deals` — 8 rows

Shape: `{ id, contactId, title, valueVnd, stage, updatedAt }`. `updatedAt` is an ISO-8601 date
string. `stage` is one of this site's 5 pipeline stage keys (documented in §3.3 below) —
`KanbanBoard`'s `columns` prop uses these keys/labels directly.

| id | contactId | title | valueVnd | stage | updatedAt |
|---|---|---|---|---|---|
| `d1` | `c1` | Chiêu FW26 Campaign Rebrand | 350000000 | `won` | 2026-08-14 |
| `d2` | `c2` | Bloom Coffee Brand Identity Refresh | 180000000 | `new` | 2026-09-02 |
| `d3` | `c3` | Vinova Digital Banking App Launch Campaign | 620000000 | `negotiation` | 2026-09-10 |
| `d4` | `c4` | Whitfield & Rowe Website Redesign | 95000000 | `proposal` | 2026-09-05 |
| `d5` | `c5` | Sunrise Realty Listings Microsite | 210000000 | `won` | 2026-07-28 |
| `d6` | `c6` | Amara Skincare Product Launch Video | 145000000 | `lost` | 2026-06-19 |
| `d7` | `c7` | EduNext Course Platform Brand System | 275000000 | `negotiation` | 2026-09-12 |
| `d8` | `c9` | Trattoria Bella Menu & Signage Design | 60000000 | `new` | 2026-09-15 |

### 3.3 Pipeline stages (documented stage keys, drive `KanbanBoard` columns)

Reasonable creative-agency stage names, in `KanbanBoard` column order left-to-right:

| Order | `stage` key | Column label |
|---|---|---|
| 1 | `new` | New |
| 2 | `proposal` | Proposal Sent |
| 3 | `negotiation` | In Negotiation |
| 4 | `won` | Won |
| 5 | `lost` | Lost |

### 3.4 `activityLog` — seed rows + auto-append triggers

Shape: `{ id, contactId?, dealId?, type, note, at }`. `type` is a short machine key
(`contact_created`, `contact_updated`, `contact_deleted`, `deal_created`, `deal_stage_changed`,
`deal_updated`, `deal_deleted`, `note` for manually-added entries) — `RecordTable`'s columns render
`type` alongside a human-readable `note` and the `at` timestamp.

**Seed rows (6, backdated, consistent with the deals/contacts above and their `updatedAt` values):**

| id | contactId | dealId | type | note | at |
|---|---|---|---|---|---|
| `a1` | `c1` | `d1` | `deal_stage_changed` | Chiêu FW26 Campaign Rebrand moved to Won | 2026-08-14 |
| `a2` | `c5` | `d5` | `deal_stage_changed` | Sunrise Realty Listings Microsite moved to Won | 2026-07-28 |
| `a3` | `c6` | `d6` | `deal_stage_changed` | Amara Skincare Product Launch Video moved to Lost | 2026-06-19 |
| `a4` | `c3` | `d3` | `deal_stage_changed` | Vinova Digital Banking App Launch Campaign moved to In Negotiation | 2026-09-10 |
| `a5` | `c7` | `d7` | `deal_stage_changed` | EduNext Course Platform Brand System moved to In Negotiation | 2026-09-12 |
| `a6` | `c9` | `d8` | `deal_created` | New deal opened: Trattoria Bella Menu & Signage Design | 2026-09-15 |

**Auto-append triggers (wired in the plan's Task 5, cross-referenced by Tasks 3/4):** any mutation
made through the Contacts or Pipeline screens pushes exactly one new `activityLog` entry, via a
single shared helper (documented in the plan as `logActivity`) both screens call — never
duplicated logic per screen. Triggers:

- Contacts screen: creating a contact → `contact_created`; editing a contact's fields →
  `contact_updated`; deleting a contact → `contact_deleted` (`contactId` set, `dealId` omitted).
- Pipeline screen: creating a deal → `deal_created`; moving a deal to a new stage via
  `KanbanBoard`'s move-select control → `deal_stage_changed` (the `note` names the deal title and
  target stage label, matching the seed rows' phrasing above); editing a deal's other fields (not
  stage) → `deal_updated`; deleting a deal → `deal_deleted` (`dealId` set, `contactId` set to the
  deal's `contactId` when known).
- Activity Log screen itself: a small "Add note" affordance lets the visitor manually append a
  `type: 'note'` entry with a free-text `note` and no `contactId`/`dealId` — this is the "plus
  manually addable" part of master spec §4.3's data model line, and is the one mutation on this
  screen that does *not* itself re-trigger another auto-append (it *is* the log entry).

The Activity Log screen always **displays** entries most-recent-first by sorting on `at` at render
time — it does not rely on storage order. `useLocalCollection`'s `add()` (plan 30 Task 4) appends
to the end of the underlying array; the shared `logActivity` helper (plan Task 2) calls `add()`
as-is rather than reimplementing storage writes, and the screen-level sort is what guarantees
recency ordering regardless of insertion order.

## 4. Reset behavior (cross-reference)

"Reset demo data" (§1.1) resets all three `useLocalCollection` keys (`crm-agency-contacts`,
`crm-agency-deals`, `crm-agency-activity-log`) to the exact seed arrays in §3.1/§3.2/§3.4, and
clears the login flag. It does not selectively reset one screen's data — always all three, plus
logout, in one action, matching master spec §4.3 exactly.

## 5. Hallmark design brief

**Assigned mood (master spec §4.3):** cool anchor hue, grotesque-sans display. This is an
**internal tool**, not a public landing page — the Hallmark session (plan Task 1) should design for
a dashboard-chrome aesthetic (data density, table/kanban legibility, restrained motion) rather than
a marketing hero/section rhythm. It shares the "cool" mood family with `crm-realestate`
(humanist-sans) and needs to read as clearly distinct from it within that shared coolness — the
differentiator is the grotesque-sans display type and a more agency/creative visual attitude
(sharper contrast, more confident/blunter type scale, less "friendly SaaS," more "in-house tool at
a design studio") rather than a different hue family altogether.

**Reference directions to research** (the Hallmark session picks and justifies one, or a
synthesis, per its own process — these are starting points, not fixed token values):

1. **Swiss/International-Style grid systems adapted to software chrome** — think how a grid-driven,
   grotesque-type print system (Müller-Brockmann-lineage) would look as a sidebar-plus-table
   dashboard: strict baseline grid, a single confident accent color reserved for interactive state
   (active nav item, primary buttons, kanban column headers), generous but disciplined whitespace
   even in data-dense views.
2. **Creative-agency-brand-carried-into-tool** — the visual attitude a design/branding agency would
   give its *own* internal tools if it built one for itself: bolder type-as-graphic-device
   treatments (oversized stage counts on Kanban columns, a confident wordmark on the login screen),
   willing to be a little louder than a generic B2B SaaS dashboard, while staying legible and
   information-dense where it matters (tables, forms).
3. **Dark-capable, developer-tool-adjacent dashboard chrome** (e.g. the visual register of modern
   code-adjacent SaaS dashboards) — cool neutrals, one saturated cool accent, monospace or
   grotesque numerals for data (deal values, counts), restrained/functional motion (state
   transitions, not decorative flourish) — useful as a reference for information density and
   restraint even if the session doesn't adopt literal dark mode.

**Non-binding starting direction:** cool anchor hue (blue/violet/teal family), a real grotesque
sans for both display and UI chrome (not Inter/Roboto alone — master spec §8 criterion #2), a
data-first layout discipline (table row rhythm, Kanban column width/gutter consistency) that reads
as "an agency's own internal tool," not a demo-generator dashboard template. The real token values,
font pick, and final direction are Task 1's output, not fixed here (master spec §9's "thin,
data/content-focused" spec convention, and the two explicitly-allowed deferrals in the plan's
No-Placeholders rule).

## 6. Explicitly out of scope

Unchanged from master spec §4.3: multi-user, real auth/permissions, any data leaving the browser,
reporting/analytics beyond the three screens above. No additional screens, no collapsible sidebar,
no CSV export, no email notifications — none of these are in master spec §4.3 and none are added
here.
