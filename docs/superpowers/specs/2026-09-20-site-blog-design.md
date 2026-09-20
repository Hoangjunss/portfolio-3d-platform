# Site Spec — Blog/Magazine Baseline (`blog`)

Date: 2026-09-20
Status: Approved (site #7 of 29 under the interactive-demo templates program)

## 1. Context & Scope

This is a thin, mostly-data/content spec for one of the 29 demo template sites defined by
`2026-09-20-interactive-demo-templates-design.md` (§3.2 row #7 — the BASELINE Blog/Magazine
category, §9 execution order — this is plan 37, one of plans 31-59). It does not redefine
architecture: section composition, shared component behavior, the `useLocalCollection` hydration
contract, folder convention, and the build/test gates are all already fixed by that spec and by
`2026-09-20-template-design-system-design.md` (§3's taxonomy row #7: "Article list (paginated
static) + category tag cloud"). This spec states only:

- the exact page/route composition for this site (article list + article detail),
- the seed data shape and sample post content,
- the per-post comment interactive feature's exact data flow,
- a Hallmark design brief (mood direction + research pointers, not fixed token values).

**Slug:** `blog` — folder `templates/blog/`, `display_order` 7, `category` `blog` (per plan 30
Task 1's authoritative slug table).

**Distinct from the 3 extra blog variants** (`blog-tech`, `blog-lifestyle`, `blog-food` —
interactive-demo spec §4.2): this is the general-interest BASELINE magazine, not a niche
subject/vertical. Those 3 variants are separate later plans and reuse this same architecture
(`CommentThread`, per-post `useLocalCollection` pattern, article-list + detail routing) with a
different subject and theme; nothing in this spec is written for them.

## 2. Page/route composition

Per parent spec §3's taxonomy row #7 ("Article list (paginated static) + category tag cloud"),
amended by the interactive-demo spec (§3.2 row #7 — a real per-post comment box replaces any
static no-op):

```
/               → Hero → ArticleList (paginated) → TagCloud → Footer
/posts/[slug]   → Hero-style article header → article body → CommentThread → Footer
```

- **`/` (`app/page.tsx`)** — the article list page:
  - **`Hero`** (kit component) — magazine masthead/headline/subhead, no CTA button needed beyond
    the implicit "read below" (an empty/omitted `ctaLabel` is not valid per `Hero`'s required
    props — this site supplies a low-key CTA, e.g. label "Start reading", `ctaHref="#articles"`
    anchoring to the list below, so `Hero` is used within its existing required-prop contract
    without inventing a new optional-CTA variant).
  - **`ArticleList`** — this site's own page-local composition (not a new kit component; it is
    `ItemGrid`-shaped content but article cards need an excerpt + tag + "read more" link, which
    fits within `ItemGrid`'s existing `GridItem` shape — `title`, `description` (used for the
    excerpt), and `image` — plus a page-local wrapper that turns each card into a link to
    `/posts/[slug]`. No new kit component is added for this; `ItemGrid` is reused per parent spec
    §4's "no bespoke per-template logic" rule.)
  - **Static pagination** (§3.2 below) — a page-local client component that reveals more of the
    same statically-imported post array; not a second route, not an API call.
  - **`TagCloud`** — this site's own small page-local component (a `<ul>` of the distinct
    category tags present in the seed data, each an anchor that filters the visible list to that
    tag client-side). Like `ArticleList`, this is not a new kit component — it composes directly
    from the same statically-imported seed data, no `useLocalCollection` involved (tags are
    derived, not user-mutable state).
  - **`Footer`** (kit component) — standard link set (Home, Archive, About, Contact) + social row
    on.
