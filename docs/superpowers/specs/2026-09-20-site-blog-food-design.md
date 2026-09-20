# Site Spec — Food/Recipe Blog (`blog-food`)

Date: 2026-09-20
Status: Approved (one of the 3 extra Blog/Magazine variants under the interactive-demo templates
program, interactive-demo spec §4.2)

## 1. Context & Scope

This is a thin, mostly-data/content spec for one of the 29 demo template sites defined by
`2026-09-20-interactive-demo-templates-design.md` (§4.2 — the food/recipe blog variant, §9
execution order — this is plan 56, one of plans 31-59). It does not redefine architecture: the
interactive mechanism (`CommentThread` + `useLocalCollection`, keyed per post), the shared
component behavioral contracts, the `useLocalCollection` hydration contract, folder convention,
and the build/test gates are all already fixed by the master spec and by the baseline blog site's
own precedent (`docs/superpowers/specs/2026-09-20-site-blog-design.md`,
`docs/superpowers/plans/2026-09-20-37-blog.md`). This spec states only:

- the exact page/route composition for this site, with its image-forward article-list layout
  emphasis,
- the seed data shape and sample food/recipe blog post content,
- the per-post comment interactive feature's exact data flow (this site's storageKey prefix),
- a Hallmark design brief (mood direction + research pointers, not fixed token values).

**Slug:** `blog-food` — folder `templates/blog-food/`, `category` `blog` (interactive-demo spec §6
folder convention; the exact `display_order` for this site is whatever value plan 30 Task 1's
authoritative 29-row slug table assigns it — this spec does not restate that table).

**Distinct from the baseline `blog` and from `blog-lifestyle`:** the baseline (`blog`) is a
general-interest magazine, deliberately not niche. `blog-lifestyle` is also a warm-hue/serif
direction, but a lifestyle/travel magazine with an ordinary text-forward article-list layout.
`blog-food` shares the warm-hue/serif family with `blog-lifestyle` but is differentiated by (a) its
subject — food/recipes, not lifestyle/travel — and (b) its **image-forward article-list layout**:
each post's featured image is a first-class, large visual element on the list page, not a small
thumbnail accompanying mostly-text cards. Nothing in this spec is written for `blog` or
`blog-lifestyle`; each variant is its own plan and reuses only the shared architecture.

## 2. Page/route composition

Same section composition as the baseline `blog` site (article list + category tag cloud + article
detail with `CommentThread`), with one layout difference called out explicitly below:

```
/               → Hero → ArticleList (image-forward, paginated) → TagCloud → Footer
/posts/[slug]   → Hero-style article header (incl. featured image) → article body → CommentThread → Footer
```

