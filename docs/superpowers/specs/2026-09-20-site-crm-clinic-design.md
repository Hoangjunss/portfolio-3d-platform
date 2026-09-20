# Site Spec — CRM Clinic (`crm-clinic`)

Date: 2026-09-20
Status: Approved (site #29 of 29 under the interactive-demo templates program — third of the three
CRM variants defined by the parent spec §4.3)

## 1. Context & Scope

This is a thin, mostly-data/content spec for one of the 29 demo template sites defined by
`2026-09-20-interactive-demo-templates-design.md` (§4.3, §9 execution order — this is plan 59, the
last of plans 31-59). It does not redefine architecture: the internal-dashboard page structure, the
fake-login convention, `RecordTable`/`KanbanBoard` behavior, the `useLocalCollection` hydration
contract, folder convention, and the build/test gates are all already fixed by that spec and by
`2026-09-20-template-design-system-design.md`. This spec states only:

- the fake-login screen's exact behavior,
- the sidebar nav structure and its UI relabeling of the generic CRM taxonomy for a clinic domain,
- the seed data (8-12 patients, 6-10 treatment-pipeline entries, activity log),
- the activity log's auto-append triggers,
- a Hallmark design brief (mood direction + research pointers, not fixed token values).

**Slug:** `crm-clinic` — folder `templates/crm-clinic/`, `display_order` 29, `category`
`crm-clinic` (per plan 30 Task 1's authoritative slug table).

**Structural note (unchanged from parent spec §4.3, restated for this plan):** unlike the other 26
sites in this program, CRM sites are **not** public marketing landing pages — this site does not
compose from `Hero` + marketing sections. It is a mock internal dashboard tool: a fake "login"
screen followed by a sidebar-navigated shell with three screens, each backed by one
`useLocalCollection` and one of `RecordTable`/`KanbanBoard`.

## 2. UI relabeling: patients and treatment pipeline

The parent spec's `useLocalCollection` shapes for this category (`contacts`, `deals`,
`activityLog`) are generic — written for a sales/agency reading of "CRM." This site's domain is a
clinic's patient-relationship pipeline, so the **underlying data shape is used unmodified**
(`contacts`/`deals`/`activityLog`, verbatim field names, so `RecordTable`/`KanbanBoard` work with
zero kit changes), but the **UI copy relabels it** for the clinic domain:

| Generic concept (kit / storage key) | UI label in this site | Meaning in this domain |
|---|---|---|
| `contacts` (sidebar item, `RecordTable` screen) | **Patients** | A person the clinic has a relationship with — current or prospective patient |
| `deals` (sidebar item, `KanbanBoard` screen) | **Treatment Pipeline** | A patient's care journey for one treatment/procedure, from inquiry to completion — not a sales opportunity |
| `activityLog` (sidebar item, `RecordTable` screen) | **Activity Log** | Chronological record of interactions/changes tied to a patient and/or a treatment-pipeline entry |

This relabeling is UI-copy-only (sidebar labels, screen headings, empty-state text, column
headers) — it never renames the underlying TypeScript field names or `storageKey` strings, so a
future kit change to `RecordTable`/`KanbanBoard` continues to work without touching this site.

Field-level relabeling within `contacts`:

