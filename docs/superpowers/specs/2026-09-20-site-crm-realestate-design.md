# Site Spec — CRM Real Estate (`crm-realestate`)

Date: 2026-09-20
Status: Approved (site #27 of 29 under the interactive-demo templates program)

## 1. Context & Scope

This is a thin, mostly-data/content spec for one of the 29 demo template sites defined by
`2026-09-20-interactive-demo-templates-design.md` (§4.3, §9 execution order — this is plan 57, the
first-authored of the 3 CRM variants). It does not redefine architecture: this category's page
structure (fake login → dashboard shell → 3 record screens), the `KanbanBoard`/`RecordTable`
component contracts, the `useLocalCollection` hydration contract, folder convention, and the
build/test gates are all already fixed by that spec and by
`2026-09-20-template-design-system-design.md`. This spec states only:

- the fake-login screen's exact behavior and data shape,
- the sidebar nav structure,
- the seed data (contacts, deals, activity log) for a real-estate agency,
- the activity log's auto-append triggers,
- a Hallmark design brief (mood direction + research pointers, not fixed token values).

**Slug:** `crm-realestate` — folder `templates/crm-realestate/`, `display_order` 27, `category`
`crm-realestate` (per plan 30 Task 1's authoritative slug table).

**Category reminder (interactive-demo spec §4.3):** CRM is a structurally different category from
the other 26 sites in this program — it is an **internal dashboard app**, not a public marketing
landing page. It does not compose from `Hero` + marketing sections at all. It does not use
`ItemGrid`, `PeopleGrid`, `Timeline`, `PhotoGallery`, `StatBlock`, `InquiryForm`, or `Footer`.

## 2. Page structure

### 2.1 Fake login screen

The entry point of the app. Any input is accepted — there is no real authentication, no password
check, no validation beyond "a name was typed" (a non-empty `Name` field is the only required
input, so the screen never traps a visitor who doesn't know what to type). Submitting the form logs
the visitor in.

- **Fields:** `Name` (text, required), `Email` (text, optional — cosmetic only, never validated as
  a real email, never sent anywhere).
- **Behavior on submit:** writes a session record to `localStorage` (see §2.2) and immediately
  shows the dashboard shell — no network call, no delay, no loading state.
- **Persistence:** the session is `localStorage`-only, exactly like the CRM's business data —
  **no cookie, no server session, no expiry.** Reloading the page while "logged in" keeps the
  visitor on the dashboard (the login screen is never shown again until storage is cleared).
  Clearing browser storage (or using a private window) returns the visitor to the login screen.
- **Logout:** the dashboard shell's "Reset demo data" affordance (§2.2, per master spec §3.1's
  reset-also-logs-out rule for this category) clears the session record *and* re-seeds
  `contacts`/`deals`/`activityLog` back to their seed values in the same action — a visitor who
  resets always lands back at the login screen with a clean demo.
- **No separate "Log out" button is required by this spec** — "Reset demo data" is the only exit
  from the logged-in state, matching master spec §4.3's explicit wording ("The 'Reset demo data'
  affordance also logs the visitor out"). An implementer may add a plain "Log out" control that
  only clears the session record (leaving business data untouched) as an enhancement, but it is not
  required for this plan to be complete.

### 2.2 Session data shape

```ts
interface CrmSession {
  id: string;       // fixed constant id, e.g. 'session' — this collection only ever holds 0 or 1 row
  name: string;
  loggedIn: true;
}
```

Storage key: `'crm-realestate-session'`, held in a `useLocalCollection<CrmSession>` whose seed is
`[]` (empty = logged out). Logging in calls `add({ id: 'session', name, loggedIn: true })`; the
dashboard shell checks `items.length > 0` to decide login vs. dashboard. `email` is accepted on the
form but intentionally **not** persisted in `CrmSession` — it is cosmetic input only, per §2.1;
persisting it would imply the app does something with it, which it never does.

### 2.3 Dashboard shell

Once logged in, the visitor sees a persistent shell: a sidebar with exactly 3 nav items, and a main
content area that renders the selected screen.

**Sidebar nav (in this order):**

1. **Contacts** — `RecordTable` of the agency's contacts (§3.1).
2. **Deals / Pipeline** — `KanbanBoard` of the agency's deals (§3.2).
3. **Activity Log** — `RecordTable` of the auto/manually logged activity (§3.3).

The sidebar also carries the small, non-prominent "Reset demo data" control (§2.1) — always
visible regardless of which screen is active, per master spec §3.1's convention that every site
exposes this affordance.

Navigation between the 3 screens is client-side state (no routing requirement in this spec —
implementer's call whether it's a simple `useState<'contacts'|'deals'|'activity'>` or Next.js
routes under `app/`; either satisfies this spec as long as all 3 screens are reachable from the
sidebar without a full page reload).

## 3. Seed data

All seed data lives in `templates/crm-realestate/data/seed.ts`, statically importable at build
time per parent spec §3.1's render-pattern rule. Sample copy is realistic-but-fictional — a
fictional Vietnamese real-estate agency, **Việt Nam Land Partners**, so all names below are
fictional and must not resemble a real company or real people.

### 3.1 Contacts (`RecordTable` rows)

```ts
interface Contact {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  tags: string[];
}
```

`RecordTable` columns for this screen: `name`, `company`, `email`, `phone` (4 columns — `tags` is
not rendered as its own `RecordTable` column per that component's flat `string`-cell contract, but
may be shown concatenated inside the `name` or `company` cell's row data at implementer's
discretion; not required).

10 seed rows:

```ts
const CONTACTS: Contact[] = [
  { id: 'ct-1', name: 'Nguyễn Thị Mai', company: 'Mai Trading Co.', email: 'mai.nguyen@maitrading.vn', phone: '0901112233', tags: ['buyer', 'apartment'] },
  { id: 'ct-2', name: 'Trần Văn Hùng', company: '—', email: 'hung.tran@gmail.com', phone: '0912223344', tags: ['seller', 'villa'] },
  { id: 'ct-3', name: 'Lê Thị Hồng', company: 'Hồng Phát Investments', email: 'hong.le@hongphat.vn', phone: '0923334455', tags: ['investor'] },
  { id: 'ct-4', name: 'Phạm Quốc Anh', company: '—', email: 'quocanh.pham@outlook.com', phone: '0934445566', tags: ['buyer', 'land'] },
  { id: 'ct-5', name: 'Vũ Thị Ngọc', company: 'Ngọc Gia Furniture', email: 'ngoc.vu@ngocgia.vn', phone: '0945556677', tags: ['buyer', 'commercial'] },
  { id: 'ct-6', name: 'Đặng Minh Tuấn', company: '—', email: 'tuan.dang@yahoo.com', phone: '0956667788', tags: ['seller', 'apartment'] },
  { id: 'ct-7', name: 'Bùi Thị Lan Anh', company: 'Lan Anh Design Studio', email: 'lananh.bui@landesign.vn', phone: '0967778899', tags: ['buyer', 'apartment'] },
  { id: 'ct-8', name: 'Hoàng Văn Đức', company: '—', email: 'duc.hoang@gmail.com', phone: '0978889900', tags: ['investor', 'land'] },
  { id: 'ct-9', name: 'Ngô Thị Thu Hà', company: 'Thu Hà Logistics', email: 'thuha.ngo@thuhalogistics.vn', phone: '0989990011', tags: ['renter', 'commercial'] },
  { id: 'ct-10', name: 'Đỗ Văn Nam', company: '—', email: 'nam.do@example.com', phone: '0990001122', tags: ['buyer', 'villa'] },
];
```

### 3.2 Deals (`KanbanBoard` items)

```ts
interface Deal {
  id: string;
  contactId: string;
  title: string;
  valueVnd: number;
  stage: string;    // one of the 5 stage keys below
  updatedAt: string; // ISO 8601
}
```

**Pipeline stages (columns, in order):**

| Stage key | Column label |
|---|---|
| `new` | New |
| `contacted` | Contacted |
| `negotiating` | Negotiating |
| `won` | Won |
| `lost` | Lost |

8 seed rows, spread across all 5 stages (at least one per stage so the Hallmark pass has a real
board to design for, not an empty column):

```ts
const DEALS: Deal[] = [
  { id: 'dl-1', contactId: 'ct-1', title: 'Mai — 2BR apartment, Vinhomes Grand Park', valueVnd: 3200000000, stage: 'new', updatedAt: '2026-09-14T09:00:00.000Z' },
  { id: 'dl-2', contactId: 'ct-2', title: 'Hùng — Villa listing, Thảo Điền', valueVnd: 18500000000, stage: 'new', updatedAt: '2026-09-15T10:30:00.000Z' },
  { id: 'dl-3', contactId: 'ct-3', title: 'Hồng Phát — 4-unit investment package', valueVnd: 9800000000, stage: 'contacted', updatedAt: '2026-09-12T14:00:00.000Z' },
  { id: 'dl-4', contactId: 'ct-4', title: 'Quốc Anh — Land plot, Củ Chi', valueVnd: 2100000000, stage: 'contacted', updatedAt: '2026-09-16T08:15:00.000Z' },
  { id: 'dl-5', contactId: 'ct-5', title: 'Ngọc Gia — Ground-floor retail unit', valueVnd: 6400000000, stage: 'negotiating', updatedAt: '2026-09-17T11:45:00.000Z' },
  { id: 'dl-6', contactId: 'ct-7', title: 'Lan Anh — 1BR apartment, District 2', valueVnd: 2750000000, stage: 'negotiating', updatedAt: '2026-09-18T13:20:00.000Z' },
  { id: 'dl-7', contactId: 'ct-9', title: 'Thu Hà — Warehouse lease, Bình Dương', valueVnd: 1200000000, stage: 'won', updatedAt: '2026-09-10T09:30:00.000Z' },
  { id: 'dl-8', contactId: 'ct-6', title: 'Minh Tuấn — Studio unit, Bình Thạnh', valueVnd: 1850000000, stage: 'lost', updatedAt: '2026-09-11T16:00:00.000Z' },
];
```

`RecordTable`/`KanbanBoard` both render `valueVnd` formatted as VND currency in the UI
(`Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`, same formatter pattern
already used by `PricedItemGrid`/`CartDrawer` in `template-kit`) — the raw field stays a plain
`number` in the data model.

### 3.3 Activity log (`RecordTable` rows)

```ts
interface ActivityLogEntry {
  id: string;
  contactId?: string;
  dealId?: string;
  type: string;   // 'contact_added' | 'contact_updated' | 'contact_deleted' | 'deal_added' | 'deal_updated' | 'deal_stage_changed' | 'deal_deleted' | 'note'
  note: string;
  at: string;      // ISO 8601
}
```

`RecordTable` columns for this screen: `type`, `note`, `at` (3 columns; `contactId`/`dealId` are
optional cross-references, not rendered as their own columns — an implementer may resolve
`contactId`/`dealId` to a display name inside `note`'s cell content at record-creation time, see
§4 below, rather than adding lookup logic to the `RecordTable` render path itself).

6 seed rows — a plausible history predating the visitor's own session, so the log screen isn't
empty on first visit (unlike the login-session and callback-style "your own submissions" patterns
in other categories, this log represents the *agency's* history, not the visitor's, so pre-seeding
it does not violate the "no fake visitor history" rule from the `corporate` site's precedent):

```ts
const ACTIVITY_LOG: ActivityLogEntry[] = [
  { id: 'al-1', contactId: 'ct-1', type: 'contact_added', note: 'Added contact Nguyễn Thị Mai', at: '2026-09-14T08:55:00.000Z' },
  { id: 'al-2', dealId: 'dl-1', type: 'deal_added', note: 'Created deal "Mai — 2BR apartment, Vinhomes Grand Park"', at: '2026-09-14T09:00:00.000Z' },
  { id: 'al-3', dealId: 'dl-3', type: 'deal_stage_changed', note: 'Moved "Hồng Phát — 4-unit investment package" to Contacted', at: '2026-09-12T14:00:00.000Z' },
  { id: 'al-4', dealId: 'dl-5', type: 'deal_stage_changed', note: 'Moved "Ngọc Gia — Ground-floor retail unit" to Negotiating', at: '2026-09-17T11:45:00.000Z' },
  { id: 'al-5', dealId: 'dl-7', type: 'deal_stage_changed', note: 'Moved "Thu Hà — Warehouse lease, Bình Dương" to Won', at: '2026-09-10T09:30:00.000Z' },
  { id: 'al-6', contactId: 'ct-6', type: 'note', note: 'Called Đặng Minh Tuấn to confirm listing photos', at: '2026-09-11T15:00:00.000Z' },
];
```

## 4. Activity log auto-append

Per interactive-demo spec §4.3: `activityLog` is "auto-appended on any contact/deal mutation, plus
manually addable." This spec fixes the exact wiring so plan implementation doesn't invent its own
convention per screen:

- **Mechanism:** a shared helper, `logActivity(add, entry)` (a plain function, not a hook, taking
  the Activity Log's own `useLocalCollection` `add` function plus a partial `ActivityLogEntry`
  minus `id`/`at`, which it fills in with `crypto.randomUUID()` and `new Date().toISOString()`).
  Both the Contacts screen and the Deals screen import this same helper from a shared module (e.g.
  `templates/crm-realestate/lib/logActivity.ts`) and call it immediately after their own
  `useLocalCollection` mutation succeeds — this is what "cross-screen activity logging" means
  concretely: two independent screens' mutation handlers both write into the third screen's
  collection through one shared function, not by importing each other's components.
- **Triggers (exhaustive for this spec):**

| Screen | User action | `type` | `note` template |
|---|---|---|---|
| Contacts | Add contact | `contact_added` | `Added contact {name}` |
| Contacts | Edit contact | `contact_updated` | `Updated contact {name}` |
| Contacts | Delete contact | `contact_deleted` | `Removed contact {name}` |
| Deals | Add deal | `deal_added` | `Created deal "{title}"` |
| Deals | Move to new stage (via `KanbanBoard`'s move-select) | `deal_stage_changed` | `Moved "{title}" to {stageLabel}` |
| Deals | Delete deal (if implemented; not required by §3.2/§4 beyond stage-move) | `deal_deleted` | `Removed deal "{title}"` |

- **Manual addition:** the Activity Log screen itself exposes a small "Add note" affordance (a
  single-field form, not the full `InquiryForm` component since this category doesn't compose
  marketing components) that calls `logActivity` directly with `type: 'note'` and the visitor's
  free-text `note` — this is what "plus manually addable" means in the master spec's data-model
  line.
- **No `contactId`/`dealId` required from the caller for a manual note** — both fields are
  optional per §3.3's type; a manually-added note may reference neither.
- **This mechanism only appends; it never mutates or removes existing entries** — deleting a
  contact or deal removes that record from its own collection but its historical `activityLog`
  entries stay (deleting history would misrepresent what "activity log" means for a CRM demo).

## 5. Hallmark design brief

**Industry mood:** internal tool, not a marketing site. The audience is the agency's own staff
using this dashboard many times a day, so the design should read as fast, legible, and
utilitarian-but-considered — closer to a well-designed SaaS back-office (Linear, Notion's table
views, a modern CRM's own admin UI) than to any real-estate marketing site's warm, aspirational
tone. Master spec §4.3's starting-family suggestion for this variant is a **cool anchor hue with a
humanist-sans display** — this is a **non-binding starting direction only**; the real Hallmark
session (Task 1 of the implementation plan) may deviate from it if research supports a different
direction, as long as it clears the design-scoring gate (master spec §8), particularly criterion
#10 (distinctiveness — `crm-agency` also starts from a cool anchor hue but a grotesque-sans
display, and `crm-clinic` starts from a soft cool/green anchor; this site must not read as either
sibling's re-skin) and criterion #7 (accessibility — a dense `RecordTable`/`KanbanBoard` UI lives
or dies on contrast and focus-state legibility more than any marketing page in this program).

**What "internal tool aesthetic" concretely changes versus the other 26 sites' Hallmark briefs:**
- Information density is a feature, not something to soften — the login screen may (and probably
  should) be minimal/quiet, but the dashboard screens should feel like a real working tool: tight
  but legible row heights, clear table/column affordances, visible interactive states on every
  row action (edit/delete buttons, the Kanban move-select).
- Motion (master spec §8 criterion #5) should be even more restrained here than the program's
  general "purposeful, restrained" bar — an internal tool with showy transitions on every table row
  reads as a demo gimmick, not a credible product; short, functional transitions only (stage
  changes, row hover) are appropriate.
- The humanist-sans direction (vs. this category's other two variants' grotesque-sans /
  same-humanist-different-hue choices) should read as approachable-but-professional — legible at
  small sizes in a dense table, not decorative.

**Reference directions to research during the Hallmark pass** (starting points, not commitments):
1. Modern B2B SaaS back-office/admin UIs (e.g. the visual language of tools built around dense
   tables and Kanban boards) — for what "internal tool, not landing page" concretely looks like:
   restrained chrome, clear data hierarchy, purposeful (not decorative) accent color usage.
2. Real-estate CRM/property-management software's own actual product UI (distinct from
   real-estate *marketing* sites, which is a different mood entirely already covered by this
   program's `realestate` category) — for industry-appropriate iconography/terminology cues
   (pipeline stage names, currency formatting) without borrowing that category's warm/aspirational
   palette.
3. Humanist-sans type systems in data-dense products (e.g. systems built around a humanist
   grotesque or neo-grotesque optimized for UI legibility) — for the actual `displayFont`/`bodyFont`
   pairing research, since "humanist-sans" is a family, not a single typeface choice.

Actual token values (accent hue, type pairing, spacing scale, motion durations) are Task 1's
output, not this spec's — per master spec §9, this is intentionally deferred to the real Hallmark
session.
