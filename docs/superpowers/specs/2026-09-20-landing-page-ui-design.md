# Landing Page UI/UX Design — Portfolio 3D Platform

Date: 2026-09-20
Status: Design approved by Hallmark flow — ready to feed the implementation plan
Author tool: Hallmark (`hallmark` skill), genre + macrostructure + theme decisions below
Scope: the **public landing page** only (`frontend/app/page.tsx` and its sections). Does **not**
cover the 3D carousel internals (already specced in `docs/superpowers/plans/2026-09-19-12-3d-carousel.md`)
or the `/admin` dashboard (separate design pass — see companion specs for the 6 missing admin
screens and for Sub-project 2, the 20-template design system).

---

## 1. Brief (as inferred, per Hallmark's design-context gate)

- **Audience:** SME owners evaluating a ready-made website instead of hiring an agency — not
  developers. They judge quality visually, fast.
- **Use case:** (1) preview a template in the 3D carousel, (2) open the live demo in a new tab,
  (3) submit the lead/contact form to get in touch. Two conversion points, not one.
- **Tone:** **Luxury** — matches the design spec's own words ("looks visually premium").

## 2. Hallmark decisions

| Axis | Pick | Why |
|---|---|---|
| Genre | Editorial (silent default) | No SaaS/atmospheric/playful signal; agency-showcase energy fits editorial |
| Macrostructure | **Marquee Hero** | The company *is* the statement; lets the 3D carousel (not the hero) carry the visual weight immediately below the fold |
| Nav | **N9 Edge-aligned minimal** | Wordmark hard-left, one CTA hard-right, vast negative space — luxury/Apple-product-page register; listed as acceptable under editorial |
| Footer | **Ft1 Mast-headed** | Wordmark + tagline + a few small links (Admin login, Contact) — editorial default |
| Theme | **Custom — "Atelier-warm"** | Warm-bronze anchor (hue ~55–70), light paper, high-contrast serif display — not a 1:1 catalog theme because luxury needs a tuned warm palette |
| Type pairing | **Fraunces** (display) + **EB Garamond** (body) + **Geist Mono** (outlier, wordmark only — 2 slots: nav + footer) | Luxury-tier free pairing (`typography.md`); Marquee Hero needs a *contrasting* wordmark face, not a same-family collapse |
| Enrichment | **None — typography only** | The 3D carousel section immediately below the fold is the image moment; a second visual in the hero would compete with it |
| Motion | Quiet — one reveal per section, IntersectionObserver, `prefers-reduced-motion` respected | Editorial genre default: "one orchestrated entrance, no bounces" |

This is the **first Hallmark run** for this project — no `.hallmark/log.json` yet, so no
diversification constraint applies. The log has been seeded (see §7).

## 3. Design tokens

Full token file: `frontend/tokens.css` (already written, portable, OKLCH-only, no pure black/white,
no Inter/Roboto/system-ui default). Summary:

- **Paper** `oklch(97% 0.010 70)` (light) / `oklch(15% 0.010 55)` (dark)
- **Ink** `oklch(20% 0.012 55)` (light) / `oklch(94% 0.008 70)` (dark)
- **Accent** `oklch(58% 0.150 55)` — warm bronze, used at ≤3% of any viewport (focus rings, active nav
  item, one underline, the CTA border/text — never a filled block)
- **Type scale** 1.25 ratio, `--text-display` capped at `clamp(2.75rem, 5vw + 1rem, 5.25rem)`
- **Spacing** 4pt scale, named tokens `--space-3xs` → `--space-4xl`
- **Motion** `--dur-micro/short/long` (120/220/420ms), `--ease-out/in/in-out` — no browser-default `ease`

`app/globals.css` must `@import "../tokens.css";` **above** the existing `@tailwind` directives
(append-only — do not remove the three `@tailwind` lines already there).

## 4. Section-by-section design

Sections, in DOM order: **Nav → Hero → 3D Carousel (plan 12) → About → Services → Contact → Footer**.

### 4.1 Nav — N9 Edge-aligned minimal

- Wordmark hard-left, set in `--font-wordmark` (Geist Mono, uppercase, `letter-spacing: 0.08em`,
  small — this is not a logo image).
- One CTA hard-right: **"Xem template"** (scrolls to the 3D carousel anchor `#templates`). No link
  row — the absence of clutter *is* the design, matching N9's "luxury sites" note.
