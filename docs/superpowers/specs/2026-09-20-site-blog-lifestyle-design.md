# `blog-lifestyle` Demo Site Spec

Date: 2026-09-20
Status: Approved
Scope: one of the 29 interactive-demo template sites — §4.2 extra Blog/Magazine variant
`blog-lifestyle` (lifestyle/travel magazine), from
`docs/superpowers/specs/2026-09-20-interactive-demo-templates-design.md`.

This spec is thin and data/content-focused per master spec §9: the architecture, component
contracts, and interaction mechanism are already fixed by the master spec and by the baseline
`blog` site's own spec/plan (`2026-09-20-site-blog-design.md`, plan 37). This document states only
what is specific to `blog-lifestyle` — its seed content, its storageKey pattern, and its Hallmark
design brief.

## 1. Site identity

- **Slug / subdomain:** `blog-lifestyle` (per plan 30 Task 1's authoritative slug table,
  `display_order = 25`, `category = blog-lifestyle`)
- **Folder:** `templates/blog-lifestyle/`
- **Subject:** lifestyle/travel magazine — slower-paced personal essays on travel, home, food-as-
  ritual, style, and everyday well-being, distinct from `blog-tech`'s startup/tech commentary and
  the baseline `blog`'s general-interest mix.
- **Differentiation from siblings:** `blog-tech` is cool-hued/grotesque-sans and topically
  tech/startup; `blog` (baseline) is neutral-toned and general-interest; `blog-lifestyle` is the
  warm-hued, serif-display, travel/lifestyle-flavored sibling — its own distinct voice and mood,
  not a re-skin of either.

## 2. Section composition (unchanged mechanism, per master spec §4.2)

Same pattern as the baseline `blog` plan:

- `/` — `Hero` → `ArticleList` (paginated, page-local component, reveal-4-per-click) → `TagCloud`
  (page-local component, derives tags from the full post set) → `Footer`
- `/posts/[slug]/` — static article detail route (`generateStaticParams()` over every seed post id)
  rendering title/tag/publish date/body, then the per-post `CommentThread`-backed comment section,
  then `Footer`

No new `template-kit` component is needed; `ArticleList`/`TagCloud` are page-local exactly as in
the baseline site, per that plan's design decision (d).

## 3. Seed content — `POSTS`

Six to ten realistic-but-fictional lifestyle/travel magazine posts. All names, places, and people
below are fictional; no fabricated statistics are presented as real (master spec §5).

### 3.1 `BlogPost` shape

```typescript
interface BlogPost {
  id: string;         // slug, used as the /posts/[slug] route param
  title: string;
  excerpt: string;
  tag: string;         // single primary category tag
  publishedAt: string; // ISO date
  body: string[];      // paragraphs
}
```

### 3.2 The posts

1. **id:** `a-slow-morning-in-hoi-an`
   **title:** A Slow Morning in Hội An
   **tag:** Travel
   **publishedAt:** 2026-01-12
   **excerpt:** Before the tour groups arrive, the old town belongs to the lantern-makers, the
   bánh mì cart, and whoever is awake early enough to notice.
   **body:**
   - The ferry from the mainland had left me on the wrong side of the river the night before, so
     the walk into town at six in the morning felt like arriving twice — once by boat, and once on
     foot, past shutters still down and a single bicycle bell somewhere out of sight.
   - By the time the first shopfronts opened, I had already found the noodle stall I would return
     to on every one of the next four mornings, run by a woman who never once asked what I wanted
     and was never once wrong about it.
   - Travel writing likes to promise a "hidden gem." Hội An at six a.m. isn't hidden — it's simply
     unattended, briefly, by anyone trying to sell you something, and that turns out to be enough.

2. **id:** `the-case-for-boring-vacations`
   **title:** The Case for Boring Vacations
   **tag:** Travel
   **publishedAt:** 2026-01-26
   **excerpt:** No itinerary, no must-see list, one neighborhood, ten days — a defense of the
   vacation with nothing to show for it.
   **body:**
   - Every trip I've regretted had a spreadsheet. Every trip I still think about had a rented
     apartment, a market two blocks away, and no plan past dinner.
   - This isn't a knock on ambitious travel — some places reward a checklist. But most of my best
     travel memories are of doing the same small errand every day until it stopped feeling like an
     errand and started feeling like a life I was temporarily allowed to live.
   - The boring vacation has one requirement most itineraries quietly forbid: enough unscheduled
     time to get mildly, harmlessly lost.

