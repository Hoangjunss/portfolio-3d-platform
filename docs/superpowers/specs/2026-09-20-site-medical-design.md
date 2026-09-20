# Site Spec — Medical (`medical`)

Date: 2026-09-20
Status: Approved (site #9 of 29 under the interactive-demo templates program)

## 1. Context & Scope

This is a thin, mostly-data/content spec for one of the 29 demo template sites defined by
`2026-09-20-interactive-demo-templates-design.md` (§3.2 row #9, §9 execution order — this is plan
39, one of plans 31-59). It does not redefine architecture: section composition, shared component
behavior, the `useLocalCollection` hydration contract, folder convention, and the build/test gates
are all already fixed by that spec and by `2026-09-20-template-design-system-design.md` (§3 taxonomy
row #9: "Services-as-treatments grid + doctor/staff grid + appointment form"). This spec states
only:

- the exact section composition for this site (already implied by the parent spec §3/§4, restated
  here for the plan to point at),
- the seed data shape and sample rows,
- the interactive feature's exact data flow,
- a Hallmark design brief (mood direction + research pointers, not fixed token values).

**Slug:** `medical` — folder `templates/medical/`, `display_order` 9, `category` `medical` (per
plan 30 Task 1's authoritative slug table).

## 2. Section composition

Per parent spec §3 (taxonomy row #9) and §4's kit-component mapping:

```
Hero → ItemGrid(treatments/services) → PeopleGrid(doctors) → InquiryForm(appointment request) → Footer
```

- **`Hero`** — clinic headline/subhead/CTA (e.g. "Book an appointment", linking down to the
  interactive feature's form, not to an external page).
- **`ItemGrid`** — `columns={3}`, items = the clinic's treatments/services (icon+text variant, no
  images required — see seed shape below).
- **`PeopleGrid`** — `roleLabel="Doctors"`, items = doctor/staff profiles.
- **`InquiryForm`** — the appointment-request form itself (base name/email/phone/message fields
  plus 2 extra fields per §4 below), placed directly above `Footer`.
- **`Footer`** — standard link set (About, Services, Doctors, Contact) + social row on.

The interactive feature (§4 below) composes `InquiryForm` directly in the page's normal flow (it is
already one of the four listed sections, not a bolt-on) plus a client-side "Your appointments" list
rendered immediately below the form — this placement is a content/layout decision this spec fixes;
component behavior is unchanged from the kit.

## 3. Seed data

All seed data lives in `templates/medical/data/seed.ts` — must be statically importable at build
time per parent spec §3.1's render-pattern rule: static content renders directly from imported seed
data, never gated behind `useLocalCollection`'s hydration.

Content authenticity rule (parent spec §5 / interactive-demo spec §5, both restate the same rule):
sample copy is realistic-but-fictional, no fabricated medical claims or statistics presented as
real, no invented efficacy/outcome numbers, no Lorem Ipsum above the fold. This site uses a
fictional Vietnamese multi-specialty clinic, **Phòng khám Đa khoa An Tâm**, so all names below are
fictional and must not resemble a real clinic, hospital, or practitioner.

### 3.1 Treatments/services (`ItemGrid` items)

```ts
interface TreatmentItem {
  id: string;
  title: string;
  description: string;
  icon: string; // icon token name, not an image path — icon+text, not image+text
}

const TREATMENTS: TreatmentItem[] = [
  {
    id: 'trt-general',
    title: 'General Checkup',
    description: 'Routine health screening and consultation for adults and children.',
    icon: 'stethoscope',
  },
  {
    id: 'trt-dental',
    title: 'Dental Care',
    description: 'Cleanings, fillings, and general dentistry for the whole family.',
    icon: 'tooth',
  },
  {
    id: 'trt-pediatrics',
    title: 'Pediatrics',
    description: 'Growth monitoring, vaccinations, and childhood illness care.',
    icon: 'baby',
  },
  {
    id: 'trt-cardiology',
    title: 'Cardiology Consultation',
    description: 'Heart health assessment and referral coordination for ongoing care.',
    icon: 'heart-pulse',
  },
  {
    id: 'trt-dermatology',
    title: 'Dermatology',
    description: 'Skin condition assessment and treatment planning.',
    icon: 'sparkles',
  },
  {
    id: 'trt-physio',
    title: 'Physiotherapy',
    description: 'Rehabilitation and mobility support following injury or surgery.',
    icon: 'activity',
  },
  {
    id: 'trt-lab',
    title: 'Laboratory Testing',
    description: 'On-site blood work and diagnostic panels with same-week results.',
    icon: 'flask',
  },
  {
    id: 'trt-nutrition',
    title: 'Nutrition Counseling',
    description: 'Personalized dietary guidance for chronic condition management and general wellness.',
    icon: 'apple',
  },
];
```

Eight items — inside `ItemGrid`'s `columns={3}` layout this wraps to a 3-3-2 grid, giving the
Hallmark pass (Task 1 of the plan) a real asymmetric layout to design for.

### 3.2 Doctors (`PeopleGrid` items)

```ts
interface DoctorItem {
  id: string;
  name: string;
  role: string; // specialty, shown under roleLabel="Doctors"
  photo?: string; // omitted in seed data — PeopleGrid renders without a photo per its existing contract
}

const DOCTORS: DoctorItem[] = [
  { id: 'doc-1', name: 'BS. Nguyễn Thị Mai', role: 'General Medicine' },
  { id: 'doc-2', name: 'BS. Trần Văn Khoa', role: 'Cardiology' },
  { id: 'doc-3', name: 'BS. Lê Thị Ngọc', role: 'Pediatrics' },
  { id: 'doc-4', name: 'BS. Phạm Minh Tuấn', role: 'Dermatology' },
];
```

Four doctors — no photos in seed data (`PeopleGrid` already renders correctly without `photo` per
its existing prop contract from plan 30 Task 3); a real photo upload is an admin action out of
scope here, same convention as `thumbnail.webp`.

## 4. Interactive feature: "Appointment request" → "Your appointments"

Per interactive-demo spec §3.2 row #9: an appointment-request form whose submissions accumulate in
a small "Your appointments" panel, visible to the same visitor on return (same browser, same
`localStorage`).

### 4.1 Data shape

```ts
interface Appointment {
  id: string;               // generated client-side (e.g. crypto.randomUUID()) at submit time
  name: string;
  phone: string;
  preferredDoctor: string;  // extra InquiryForm field
  preferredDate: string;    // extra InquiryForm field (yyyy-mm-dd, type="date" input)
}
```

Storage key: `'medical-appointments'` (per this task's instructions, matching the shape
`useLocalCollection<{id, name, phone, preferredDoctor, preferredDate}>('medical-appointments', [])`).

### 4.2 `InquiryForm` field set

`InquiryForm`'s base fields (`name`, `email`, `phone`, trailing `message`) are always rendered by
the kit component regardless of the `fields` prop. This feature adds exactly two extra fields via
the `fields` prop:

```ts
const APPOINTMENT_FIELDS: InquiryField[] = [
  { name: 'preferredDoctor', label: 'Preferred Doctor', type: 'text', required: false },
  { name: 'preferredDate', label: 'Preferred Date', type: 'text', required: true },
  // note: InquiryField's `type` union is 'text' | 'email' | 'tel' | 'number' (template-kit
  // contract, plan 30) — 'preferredDate' uses type: 'text' with a yyyy-mm-dd placeholder/pattern
  // hint in its label rather than a native `type="date"` input, since InquiryField's type union
  // does not include 'date'; do not widen the kit's shared type for one site's convenience.
];
```

`email` and `message` values collected by `InquiryForm` are not persisted into the `Appointment`
record (the record shape is fixed to `{id, name, phone, preferredDoctor, preferredDate}` per this
task's instructions) — the submit handler reads only the fields the record shape needs and discards
the rest, same pattern as any `InquiryForm` consumer that doesn't need every collected field.

### 4.3 Seed value

The hook seeds with an **empty array**, not fictional pre-filled appointments — a "Your
appointments" panel pre-populated with fake bookings the visitor never made would misrepresent the
panel as already containing the visitor's own history.

```ts
const APPOINTMENTS_SEED: Appointment[] = [];
```

### 4.4 Data flow

1. Client component mounts `useLocalCollection<Appointment>('medical-appointments', APPOINTMENTS_SEED)`.
2. `InquiryForm` is rendered with `fields={APPOINTMENT_FIELDS}` and an `onSubmit` handler that:
   - builds an `Appointment` from the form values (`id: crypto.randomUUID()`, `name`, `phone`,
     `preferredDoctor`, `preferredDate`),
   - calls the hook's `add(appointment)`,
   - relies on `InquiryForm`'s own existing pending/success state (kit behavior, unchanged) to show
     confirmation.
3. **Panel: a simple list, not `SavedItemsPanel`.** `SavedItemsPanel` is specified for the
   "visitor marked/saved an existing catalog item" pattern (favorite a listing, shortlist a
   portfolio piece) — its `renderItem`/`onRemove` contract assumes items came from a pre-existing
   catalog the visitor is curating a subset of. An appointment request is not a marked catalog
   item; it's a new record the visitor authored via a form, with no catalog to remove it from. This
   site therefore renders `items` from the hook directly as a small ordered list (name, preferred
   doctor, preferred date) inside its own "Your appointments" section — no new kit component, no
   misuse of `SavedItemsPanel`'s remove-from-catalog semantics.
4. Reload persistence: per the hook's hydration contract (interactive-demo spec §3.1), a page
   reload reads the same `localStorage` key and the "Your appointments" list shows every
   appointment the visitor has submitted in this browser, in order.
5. "Reset demo data" affordance (per hook contract, interactive-demo spec §3.1's `reset()` rule):
   small, non-prominent control near the panel that calls `reset()`, returning the list to empty.

## 5. Hallmark design brief

**Industry mood:** a multi-specialty clinic — needs to read as calm, competent, and reassuring to a
visitor who may be anxious about booking care, not clinical-cold or consumer-flashy. Parent spec §5's
starting-family suggestion for this category is a soft cool or green anchor hue with a humanist-sans
display — this is a **non-binding starting direction only**; the real Hallmark session (Task 1 of
the implementation plan) may deviate from it if research supports a different direction as long as
it clears the design-scoring gate (master spec §8), particularly criterion #10 (distinctiveness
against the other 28 sites — several of which also start from a cool/green anchor hue per parent
spec §5, so `medical` must not read as a re-skin of `education` or `nonprofit`, the other two
soft-cool/humanist-sans starting families).

**Reference directions to research during the Hallmark pass** (starting points, not commitments):
1. Contemporary boutique/private clinic digital presence (the "trusted independent practice"
   register: calm color, generous whitespace, legible type at a distance) — useful for what to
   emulate selectively, not to copy wholesale (would read as generic/template-y, failing
   criterion #1).
2. Vietnamese healthcare and wellness branding — for a locally-grounded typographic and color
   voice that avoids the generic "sterile hospital-white" or "generic teal SaaS" looks most
   medical sites default to.
3. Editorial wellness/lifestyle-health publication systems (warm, human-centered, photography-
   friendly even without real photos in this seed) — a possible source for how to make the
   3-3-2 treatments grid (§3.1) and the doctors grid feel personal and reassuring rather than
   default-Bootstrap clinical.

**No fabricated medical claims or statistics.** Per parent spec §5's content-authenticity rule,
this applies with extra weight here: no invented success rates, patient counts, years-in-practice
numbers, or outcome statistics anywhere in the site's copy, including anything the Hallmark pass
might be tempted to add as a `StatBlock`-style credibility device (this site does not compose
`StatBlock` at all, per §2 above — this is a deliberate additional guard, not just a restatement).

Actual token values (accent hue, type pairing, spacing scale, motion durations) are Task 1's output,
not this spec's — per master spec §9, this is intentionally deferred to the real Hallmark session.