- **`/` (`app/page.tsx`)** — the article list page:
  - **`Hero`** (kit component) — masthead/headline/subhead for the food blog, with a CTA (e.g.
    label "See today's recipe", `ctaHref="#articles"` anchoring to the list below), matching
    `Hero`'s existing required-prop contract (same approach as the baseline blog spec §2 — no
    invented optional-CTA variant).
  - **`ArticleList` — image-forward layout (this site's distinguishing layout emphasis).** Page-local
    composition reusing `ItemGrid`'s `GridItem` shape (`title`, `description`, `image`), same as
    the baseline, but with a layout treatment that makes each post's featured image the dominant
    visual element of its card rather than a supporting thumbnail:
    - Each card's `image` renders at a large aspect ratio (a tall/generous image area, e.g. a 4:3
      or 3:2 ratio filling most of the card's visible height) **above** the title/excerpt/tag text
      block, not beside a small thumbnail.
    - The featured (most recent) post on first load renders as a single, larger "lead" card
      spanning more grid width than the rest of the list, so the very first thing a visitor sees is
      a large photograph of that post's dish — the image-forward emphasis this spec's layout
      section exists to document. The remaining posts render in a standard grid beneath it, each
      still image-dominant per the paragraph above.
    - This is a layout/CSS treatment within `ItemGrid`'s existing card shape and `ArticleList`'s
      existing page-local-component status (same rationale as baseline blog spec §2(d) — not a new
      kit component); it does not add a new prop to `ItemGrid` itself, it only changes how this
      site's page-local `ArticleList` arranges/sizes the `image` region of each card via its own
      CSS, consistent with `template-kit`'s "components define behavior, sites define presentation
      within it" rule (master spec §5).
  - **Static pagination** — identical mechanism to the baseline blog spec §3.2: the full seed array
    ships in the static export; a page-local "Load more" reveals more of the *already-bundled*
    array; not a second route, not an API call. Initial page size: 4 posts (matching baseline),
    with the single lead card (above) counted as the first of those 4, not an additional 5th slot.
  - **`TagCloud`** — same mechanism as baseline blog spec §3.3: derived from the seed data's
    distinct `tag` values, sorted, filters the visible list client-side; not persisted.
  - **`Footer`** (kit component) — same as baseline.
- **`/posts/[slug]` (`app/posts/[slug]/page.tsx`)** — the article detail page:
  - A header showing the post's title, tag, publish date, and its featured image rendered large
    (this page also honors the image-forward direction — the featured image is a full-width hero
    image above the body, not a small inline thumbnail), followed by the post body (paragraphs from
    the seed data's `body` field, including any ingredient/step structure noted in §3.1).
  - **`CommentThread`** (kit component) — the interactive feature (§4 below).
  - **`Footer`** (kit component) — same as list page.

## 3. Seed data

All seed data lives in `templates/blog-food/data/seed.ts`, statically importable at build time
(interactive-demo spec §3.1 render-pattern rule): the article list, each article's body, and the
tag cloud are all **static content** rendered directly from this seed file — only per-post comments
(§4) go through `useLocalCollection`.

Content authenticity rule (master spec §5 / interactive-demo spec §5): sample copy is
realistic-but-fictional, no fabricated stats presented as real, no Lorem Ipsum above the fold. This
site is a fictional food/recipe blog, **Bếp Nhỏ** ("Bếp Nhỏ" = "little kitchen" — a warm, home-cook
register distinct from a professional/restaurant brand, fitting a recipe-blog rather than a
lifestyle-magazine register).

### 3.1 Posts (`ArticleList` items + `/posts/[slug]` content)

Every post's featured image is noted explicitly (a short descriptive caption of the dish/scene the
placeholder image should depict; actual image assets are a later admin/media-library concern, same
as the baseline blog's thumbnail convention — this spec fixes *content*, not binary assets).

```ts
interface BlogPost {
  id: string;          // used as the URL slug, e.g. 'weeknight-tomato-braised-chicken'
  title: string;
  excerpt: string;      // 1-2 sentences, shown on the list page card
  tag: string;          // exactly one category tag per post — drives the TagCloud
  publishedAt: string;  // ISO date, display-only
  featuredImage: string; // short descriptive caption of the image this post's card/hero should show
  body: string[];       // paragraphs, rendered on the detail page in order
}

const POSTS: BlogPost[] = [
  {
    id: 'weeknight-tomato-braised-chicken',
    title: 'Weeknight Tomato-Braised Chicken, One Pan',
    excerpt: 'Thirty-five minutes, one pan, and a sauce good enough to eat with a spoon once the chicken is gone.',
    tag: 'Weeknight',
    publishedAt: '2026-08-10',
    featuredImage: 'Overhead shot of bone-in chicken thighs braised in a rich red tomato sauce, in a wide cast-iron pan, steam still rising',
    body: [
      'This is the dish I make when the week has already won and dinner still needs to happen. One pan, thighs seared skin-side down until the fat renders, then braised in crushed tomatoes with garlic and a torn handful of basil until the sauce reduces to something you want to mop up with bread.',
      'The trick that makes it taste like more effort than it is: do not rush the sear. Six full minutes, undisturbed, skin-side down, before you flip anything. That is where all the flavor actually comes from — everything after is just simmering.',
      'Serve it straight from the pan with crusty bread, or spoon it over rice if you want the sauce to go further. Leftovers, if there are any, are better the next day.',
    ],
  },
  {
    id: 'the-rice-cooker-is-underrated',
    title: 'Your Rice Cooker Can Do More Than Rice',
    excerpt: 'A look at the humble rice cooker as a genuine one-pot dinner tool, not just a rice appliance gathering dust.',
    tag: 'Kitchen Tools',
    publishedAt: '2026-07-28',
    featuredImage: 'A rice cooker open on a kitchen counter, filled with rice, sliced sausage, and vegetables, garnished with scallions',
    body: [
      'Most rice cookers spend 90% of their life making plain rice and the other 10% sitting unused on a shelf. That is a waste of a genuinely capable one-pot appliance — most models will happily steam vegetables, poach eggs, and turn out a full rice-and-protein dinner in a single cycle.',
      'The simplest version: rice, water, a layer of sliced Chinese sausage or marinated chicken on top, start the cooker, walk away. By the time the rice finishes, the protein on top has steamed through and the rendered fat has worked its way down into the rice.',
      'It will never replace a stovetop for a dish that needs real reduction or a hard sear, but for a lazy, genuinely good weeknight dinner with almost no attention required, it earns its counter space back.',
    ],
  },
  {
    id: 'why-your-cookies-spread-too-thin',
    title: 'Why Your Cookies Keep Spreading Too Thin',
    excerpt: 'Flat, greasy cookies are almost always a temperature problem, not a recipe problem. Here is how to fix it.',
    tag: 'Baking',
    publishedAt: '2026-07-15',
    featuredImage: 'Close-up of a batch of thick, craggy chocolate chip cookies cooling on a wire rack',
    body: [
      'The single most common cause of flat, greasy cookies is butter that was too warm when it went into the dough — not the recipe, not the oven, not the flour. Butter that is soft enough to leave a thumbprint but still cool to the touch is the right texture; fully melted or room-warm butter spreads before the structure sets.',
      'The second most common cause is skipping the chill. Thirty minutes in the fridge before baking lets the fat firm back up and the flour fully hydrate, both of which slow the spread in the oven long enough for the cookie to set its shape before it flattens.',
      'If both of those check out and cookies are still spreading, the oven is probably running cool — an oven thermometer is a five-dollar fix for a problem that otherwise looks unsolvable.',
    ],
  },
  {
    id: 'a-simple-case-for-cooking-with-stock',
    title: 'A Simple Case for Always Having Stock on Hand',
    excerpt: 'One ingredient swap — water to stock — improves more dishes than almost any technique.',
    tag: 'Pantry',
    publishedAt: '2026-06-30',
    featuredImage: 'A pot of simmering golden chicken stock with vegetables and herbs visible, steam rising, on a stovetop',
    body: [
      'If there is one swap that upgrades more home cooking than any technique tip, it is replacing water with stock wherever a recipe calls for liquid — rice, braises, pan sauces, soups, even the water you blanch vegetables in.',
      'You do not need a from-scratch, all-day stock for most of this. A decent low-sodium store-bought stock, or a simmered-for-an-hour version made from vegetable scraps and a leftover roast chicken carcass kept in the freezer, does almost all of the same work.',
      'Keep a container of stock in the freezer at all times, in ice-cube-tray-sized portions for small additions and quart-bag portions for soups. It is the single easiest habit that makes ordinary weeknight cooking taste more finished.',
    ],
  },
  {
    id: 'five-vegetables-worth-roasting-hot',
    title: 'Five Vegetables That Want a Very Hot Oven',
    excerpt: 'Roasting vegetables timid, at 375°F, is the most common reason they come out soft and sad instead of caramelized.',
    tag: 'Vegetables',
    publishedAt: '2026-06-12',
    featuredImage: 'A sheet pan of deeply caramelized roasted vegetables — broccoli, carrots, and Brussels sprouts — with charred edges',
    body: [
      'Broccoli, Brussels sprouts, carrots, cauliflower, and asparagus all improve dramatically at 450-475°F instead of the more timid 375°F a lot of recipes default to. The higher heat is what produces real caramelization at the edges instead of just soft, steamed vegetables that happened to be in an oven.',
      'The other common mistake is crowding the pan. Vegetables piled two deep steam each other instead of roasting — give them room to breathe, even if that means two sheet pans instead of one.',
      'Toss with oil and salt, spread in a single layer with space between pieces, and resist the urge to check on them constantly — opening the oven door repeatedly drops the temperature and undoes exactly the high heat that makes this work.',
    ],
  },
  {
    id: 'the-case-for-a-sunday-sauce',
    title: 'The Case for a Standing Sunday Sauce',
    excerpt: 'One pot of sauce, simmered once a week, quietly makes four other dinners easier.',
    tag: 'Meal Prep',
    publishedAt: '2026-05-29',
    featuredImage: 'A large pot of slow-simmered red sauce with meatballs, ladle resting on the rim, kitchen counter in soft background',
    body: [
      'A standing Sunday sauce — a big pot of slow-simmered tomato sauce, with or without meatballs, made once a week — does more for the rest of the week than almost any other single kitchen habit.',
      'The sauce itself takes maybe twenty minutes of active work spread across a few hours of mostly-unattended simmering. What it buys back is four or five weeknight dinners that are now just "boil pasta, reheat sauce" instead of a full meal built from nothing.',
      'It freezes well in quart portions, so a double batch on a slow Sunday can cover two weeks instead of one. The sauce also improves with a day or two in the fridge, so Monday and Tuesday\'s dinners are, if anything, better than Sunday\'s.',
    ],
  },
  {
    id: 'salt-earlier-than-you-think',
    title: 'You Should Probably Be Salting Earlier Than You Think',
    excerpt: 'Salting at the end fixes flavor on the surface. Salting earlier changes the whole dish.',
    tag: 'Technique',
    publishedAt: '2026-05-08',
    featuredImage: 'A hand sprinkling coarse salt over raw seasoned meat on a cutting board, close-up, natural light',
    body: [
      'Salting a dish only at the very end seasons the surface a diner tastes first, but it does not season the inside of whatever you cooked — a piece of meat, a pot of beans, a braise. Salt needs time to actually move into the food, not just sit on top of it.',
      'For meat, salting at least forty minutes before cooking (or the night before, for a larger cut) gives the salt time to draw out moisture, dissolve into it, and get reabsorbed — seasoning the inside, not just the crust.',
      'For beans and grains, salting the cooking water from the start (a old myth claims this toughens beans; it does not, at normal kitchen concentrations) means every bite is seasoned, not just the ones with sauce clinging to them.',
    ],
  },
  {
    id: 'building-a-real-pantry-on-a-budget',
    title: 'Building a Real Pantry on a Real Budget',
    excerpt: 'A short, honest list of the pantry staples that make the biggest difference for the least money.',
    tag: 'Pantry',
    publishedAt: '2026-04-20',
    featuredImage: 'A tidy pantry shelf with labeled jars of grains, dried beans, oils, and spices, warm natural light',
    body: [
      'A well-stocked pantry is less about having everything and more about having the handful of ingredients that make a huge number of dishes possible: good olive oil, a neutral oil for high heat, soy sauce, a vinegar or two, canned tomatoes, dried beans, rice, a few aromatics that keep (garlic, onion, ginger).',
      'None of this needs to be expensive or exotic to make a real difference — a mid-shelf olive oil used generously beats a fancy bottle used sparingly out of guilt about the price. The staples that matter most are the ones you will actually reach for on a Tuesday, not the ones that look good in a pantry photo.',
      'Build it slowly, two or three items a grocery trip, rather than trying to stock everything at once. The payoff compounds — each new staple usually unlocks several more dinners than the single ingredient itself suggests.',
    ],
  },
];
```

Eight posts, seven distinct tags (`Weeknight`, `Kitchen Tools`, `Baking`, `Pantry`, `Vegetables`,
`Meal Prep`, `Technique` — `Pantry` appears twice, deliberately, so the `TagCloud` demonstrates at
least one tag with more than one post while keeping most tags single-post, giving the paginated
list and tag-filter interaction real content to work against without needing all 8 visible on
first paint.

### 3.2 Static pagination

Identical mechanism to the baseline blog spec §3.2: the full `POSTS` array ships in the static
export; a page-local client component reveals more of the already-bundled array on "Load more"
clicks (not persisted — resets on reload, same reasoning as baseline). Initial page size: 4 posts,
with the lead image-forward card (§2) as the first of those 4.

### 3.3 Tag cloud

Identical mechanism to the baseline blog spec §3.3: `TagCloud` derives its tag list from `POSTS` at
build time (`[...new Set(POSTS.map(p => p.tag))]`, sorted), filters the list page client-side, not
persisted.

## 4. Interactive feature: per-post comments

Per interactive-demo spec §4.2 (same mechanism as the baseline `blog` site's §3.2 row #7 feature)
and §3.3 (`CommentThread`).

### 4.1 Data shape

```ts
interface Comment {
  id: string;
  author: string;
  text: string;
  at: string; // ISO datetime
}
```

This is exactly `template-kit`'s existing `Comment` shape (`CommentThread.tsx`) — no new fields, no
site-specific extension.

### 4.2 The per-post storageKey pattern for this site (important — read before implementing)

**One `useLocalCollection` instance per article, keyed by post id — never one shared collection for
all posts.** This site uses its own unique storageKey prefix, distinct from the baseline blog's
`blog-comments-` prefix and from every other blog variant's prefix, so that if multiple blog sites
were ever hosted under the same origin during local development, their comment data would never
collide:

- Storage key: `` `blog-food-comments-${postId}` `` — e.g.
  `blog-food-comments-weeknight-tomato-braised-chicken`,
  `blog-food-comments-the-rice-cooker-is-underrated`, one distinct `localStorage` key per post, not
  a single `blog-food-comments` key holding every post's comments in one array filtered by a
  `postId` field.
- **Why per-key, not a shared collection with a `postId` field:** identical reasoning to the
  baseline blog spec §4.2 — `useLocalCollection`'s contract seeds and hydrates an entire collection
  under one key; there is no built-in "only items where `postId === X`" query. Keying per-post
  means each article's comment thread is a fully independent `useLocalCollection<Comment>`
  instance with its own seed (`[]`), its own hydration, its own `reset()` — comments on one post
  can never leak into another's list because they are never in the same `localStorage` entry, by
  construction.
- **Where the hook is called:** inside a client-component wrapper mounted in
  `app/posts/[slug]/page.tsx` (the article detail route is dynamic per post, so the `postId` used
  to build the storage key is always the current route's own slug — one hook call per page visit,
  never one hook call trying to serve every post).
- **Seed value:** `[]` for every post — no post starts with fake seeded comments (same
  no-fabricated-content reasoning as the baseline blog spec and every other site spec's empty
  seed).

```ts
'use client';
import { useLocalCollection, CommentThread } from '@portfolio/template-kit';

const COMMENT_SEED: Comment[] = [];

function ArticleComments({ postId }: { postId: string }) {
  const { items, add } = useLocalCollection<Comment>(`blog-food-comments-${postId}`, COMMENT_SEED);

  async function handleSubmit(text: string) {
    add({
      id: crypto.randomUUID(),
      author: 'You', // no auth in this demo — every visitor-authored comment is attributed to
                      // a fixed placeholder name, same convention as the baseline blog site
      text,
      at: new Date().toISOString(),
    });
  }

  return <CommentThread comments={items} onSubmit={handleSubmit} />;
}
```

### 4.3 Data flow

1. Visitor opens `/posts/weeknight-tomato-braised-chicken`. The page's client wrapper mounts
   `useLocalCollection<Comment>('blog-food-comments-weeknight-tomato-braised-chicken', [])`.
2. First visit for that post: hook seeds
   `localStorage['blog-food-comments-weeknight-tomato-braised-chicken'] = []`, `CommentThread`
   renders its own empty state ("No comments yet" — kit behavior).
3. Visitor types into `CommentThread`'s textarea and submits. `CommentThread`'s `onSubmit(text)`
   fires (kit behavior); the site's handler wraps `text` into a full `Comment` (author + id + `at`
   timestamp) and calls the hook's `add()`.
4. The new comment appears under the article immediately (same render pass) and is written to
   `localStorage` under that post's own key.
5. Visitor navigates to `/posts/the-rice-cooker-is-underrated` (a different post). A *new*
   `useLocalCollection` instance mounts with storage key
   `blog-food-comments-the-rice-cooker-is-underrated` — this key has never been written to, so
   `CommentThread` here shows its own empty state, **not** the comment left on the first post. This
   is the isolation property §4.2 exists to guarantee.
6. Reloading `/posts/weeknight-tomato-braised-chicken` (or returning later, same browser)
   re-hydrates from that post's own `localStorage` key per the hook's contract — the comment
   persists.
7. "Reset demo data" affordance: a small, non-prominent control below `CommentThread` calling that
   post's own `reset()` — clears only the current post's comments, not every post's, consistent
   with the per-post key design.

## 5. Hallmark design brief

**Direction (master spec §4.2's assigned family):** warm anchor hue, serif display, **image-forward
layout**. Food photography is the primary visual language of this site — the design should feel
like a home-cook's recipe blog a reader would actually bookmark, not a generic "Next.js blog
starter" with food-themed copy pasted in. Warm hue and serif display type are shared with
`blog-lifestyle`; the differentiator this session must land on is the image-forward composition
(§2's large lead card, large per-card featured images, full-width detail-page hero image) plus a
distinctly food/kitchen-coded content mood (warm, tactile, appetite-driven) rather than
lifestyle/travel's more aspirational-lifestyle register. The session must clear the design-scoring
gate (master spec §8), particularly criterion #10 (distinctiveness against the other 28 sites,
especially `blog` and `blog-lifestyle`) and criterion #2 (typographic craft — the recipe/technique
posts' body copy needs the same long-form reading craft as the baseline blog, on top of the
image-forward list layout).

**Reference directions to research during the Hallmark pass** (starting points, not commitments):
1. Independent food/recipe blogs and food-magazine digital editions — for how a warm, appetite-led
   photography-first layout avoids reading as a generic recipe-card template (would fail criterion
   #1), and for real examples of a large "lead" post treatment on a list/index page.
2. Editorial food photography art direction (natural light, close crop, ingredient-level detail) —
   for what makes the featured-image treatment (§2) read as considered food styling rather than
   stock-photo filler, informing crop ratios, image framing conventions, and caption/overlay
   typography choices within the card.
3. Warm-hue serif editorial type systems (the shared family with `blog-lifestyle`) — researched
   specifically for how this site's pairing can still read as its own distinct voice next to
   `blog-lifestyle`'s, per criterion #10, rather than converging on the same specific hue/type pick.

Actual token values (accent hue, type pairing, spacing scale, motion durations) are Task 1's
output in the implementation plan, not this spec's — per master spec §9, this is intentionally
deferred to the real Hallmark session.