- Sticky, transparent over the hero, gains `--color-paper` background + hairline bottom rule after
  scrolling past the hero (single state change, not a scroll-linked animation).
- Mobile (< 40rem): unchanged — wordmark + CTA stay edge-aligned; CTA gets a 44×44px min hit target.

### 4.2 Hero — Marquee, typography-only

- Fills the fold. No subhead, no CTA, no image inside the fold (per Marquee Hero rules).
- Headline (≤ 50 chars, honest — no invented metric):
  > **"See your site before you build it."**
  Set in `--font-display` (Fraunces), left-biased (not centred — editorial ban on centred-everything
  heroes), size `--text-display`.
- A single thick horizontal rule (`--color-rule`, 2px) divides hero from the section below — the
  Marquee Hero "hard colour/rule change" beat.
- Content for this line and any hero microcopy comes from the BE `content_sections` API
  (`section_key = "hero"`), not hardcoded — per design spec §4. If the CMS value is empty, fall back
  to the string above, never to an empty heading.

### 4.3 3D Carousel — unchanged, cross-reference only

This section's implementation is fully specced in plan 12. This design doc only fixes its **visual
integration** with the rest of the page: the carousel section sits directly beneath the hero's rule,
uses the same `--color-paper` background (no boxed/carded container around the whole carousel — no
card-in-card), and its section head (if any) uses archetype **S2 Hanging** (see §4.4) for consistency
with About/Services below it.

### 4.4 About — prose block, S2 Hanging section head

- Section head: **S2 Hanging** — heading floats in negative space above the block, no border, no
  numbered eyebrow (numbered/eyebrow-left patterns are banned — gate 54).
- Heading (small, `--text-lg`, `--font-display`): **"Một xưởng, hai mươi bản thiết kế."**
  ("One workshop, twenty designs.") — luxury voice pattern: *named scale, refusal of the verb*
  (see `copy.md` § Luxury).
- Body copy (`--font-body`, max `65ch`): describes the actual product truthfully — 20 handcrafted
  templates, one shared 3D showroom experience, a Spring Boot admin behind every one of them. **No
  invented metrics** (no "+X% conversion", no "trusted by N companies" — none of that exists yet).
- Layout: asymmetric two-column — narrow left margin (caption-only, e.g. "Est. cho 20 mẫu website"),
  wide right column for the prose. This is the *permitted* wide-left-margin technique (body-level
  caption, not a numbered eyebrow paired with the heading).

### 4.5 Services — F4 Step sequence

- Section head: S2 Hanging again (same archetype reused deliberately — About and Services share the
  page's editorial rhythm; reserving S2 for both is a coherence choice, not a diversification
  violation, since diversification applies *across* Hallmark runs/pages, not within one page's
  repeated section-head role).
- Body: **F4 Step sequence**, numbering `01 / 02 / 03`, vertical stack:
  1. **Xem trước trong 3D** — browse the carousel, open a live demo in a new tab.
  2. **Chọn & tuỳ biến nội dung** — pick a template, request copy/branding changes through the admin
     team.
  3. **Ra mắt trên subdomain của bạn** — launched and managed through the same Spring Boot admin
     system that runs this platform.
- No invented feature-icon grid (gate 3 — three-column equal-icon-tile feature grid is banned).
  The step sequence *is* the differentiation from a generic 3-card layout.

### 4.6 Contact — lead capture form

Not a component-cookbook CTA archetype (C2 inline-form-as-CTA is single-field only); this is a
dedicated multi-field form section, composed manually:

- Two-column split at ≥ 60rem: **left** = heading + one short line of reassurance copy (no fake
  urgency, no "Limited spots!"); **right** = the form.
- Fields, matching the `leads` table (design spec §6) and `LeadForm` (BE, plan 07): **Họ tên**,
  **Email**, **Số điện thoại** (optional), **Nội dung** (textarea). Labels describe, don't abbreviate
  ("Số điện thoại", not "SĐT").
- Submit button: verb-labelled — **"Gửi yêu cầu tư vấn"**, not "Submit" / "Gửi" alone.
- All 8 interaction states per field (default/hover/focus-visible/active/disabled/loading/error/
  success) — see `interaction-and-states.md` at implementation time. Error copy follows the 3-part
  rule (what happened → why → what to do), e.g. "Không gửi được yêu cầu. Máy chủ không phản hồi. Thử
  lại sau ít phút hoặc gọi trực tiếp."