- **`company` is repurposed as "Referred by"** — the source that brought the patient to the clinic
  (e.g. a referring doctor's name, "Self (walk-in)", "Google Search", "Friend/family referral").
  This is documented here rather than left ambiguous because "company" has no natural meaning for
  an individual patient; every other field (`name`, `email`, `phone`, `tags[]`) keeps its literal
  meaning unchanged.

## 3. Page structure

### 3.1 Fake login screen

- Route: this site's root (`/`) renders the login screen when not "logged in"; the dashboard shell
  renders when "logged in." No routing library beyond Next.js's own App Router is needed — a single
  client component reads its own login-state hook and conditionally renders one or the other.
- **Any input is accepted.** A minimal form (email-shaped text input + password-shaped text input,
  both optional in practice) with one "Sign in" button. There is no validation against a real
  credential store — clicking "Sign in" with any values (including empty) transitions to the
  dashboard shell. This is explicit, visible copy on the screen itself (e.g. a small caption: "Demo
  login — any email and password will work"), per parent spec §4.3's "so the demo *feels* like an
  internal tool, not a public site" framing — it must never read as a real auth boundary.
- **Login state is `useLocalCollection`-backed, `localStorage`-only, no session/cookie/expiry:**
  `useLocalCollection<SessionState>('crm-clinic-session', SESSION_SEED)` where:

```ts
interface SessionState {
  id: 'session'; // single-row collection — one fixed id, used as a simple keyed flag
  loggedIn: boolean;
}

const SESSION_SEED: SessionState[] = [{ id: 'session', loggedIn: false }];
```

  On "Sign in," the component calls `update('session', { loggedIn: true })`. On reload, the hook
  reads the same `localStorage` key and `loggedIn` is still `true` — the visitor stays logged in
  until `localStorage` is cleared or "Reset demo data" is used (§3.1 below repeats the single-row
  collection choice over a bare boolean in `localStorage` specifically so this site's login state
  goes through the same one shared hook every other collection uses, rather than a bespoke
  `localStorage.getItem`/`setItem` pair — keeping "every interactive feature calls
  `useLocalCollection`, never a bespoke storage mechanism" true for this site too, per parent spec
  §3.1).
- **"Reset demo data" also logs the visitor out**, per parent spec §4.3's explicit requirement. The
  dashboard shell's reset affordance calls `reset()` on all four collections used by this site
  (`crm-clinic-session`, `crm-clinic-contacts`, `crm-clinic-deals`, `crm-clinic-activity-log`) —
  the session collection's `reset()` re-seeds `loggedIn: false`, which is what sends the visitor
  back to the login screen.

### 3.2 Dashboard shell + sidebar nav

Three sidebar items, in this order, using §2's relabeling:

1. **Patients** — `RecordTable` over `contacts`.
2. **Treatment Pipeline** — `KanbanBoard` over `deals`.
3. **Activity Log** — `RecordTable` over `activityLog`.

The shell is a simple two-column layout: a fixed-width sidebar (clinic name/logo placeholder + the
3 nav items + a "Reset demo data" link at the bottom) and a main content area showing whichever
screen is selected. Selected-screen state is plain React state (not persisted — which screen is
open is not part of the demo's persisted interactive story, unlike login state and the three
collections).

## 4. Seed data

All seed data lives in `templates/crm-clinic/data/seed.ts`, statically importable at build time per
parent spec §3.1's render-pattern rule: each screen's static shell (sidebar, headings, table/board
scaffolding) renders immediately; only the *mutable* view of `contacts`/`deals`/`activityLog`
(post-edit state) reads from `localStorage`, and only after mount, per the same rule as every other
site in this program.

Content authenticity rule (parent spec §5 / interactive-demo spec §5): sample copy is
realistic-but-fictional, no fabricated stats presented as real, no Lorem Ipsum. **No fabricated
medical claims** (parent spec §5) — treatment names are realistic clinic service categories (e.g.
"dental implant consultation," "skin rejuvenation package"), never a claimed clinical outcome,
efficacy statistic, or medical guarantee. This site uses a fictional clinic, **Phòng khám Xanh
Lá** ("Green Leaf Clinic"), so all patient/provider names below are fictional and must not resemble
real people.

### 4.1 Patients (`contacts`)

```ts
interface Contact {
  id: string;
  name: string;
  company: string; // relabeled "Referred by" in the UI — see §2
  email: string;
  phone: string;
  tags: string[];
}
```

10 seed rows (`storageKey`: `'crm-clinic-contacts'`):

```ts
const CONTACTS: Contact[] = [
  { id: 'pt-1', name: 'Nguyễn Thị Mai', company: 'Self (walk-in)', email: 'mai.nguyen@example.com', phone: '0901112233', tags: ['New Patient'] },
  { id: 'pt-2', name: 'Trần Văn Hùng', company: 'Dr. Lê Văn Khoa (referral)', email: 'hung.tran@example.com', phone: '0902223344', tags: ['Follow-up needed'] },
  { id: 'pt-3', name: 'Phạm Thị Lan', company: 'Google Search', email: 'lan.pham@example.com', phone: '0903334455', tags: ['New Patient', 'Insurance'] },
  { id: 'pt-4', name: 'Lê Hoàng Nam', company: 'Friend/family referral', email: 'nam.le@example.com', phone: '0904445566', tags: ['VIP'] },
  { id: 'pt-5', name: 'Vũ Thị Hoa', company: 'Self (walk-in)', email: 'hoa.vu@example.com', phone: '0905556677', tags: ['Allergy Alert'] },
  { id: 'pt-6', name: 'Đặng Minh Tuấn', company: 'Dr. Ngô Thị Bích (referral)', email: 'tuan.dang@example.com', phone: '0906667788', tags: ['Follow-up needed', 'Insurance'] },
  { id: 'pt-7', name: 'Bùi Thị Ngọc', company: 'Facebook Ads', email: 'ngoc.bui@example.com', phone: '0907778899', tags: ['New Patient'] },
  { id: 'pt-8', name: 'Hoàng Văn Đức', company: 'Self (walk-in)', email: 'duc.hoang@example.com', phone: '0908889900', tags: ['VIP', 'Allergy Alert'] },
  { id: 'pt-9', name: 'Ngô Thị Thu', company: 'Friend/family referral', email: 'thu.ngo@example.com', phone: '0909990011', tags: ['New Patient'] },
  { id: 'pt-10', name: 'Đỗ Văn Phúc', company: 'Google Search', email: 'phuc.do@example.com', phone: '0900001122', tags: ['Follow-up needed'] },
];
```

`tags[]` vocabulary used across the seed set (not an enforced enum — free-text tags per the kit's
existing `contacts` shape): `New Patient`, `Follow-up needed`, `Insurance`, `VIP`, `Allergy Alert`.

### 4.2 Treatment Pipeline (`deals`)

```ts
interface Deal {
  id: string;
  contactId: string; // FK into Contact.id above
  title: string;
  valueVnd: number; // treatment cost estimate, in VND
  stage: string;
  updatedAt: string; // ISO 8601
}
```

**Stages** (drives `KanbanBoard` columns, left to right):

| `stage` key | Column label | Meaning |
|---|---|---|
| `inquiry` | Inquiry | Patient has expressed interest; no appointment booked yet |
| `consultation_scheduled` | Consultation Scheduled | An initial consultation appointment is booked |
| `in_treatment` | In Treatment | Treatment plan is active/in progress |
| `completed` | Completed | Treatment finished, no further action pending |

8 seed rows (`storageKey`: `'crm-clinic-deals'`):

```ts
const DEALS: Deal[] = [
  { id: 'tp-1', contactId: 'pt-1', title: 'Dental Implant Consultation', valueVnd: 2500000, stage: 'inquiry', updatedAt: '2026-09-14T09:00:00.000Z' },
  { id: 'tp-2', contactId: 'pt-2', title: 'Orthodontic Follow-up', valueVnd: 800000, stage: 'consultation_scheduled', updatedAt: '2026-09-15T10:30:00.000Z' },
  { id: 'tp-3', contactId: 'pt-3', title: 'Skin Rejuvenation Package', valueVnd: 12000000, stage: 'in_treatment', updatedAt: '2026-09-16T14:00:00.000Z' },
  { id: 'tp-4', contactId: 'pt-4', title: 'Annual Wellness Checkup', valueVnd: 1500000, stage: 'completed', updatedAt: '2026-09-10T08:00:00.000Z' },
  { id: 'tp-5', contactId: 'pt-5', title: 'Allergy Management Plan', valueVnd: 3000000, stage: 'inquiry', updatedAt: '2026-09-17T11:00:00.000Z' },
  { id: 'tp-6', contactId: 'pt-6', title: 'Physical Therapy Program', valueVnd: 9500000, stage: 'in_treatment', updatedAt: '2026-09-13T13:00:00.000Z' },
  { id: 'tp-7', contactId: 'pt-8', title: 'Cosmetic Dental Whitening', valueVnd: 4000000, stage: 'consultation_scheduled', updatedAt: '2026-09-18T09:30:00.000Z' },
  { id: 'tp-8', contactId: 'pt-9', title: 'Nutrition Counseling Package', valueVnd: 2000000, stage: 'completed', updatedAt: '2026-09-09T15:00:00.000Z' },
];
```

`valueVnd` is a treatment cost estimate, not a real medical price list — realistic-but-fictional
magnitude only (parent spec §5), never presented as an actual clinic's pricing.

### 4.3 Activity Log (`activityLog`)

```ts
interface ActivityLogEntry {
  id: string;
  contactId?: string;
  dealId?: string;
  type: string;
  note: string;
  at: string; // ISO 8601
}
```

`type` vocabulary used by this site: `patient_added`, `patient_updated`, `patient_deleted`,
`treatment_added`, `treatment_stage_changed`, `note` (manually added, no mutation behind it).

Seed rows (`storageKey`: `'crm-clinic-activity-log'`) — a short plausible history predating the
demo session, establishing that the log is a real ongoing record, not empty on first load:

```ts
const ACTIVITY_LOG: ActivityLogEntry[] = [
  { id: 'log-1', contactId: 'pt-1', type: 'patient_added', note: 'Patient record created.', at: '2026-09-01T08:00:00.000Z' },
  { id: 'log-2', contactId: 'pt-1', dealId: 'tp-1', type: 'treatment_added', note: 'Dental Implant Consultation added to pipeline.', at: '2026-09-14T09:00:00.000Z' },
  { id: 'log-3', contactId: 'pt-2', dealId: 'tp-2', type: 'treatment_stage_changed', note: 'Orthodontic Follow-up moved to Consultation Scheduled.', at: '2026-09-15T10:30:00.000Z' },
  { id: 'log-4', contactId: 'pt-3', type: 'note', note: 'Patient requested morning appointment slots going forward.', at: '2026-09-16T14:10:00.000Z' },
  { id: 'log-5', contactId: 'pt-4', dealId: 'tp-4', type: 'treatment_stage_changed', note: 'Annual Wellness Checkup marked Completed.', at: '2026-09-10T08:20:00.000Z' },
  { id: 'log-6', contactId: 'pt-6', dealId: 'tp-6', type: 'treatment_stage_changed', note: 'Physical Therapy Program moved to In Treatment.', at: '2026-09-13T13:05:00.000Z' },
];
```

### 4.4 Activity log auto-append triggers

Per parent spec §4.3 ("auto-appended on any contact/deal mutation, plus manually addable"), this
site wires a **shared helper function**, `logActivity(entry)`, that both the Patients screen and
the Treatment Pipeline screen call after their own `useLocalCollection` mutation succeeds:

```ts
// templates/crm-clinic/lib/logActivity.ts (shape only — implementer's exact file, Task 5)
function logActivity(
  add: (entry: ActivityLogEntry) => void, // the activityLog collection's own add()
  entry: Omit<ActivityLogEntry, 'id' | 'at'>,
): void;
```

Concrete triggers:

| Screen action | `type` appended | `note` template |
|---|---|---|
| Add a patient (Patients screen) | `patient_added` | `"{name} added as a new patient."` |
| Edit a patient (Patients screen) | `patient_updated` | `"{name}'s record was updated."` |
| Delete a patient (Patients screen) | `patient_deleted` | `"{name}'s record was removed."` |
| Add a treatment-pipeline entry (Treatment Pipeline screen) | `treatment_added` | `"{title} added to the pipeline for {patientName}."` |
| Move a treatment-pipeline entry to a new stage (Treatment Pipeline screen, via `KanbanBoard`'s move-select) | `treatment_stage_changed` | `"{title} moved to {newStageLabel}."` |

The Activity Log screen itself also lets a user manually add a `note`-type entry directly (a small
inline form above the `RecordTable`, not part of the auto-append wiring) — this is the "plus
manually addable" half of the parent spec's requirement.

## 5. Hallmark design brief

**Industry mood:** an internal clinical-operations tool a receptionist/care-coordinator uses many
times a day — must read as calm, legible, and low-fatigue over long sessions, not as a consumer
wellness marketing site. Parent spec §4.3's starting-family suggestion for this variant is a soft
cool/green anchor hue with a humanist-sans display — this is a **non-binding starting direction
only**; the real Hallmark session (Task 1 of the implementation plan) may deviate from it if
research supports a different direction, as long as it clears the design-scoring gate (master spec
§8), particularly criterion #10 (distinctiveness against the other 28 sites, including the other
two CRM variants — `crm-realestate` and `crm-agency` — which share this site's exact page structure
and component kit, so `crm-clinic` must read as its own tool via typography/color/spacing alone,
not via any structural difference).

**Reference directions to research during the Hallmark pass** (starting points, not commitments):
1. Scandinavian/Nordic healthcare-software dashboards — sage/muted-green palettes, generous
   whitespace, a humanist sans with soft terminals; useful for the "calming internal tool" register
   without tipping into a consumer wellness-app look (which would misrepresent this as a
   patient-facing product rather than staff-facing software).
2. Contemporary telehealth/practice-management SaaS admin panels — for how a data-dense internal
   tool (tables, kanban, forms) stays legible and low-stress at high information density, informing
   this site's spacing rhythm and table/card treatment specifically.
3. Editorial "paper chart" register — off-white/warm-neutral backgrounds with a single muted-green
   accent, evoking a calm clinical record system rather than a generic dark-mode SaaS dashboard;
   a possible source for how to differentiate this site's mood from `crm-agency`'s (grotesque-sans,
   parent spec §4.3) and `crm-realestate`'s (also cool-hue but non-clinical) without either variant
   competing for the same "generic blue dashboard" territory.

Actual token values (accent hue, type pairing, spacing scale, motion durations) are Task 1's output
in the implementation plan, not this spec's — per master spec §9, this is intentionally deferred to
the real Hallmark session.