3. **id:** `what-my-grandmothers-kitchen-taught-me-about-hosting`
   **title:** What My Grandmother's Kitchen Taught Me About Hosting
   **tag:** Home
   **publishedAt:** 2026-02-03
   **excerpt:** She never had a matching set of anything, and somehow every dinner at her table
   felt like the best-planned party in the world.
   **body:**
   - My grandmother owned four dining chairs and regularly sat eight people. Nobody ever mentioned
     it, because by the time you noticed you were on a kitchen stool, you already had a plate of
     something too good to care.
   - The lesson wasn't "don't worry about mismatched furniture" — it was that hosting is a
     temperature, not an inventory. Warmth reads as preparation even when preparation was, honestly,
     minimal.
   - I still don't own a full set of matching chairs. I've stopped apologizing for it.

4. **id:** `a-wardrobe-built-for-one-suitcase`
   **title:** A Wardrobe Built for One Suitcase
   **tag:** Style
   **publishedAt:** 2026-02-17
   **excerpt:** Two years of traveling with carry-on only taught me more about my actual style than
   a decade of closet space ever did.
   **body:**
   - Constraint is a strange kind of editor. When everything has to earn its place in one bag, you
     stop buying clothes that only work in your head.
   - What survived the cut, trip after trip, was almost never the interesting piece — it was the
     reliable one: the shirt that looked fine slept-in, the shoes that worked for a train platform
     and a dinner table on the same day.
   - I now own a closet's worth of clothes again, at home. Most of it still passes the one-suitcase
     test anyway. That test turned out to be about more than luggage.
   - A wardrobe built for one suitcase, on reflection, was mostly a wardrobe built for one honest
     look at what I actually wear versus what I merely own.

5. **id:** `learning-to-cook-with-whatever-is-left`
   **title:** Learning to Cook With Whatever Is Left
   **tag:** Food
   **publishedAt:** 2026-03-02
   **excerpt:** Recipe-following got me competent. Emptying the fridge before a trip got me
   actually good.
   **body:**
   - The habit started out of necessity — three days before any longer trip, I stop buying
     groceries and start cooking from whatever's already there, no shopping list, no recipe.
   - It's a strange kind of practice. You can't follow a recipe you don't have, so you're forced to
     understand *why* a dish works, not just *what* goes in it — what an acid does to fat, what
     salt does before heat is even involved.
   - The dishes from "whatever's left" week are rarely photogenic. They are, without exception,
     what I actually crave when I'm home and tired, which by now feels like the more honest
     definition of a good meal.

6. **id:** `the-two-week-town-that-changed-how-i-travel`
   **title:** The Two-Week Town That Changed How I Travel
   **tag:** Travel
   **publishedAt:** 2026-03-19
   **excerpt:** I went to Đà Lạt for four days and stayed two weeks, mostly by accident, and it
   rearranged how I've planned every trip since.
   **body:**
   - The plan was four days, a waterfall, a market, a bus back to the coast. Four days became six
     when a friend of a friend offered a spare room; six became two weeks somewhere around the
     point I'd learned the names of the fruit sellers on my street.
   - What I'd been calling "seeing a place" on every prior trip turned out to mean something much
     smaller than what those two weeks gave me — a sense of a town's actual rhythm, not its
     highlight reel.
   - I still take short trips. But I now build in at least one stop with no return ticket booked,
     on principle, because the accident of staying is usually the whole trip.

7. **id:** `a-year-of-sunday-rituals`
   **title:** A Year of Sunday Rituals
   **tag:** Home
   **publishedAt:** 2026-04-06
   **excerpt:** Same coffee, same market, same three-hour stretch with no phone — the unglamorous
   routine that ended up holding the rest of the week together.
   **body:**
   - It started as an experiment: one fixed Sunday morning routine, unchanged for a year, to see if
     repetition would get boring or get comforting. It got comforting, and stayed that way longer
     than I expected.
   - The ritual itself is almost embarrassingly small — coffee made a specific way, a walk to the
     same market stalls, no phone until noon. None of it photographs well. All of it is doing more
     work than anything else in my week.
   - A year in, I've stopped thinking of it as a routine and started thinking of it as the thing
     that makes the other six days survivable.