- **`/posts/[slug]` (`app/posts/[slug]/page.tsx`)** — the article detail page:
  - A simple header (post title, tag, publish date) followed by the post body (rendered from the
    seed data's `body` field — plain paragraphs, no CMS/markdown pipeline needed for demo scope).
  - **`CommentThread`** (kit component, §3.3 of the interactive-demo spec) — the interactive
    feature (§4 below).
  - **`Footer`** (kit component) — same as the list page.

## 3. Seed data

All seed data lives in `templates/blog/data/seed.ts`, statically importable at build time per the
parent spec §3.1 render-pattern rule: the article list, each article's body, and the tag cloud are
all **static content** rendered directly from this seed file — only per-post comments (§4) go
through `useLocalCollection`.

Content authenticity rule (parent spec §5 / interactive-demo spec §5, both restate the same rule):
sample copy is realistic-but-fictional, no fabricated stats presented as real, no Lorem Ipsum above
the fold. This site is a fictional general-interest magazine, **Vệt Nắng** ("Vệt Nắng" = "streak of
sunlight" — a warm, unbranded, general-audience name deliberately not tied to any single subject
like tech/lifestyle/food, so it reads as the baseline category, not one of the 3 extra variants).

### 3.1 Posts (`ArticleList` items + `/posts/[slug]` content)

```ts
interface BlogPost {
  id: string;       // used as the URL slug, e.g. 'morning-routines-that-stick'
  title: string;
  excerpt: string;  // 1-2 sentences, shown on the list page card
  tag: string;      // exactly one category tag per post — drives the TagCloud
  publishedAt: string; // ISO date, display-only
  body: string[];   // paragraphs, rendered on the detail page in order
}

const POSTS: BlogPost[] = [
  {
    id: 'morning-routines-that-stick',
    title: 'The Morning Routines That Actually Stick',
    excerpt: 'Most morning routines fail within two weeks. Here is what separates the ones that last from the ones that quietly die.',
    tag: 'Life',
    publishedAt: '2026-08-04',
    body: [
      'Every January, and every "new week, new me" Monday after it, millions of people design an elaborate morning routine and abandon it within ten days. The problem is rarely willpower — it is that the routine was designed for an idealized version of the morning, not the one that actually happens.',
      'The routines that survive share one trait: they are boring enough to do on a bad day. A five-minute walk beats a forty-minute gym circuit if the walk is the one you will still do when you are tired, behind on sleep, and it is raining.',
      'Start by tracking, for one week, what your mornings actually look like — not what you wish they looked like. Then build the smallest version of the routine that fits inside that reality, and only expand it once the small version has survived a full month without a single skipped day.',
    ],
  },
  {
    id: 'the-case-for-boring-vacations',
    title: 'The Case for Boring Vacations',
    excerpt: 'Not every trip needs an itinerary. A growing number of travelers are choosing to do almost nothing, on purpose — and reporting they come back more rested than ever.',
    tag: 'Travel',
    publishedAt: '2026-07-22',
    body: [
      'The itinerary-packed vacation — three cities in five days, a museum before breakfast, a sunset spot booked weeks in advance — has quietly become a second job. It produces great photos and, often, a traveler who returns more exhausted than when they left.',
      'A counter-trend is picking up: the single-location, mostly-unplanned trip. One town, one rented room, a loose plan that fits on an index card. Long mornings, a market visit, an afternoon with a book, dinner wherever looks good that night.',
      'It sounds like it would be boring. Travelers who have tried it tend to say the opposite — that the absence of a schedule is what let them actually notice the place they were in, instead of rushing through it toward the next checkbox.',
    ],
  },
  {
    id: 'why-your-inbox-never-empties',
    title: 'Why Your Inbox Never Actually Empties',
    excerpt: 'Inbox zero is a myth for most working adults — and chasing it might be costing you more focus than the inbox itself.',
    tag: 'Work',
    publishedAt: '2026-07-10',
    body: [
      'Inbox zero promises a clean slate: answer everything, file everything, arrive at a satisfying blank screen. For anyone whose job involves more than a trickle of email, it is also close to impossible to sustain — and the daily attempt to reach it eats time that could go to the actual work the email is about.',
      'A simpler approach treats the inbox as a stream, not a to-do list: triage fast (reply, delegate, or move to a separate task list), and let the inbox itself stay messy. The goal is never letting anything important go unanswered, not achieving a number.',
      'The switch takes discipline in the opposite direction — resisting the urge to "just clear a few more" when the real task list is what actually needs your attention.',
    ],
  },
  {
    id: 'the-quiet-return-of-handwritten-letters',
    title: 'The Quiet Return of Handwritten Letters',
    excerpt: 'In an era of instant messages, a small but growing group of people are choosing the two-week delay of a real letter — on purpose.',
    tag: 'Culture',
    publishedAt: '2026-06-28',
    body: [
      'A handwritten letter takes longer to write, longer to send, and longer to arrive than almost any other form of communication available today. That used to be its main drawback. For a small but growing group of letter-writers, it has become the entire appeal.',
      'The slowness forces a kind of editing that a text message never demands — you cannot un-send a sentence once the envelope is sealed, so you tend to think harder about what you actually want to say.',
      'Stationery shops in several cities report a modest but real uptick in letter-writing sets bought by people under 30 — a generation that grew up entirely on instant messaging, now experimenting with the opposite.',
    ],
  },
  {
    id: 'sleep-debt-you-cant-outrun',
    title: 'The Sleep Debt You Cannot Outrun on the Weekend',
    excerpt: 'Catching up on sleep every Saturday feels like it works. New research suggests the debt adds up anyway.',
    tag: 'Health',
    publishedAt: '2026-06-15',
    body: [
      'The "sleep in on the weekend" strategy is close to universal among people who consistently under-sleep on weekdays. It feels like it balances the books. Sleep researchers increasingly describe it as a partial fix at best.',
      'The core issue is that a single long weekend sleep does not fully reverse a week of accumulated deficit, and it can also shift your body clock in a way that makes Monday morning feel like mild jet lag — a pattern sometimes called "social jet lag."',
      'The more durable fix is less dramatic and less satisfying to hear: a consistent wake time across all seven days, even if the exact bedtime varies, does more for how rested you feel than any single catch-up sleep can.',
    ],
  },
  {
    id: 'the-hidden-cost-of-subscriptions',
    title: 'The Hidden Cost of Small Monthly Subscriptions',
    excerpt: 'None of them feel expensive on their own. Added up, they are quietly one of the largest line items in a lot of household budgets.',
    tag: 'Money',
    publishedAt: '2026-05-30',
    body: [
      'Five dollars here, three dollars there — a streaming service, a cloud storage tier, a fitness app, a recipe box, a font license nobody remembers subscribing to. Individually, none of them register as a real expense.',
      'Add them up, though, and a surprising number of households find they are paying more per month in small recurring subscriptions than they spend on a category they actively budget for, like dining out.',
      'The fix that seems to work is not "cancel everything" — it is a once-a-quarter audit: list every recurring charge in one place, and ask honestly whether it earned its renewal this quarter, not whether it might be useful again someday.',
    ],
  },
  {
    id: 'how-neighborhoods-lost-their-porches',
    title: 'How Neighborhoods Lost Their Porches — and What Replaced Them',
    excerpt: 'The front porch used to be where a neighborhood happened. A look at what filled that role once porches disappeared from newer housing.',
    tag: 'Culture',
    publishedAt: '2026-05-12',
    body: [
      'Older neighborhoods are dotted with front porches built for exactly one purpose: sitting outside where you could see, and be seen by, whoever walked past. Newer housing, built for cars and privacy, mostly stopped including them.',
      'That did not eliminate the human need the porch served — it just moved it. Community gardens, shared courtyards, and even neighborhood messaging apps have partly filled the role, with very different tradeoffs around who actually shows up and how often.',
      'Urban planners studying the shift note that the replacements tend to require more deliberate effort than a porch ever did — you have to decide to go to the garden or open the app, where a porch just put you there by default.',
    ],
  },
  {
    id: 'the-skill-of-doing-nothing-well',
    title: 'The Skill of Doing Nothing Well',
    excerpt: 'Unstructured free time is disappearing from most adult schedules. The people who protect it on purpose report a surprising benefit.',
    tag: 'Life',
    publishedAt: '2026-04-27',
    body: [
      'Ask most adults what they did with their last free hour and the honest answer is usually "scrolled a phone" — not because they wanted to, but because unstructured time has become uncomfortable in a way it rarely used to be.',
      'A small body of research on boredom suggests that resisting the urge to fill every gap with a screen leads, somewhat reliably, to better creative problem-solving afterward — the mind wanders somewhere useful when it is allowed to wander at all.',
      'The practice, if it can be called that, is simple to describe and hard to do: pick one gap in your day, on purpose, and leave it genuinely empty. No podcast, no phone, no plan. See what shows up.',
    ],
  },
];
```

Eight posts, five distinct tags (`Life`, `Travel`, `Work`, `Culture`, `Health`, `Money` — `Culture`
appears twice, `Life` appears twice, deliberately, so the `TagCloud` demonstrates more than one post
per tag), giving both the paginated list (§3.2) and the tag-filter interaction real content to work
against without needing all 8 visible on first paint.

### 3.2 Static pagination

Per parent spec §3's taxonomy row #7 ("Article list (paginated static)"), pagination here means:
the full `POSTS` array (§3.1) is bundled into the static export exactly as any other seed data
(parent spec §3.1 render-pattern rule — no server, no API call ever fetches "page 2"). The list
page renders a fixed initial page size, and a small client component reveals the rest of the
*already-bundled* array on click:

- Initial render (server/static-exported, no client JS required to see it): the first **4** posts
  from `POSTS`, in the array's own order (newest-first, matching `publishedAt` descending —
  `POSTS` above is already authored in that order).
