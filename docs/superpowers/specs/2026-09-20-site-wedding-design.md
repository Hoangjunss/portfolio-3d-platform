# Site Spec — Wedding (`wedding`)

Date: 2026-09-20
Status: Approved (site #12 of 29 under the interactive-demo templates program)

## 1. Context & Scope

This is a thin, mostly-data/content spec for one of the 29 demo template sites defined by
`2026-09-20-interactive-demo-templates-design.md` (§3.2 row #12, §9 execution order — this is plan
42, the twelfth of plans 31-59). It does not redefine architecture: section composition, shared
component behavior, the `useLocalCollection` hydration contract, folder convention, and the
build/test gates are all already fixed by that spec and by
`2026-09-20-template-design-system-design.md` (§3's taxonomy row: "Wedding / Sự kiện cá nhân —
Countdown block + photo gallery + RSVP form"). This spec states only:

- the exact section composition for this site, including the one page-level piece that is not a
  `template-kit` component (the countdown),
- the seed data shape and sample rows (couple names, wedding date, photo gallery entries),
- the countdown's computation logic,
- the RSVP interactive feature's exact field set and its live guest-count derivation,
- a Hallmark design brief (mood direction + research pointers, not fixed token values).

**Slug:** `wedding` — folder `templates/wedding/`, `display_order` 12, `category` `wedding` (per
plan 30 Task 1's authoritative slug table).

## 2. Section composition

```
Hero (+ page-level countdown) → PhotoGallery → InquiryForm (RSVP) → Footer
```

- **`Hero`** — couple names as headline, wedding date/venue as subhead, a CTA linking down to the
  RSVP form (`ctaLabel: "RSVP now"`, `ctaHref: "#rsvp"`). `Hero` itself is unchanged `template-kit`
  behavior (headline/subhead/CTA/background image) — it carries no countdown logic of its own.
- **Countdown — page-level, NOT a new `template-kit` component.** A small client component
  (`WeddingCountdown`, owned by this site's `app/` tree, not the kit) rendered directly below the
  static `Hero` section, inside the same visual "hero band." It is page-level because a live
  ticking countdown is specific to this one category — no other of the 29 sites needs it, so it
  does not meet the kit's "used by 2+ categories" bar (parent spec §4's own rule for what earns a
  shared component). See §4 for its computation logic and its render-pattern placement.
- **`PhotoGallery`** — `layout="grid"`, `lightbox={true}`, items = the couple's photo set (§3.2).
- **`InquiryForm`** — the RSVP form, `fields` = the two RSVP-specific extra fields defined in §5,
  `submitLabel="Send RSVP"`. Anchored at `id="rsvp"` so `Hero`'s CTA scrolls to it.
- **`Footer`** — standard link set (Our Story, Gallery, RSVP, Registry) + social row on.

No other `template-kit` component is composed on this page. The RSVP interactive layer (§5) is a
client component wrapping `InquiryForm` plus a live "guests confirmed" total, mounted in the same
position as the static `InquiryForm` anchor — matching the render-pattern rule (interactive-demo
spec §3.1): the form's static labels/markup are the kit component's own static render; only the
submitted-RSVPs collection and the live total are client-hydrated state.

## 3. Seed data

All seed data lives in `templates/wedding/data/seed.ts` (statically importable at build time per
parent spec §3.1's render-pattern rule: static content — couple names, wedding date/venue, photo
gallery — renders directly from imported seed data, never gated behind `useLocalCollection`'s
hydration).

Content authenticity rule (parent spec §5 / interactive-demo spec §5, both restate the same rule):
sample copy is realistic-but-fictional, no fabricated stats presented as real, no Lorem Ipsum above
the fold. This site uses a fictional Vietnamese couple, **Nguyễn Hoàng Minh & Đặng Thanh Hà**, and a
fictional venue, **Ngọc Lan Garden Hall, TP. Thủ Đức**; neither name may resemble a real couple or
venue.

### 3.1 Couple / event details (`Hero` + countdown inputs)

```ts
interface WeddingDetails {
  partnerOneName: string;
  partnerTwoName: string;
  weddingDateIso: string; // fixed future date-time, ISO 8601 with offset — the countdown's single
                           // source of truth (§4.1); never derived from "today" at build/runtime
  venueName: string;
  venueAddress: string;
}

const WEDDING: WeddingDetails = {
  partnerOneName: 'Nguyễn Hoàng Minh',
  partnerTwoName: 'Đặng Thanh Hà',
  weddingDateIso: '2026-12-20T17:00:00+07:00',
  venueName: 'Ngọc Lan Garden Hall',
  venueAddress: '58 Đường Nguyễn Văn Hưởng, TP. Thủ Đức, TP.HCM',
};
```

`weddingDateIso` is a **fixed, hardcoded future date in seed data**, not computed from
`Date.now()` at build time — the countdown (§4) reads this single constant, so the same value
appears in the static-exported HTML's copy (e.g. "Saturday, December 20, 2026") and drives the
client-side countdown's arithmetic; there is exactly one date value in this codebase, never two
that could drift.

`Hero` receives `headline: "${partnerOneName} & ${partnerTwoName}"`, `subhead` formatted from
`weddingDateIso` + `venueName` (e.g. "December 20, 2026 · Ngọc Lan Garden Hall, TP. Thủ Đức").

### 3.2 Photo gallery (`PhotoGallery` items)

```ts
interface Photo {
  id: string;
  src: string;
  alt: string;
}

const PHOTOS: Photo[] = [
  { id: 'photo-1', src: '/gallery/engagement-01.webp', alt: 'Minh and Hà laughing together at their engagement shoot in a Đà Lạt pine forest' },
  { id: 'photo-2', src: '/gallery/engagement-02.webp', alt: 'Close-up portrait of Hà in her engagement áo dài, golden-hour light' },
  { id: 'photo-3', src: '/gallery/engagement-03.webp', alt: 'Minh and Hà holding hands walking along a lakeside path' },
  { id: 'photo-4', src: '/gallery/couple-01.webp', alt: 'Minh and Hà seated together at a café table, candid moment' },
  { id: 'photo-5', src: '/gallery/couple-02.webp', alt: 'Minh and Hà dancing during a rehearsal at Ngọc Lan Garden Hall' },
  { id: 'photo-6', src: '/gallery/family-01.webp', alt: 'Minh and Hà with both families at an engagement gathering' },
  { id: 'photo-7', src: '/gallery/venue-01.webp', alt: 'Ngọc Lan Garden Hall decorated for the reception, string lights over the garden' },
  { id: 'photo-8', src: '/gallery/couple-03.webp', alt: 'Minh and Hà embracing at sunset near the venue garden' },
];
```

Eight photos — a deliberate mix of engagement shoot, candid couple moments, family, and venue shots
so the Hallmark pass (Task 1 of the plan) has real content variety to design a grid/lightbox
around, not a uniform filler set. Every `alt` is a real, specific description (accessibility
criterion #7 of the master spec's design-scoring gate) — never a generic "photo" placeholder.

## 4. Countdown computation logic (page-level, not a kit component)

### 4.1 Inputs and output shape

```ts
interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  hasPassed: boolean; // true once "now" >= weddingDateIso; countdown UI switches to a
                       // "We're married!" state instead of showing negative numbers
}

function computeCountdown(targetIso: string, now: Date): CountdownParts {
  const targetMs = new Date(targetIso).getTime();
  const diffMs = targetMs - now.getTime();
  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, hasPassed: true };
  }
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const seconds = Math.floor((diffMs / 1000) % 60);
  return { days, hours, minutes, seconds, hasPassed: false };
}
```

This function is pure (no `Date.now()` call inside it — `now` is an injected parameter) precisely
so it is unit-testable without faking system time globally: the implementation plan's Task 2 tests
`computeCountdown(WEDDING.weddingDateIso, someFixedDate)` against hand-computed expected values,
plus the `hasPassed` branch for a `now` after `weddingDateIso`.

### 4.2 Render pattern (why this is page-level, client-only, and never blocks first paint)

- `WeddingCountdown` is a `'use client'` component that calls `computeCountdown(WEDDING.weddingDateIso, new Date())`
  and re-renders once a second via a `setInterval` inside `useEffect` (cleared on unmount).
- Per interactive-demo spec §3.1's render-pattern rule, this component's *first* client render (and
  the static-exported HTML it hydrates onto) must not depend on `Date.now()` for its initial paint
  — the static shell renders the human-readable wedding date/venue text (§3.1, always available from
  seed data) immediately; the ticking `days/hours/minutes/seconds` numbers only appear once
  `WeddingCountdown` mounts client-side, avoiding any server/client "now" mismatch (there is no
  server here at all — a static export — but the same discipline avoids a first-paint flash of
  `0d 0h 0m 0s` before the interval's first tick populates real numbers; the component computes its
  first real value synchronously in its own render, not deferred to the first interval tick).
- This is explicitly **not** a `useLocalCollection` feature — the countdown reads no
  visitor-specific state and persists nothing; it belongs in §4, not §5.

## 5. Interactive feature: RSVP form → live guest-count total

Per interactive-demo spec §3.2 row #12: an RSVP form whose submissions accumulate, with a
live-updating "X guests confirmed" total derived from the accumulated responses.

### 5.1 Data shape

```ts
interface RsvpEntry {
  id: string;              // generated client-side (crypto.randomUUID()) at submit time
  name: string;
  attending: 'yes' | 'no'; // RSVP §5.2's extra field, normalized to this union at submit time
  guestCount: number;      // total guests this RSVP represents, including the respondent; 0 when attending === 'no'
}
```

Storage key: **`'wedding-rsvps'`** (fixed by the interactive-demo spec's master data-layer
convention for this site — used verbatim, not a derived/prefixed variant).

### 5.2 RSVP form field set

`InquiryForm`'s base fields (name/email/phone/message, kit-unchanged) plus two extra fields passed
via its existing `fields` prop — `InquiryForm`'s field `type` union (`'text' | 'email' | 'tel' |
'number'`, plan 30 Task 3) has no boolean/select variant, so "attending yes/no" is modeled as a
`text` field with an explicit instruction in its `label`, parsed/normalized to `'yes' | 'no'` by
this site's own submit handler — the same "kit stays generic, site does its own mapping" pattern
corporate's `CallbackSection` and realestate's save-toggle already establish (no kit change):

```ts
const RSVP_EXTRA_FIELDS = [
  { name: 'attending', label: 'Attending? (type "yes" or "no")', type: 'text', required: true },
  { name: 'guestCount', label: 'Number of guests (including yourself)', type: 'number', required: true },
];
```

Submit-time normalization (site-level, inside the RSVP client component's `onSubmit` handler, not
a kit change):
- `attending`: lowercase/trim the raw string; any value other than exactly `'yes'` is treated as
  `'no'` (fail-safe toward "not confirmed" rather than silently counting an ambiguous answer as a
  confirmed guest).
- `guestCount`: `Number(values.guestCount)`, clamped to `0` when `attending === 'no'` (a guest who
  is not attending contributes 0 to the confirmed total regardless of what they typed) and to a
  minimum of `1` when `attending === 'yes'` (a "yes" always represents at least the respondent).

### 5.3 Data flow

1. A client component (`RsvpSection`, mounted at the `id="rsvp"` anchor per §2) calls
   `useLocalCollection<RsvpEntry>('wedding-rsvps', [])` — seeded empty, per the interactive-demo
   spec's instruction for this site: a pre-populated guest list the visitor never submitted would
   misrepresent the live total as already containing real confirmations, the same misleading-UX
   reasoning corporate's callback-requests (§4.2 of that site's spec) and realestate's saved-listings
   (§4.2 of that site's spec) seeds already establish for this program.
2. `InquiryForm` is rendered with `fields={RSVP_EXTRA_FIELDS}`, `submitLabel="Send RSVP"`, and an
   `onSubmit` handler that normalizes the raw form values per §5.2 and calls
   `add({ id: crypto.randomUUID(), name: values.name, attending, guestCount })`.
3. **Live guest-count total** is derived state, not stored separately:
   ```ts
   const confirmedGuests = items
     .filter((entry) => entry.attending === 'yes')
     .reduce((sum, entry) => sum + entry.guestCount, 0);
   ```
   Rendered as `"${confirmedGuests} guests confirmed"` directly beside (or above) the RSVP form —
   it recomputes on every render, so it updates the instant a new RSVP is `add()`-ed, with no
   separate counter to keep in sync.
4. Reload persistence: per the hook's hydration contract (interactive-demo spec §3.1), a page
   reload reads the same `localStorage` key; both the guest-count total and (optionally, per
   implementation) a short "Thanks for your RSVP" list reflect every RSVP submitted in this browser.
5. "Reset demo data" affordance (per hook contract, interactive-demo spec §3.1's `reset()` rule): a
   small, non-prominent control near the RSVP section that calls `reset()`, returning the guest list
   — and the live total — to empty.

## 6. Hallmark design brief

**Industry mood:** warm, intimate, celebratory — a wedding site earns trust through warmth and
craft, not corporate authority. Parent spec §5's starting-family suggestion for this category is a
warm anchor hue (terracotta/rose) with a serif display — this is a **non-binding starting direction
only** — the real Hallmark session (Task 1 of the implementation plan) may deviate from it if
research supports a different direction, as long as it clears the design-scoring gate (master spec
§8), particularly criterion #10 (distinctiveness against the other 28 sites — `restaurant`,
`beauty`, and `photography` also start from the same warm/serif family per parent spec §5, so
`wedding` must not read as a re-skin of any of them).

**Reference directions to research during the Hallmark pass** (starting points, not commitments):
1. Contemporary Vietnamese wedding-invitation and wedding-website design (the "save the date /
   digital thiệp cưới" register: elegant restrained ornament, a warm romantic palette, legible
   countdown/RSVP UI patterns already familiar to a Vietnamese guest) — useful for what to emulate
   selectively, not to copy wholesale (would read as a generic wedding-template-generator output,
   failing criterion #1).
2. Editorial fine-art wedding photography sites (large-format imagery, generous whitespace,
   confident serif type pairing) — a source for how to make `PhotoGallery`'s grid/lightbox feel like
   a considered photo story rather than a default thumbnail wall.
3. Botanical/garden-event branding (since the fictional venue is a garden hall) — a possible source
   for a distinguishing motif (line-art florals, a specific green/terracotta balance) that keeps this
   site's warm palette from collapsing into an identical rose-gold cliché shared by every wedding
   template on the market.

Actual token values (accent hue, type pairing, spacing scale, motion durations) are Task 1's output,
not this spec's — per master spec §9, this is intentionally deferred to the real Hallmark session.
