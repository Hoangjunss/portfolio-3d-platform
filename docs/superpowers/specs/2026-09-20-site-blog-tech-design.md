# Site Spec — Blog/Magazine Extra Variant: Tech/Startup Commentary (`blog-tech`)

Date: 2026-09-20
Status: Approved (site #24 of 29 under the interactive-demo templates program)

## 1. Context & Scope

This is a thin, mostly-data/content spec for one of the 29 demo template sites defined by
`2026-09-20-interactive-demo-templates-design.md` (§4.2 — the first of 3 extra Blog/Magazine
variants, §9 execution order — this is plan 54, one of plans 31-59). It does not redefine
architecture: section composition, shared component behavior, the `useLocalCollection` hydration
contract, folder convention, and the build/test gates are all already fixed by that spec and by
`2026-09-20-template-design-system-design.md` (§3's taxonomy row #7: "Article list (paginated
static) + category tag cloud") and by the BASELINE blog site's own plan/spec
(`2026-09-20-37-blog.md` / `2026-09-20-site-blog-design.md`), which this spec reuses structurally
without modification. This spec states only:

- the exact page/route composition for this site (identical pattern to the baseline `blog`),
- the seed data shape and sample post content (tech/startup commentary, not general-interest),
- the per-post comment interactive feature's exact data flow, with this site's own storageKey
  prefix so its comments never collide with the baseline `blog` site's `localStorage` entries,
- a Hallmark design brief (cool-hue/grotesque-sans mood direction + research pointers, not fixed
  token values).

**Slug:** `blog-tech` — folder `templates/blog-tech/`, `display_order` 24, `category` `blog-tech`
(per plan 30 Task 1's authoritative slug table).

**Distinct from the baseline `blog` site and the other 2 extra variants** (`blog-lifestyle`,
`blog-food` — interactive-demo spec §4.2): this is the tech/startup-commentary vertical, not the
general-interest baseline. It reuses the baseline's exact architecture (`CommentThread`, per-post
`useLocalCollection` pattern, article-list + detail routing) with a different subject and theme —
per the master spec §4.2 assignment: "Cool anchor hue, grotesque-sans display."

## 2. Page/route composition

Identical to the baseline `blog` site's composition (`2026-09-20-site-blog-design.md` §2), per
parent spec §3's taxonomy row #7 ("Article list (paginated static) + category tag cloud"), amended
by the interactive-demo spec (§3.2 row #7 — a real per-post comment box replaces any static no-op):

```
/               → Hero → ArticleList (paginated) → TagCloud → Footer
/posts/[slug]   → Hero-style article header → article body → CommentThread → Footer
```

- **`/` (`app/page.tsx`)** — the article list page:
  - **`Hero`** (kit component) — masthead/headline/subhead, with a low-key CTA (e.g. label "Start
    reading", `ctaHref="#articles"` anchoring to the list below), same contract-only usage as the
    baseline — `Hero`'s required props are not left empty.
  - **`ArticleList`** — page-local composition (not a new kit component), same rationale as the
    baseline: `ItemGrid`-shaped content (`title`, `description` used for the excerpt, `image`) plus
    a page-local wrapper linking each card to `/posts/[slug]`.
  - **Static pagination** (§3.2 below) — a page-local client component revealing more of the
    statically-imported post array; not a second route, not an API call.
  - **`TagCloud`** — page-local component deriving its tags from the seed data, filtering the
    visible list client-side; no `useLocalCollection` involved (tags are derived, not mutable).
  - **`Footer`** (kit component) — standard link set + social row on.
- **`/posts/[slug]` (`app/posts/[slug]/page.tsx`)** — the article detail page:
  - A header (post title, tag, publish date) followed by the post body (plain paragraphs from the
    seed data's `body` field).
  - **`CommentThread`** (kit component, interactive-demo spec §3.3) — the interactive feature (§4
    below).
  - **`Footer`** (kit component) — same as the list page.

## 3. Seed data

All seed data lives in `templates/blog-tech/data/seed.ts`, statically importable at build time per
the parent spec §3.1 render-pattern rule: the article list, each article's body, and the tag cloud
are all **static content** rendered directly from this seed file — only per-post comments (§4) go
through `useLocalCollection`.

Content authenticity rule (parent spec §5 / interactive-demo spec §5, both restate the same rule):
sample copy is realistic-but-fictional, no fabricated stats presented as real, no Lorem Ipsum above
the fold. This site is a fictional tech/startup commentary publication, **Runtime Notes** — a
name that reads as an engineering-adjacent, product/startup-commentary outlet without impersonating
any real publication.

### 3.1 Posts (`ArticleList` items + `/posts/[slug]` content)

```ts
interface BlogPost {
  id: string;       // used as the URL slug, e.g. 'the-roadmap-nobody-reads'
  title: string;
  excerpt: string;  // 1-2 sentences, shown on the list page card
  tag: string;      // exactly one category tag per post — drives the TagCloud
  publishedAt: string; // ISO date, display-only
  body: string[];   // paragraphs, rendered on the detail page in order
}

const POSTS: BlogPost[] = [
  {
    id: 'the-roadmap-nobody-reads',
    title: 'The Roadmap Nobody Reads',
    excerpt: 'Most product roadmaps are written for the one stakeholder meeting where they get presented, then quietly ignored by everyone who actually ships.',
    tag: 'Product',
    publishedAt: '2026-08-18',
    body: [
      'Every quarter, a product team spends a week polishing a roadmap slide, presents it once, and watches it start drifting out of date within a month. The slide was never wrong exactly — it was built for an audience of one meeting, not for the engineers who need to make daily tradeoffs against it.',
      'Teams that actually use their roadmap tend to keep it somewhere boring: a living doc, a pinned ticket, a channel topic — not a deck. The format matters less than the update cadence; a roadmap nobody edits after the kickoff meeting has already stopped being a roadmap.',
      'The fix is rarely "communicate more." It is picking one place the roadmap lives, updating it in five minutes every Friday, and accepting that most stakeholders will never open it — which is fine, as long as the five people who need it daily can find it.',
    ],
  },
  {
    id: 'seed-round-math-nobody-explains',
    title: 'The Seed Round Math Nobody Explains to First-Time Founders',
    excerpt: 'Dilution compounds faster than most first-time founders expect. A plain-language walk through why a "small" seed round can cost more equity than it looks like on the term sheet.',
    tag: 'Funding',
    publishedAt: '2026-08-02',
    body: [
      'A first-time founder raising a seed round often focuses on the headline valuation and misses how much of the company a modest option pool top-up, combined with a standard liquidation preference, actually costs by the time the round closes.',
      'None of this is predatory by default — it is standard market structure, explained badly, to people who have every reason to be focused on product instead of cap table mechanics during their first raise.',
      'The one number worth asking a lead investor to walk through line by line, before signing anything, is fully-diluted ownership after close — not headline valuation, not pre-money, not the number on the first page of the deck.',
    ],
  },
  {
    id: 'on-call-rotation-that-does-not-burn-out-the-team',
    title: 'The On-Call Rotation That Does Not Burn Out the Team',
    excerpt: 'A survey of engineering teams found the difference between a sustainable on-call rotation and a dreaded one is rarely about tooling — it is about one specific staffing decision.',
    tag: 'Engineering',
    publishedAt: '2026-07-21',
    body: [
      'Most postmortems about on-call burnout blame the alerting tool, the runbook quality, or the pager fatigue from noisy thresholds. Those all matter, but teams that have actually fixed a broken rotation point to something simpler: rotation length relative to team size.',
      'A five-person team running week-long on-call shifts puts each engineer on the hook roughly ten weeks a year — that is the structural problem, not the alert volume. Shortening shifts to a few days, or growing the rotation pool before adding more services to watch, tends to fix morale faster than any dashboard redesign.',
      'The teams that get this right treat rotation size as a capacity metric worth tracking on its own, the same way they track deploy frequency — not an afterthought decided once when the on-call policy was first written and never revisited.',
    ],
  },
  {
    id: 'the-ai-feature-nobody-asked-for',
    title: 'The AI Feature Nobody Asked For',
    excerpt: 'A growing number of product teams are shipping an AI feature because competitors have one, not because a single support ticket ever requested it. A look at what happens next.',
    tag: 'AI',
    publishedAt: '2026-07-05',
    body: [
      'It has become common for a product review to include a line like "we need an AI [x]" with no user research attached — the feature exists to answer a board question or a competitor comparison chart, not a customer problem.',
      'The products that get real usage out of an AI feature almost always started from a specific, narrow, already-validated workflow — a summarization step users were already doing by hand, a search that was already frustrating — rather than a general-purpose chat box bolted onto an existing UI.',
      'The pattern worth watching for internally: if nobody can name the support ticket, sales call, or user interview that motivated the feature, it is being built for the roadmap slide, not for a user — and it usually shows in the adoption numbers three months later.',
    ],
  },
  {
    id: 'hiring-the-fifth-engineer',
    title: 'Hiring the Fifth Engineer Is Not Like Hiring the Second',
    excerpt: 'The skills that make a great early engineering hire quietly change somewhere between hire two and hire five. Most startups notice this only after a bad hire.',
    tag: 'Hiring',
    publishedAt: '2026-06-19',
    body: [
      'The first two or three engineers at a startup are usually generalists who can build anything, tolerate ambiguity, and work directly with the founders. That profile is exactly right for the first few hires and exactly wrong to keep optimizing for once a real codebase and real processes exist.',
      'Somewhere around hire four or five, the bottleneck shifts from "can this person build things fast" to "can this person work inside a codebase they did not design, alongside people who disagree with them." Founders who keep hiring for pure velocity past this point tend to end up with a team that ships fast and fights constantly about direction.',
      'The practical fix is unglamorous: write down, explicitly, what changed about the role at hire five, and interview for that — not for a slightly-more-senior version of the same generalist profile that worked at hire two.',
    ],
  },
  {
    id: 'growth-loop-that-quietly-stopped-working',
    title: 'The Growth Loop That Quietly Stopped Working',
    excerpt: 'A referral loop that drove a third of signups for two years can decay slowly enough that nobody notices until a board deck forces the question.',
    tag: 'Growth',
    publishedAt: '2026-06-03',
    body: [
      'Growth loops are usually built once, dashboarded once, and then trusted for years — which is exactly how a slow decay goes unnoticed. A referral incentive that worked when the product had a small, dense early-adopter network can quietly stop converting as the audience broadens, with no single week showing an alarming drop.',
      'The teams that catch this early tend to review loop-level conversion, not just top-line signups, on a recurring cadence — monthly at minimum for any loop responsible for double-digit percent of growth — treating it the way finance teams treat a recurring revenue cohort review.',
      'The uncomfortable finding in most of these reviews is not that the loop broke suddenly. It is that it had been declining steadily for a year, and the top-line number stayed flat only because a separate channel was quietly picking up the slack.',
    ],
  },
  {
    id: 'the-real-cost-of-a-flaky-test-suite',
    title: 'The Real Cost of a Flaky Test Suite',
    excerpt: 'Engineers routinely underestimate how much a flaky CI pipeline costs in lost trust, not just lost minutes — and trust is much harder to rebuild than a broken assertion.',
    tag: 'Engineering',
    publishedAt: '2026-05-17',
    body: [
      'A flaky test that fails one run in twenty looks, on paper, like a minor annoyance worth a re-run click. In practice, once a team stops trusting red CI to mean something is actually broken, they stop looking closely at failures at all — including the real ones.',
      'The actual cost is not the extra CI minutes; it is the erosion of the signal the test suite exists to provide. A team that has learned to ignore red builds will eventually ship a real regression straight through a suite that technically caught it.',
      'Teams that recover from this tend to do something deliberately unglamorous: quarantine flaky tests into a separate, visibly-tracked bucket immediately on detection, with an owner and a deadline, rather than letting them accumulate quietly inside the main suite where they poison trust in everything else.',
    ],
  },
  {
    id: 'the-slow-death-of-the-weekly-all-hands',
    title: 'The Slow Death of the Weekly All-Hands',
    excerpt: 'As remote and hybrid startups scale past fifty people, the weekly all-hands often becomes the meeting everyone attends and nobody finds useful. Here is what is replacing it.',
    tag: 'Culture',
    publishedAt: '2026-04-29',
    body: [
      'A weekly all-hands works well at fifteen people, where most updates are relevant to most attendees. It works progressively worse as headcount grows, because the fraction of any given update that is relevant to any given attendee keeps shrinking, while the meeting length stays roughly the same.',
      'Startups that notice the drop in engagement — cameras off, side-channel chatter, attendance sliding — tend to respond by cutting the meeting shorter, which treats the symptom, not the cause: the content mix, not the length, is usually the actual problem.',
      'What replaces it in teams that get this right is a written weekly update, read asynchronously, paired with a much shorter live session reserved for genuine cross-team announcements and open Q&A — a format that respects that not every update needs a room full of forty people.',
    ],
  },
];
```

Eight posts, six distinct tags (`Product`, `Funding`, `Engineering`, `AI`, `Hiring`, `Growth`,
`Culture` — `Engineering` appears twice, deliberately, so the `TagCloud` demonstrates more than one
post per tag), giving both the paginated list (§3.2) and the tag-filter interaction real content to
work against without needing all 8 visible on first paint.

### 3.2 Static pagination

Identical mechanism to the baseline `blog` site (`2026-09-20-site-blog-design.md` §3.2): the full
`POSTS` array is bundled into the static export exactly as any other seed data (parent spec §3.1
render-pattern rule — no server, no API call ever fetches "page 2"). Initial render shows the first
**4** posts (newest-first, matching `publishedAt` descending — `POSTS` above is already authored in
that order); a page-local "Load more" client component (plain `useState` reveal count, not
persisted — which posts are currently visible is not worth surviving a reload) reveals the next 4
on click, hiding itself once every post is visible.

### 3.3 Tag cloud

`TagCloud` derives its list of tags from `POSTS` at build time (`[...new Set(POSTS.map(p =>
p.tag))]`, sorted) — never hand-maintained separately. Clicking a tag filters the list page's
visible posts to that tag (client-side `useState` filter, not persisted, same reasoning as §3.2).
Filtering and the "Load more" pagination compose simply: the filter narrows the candidate array
first, then the same reveal-count pattern paginates whatever the filtered result is.

## 4. Interactive feature: per-post comments

Per interactive-demo spec §3.2 row #7 / §4.2 ("identical mechanism to the baseline blog plan") and
§3.3 (`CommentThread`).

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
no new fields, no site-specific extension. Identical shape to the baseline `blog` site's `Comment`.

### 4.2 The per-post storageKey pattern (important — read before implementing)

**One `useLocalCollection` instance per article, keyed by post id — never one shared collection for
all posts.** This site reuses the baseline `blog` plan's exact mechanism with a distinct key prefix
so the two sites' `localStorage` entries never collide (they are, in the browser, two entirely
separate origins per deployed static site anyway — but the prefix is kept distinct regardless, per
this spec's own naming discipline and in case any future local-dev setup ever serves multiple demo
sites from one origin):

- Storage key: `` `blog-tech-comments-${postId}` `` — e.g.
  `blog-tech-comments-the-roadmap-nobody-reads`,
  `blog-tech-comments-seed-round-math-nobody-explains-first-time-founders`, one distinct
  `localStorage` key per post, not a single `blog-tech-comments` key holding every post's comments
  in one array filtered by a `postId` field, and never the baseline site's own `blog-comments-*`
  prefix.
- **Why per-key, not a shared collection with a `postId` field:** unchanged from the baseline site
  spec's reasoning (`2026-09-20-site-blog-design.md` §4.2) — `useLocalCollection`'s contract
  (interactive-demo spec §3.1) seeds and hydrates an entire collection under one key, with no
  built-in "give me only the items where `postId === X`" query. Keying per-post means each
  article's comment thread is a completely independent `useLocalCollection<Comment>` instance with
  its own seed (`[]`), its own hydration, its own `reset()`.
- **Where the hook is called:** inside `app/posts/[slug]/page.tsx`'s client component wrapper (the
  article detail route is dynamic per post, so the `postId` used to build the storage key is always
  the current route's own slug — one hook call per page visit, never one hook call trying to serve
  every post).
- **Seed value:** `[]` for every post — no post starts with fake seeded comments (same
  no-fabricated-content reasoning as the baseline `blog` site and the `corporate`/`ecommerce` site
  specs' own empty seeds).

```ts
'use client';
import { useLocalCollection, CommentThread } from '@portfolio/template-kit';

const COMMENT_SEED: Comment[] = [];

function ArticleComments({ postId }: { postId: string }) {
  const { items, add } = useLocalCollection<Comment>(`blog-tech-comments-${postId}`, COMMENT_SEED);

  async function handleSubmit(text: string) {
    add({
      id: crypto.randomUUID(),
      author: 'You', // no auth in this demo — every visitor-authored comment is attributed to
                      // a fixed placeholder name, same convention the baseline blog site and the
                      // CRM category (interactive-demo spec §4.3) both use for no-real-auth demo
                      // identity
      text,
      at: new Date().toISOString(),
    });
  }

  return <CommentThread comments={items} onSubmit={handleSubmit} />;
}
```

### 4.3 Data flow

1. Visitor opens `/posts/the-roadmap-nobody-reads`. The page's client wrapper mounts
   `useLocalCollection<Comment>('blog-tech-comments-the-roadmap-nobody-reads', [])`.
2. First visit for that post: hook seeds
   `localStorage['blog-tech-comments-the-roadmap-nobody-reads'] = []`, `CommentThread` renders its
   own empty state ("No comments yet" — kit behavior, plan 30 Task 5).
3. Visitor types into `CommentThread`'s textarea and submits. `CommentThread`'s `onSubmit(text)`
   fires (kit behavior); the site's handler wraps `text` into a full `Comment` (author + id + `at`
   timestamp) and calls the hook's `add()`.
4. The new comment appears under the article immediately (same render pass, `CommentThread` reads
   the same hook's `items`) and is written to `localStorage` under that post's own
   `blog-tech-comments-*` key.
5. Visitor navigates to `/posts/seed-round-math-nobody-explains-first-time-founders` (a different
   post). A *new* `useLocalCollection` instance mounts with its own
   `blog-tech-comments-seed-round-math-nobody-explains-first-time-founders` key — this key has
   never been written to, so `CommentThread` here shows its own empty state, **not** the comment
   left on the first post.
6. Reloading `/posts/the-roadmap-nobody-reads` (or returning later, same browser) re-hydrates from
   that post's own `localStorage` key per the hook's contract (interactive-demo spec §3.1 item 2) —
   the comment persists.
7. "Reset demo data" affordance: a small, non-prominent control below `CommentThread` calling that
   post's own `reset()` — clears only the current post's comments, consistent with the per-post key
   design.

## 5. Hallmark design brief

**Industry mood (master spec §4.2's assignment):** "Cool anchor hue, grotesque-sans display" —
tech/startup commentary read: confident, engineering-adjacent, a publication a founder or engineer
would actually subscribe to for opinionated industry commentary, not a marketing-agency "blog"
template and not a general-interest magazine (that register belongs to the baseline `blog` site).
Grotesque-sans as the display direction should read closer to a considered product/engineering
publication's type system — geometric, confident, screen-native — than a default system-font stack;
the cool anchor hue should differentiate clearly from the baseline `blog`'s deliberately open/warm
neutral mood and from `blog-lifestyle`/`blog-food`'s warm-hue/serif directions (interactive-demo
spec §4.2's table). Actual token values (the specific hue, the specific grotesque-sans/body-font
pairing, spacing scale, motion durations) are this site's Task 1 output, not this spec's — per
master spec §9, deferred to the real Hallmark session.

The session must clear the design-scoring gate (master spec §8), particularly criterion #10
(distinctiveness against the other 28 sites — most directly against the baseline `blog` and the
other 2 extra blog variants, all of which share the same underlying component/architecture and so
must differentiate purely on visual design) and criterion #2 (typographic craft — this site's
long-form article body makes typographic craft especially load-bearing, same as every blog-family
site).

**Reference directions to research during the Hallmark pass** (starting points, not commitments):
1. Independent tech/product-commentary publications and engineering-culture newsletters — the
   register of a publication written by and for people who build software, as distinct from a
   general marketing blog or a corporate engineering-blog template look (would fail criterion #1).
2. Developer-tool and startup-infrastructure product sites' own editorial/blog sections — for a
   cool-hue, grotesque-sans visual language that still reads as genuinely designed rather than a
   default dev-tool dark-mode template.
3. Modern grotesque/geometric-sans type systems used in screen-native product and engineering
   publications — for how the article-list grid (§3.2), the tag cloud (§3.3), and the article
   detail page's long-form body text can carry real typographic craft (criterion #2) within a
   grotesque-sans display direction, rather than defaulting to a single weight/size for everything.