- A **"Load more"** button (page-local client component, no `useLocalCollection` involved — this
  is not persisted state, just a `useState` reveal count that resets on reload, which is correct:
  which posts are currently visible is not a visitor-authored fact worth persisting) reveals the
  next 4 on click. With 8 seed posts, one click reveals the full list; the component does not
  assume exactly 8 — it hides itself once every post is visible, so the pattern still works if a
  future edit adds a 9th post.
- This satisfies "paginated" without inventing a second route, a query-string page parameter, or
  any concept of a "page 2" URL — appropriate for a demo site whose entire catalog is a bundled
  JSON array, not a real paginated backend.

### 3.3 Tag cloud

`TagCloud` derives its list of tags from `POSTS` at build time (`[...new Set(POSTS.map(p =>
p.tag))]`, sorted) — not hand-maintained separately, so it can never drift from the actual posts.
Clicking a tag filters the list page's visible posts to that tag (client-side `useState` filter,
same "not persisted, resets on reload" reasoning as §3.2 — a returning visitor should see the
un-filtered list again, not their last filter choice). Filtering and the "Load more" pagination
from §3.2 compose simply: the filter narrows the candidate array first, then the same reveal-count
pattern paginates whatever the filtered result is.

## 4. Interactive feature: per-post comments

Per interactive-demo spec §3.2 row #7 ("Comment box per post → comments persist per post, listed
under the article") and §3.3 (`CommentThread`).