- On success: silent success (field values clear, a small inline confirmation line appears in place
  of the button) — not a celebratory toast, per editorial's "quiet" motion stance.
- Below 40rem: label above input, submit button full-width, fields stack vertically.

### 4.7 Footer — Ft1 Mast-headed

- Wordmark (Geist Mono, same as nav) + one short tagline in `--font-body` italic (body-copy italic is
  allowed — it's the only place italics appear; the heading font stays roman everywhere).
- Small link row beside it: **Đăng nhập quản trị** (→ `/admin/login`), **Liên hệ** (anchors to §4.6).
- One line of copyright, muted colour, small caps tracked. No social icon row (none exist yet — don't
  fabricate placeholder social links).

## 5. Motion

- One `reveal` keyframe (opacity 0 → 1, `translateY(8px)` → `0`) per section, triggered by
  `IntersectionObserver`, staggered by DOM index, capped at ~500ms total stagger.
- The rule divider between Hero and the 3D carousel does **not** animate — it's a static structural
  element, not a transition.
- 3D carousel's own motion (drag/rotate/focus-enlarge) is out of scope here — specced in plan 12.
- Full `prefers-reduced-motion: reduce` fallback: collapses every `reveal` to a 150ms opacity
  crossfade (already declared in `tokens.css`).

## 6. Responsive (mobile non-negotiables, verified at 320/375/414/768px)

- `overflow-x: clip` on `html` and `body` (already in `tokens.css`) — no horizontal scroll anywhere.
- No two-line clickable text: nav CTA, footer links, form submit button all fit on one line at 320px
  (short verb labels chosen specifically for this — "Gửi yêu cầu tư vấn" fits at the chosen type
  scale; re-measure at build time and shorten further if it wraps).
- Hero headline wraps inside long words (`overflow-wrap: anywhere`) and steps down to
  `--text-display-s` below 40rem per the hero-shrink rule for Marquee Hero.
- About's asymmetric two-column collapses to one column below 60rem (caption moves above the prose,
  not beside it).
- Services' F4 step sequence stays vertical at all widths (it already is) — numbering moves inline
  with the step heading below 40rem instead of hanging in a left margin.
- Contact's two-column split collapses to a single column below 60rem, form fields full-width below
  40rem.

## 7. Slop-test self-check (inline, no live page shipped yet)

This design doc is tokens + section spec, not rendered code, so the full 58-gate pass happens at
implementation time against the actual markup. Checked now, against the decisions above:

- No pure `#000`/`#fff` — tokens use tinted OKLCH paper/ink. ✓
- No Inter/Roboto/system-ui default — Fraunces + EB Garamond + Geist Mono (outlier, 2 slots only). ✓
- No centred-everything hero — left-biased headline. ✓
- No card-in-card around the 3D carousel. ✓
- No three-column equal-icon feature grid for Services — replaced with F4 step sequence. ✓
- No eyebrow-left/heading-right hanging header (gate 54) — About's left margin holds only a caption,
  never a numbered eyebrow paired with the heading. ✓
- No fabricated metrics/testimonials anywhere (About, Services). ✓
- No italic display headings — italic reserved for the footer tagline (body copy). ✓

`.hallmark/log.json` entry to add at implementation time:
```json
{ "date": "2026-09-20", "macrostructure": "Marquee Hero", "theme": "custom",
  "theme_axes": "light / high-contrast-serif / warm", "vibe": "warm atelier, premium, unhurried",
  "enrichment": "none", "brief": "Portfolio 3D Platform — landing page" }
```

## 8. Handoff

This spec is the design input for a new implementation plan
(`docs/superpowers/plans/2026-09-20-19-landing-page-sections.md` or similar numbering) to be written
via the `writing-plans` skill — TDD steps for `HeroSection`, `AboutSection`, `ServicesSection`,
`ContactForm` (+ its backend wiring, since `leads` POST already exists from plan 07), `SiteNav`,
`SiteFooter`, each as its own client/server component under `frontend/app/`.

Still open (tracked separately, not this doc):
- 6 missing admin dashboard screens (content editor, media library, user management UI, audit log
  viewer, error log viewer, settings page) — backend APIs exist (plans 04, 06, 10), no plan yet.
- Sub-project 2 — Template Design System for the 20 demo sites (design spec explicitly says "not yet
  written / to be brainstormed separately", §10 of the main design spec).