8. **id:** `packing-light-for-a-heavy-year`
   **title:** Packing Light for a Heavy Year
   **tag:** Travel
   **publishedAt:** 2026-04-21
   **excerpt:** The year I traveled the most was also the hardest one at home — and the two turned
   out to be more connected than I expected.
   **body:**
   - I didn't plan to travel as much as I did that year. Most of the trips were short, sudden, and
     driven by things happening at home that I needed distance from, briefly, to think straight
     about.
   - Travel writing tends to sell movement as pure pleasure. That year taught me it can also be a
     tool — a way to get enough altitude on a hard problem that it stops looking unsolvable by the
     time you land again.
   - None of those trips fixed anything by themselves. But I came home from each one able to make
     one decision I couldn't make before I left, and a year of that adds up to more than a year of
     staying put would have.

## 4. Interactive feature: per-post comments

Identical mechanism to the baseline `blog` plan (master spec §3.2 row #7, §3.3 `CommentThread`):
each article detail page mounts a client component (`ArticleComments`, following the baseline
site's naming) that calls

```typescript
useLocalCollection<{ id: string; author: string; text: string; at: string }>(
  `blog-lifestyle-comments-${postId}`,
  [],
)
```

and renders `CommentThread` from `@portfolio/template-kit`. Per-post storageKey pattern:

- **Prefix:** `blog-lifestyle-comments-` — unique to this site, parallel to the baseline `blog`
  plan's `blog-comments-` prefix and `blog-tech`'s own (separately specced) prefix. Never a shared
  key filtered by `postId`; always `` `blog-lifestyle-comments-${postId}` `` built inside the
  client component from its `postId` prop, never a module-level constant.
- **Seed:** empty array (`[]`) for every post — no fabricated seed comments.
- **Author attribution:** every visitor-authored comment is attributed to a fixed placeholder
  name (`'You'`), same convention as the baseline site — no fabricated real identity.

## 5. Hallmark design brief

**Mood family (master spec §4.2's assigned direction): warm anchor hue, serif display.**

This is a non-binding starting direction, not a fixed token set — the real Hallmark session (this
site's Task 1) researches and converges on its own specific palette/type choices within this
family. The direction exists to guarantee `blog-lifestyle` reads as distinct from `blog-tech`
(cool anchor hue, grotesque-sans — startup/tech commentary) and from the baseline `blog` (neutral
tones, general-interest) when the 29 sites stand side by side (master spec §8 criterion #10).

- **Warm anchor hue:** terracotta/clay, amber, or warm sand-adjacent hues are plausible starting
  points for the accent — the session should test candidates against the subject matter (travel,
  home, food, slow living) rather than picking a warm hue arbitrarily; must still clear WCAG AA
  contrast on every real text/background pairing (master spec §8 criterion #3).
- **Serif display:** a serif or humanist-serif display face for headlines/pull quotes, paired per
  the 2+1 font-pairing rule (master spec §8 criterion #2) with a legible sans or serif body face
  suited to long-form reading — this site's article-body typographic craft is especially
  load-bearing, same as the baseline `blog` site's own brief notes for its long-form pages.
- **Reference directions to research (2-3, not prescriptive of final values):**
  1. Independent print/digital travel and lifestyle magazines (the editorial-feature layouts of
     outlets covering slow travel, home, and food-as-ritual writing) — for pacing, pull-quote
     treatment, and image/text rhythm on long-form articles.
  2. Warm-toned hospitality and boutique-travel brand identity systems (small inns, artisan-food
     brands, slow-travel operators) — for the warm-hue palette direction and a tactile, unhurried
     visual voice, avoiding the generic "wanderlust" travel-blog cliché look.
  3. Classic serif-display editorial type systems (magazine mastheads and headline treatments built
     around a strong serif display face) — for the display/body font-pairing decision and headline
     hierarchy.
- **Anti-generic guardrail:** must not read as a generic "travel blog" template (stock beach photo
  hero, default card grid, Instagram-adjacent gradient) — master spec §8 criterion #1. The warm/
  serif direction should feel considered and specific to this content, not decorative wallpaper.
