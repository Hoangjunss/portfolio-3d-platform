# Photography Demo Site — Content & Data Spec

Date: 2026-09-20
Status: Approved (scoped by `2026-09-20-interactive-demo-templates-design.md` §3.2 row #18 and
`2026-09-20-template-design-system-design.md` §3 row #18)

## 1. Context & Scope

This is a thin, mostly-data spec for one of the 29 demo sites in the interactive-demo templates
program — category #18, **Photography Studio**. Per the parent spec's §9 execution order, this
site's plan is `2026-09-20-48-photography.md` (plan 48). The architecture (component kit,
`useLocalCollection` hook, per-site Hallmark design convention, folder/build convention) is already
fixed by the two governing specs; this document fixes only what is specific to `photography`: the
fictional studio, its sample content, its seed data shapes, its interactive feature's exact data
flow, and its Hallmark design brief.

- Slug: `photography`, `subdomain`: `photography`, `category`: `photography`, `display_order`: 18
  — fixed by plan 30 Task 1's authoritative slug table; do not deviate.
- Folder: `templates/photography/`.

## 2. Section composition

Per parent spec §3 row 18 ("Full-bleed photo gallery (masonry) + packages/pricing") and the
interactive-demo spec's component behavior contract:

`Hero` → `PhotoGallery`(full-bleed, `layout="masonry"`, `lightbox={true}`) → `PricedItemGrid`
(packages/pricing) → `Footer`

- `Hero`: studio name, one-line specialty positioning, CTA to the gallery section.
- `PhotoGallery`: the studio's full portfolio, full-bleed (the section itself spans the page's full
  width, not a contained column — a layout decision for Task 2, not a new component prop), masonry
  layout, lightbox on. This is also where the favorite/filter interactive feature (§4) lives.
- `PricedItemGrid`: the studio's 3 packages, VND pricing.
- `Footer`: standard link set (per `template-kit`'s `Footer` contract — links + social on/off, this
  site's exact values are a Task 2 implementation detail, not fixed here).

## 3. Fictional studio

**Name:** Mộc Ảnh Studio ("Mộc" — wood/natural, evoking warm, unpolished, editorial-documentary
photography rather than a glossy commercial look).

**Specialty:** Wedding and portrait photography, with a documentary/editorial style (candid
storytelling over posed studio shots) — chosen because it gives the gallery natural variety
(ceremony, portrait, detail, location) that reads well in a masonry layout, and it pairs naturally
with a warm mood family (§5) distinct from the cooler moods already assigned to other categories in
this program (Corporate, SaaS, Legal, Automotive, Construction, the 3 CRM variants, `blog-tech`).

**One-line positioning (for `Hero`):** "Đám cưới và chân dung, kể bằng khoảnh khắc thật." ("Weddings
and portraits, told through real moments.")

## 4. Gallery seed data (`PhotoGallery`)

13 photos — realistic-but-fictional captions, no fabricated stats, no client names presented as
verifiable testimonials (master spec §5/§8 criterion 8). `id` is a stable string; `src` paths are
placeholders under `/gallery/` for Task 2 to supply as real (even if stock/generated) images —
content authenticity applies to copy, not to requiring real client photography for a demo site.

| `id` | `src` | `alt` / caption |
|---|---|---|
| `photo-01` | `/gallery/01-ceremony-arch.webp` | Cô dâu chú rể trao nhẫn dưới giàn hoa, lễ cưới ngoài trời tại Đà Lạt |
| `photo-02` | `/gallery/02-portrait-window-light.webp` | Chân dung cô dâu bên cửa sổ ánh sáng tự nhiên, buổi sáng chuẩn bị |
| `photo-03` | `/gallery/03-detail-rings.webp` | Cận cảnh nhẫn cưới đặt trên thiệp mời viết tay |
| `photo-04` | `/gallery/04-first-dance.webp` | Khoảnh khắc nhảy đầu tiên của cô dâu chú rể trong tiệc tối |
| `photo-05` | `/gallery/05-family-group.webp` | Ảnh nhóm gia đình hai bên sau lễ gia tiên |
| `photo-06` | `/gallery/06-groom-prep.webp` | Chú rể thắt cà vạt, hậu trường chuẩn bị buổi sáng |
| `photo-07` | `/gallery/07-portrait-couple-field.webp` | Chân dung đôi uyên ương giữa cánh đồng hoa cải lúc hoàng hôn |
| `photo-08` | `/gallery/08-candid-guests-laughing.webp` | Khách mời cười vui trong lúc tiệc, khoảnh khắc tự nhiên không dàn dựng |
| `photo-09` | `/gallery/09-detail-bouquet.webp` | Bó hoa cưới đặt trên bàn gỗ mộc, ánh sáng cửa sổ |
| `photo-10` | `/gallery/10-portrait-solo-bw.webp` | Chân dung đen trắng, người mẫu studio, ánh sáng cửa sổ lớn |
| `photo-11` | `/gallery/11-reception-toast.webp` | Khoảnh khắc nâng ly chúc mừng của quan khách |
| `photo-12` | `/gallery/12-couple-walking-street.webp` | Đôi uyên ương đi dạo phố cổ Hội An, ảnh dạo phố |
| `photo-13` | `/gallery/13-detail-invitation-flatlay.webp` | Flatlay thiệp cưới, nhẫn, và hoa cài áo trên nền vải lanh |

## 5. Packages/pricing seed data (`PricedItemGrid`)

3 packages, `currency: 'VND'`, matching `PricedItemGrid`'s `{id, title, price, image?}` contract
(the description text below is additional copy this site renders alongside the kit's price/title
fields — Task 2's implementation detail how it's laid out, not a new component prop).

| `id` | `title` | `price` (VND) | Includes (descriptive copy, not a new prop) |
|---|---|---|---|
| `pkg-essential` | Gói Cơ Bản | 8,500,000 | 1 photographer, 6 giờ chụp, 300 ảnh đã chỉnh sửa, 1 album in 20 trang |
| `pkg-signature` | Gói Signature | 15,900,000 | 2 photographers, 10 giờ chụp (lễ + tiệc), 600 ảnh đã chỉnh sửa, 1 album in 30 trang, 1 video highlight 3 phút |
| `pkg-premium` | Gói Trọn Gói | 26,000,000 | 2 photographers + 1 quay phim, trọn ngày (chuẩn bị đến hết tiệc), toàn bộ ảnh gốc + 900 ảnh đã chỉnh sửa, 2 album (gia đình + khách), video full 15 phút |

## 6. Favorite / filter interactive feature

Per interactive-demo spec §3.2 row #18: "Favorite" toggle on gallery photos → favorites lightbox
filter.

- **Hook:** `useLocalCollection<FavoritePhoto>('photography-favorites', [])` — seeded empty (no
  photo is pre-favorited; nothing to fabricate here, an empty seed is the correct seed per §3.1's
  hydration contract).
- **Shape:** `FavoritePhoto = { id: string; photoId: string; favoritedAt: string }` — `id` is the
  favorite record's own id (`crypto.randomUUID()` at favorite time, matching plan 31's
  `CallbackRequest` precedent), `photoId` references one of §4's 13 `photo-NN` ids, `favoritedAt` an
  ISO timestamp.
- **Data flow:**
  1. Static shell renders all 13 photos from `data/seed.ts`'s `PHOTOS` array directly (server/static
     export, per the render-pattern rule — never gated behind hydration).
  2. A client component (`PhotoGallerySection`, Task 3) mounts after the static shell, calls
     `useLocalCollection('photography-favorites', [])`, and renders a per-photo "Favorite" toggle
     (a heart/star icon button, accessible name e.g. "Favorite [caption]") over/beside each
     `PhotoGallery` item.
  3. Toggling a non-favorited photo calls `add({ id, photoId, favoritedAt })`; toggling an already-
     favorited photo calls `remove(id)` (looked up by `photoId` in the current `items`).
  4. A filter control ("Show all" / "Show favorites only", e.g. a toggle button or checkbox) switches
     the gallery's rendered photo set between the full 13-photo `PHOTOS` array and the subset whose
     `id` is in `items.map(f => f.photoId)`.
  5. The lightbox (parent spec §4 `PhotoGallery` component, `lightbox={true}`) opens on whichever
     filtered set is currently displayed — favoriting/filtering never removes lightbox behavior, it
     only changes which photos are in it.
  6. Reload: `useLocalCollection`'s hydration contract (interactive-demo spec §3.1) makes a
     favorited photo stay favorited and the last-selected filter state is **not** required to
     persist (filter is transient UI state, `favorites` is the persisted data) — Task 3's test
     verifies the favorite itself persists across remount, not the filter toggle position.