### 4.1 Data shape

```ts
interface Comment {
  id: string;
  author: string;
  text: string;
  at: string; // ISO datetime
}
```

This is exactly `template-kit`'s existing `Comment` shape (plan 30 Task 5, `CommentThread.tsx`) —
no new fields, no site-specific extension.

### 4.2 The per-post storageKey pattern (important — read before implementing)

**One `useLocalCollection` instance per article, keyed by post id — never one shared collection for
all posts.** Concretely:

- Storage key: `` `blog-comments-${postId}` `` — e.g. `blog-comments-morning-routines-that-stick`,
  `blog-comments-the-case-for-boring-vacations`, one distinct `localStorage` key per post, not a
  single `blog-comments` key holding every post's comments in one array filtered by a `postId`
  field.
- **Why per-key, not a shared collection with a `postId` field:** `useLocalCollection`'s contract
  (interactive-demo spec §3.1) seeds and hydrates an entire collection under one key — there is no
  built-in "give me only the items where `postId === X`" query. Keying per-post means each
  article's comment thread is a completely independent `useLocalCollection<Comment>` instance with
  its own seed (`[]`), its own hydration, its own `reset()` — comments on post A can never leak
  into post B's list because they are never in the same `localStorage` entry, by construction, not
  by a filter that could be implemented incorrectly.
- **Where the hook is called:** inside `app/posts/[slug]/page.tsx`'s client component wrapper
  (the article detail route is dynamic per post, so the `postId` used to build the storage key is
  always the current route's own slug — one hook call per page visit, never one hook call trying
  to serve every post).
- **Seed value:** `[]` for every post — no post starts with fake seeded comments (same
  no-fabricated-content reasoning as the `corporate` site spec's empty callback-request seed and
  the `ecommerce` site spec's empty cart seed).

```ts
'use client';
import { useLocalCollection, CommentThread } from '@portfolio/template-kit';

const COMMENT_SEED: Comment[] = [];

function ArticleComments({ postId }: { postId: string }) {
  const { items, add } = useLocalCollection<Comment>(`blog-comments-${postId}`, COMMENT_SEED);

  async function handleSubmit(text: string) {
    add({
      id: crypto.randomUUID(),
      author: 'You', // no auth in this demo — every visitor-authored comment is attributed to
                      // a fixed placeholder name, same convention the CRM category (interactive-
                      // demo spec §4.3) uses for its own no-real-auth login screen
      text,
      at: new Date().toISOString(),
    });
  }

  return <CommentThread comments={items} onSubmit={handleSubmit} />;
}
```

### 4.3 Data flow

1. Visitor opens `/posts/morning-routines-that-stick`. The page's client wrapper mounts
   `useLocalCollection<Comment>('blog-comments-morning-routines-that-stick', [])`.
2. First visit for that post: hook seeds `localStorage['blog-comments-morning-routines-that-stick']
   = []`, `CommentThread` renders its own empty state ("No comments yet" — kit behavior, plan 30
   Task 5).
3. Visitor types into `CommentThread`'s textarea and submits. `CommentThread`'s `onSubmit(text)`
   fires (kit behavior); the site's handler wraps `text` into a full `Comment` (author + id + `at`
   timestamp) and calls the hook's `add()`.
4. The new comment appears under the article immediately (same render pass, `CommentThread` reads
   the same hook's `items`) and is written to `localStorage` under that post's own key.
5. Visitor navigates to `/posts/the-case-for-boring-vacations` (a different post). A *new*
   `useLocalCollection` instance mounts with storage key
   `blog-comments-the-case-for-boring-vacations` — this key has never been written to, so
   `CommentThread` here shows its own empty state, **not** the comment left on the first post. This
   is the isolation property §4.2 exists to guarantee.
6. Reloading `/posts/morning-routines-that-stick` (or returning later, same browser) re-hydrates
   from that post's own `localStorage` key per the hook's contract (interactive-demo spec §3.1
   item 2) — the comment persists.
7. "Reset demo data" affordance: a small, non-prominent control below `CommentThread` calling that
   post's own `reset()` — clears only the current post's comments, not every post's, consistent
   with the per-post key design (there is no single shared key a global reset could target even if
   one were added later).

## 5. Hallmark design brief

**Industry mood:** general-interest magazine/blog — broad-appeal editorial content (life, work,
culture, health, travel, money — see §3.1's tag spread), not a specific niche like tech commentary,
lifestyle/travel-only, or food (those are the 3 extra variants' job, interactive-demo spec §4.2).
The design should read as a considered, editorial publication a wide range of readers would
subscribe to — closer to a well-run general-interest magazine than a single-topic niche blog or a
generic "Next.js blog starter" look. Parent spec §5 does not name a starting family specific to
Blog/Magazine (it sits outside the four listed clusters, the same way `ecommerce`'s baseline does);
for this baseline, hue and type pairing are an **open call for the real Hallmark session** — this
is a **non-binding starting direction only**, not a fixed pick. The session must clear the
design-scoring gate (master spec §8), particularly criterion #10 (distinctiveness against the
other 28 sites, including the 3 extra blog variants that *do* commit to specific hue/type families
per interactive-demo spec §4.2 — `blog` must not read as a diluted version of any of them, nor as a
re-skin of an unrelated site like `corporate` or `ecommerce`).

**Reference directions to research during the Hallmark pass** (starting points, not commitments):
1. General-interest print magazines' digital editions (the "considered general-audience
   publication" register: confident but restrained editorial type hierarchy, generous line-length
   and leading for long-form reading, a masthead that reads as a real publication rather than a
   generic "Blog" label) — useful for what makes a baseline blog feel like an actual magazine
   rather than a default markdown-blog theme (would fail criterion #1).
2. Independent/indie digital magazines and newsletters — for a voice distinct from both the
   generic corporate-blog look and the 3 extra variants' more niche-coded directions (tech,
   lifestyle, food).
3. Classic newspaper/magazine grid systems (print or digital) — a possible source for how the
   article-list grid (§3.2) and the tag cloud (§3.3) can read as a genuine editorial front page
   rather than a default card-grid, and for how the article detail page's long-form body text can
   carry real typographic craft (criterion #2) instead of default body-copy styling.

Actual token values (accent hue, type pairing, spacing scale, motion durations) are Task 1's
output, not this spec's — per master spec §9, this is intentionally deferred to the real Hallmark
session.