- **Why `SavedItemsPanel` is not used here:** unlike Real Estate/Agency/Travel's "saved item from a
  catalog" pattern, Photography's favorite is a same-page filter control on the gallery already
  visible, not a separate panel listing saved items elsewhere on the page — per interactive-demo
  spec §3.2 row #18's literal wording ("favorites lightbox filter", not "a saved-items panel"). This
  mirrors plan 31's corporate site precedent of deviating from a shared kit component when its
  contract doesn't fit (`site-corporate-design.md` §4.3).

## 7. Hallmark design brief

**Mood family (non-binding starting direction):** warm anchor hue, serif or humanist-serif display
pairing — per parent spec §5's Photography cluster ("warm anchor hue (terracotta/rose), serif
display"). This is a starting direction only; the real Hallmark session (plan 48 Task 1) may deviate
if its research supports a different direction, as long as the result clears master spec §8's
scoring bar, especially criterion #10 (distinctiveness against Restaurant/Beauty/Wedding, the other
three categories sharing this warm-serif starting cluster).

**Reference directions to research (2-3, not a blend of all three):**

1. **Documentary wedding photographer portfolios** — the visual language of independent,
   editorial-style wedding/portrait photographers' own sites: gallery-first, minimal chrome, type
   used sparingly so images carry the page. Relevant because Mộc Ảnh's positioning (§3) is
   documentary-over-posed.
2. **Vietnamese/SEA boutique studio branding** — warm, natural-material textures (linen, wood,
   film-grain treatments) as seen in independent Vietnamese wedding studios' branding, to keep the
   site legible as a Vietnamese-market business rather than a generic Western portfolio template.
3. **Film-photography-adjacent editorial layout** — asymmetric masonry grids, generous whitespace,
   a restrained serif/humanist-serif pairing (echoing analog print portfolios) — useful research for
   making the required masonry `PhotoGallery` layout (§2) feel intentional rather than a default
   Pinterest-style grid, which is exactly the anti-generic risk master spec §8 criterion #1 flags.

**Explicitly not fixed here (Hallmark session's own output, per the "no fabricated token values"
deferral):** exact hex/OKLCH accent value, exact font family names, spacing scale, motion
durations/easings. Task 1 of plan 48 produces these as `templates/photography/theme.ts` and
`app/globals.css`.

## 8. Open items

- Real photography (or licensed/generated stand-in imagery) for the 13 `/gallery/*.webp` paths in
  §4 is a Task 2 implementation detail, not fixed by this spec — same convention as plan 31's
  placeholder-but-valid `thumbnail.webp`.
- `public/thumbnail.webp` for the `templates` table carousel: a masonry-gallery screenshot or a
  single hero portrait, admin's manual upload step per parent spec §6 — out of scope here.
