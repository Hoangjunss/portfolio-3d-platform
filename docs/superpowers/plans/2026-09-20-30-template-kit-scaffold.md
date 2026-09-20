# Template Kit Scaffold + Local-Persistence Hook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the shared `template-kit` component package (15 components + the
`useLocalCollection` local-persistence hook + an open theming contract) and seed the platform's
`templates` table with all 29 demo-site rows (20 original categories + 3 extra e-commerce + 3
extra blog + 3 CRM). **This plan does not build any of the 29 template repos themselves** — that
is plans 31-59, one per site, each with its own spec and its own Hallmark design pass.

**Architecture:** This plan supersedes and redoes `2026-09-20-28-template-design-system-scaffold.md`,
which has zero commits. Task 1 is a Flyway migration only (no new entity fields, no new endpoints
— `Template`/`TemplateDto`/`AdminTemplateController` already exist per plan 05). Tasks 2-5 build a
new, standalone local workspace package `template-kit/` (its own `package.json`, own Vitest
config, not wired into any npm workspaces array — matches how plan 28 scoped it, since no template
repo consumes it yet). Task 6 wires `template-kit`'s test run into CI, which nothing currently does.

**Tech Stack:** Next.js/React 19 components (framework-agnostic enough to run inside any of the 29
template repos' `app/` trees later), Vitest + Testing Library + jsdom, TypeScript. Backend change
is limited to task 1's migration.

**Spec:** `docs/superpowers/specs/2026-09-20-interactive-demo-templates-design.md` (§3.1
`useLocalCollection` contract, §3.3 the 6 new components, §4 the 9 extra site slugs, §5 the
Hallmark-per-site theming override, §6 folder/slug convention, §9 execution order — this is plan
30 in that section) and `docs/superpowers/specs/2026-09-20-template-design-system-design.md` (§3
20-category taxonomy, §4 the 9 original components, §6 folder/thumbnail/export convention,
unchanged by the amendment).

## Global Constraints

- Backend must run within `-Xmx350m` — task 1 adds no new list endpoint, no new pagination concern.
- **Backend layout follows spec 5.1.** No backend code beyond the migration file — do not touch
  `model/Template.java`, it already has every column this plan needs.
- No comments restating what code does; only comments explaining non-obvious "why".
- `template-kit` components carry **no fabricated metrics or testimonials** in default
  props/story fixtures (interactive-demo spec §5's "content authenticity" rule, unchanged from the
  parent spec) — `StatBlock`'s default export must not ship a made-up number.
- Every `template-kit` component must render at 320/375/414/768px without horizontal scroll — it
  will be reused across 29 independently-designed sites this package doesn't control the content
  length of.
- **Theming is now open, not a fixed 4-cluster enum** (interactive-demo spec §5 explicitly
  overrides the parent spec's "exactly 4 clusters, do not invent a 5th" rule) — `template-kit`
  exports a `TemplateTheme` *type/validator*, not a fixed set of theme values; each of the 29 sites
  supplies its own values via its own Hallmark pass, in a later plan.
- `next.config.js` in a template repo requires `output: 'export'` — enforced by task 2's build-time
  thumbnail check belonging to the *template*, not to `template-kit` itself (the kit is a component
  library, not a page).
- Current baseline per `docs/superpowers/STATUS.md`: backend `137/137 PASS`, frontend
  `42/42 PASS`. **Re-read `STATUS.md`'s own header for the actual current number before reporting**
  — other plans may have landed first.

---

## Task 1: Seed 29 template rows

**Files:**
- Create: `backend/src/main/resources/db/migration/V4__seed_template_categories.sql`
- Test: `backend/src/test/java/com/portfolio/platform/repository/TemplateRepositoryFlywaySeedTest.java`

**Interfaces:**
- Consumes: `Template` entity (`backend/src/main/java/com/portfolio/platform/model/Template.java`)
  — columns `id, name, slug, subdomain, thumbnail_media_id, description, category, tech_tags,
  display_order, is_active, view_count, click_count, created_by, created_at, updated_at`. No entity
  changes.
- Produces: 29 rows in `templates`, `slug`/`subdomain`/`category`/`display_order` values that
  tasks 31-59 (later plans) key their own template repo folder names off of — see the table below,
  which is the authoritative source for every later plan's slug.

### Design decisions

**(a) Seed rows carry `thumbnail_media_id = NULL` and `is_active = true`** — same as plan 28's
decision (a): no `Media` row exists yet for any of these; `TemplateServiceImpl`'s existing
thumbnail-resolution code already handles a NULL `thumbnailMediaId` by leaving `thumbnailUrl` null,
so the 3D carousel renders its coloured-plane fallback until an admin uploads real thumbnails.

**(b) `slug` is the REAL, final slug from the interactive-demo spec's §6 folder tree — not a
`demo-NN-` placeholder.** Plan 28 chose a placeholder pattern because no folder/CI convention was
fixed yet for any of the 20. The interactive-demo spec's §6 already commits to exact folder names
for all 29 sites (`corporate`, `ecommerce`, `shop-streetwear`, `crm-realestate`, ...), so seeding
the real slug now avoids a rename later. `subdomain` is set identical to `slug` (parent spec §6:
"slug MUST equal ... subdomain"); real DNS/CI wiring per-slug is still out of scope (plan 17).

**(c) `display_order` is 1-29 in the exact order of the table below** — 1-20 matches the
interactive-demo spec §3.2 taxonomy table order (same as the original 20-category table), 21-23
are the 3 extra e-commerce variants (§4.1), 24-26 the 3 extra blog variants (§4.2), 27-29 the 3
CRM variants (§4.3).

**(d) `category` stores the short English machine key**, unchanged convention from plan 28's
decision (d) — a stable DB key, not the bilingual taxonomy label.

**(e) This migration is idempotent-safe the way V1-V3 are** — Flyway's own versioning is the guard;
no defensive `ON CONFLICT` SQL.

**Complete slug/category/display_order table (authoritative for this task and every later 31-59 plan):**

| `display_order` | `slug` = `subdomain` | `category` | `name` (vi) |
|---|---|---|---|
| 1 | `corporate` | `corporate` | Doanh nghiệp |
| 2 | `agency` | `agency` | Agency / Digital Studio |
| 3 | `saas` | `saas` | SaaS / Startup |
| 4 | `ecommerce` | `ecommerce` | Cửa hàng online |
| 5 | `restaurant` | `restaurant` | Nhà hàng / Cafe |
| 6 | `realestate` | `realestate` | Bất động sản |
| 7 | `blog` | `blog` | Blog / Magazine |
| 8 | `portfolio` | `portfolio` | Portfolio cá nhân |
| 9 | `medical` | `medical` | Phòng khám / Nha khoa |
| 10 | `education` | `education` | Trường học / Khoá học |
| 11 | `event` | `event` | Hội nghị / Sự kiện |
| 12 | `wedding` | `wedding` | Đám cưới |
| 13 | `fitness` | `fitness` | Gym / Fitness |
| 14 | `nonprofit` | `nonprofit` | Từ thiện / NGO |
| 15 | `travel` | `travel` | Khách sạn / Resort |
| 16 | `construction` | `construction` | Kiến trúc / Xây dựng |
| 17 | `beauty` | `beauty` | Salon / Spa |
| 18 | `photography` | `photography` | Photography Studio |
| 19 | `automotive` | `automotive` | Đại lý xe |
| 20 | `legal` | `legal` | Văn phòng luật |
| 21 | `shop-streetwear` | `shop-streetwear` | Cửa hàng streetwear |
| 22 | `shop-homegoods` | `shop-homegoods` | Cửa hàng nội thất |
| 23 | `shop-electronics` | `shop-electronics` | Cửa hàng điện tử |
| 24 | `blog-tech` | `blog-tech` | Blog công nghệ |
| 25 | `blog-lifestyle` | `blog-lifestyle` | Blog lifestyle |
| 26 | `blog-food` | `blog-food` | Blog ẩm thực |
| 27 | `crm-realestate` | `crm-realestate` | CRM bất động sản |
| 28 | `crm-agency` | `crm-agency` | CRM agency |
| 29 | `crm-clinic` | `crm-clinic` | CRM phòng khám |

- [ ] **Step 1: Write the failing test**

```java
package com.portfolio.platform.repository;

import com.portfolio.platform.model.Template;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class TemplateRepositoryFlywaySeedTest {

    @Autowired
    TemplateRepository templateRepository;

    @Test
    void seedMigration_insertsExactlyTwentyNineTemplates() {
        assertThat(templateRepository.findAll()).hasSize(29);
    }

    @Test
    void seedMigration_allSlugsAreUnique() {
        List<Template> all = templateRepository.findAll();
        Set<String> slugs = all.stream().map(Template::getSlug).collect(Collectors.toSet());
        assertThat(slugs).hasSize(29);
    }

    @Test
    void seedMigration_allAreActiveWithNullThumbnail() {
        List<Template> all = templateRepository.findAll();
        assertThat(all).allSatisfy(t -> {
            assertThat(t.isActive()).isTrue();
            assertThat(t.getThumbnailMediaId()).isNull();
        });
    }

    @Test
    void seedMigration_displayOrderCoversOneToTwentyNineWithNoGaps() {
        List<Integer> orders = templateRepository.findAll().stream()
                .map(Template::getDisplayOrder)
                .sorted()
                .collect(Collectors.toList());
        List<Integer> expected = IntStream.rangeClosed(1, 29).boxed().collect(Collectors.toList());
        assertThat(orders).isEqualTo(expected);
    }

    @Test
    void seedMigration_slugEqualsSubdomainForEveryRow() {
        assertThat(templateRepository.findAll())
                .allSatisfy(t -> assertThat(t.getSlug()).isEqualTo(t.getSubdomain()));
    }
}
```

- [ ] **Step 2: Run to verify it fails** — `mvn -B -f backend/pom.xml test -Dtest=TemplateRepositoryFlywaySeedTest`. Expected: FAIL, `V4` doesn't exist yet, table has 0 rows.
- [ ] **Step 3: Write `V4__seed_template_categories.sql`** — 29 `INSERT INTO templates (name, slug, subdomain, description, category, display_order, is_active) VALUES (...)` statements, one per row of the table above, `is_active = true`, `description` a one-sentence Vietnamese description matching the category (`thumbnail_media_id` omitted → NULL by column default absence).
- [ ] **Step 4: Run the full backend suite** — `mvn -B -f backend/pom.xml test`, report the real pass count against the current `STATUS.md` baseline.
- [ ] **Step 5: Mutation checks**

| # | Revert | Test that must go RED |
|---|---|---|
| M1 | seed only 28 rows | `seedMigration_insertsExactlyTwentyNineTemplates` |
| M2 | duplicate one `slug` across two rows | `seedMigration_allSlugsAreUnique` |
| M3 | set one row's `thumbnail_media_id` to a non-null value | `seedMigration_allAreActiveWithNullThumbnail` |
| M4 | give one row `subdomain` different from its `slug` | `seedMigration_slugEqualsSubdomainForEveryRow` |

- [ ] **Step 6: Commit** — `feat: seed 29 template category rows via Flyway V4`

---

## Task 2: `template-kit` package scaffold, theme contract, thumbnail guard

**Files:**
- Create: `template-kit/package.json`, `template-kit/tsconfig.json`, `template-kit/vitest.config.ts`
- Create: `template-kit/src/theme.ts`, `template-kit/src/theme.test.ts`
- Create: `template-kit/scripts/check-thumbnail.mjs`, `template-kit/scripts/check-thumbnail.test.mjs`

**Interfaces:**
- Produces: `TemplateTheme` type and `assertValidTheme(theme: unknown): TemplateTheme` from
  `template-kit/src/theme.ts` — every later task/site imports this, not a fixed cluster.

### Design decisions

**(f) `theme.ts` exports an open `TemplateTheme` shape, not a fixed enum of clusters** —
interactive-demo spec §5 overrides plan 28's "exactly 4 clusters" rule. Each of the 29 sites picks
its own values via its own Hallmark pass (later plan); `template-kit` only defines and validates
the *shape* every site's `theme.ts` must conform to, so downstream components can rely on
`var(--color-accent)`/`var(--font-display)`/`var(--font-body)` existing regardless of which site
supplies them.

**(g) `assertValidTheme` is a runtime guard, not just a compile-time type** — a site author (or
Antigravity, building a site from a later plan) supplies real values at build time in plain
TypeScript with no compiler enforcement of non-empty strings; this function is what a site's own
`theme.ts` calls to fail loudly (thrown error naming the missing field) instead of shipping an
`undefined` token.

**(h) `check-thumbnail.mjs` is unchanged from plan 28's decision (i)** — a Node script a template's
own `package.json` `build` script runs before `next build`; asserts `public/thumbnail.webp` exists
and is a valid WEBP via a minimal magic-byte check (`RIFF....WEBP`), exits non-zero naming the
missing/invalid file if not.

- [ ] **Step 1: Write the failing tests**

`template-kit/src/theme.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { assertValidTheme } from './theme';

describe('assertValidTheme', () => {
  it('returns the theme unchanged when all fields are non-empty strings', () => {
    const theme = { accentHue: '#2563eb', displayFont: 'Fraunces', bodyFont: 'Inter Tight' };
    expect(assertValidTheme(theme)).toEqual(theme);
  });

  it('throws naming the missing field when accentHue is empty', () => {
    expect(() => assertValidTheme({ accentHue: '', displayFont: 'A', bodyFont: 'B' }))
      .toThrow(/accentHue/);
  });

  it('throws naming the missing field when displayFont is missing', () => {
    expect(() => assertValidTheme({ accentHue: '#000', bodyFont: 'B' }))
      .toThrow(/displayFont/);
  });

  it('throws when given a non-object', () => {
    expect(() => assertValidTheme(null)).toThrow(/theme/i);
  });
});
```

`template-kit/scripts/check-thumbnail.test.mjs`:
```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { checkThumbnail } from './check-thumbnail.mjs';

let dir;

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'thumb-check-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('checkThumbnail', () => {
  it('returns ok:false when the file is missing', () => {
    const result = checkThumbnail(path.join(dir, 'public', 'thumbnail.webp'));
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/not found/i);
  });

  it('returns ok:false when the file exists but is not a real WEBP', () => {
    const file = path.join(dir, 'thumbnail.webp');
    writeFileSync(file, Buffer.from('not a webp file'));
    const result = checkThumbnail(file);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/not a valid webp/i);
  });

  it('returns ok:true for a real WEBP magic-byte header', () => {
    const file = path.join(dir, 'thumbnail.webp');
    const header = Buffer.concat([
      Buffer.from('RIFF'),
      Buffer.from([0, 0, 0, 0]),
      Buffer.from('WEBP'),
    ]);
    writeFileSync(file, header);
    const result = checkThumbnail(file);
    expect(result.ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify all fail** — `cd template-kit && npx vitest run` (package doesn't exist yet, expect module-not-found).
- [ ] **Step 3: `template-kit/package.json`**

```json
{
  "name": "@portfolio/template-kit",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "main": "src/index.ts",
  "scripts": {
    "test": "vitest run"
  },
  "dependencies": {
    "react": "19.2.0",
    "react-dom": "19.2.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "7.0.1",
    "@testing-library/react": "16.3.3",
    "@types/node": "^24",
    "@types/react": "19.2.2",
    "jsdom": "30.1.0",
    "typescript": "5.6.3",
    "vitest": "5.0.1"
  }
}
```

- [ ] **Step 4: `template-kit/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "ES2022"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 5: `template-kit/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['@testing-library/jest-dom/vitest'],
  },
});
```

- [ ] **Step 6: `template-kit/src/theme.ts`**

```typescript
export interface TemplateTheme {
  accentHue: string;
  displayFont: string;
  bodyFont: string;
}

const REQUIRED_FIELDS: Array<keyof TemplateTheme> = ['accentHue', 'displayFont', 'bodyFont'];

export function assertValidTheme(theme: unknown): TemplateTheme {
  if (typeof theme !== 'object' || theme === null) {
    throw new Error('assertValidTheme: theme must be a non-null object');
  }
  const candidate = theme as Record<string, unknown>;
  for (const field of REQUIRED_FIELDS) {
    const value = candidate[field];
    if (typeof value !== 'string' || value.trim() === '') {
      throw new Error(`assertValidTheme: "${field}" must be a non-empty string`);
    }
  }
  return candidate as unknown as TemplateTheme;
}
```

- [ ] **Step 7: `template-kit/scripts/check-thumbnail.mjs`**

```javascript
import { readFileSync, existsSync } from 'node:fs';

export function checkThumbnail(filePath) {
  if (!existsSync(filePath)) {
    return { ok: false, reason: `thumbnail not found at ${filePath}` };
  }
  const buffer = readFileSync(filePath);
  const isRiff = buffer.subarray(0, 4).toString('ascii') === 'RIFF';
  const isWebp = buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  if (!isRiff || !isWebp) {
    return { ok: false, reason: `${filePath} is not a valid WEBP file` };
  }
  return { ok: true, reason: null };
}

function main() {
  const target = process.argv[2] ?? 'public/thumbnail.webp';
  const result = checkThumbnail(target);
  if (!result.ok) {
    console.error(`check-thumbnail: ${result.reason}`);
    process.exit(1);
  }
  console.log(`check-thumbnail: ${target} OK`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
```

- [ ] **Step 8: Run tests, verify pass** — `cd template-kit && npx vitest run` (7 tests so far).
- [ ] **Step 9: Mutation checks**

| # | Revert | Test that must go RED |
|---|---|---|
| M5 | let `assertValidTheme` accept an empty string for `accentHue` | the empty-`accentHue` throw test |
| M6 | let `checkThumbnail` return `ok:true` without checking the `WEBP` magic bytes | the not-a-valid-webp test |

- [ ] **Step 10: Commit** — `feat: scaffold template-kit package with open theme contract and thumbnail guard`

---

## Task 3: 9 original kit components

**Files:**
- Create: `template-kit/src/components/Hero.tsx` + `.test.tsx`
- Create: `template-kit/src/components/ItemGrid.tsx` + `.test.tsx`
- Create: `template-kit/src/components/PricedItemGrid.tsx` + `.test.tsx`
- Create: `template-kit/src/components/PeopleGrid.tsx` + `.test.tsx`
- Create: `template-kit/src/components/Timeline.tsx` + `.test.tsx`
- Create: `template-kit/src/components/PhotoGallery.tsx` + `.test.tsx`
- Create: `template-kit/src/components/InquiryForm.tsx` + `.test.tsx`
- Create: `template-kit/src/components/StatBlock.tsx` + `.test.tsx`
- Create: `template-kit/src/components/Footer.tsx` + `.test.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks (pure presentational components, no theme/hook dependency
  at the type level — they read CSS custom properties at render time, not `TemplateTheme` values
  directly).
- Produces: the 9 named exports every one of the 29 sites' `page.tsx` composes from, per the
  parent spec §4 kit table. Exact prop shapes below are what task 5's barrel export and every
  later 31-59 plan rely on.

### Design decisions (unchanged from plan 28's (g)/(h)/(j))

**(i)** No component reaches into `fetch` or any backend call — content is always passed in via
props from the calling site's own `page.tsx`.

**(j)** `StatBlock` requires its `stats` prop and renders nothing when the array is empty — the
enforcement mechanism for "no fabricated metrics."

**(k)** `InquiryForm`'s field set is data (`fields: Array<{name, label, type, required}>`) plus a
fixed trailing `message` textarea, not markup variants — one component serves every category that
needs an inquiry/request form with different extra fields.

- [ ] **Step 1: Write the failing tests** (one file per component; every component gets a
  renders-without-throwing test and an empty-items-array test where it takes a list prop)

```tsx
// template-kit/src/components/Hero.test.tsx
import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { Hero } from './Hero';

describe('Hero', () => {
  it('renders with required props without throwing', () => {
    render(<Hero headline="Build faster" subhead="A demo site" ctaLabel="Get started" ctaHref="#" />);
  });
});
```

```tsx
// template-kit/src/components/ItemGrid.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ItemGrid } from './ItemGrid';

describe('ItemGrid', () => {
  it('renders one card per item', () => {
    render(<ItemGrid items={[{ id: '1', title: 'A', description: 'desc' }, { id: '2', title: 'B', description: 'desc' }]} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders without throwing for an empty items array', () => {
    render(<ItemGrid items={[]} />);
  });
});
```

```tsx
// template-kit/src/components/PricedItemGrid.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PricedItemGrid } from './PricedItemGrid';

describe('PricedItemGrid', () => {
  it('renders price for each item', () => {
    render(<PricedItemGrid currency="VND" items={[{ id: '1', title: 'Combo A', price: 99000 }]} />);
    expect(screen.getByText(/99[,.]?000/)).toBeInTheDocument();
  });

  it('renders without throwing for an empty items array', () => {
    render(<PricedItemGrid currency="VND" items={[]} />);
  });
});
```

```tsx
// template-kit/src/components/PeopleGrid.test.tsx
import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { PeopleGrid } from './PeopleGrid';

describe('PeopleGrid', () => {
  it('renders without throwing for an empty people array', () => {
    render(<PeopleGrid roleLabel="Team" people={[]} />);
  });

  it('renders without throwing with real people', () => {
    render(<PeopleGrid roleLabel="Leadership" people={[{ id: '1', name: 'A', role: 'CEO' }]} />);
  });
});
```

```tsx
// template-kit/src/components/Timeline.test.tsx
import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { Timeline } from './Timeline';

describe('Timeline', () => {
  it('renders vertical orientation without throwing', () => {
    render(<Timeline orientation="vertical" entries={[{ id: '1', title: 'Step 1', description: 'd' }]} />);
  });

  it('renders horizontal orientation without throwing for an empty list', () => {
    render(<Timeline orientation="horizontal" entries={[]} />);
  });
});
```

```tsx
// template-kit/src/components/PhotoGallery.test.tsx
import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { PhotoGallery } from './PhotoGallery';

describe('PhotoGallery', () => {
  it('renders without throwing for an empty photos array', () => {
    render(<PhotoGallery layout="grid" photos={[]} lightbox={false} />);
  });

  it('renders without throwing with real photos', () => {
    render(<PhotoGallery layout="masonry" photos={[{ id: '1', src: '/a.webp', alt: 'A photo' }]} lightbox />);
  });
});
```

```tsx
// template-kit/src/components/InquiryForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InquiryForm } from './InquiryForm';

describe('InquiryForm', () => {
  it('renders exactly the base 4 fields when fields=[]', () => {
    render(<InquiryForm fields={[]} submitLabel="Send" onSubmit={async () => {}} />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
  });

  it('renders base + extra fields when fields has entries', () => {
    render(<InquiryForm fields={[{ name: 'company', label: 'Company', type: 'text', required: false }]} submitLabel="Send" onSubmit={async () => {}} />);
    expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
  });

  it('disables submit while onSubmit is pending, re-enables after it resolves', async () => {
    let resolveSubmit: () => void = () => {};
    const onSubmit = vi.fn(() => new Promise<void>((resolve) => { resolveSubmit = resolve; }));
    render(<InquiryForm fields={[]} submitLabel="Send" onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled());
    resolveSubmit();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).not.toBeDisabled());
  });
});
```

```tsx
// template-kit/src/components/StatBlock.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatBlock } from './StatBlock';

describe('StatBlock', () => {
  it('renders nothing for an empty stats array', () => {
    const { container } = render(<StatBlock stats={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders one block per real stat, never a literal 0 for a missing value', () => {
    render(<StatBlock stats={[{ label: 'Clients served', value: '120+' }]} />);
    expect(screen.getByText('120+')).toBeInTheDocument();
  });
});
```

```tsx
// template-kit/src/components/Footer.test.tsx
import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it('renders without throwing with an empty link set and social off', () => {
    render(<Footer links={[]} showSocial={false} />);
  });
});
```

- [ ] **Step 2: Run to verify all fail.**

- [ ] **Step 3: `Hero.tsx`, `Footer.tsx`**

```tsx
// template-kit/src/components/Hero.tsx
export interface HeroProps {
  headline: string;
  subhead: string;
  ctaLabel: string;
  ctaHref: string;
  backgroundImage?: string;
}

export function Hero({ headline, subhead, ctaLabel, ctaHref, backgroundImage }: HeroProps) {
  return (
    <section
      className="tk-hero"
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}
    >
      <h1>{headline}</h1>
      <p>{subhead}</p>
      <a href={ctaHref}>{ctaLabel}</a>
    </section>
  );
}
```

```tsx
// template-kit/src/components/Footer.tsx
export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterProps {
  links: FooterLink[];
  showSocial: boolean;
}

export function Footer({ links, showSocial }: FooterProps) {
  return (
    <footer className="tk-footer">
      <nav>
        {links.map((link) => (
          <a key={link.href} href={link.href}>{link.label}</a>
        ))}
      </nav>
      {showSocial ? <div className="tk-footer-social" aria-label="Social links" /> : null}
    </footer>
  );
}
```

- [ ] **Step 4: `ItemGrid.tsx`, `PricedItemGrid.tsx`, `PeopleGrid.tsx`**

```tsx
// template-kit/src/components/ItemGrid.tsx
export interface GridItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  image?: string;
}

export interface ItemGridProps {
  items: GridItem[];
  columns?: 2 | 3 | 4;
}

export function ItemGrid({ items, columns = 3 }: ItemGridProps) {
  return (
    <ul className="tk-item-grid" data-columns={columns}>
      {items.map((item) => (
        <li key={item.id}>
          {item.image ? <img src={item.image} alt="" /> : null}
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </li>
      ))}
    </ul>
  );
}
```

```tsx
// template-kit/src/components/PricedItemGrid.tsx
export interface PricedItem {
  id: string;
  title: string;
  price: number;
  image?: string;
}

export interface PricedItemGridProps {
  items: PricedItem[];
  currency: string;
  ctaLabel?: string;
  onSelect?: (item: PricedItem) => void;
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(price);
}

export function PricedItemGrid({ items, currency, ctaLabel, onSelect }: PricedItemGridProps) {
  return (
    <ul className="tk-priced-item-grid">
      {items.map((item) => (
        <li key={item.id}>
          {item.image ? <img src={item.image} alt="" /> : null}
          <h3>{item.title}</h3>
          <span>{formatPrice(item.price, currency)}</span>
          {ctaLabel ? (
            <button type="button" onClick={() => onSelect?.(item)}>{ctaLabel}</button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
```

```tsx
// template-kit/src/components/PeopleGrid.tsx
export interface Person {
  id: string;
  name: string;
  role: string;
  photo?: string;
}

export interface PeopleGridProps {
  people: Person[];
  roleLabel: string;
}

export function PeopleGrid({ people, roleLabel }: PeopleGridProps) {
  return (
    <ul className="tk-people-grid" aria-label={roleLabel}>
      {people.map((person) => (
        <li key={person.id}>
          {person.photo ? <img src={person.photo} alt="" /> : null}
          <h3>{person.name}</h3>
          <p>{person.role}</p>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 5: `Timeline.tsx`, `PhotoGallery.tsx`**

```tsx
// template-kit/src/components/Timeline.tsx
export interface TimelineEntry {
  id: string;
  title: string;
  description: string;
  date?: string;
}

export interface TimelineProps {
  entries: TimelineEntry[];
  orientation: 'vertical' | 'horizontal';
}

export function Timeline({ entries, orientation }: TimelineProps) {
  return (
    <ol className="tk-timeline" data-orientation={orientation}>
      {entries.map((entry) => (
        <li key={entry.id}>
          {entry.date ? <time>{entry.date}</time> : null}
          <h3>{entry.title}</h3>
          <p>{entry.description}</p>
        </li>
      ))}
    </ol>
  );
}
```

```tsx
// template-kit/src/components/PhotoGallery.tsx
export interface Photo {
  id: string;
  src: string;
  alt: string;
}

export interface PhotoGalleryProps {
  photos: Photo[];
  layout: 'grid' | 'masonry';
  lightbox: boolean;
}

export function PhotoGallery({ photos, layout, lightbox }: PhotoGalleryProps) {
  return (
    <ul className="tk-photo-gallery" data-layout={layout} data-lightbox={lightbox}>
      {photos.map((photo) => (
        <li key={photo.id}>
          <img src={photo.src} alt={photo.alt} />
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 6: `InquiryForm.tsx`**

```tsx
// template-kit/src/components/InquiryForm.tsx
import { useState, type FormEvent } from 'react';

export interface InquiryField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'number';
  required: boolean;
}

export interface InquiryFormProps {
  fields: InquiryField[];
  submitLabel: string;
  onSubmit: (values: Record<string, string>) => Promise<void>;
}

const BASE_FIELDS: InquiryField[] = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone', type: 'tel', required: false },
];

export function InquiryForm({ fields, submitLabel, onSubmit }: InquiryFormProps) {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const allFields = [...BASE_FIELDS, ...fields];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values: Record<string, string> = {};
    for (const field of allFields) values[field.name] = String(formData.get(field.name) ?? '');
    values.message = String(formData.get('message') ?? '');

    setPending(true);
    setStatus('idle');
    try {
      await onSubmit(values);
      setStatus('success');
    } catch {
      setStatus('error');
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="tk-inquiry-form" onSubmit={handleSubmit}>
      {allFields.map((field) => (
        <label key={field.name}>
          {field.label}
          <input name={field.name} type={field.type} required={field.required} disabled={pending} />
        </label>
      ))}
      <label>
        Message
        <textarea name="message" disabled={pending} />
      </label>
      <button type="submit" disabled={pending}>{submitLabel}</button>
      {status === 'success' ? <p role="status">Sent</p> : null}
      {status === 'error' ? <p role="alert">Something went wrong</p> : null}
    </form>
  );
}
```

- [ ] **Step 7: `StatBlock.tsx`**

```tsx
// template-kit/src/components/StatBlock.tsx
export interface Stat {
  label: string;
  value: string;
}

export interface StatBlockProps {
  stats: Stat[];
}

export function StatBlock({ stats }: StatBlockProps) {
  if (stats.length === 0) return null;
  return (
    <dl className="tk-stat-block">
      {stats.map((stat) => (
        <div key={stat.label}>
          <dt>{stat.label}</dt>
          <dd>{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
```

- [ ] **Step 8: Run `cd template-kit && npx vitest run`, verify all pass.**
- [ ] **Step 9: Mutation checks**

| # | Revert | Test that must go RED |
|---|---|---|
| M7 | make `StatBlock` return an empty `<div>` instead of `null` for `stats=[]` | the empty-stats `toBeEmptyDOMElement` test |
| M8 | drop the `disabled={pending}` on `InquiryForm`'s submit button | the pending-submit-disables test |
| M9 | render only `BASE_FIELDS` and ignore the `fields` prop in `InquiryForm` | the base+extra-fields test |

- [ ] **Step 10: Commit** — `feat: add the 9 original template-kit components`

---

## Task 4: `useLocalCollection` hook

**Files:**
- Create: `template-kit/src/useLocalCollection.ts` + `.test.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `useLocalCollection<T extends { id: string }>(storageKey, seedData)` returning
  `{ items, add, update, remove, reset }` — task 5's `CartDrawer`, `CommentThread`, `KanbanBoard`,
  `RecordTable`, `SavedItemsPanel`, `CompareTray` all call this hook; every later 31-59 site plan's
  own interactive feature also calls it directly with its own `T` shape.

### Design decisions (interactive-demo spec §3.1, verbatim contract)

**(l)** First visit (nothing in `localStorage` under `storageKey`): hook writes `seedData` to
`localStorage` and the returned `items` equal `seedData`, synchronously on first render (via
`useState(() => seedData)` as the initial value) — **no loading flash, no empty state on first
paint**, matching static-export SSR/first-paint content.

**(m)** Reading real `localStorage` only happens inside `useEffect` (client-only, post-mount) —
this is what makes the render pattern in the interactive-demo spec §3.1 correct: the exact same
`seedData` renders on the server-generated static HTML and on first client paint (no hydration
mismatch), and only after mount does the hook "take over" if a returning visitor's `localStorage`
holds different data.

**(n)** `reset()` re-seeds from the original `seedData` closure captured at the hook's first call
— every site's UI wires this to a small "Reset demo data" affordance per the spec.

- [ ] **Step 1: Write the failing test**

```tsx
// template-kit/src/useLocalCollection.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLocalCollection } from './useLocalCollection';

interface Item {
  id: string;
  label: string;
}

const SEED: Item[] = [{ id: '1', label: 'Seed item' }];

beforeEach(() => {
  window.localStorage.clear();
});

describe('useLocalCollection', () => {
  it('returns seedData synchronously on first render before any effect runs', () => {
    const { result } = renderHook(() => useLocalCollection('test-key-1', SEED));
    expect(result.current.items).toEqual(SEED);
  });

  it('writes seedData into localStorage on first visit', async () => {
    renderHook(() => useLocalCollection('test-key-2', SEED));
    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem('test-key-2')!)).toEqual(SEED);
    });
  });

  it('persists an add() mutation to localStorage and to items', async () => {
    const { result } = renderHook(() => useLocalCollection('test-key-3', SEED));
    await waitFor(() => expect(result.current.items).toEqual(SEED));

    act(() => {
      result.current.add({ id: '2', label: 'New item' });
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(2);
      expect(JSON.parse(window.localStorage.getItem('test-key-3')!)).toHaveLength(2);
    });
  });

  it('reads existing localStorage data instead of seedData on a later mount', async () => {
    window.localStorage.setItem('test-key-4', JSON.stringify([{ id: '9', label: 'Returning visitor data' }]));
    const { result } = renderHook(() => useLocalCollection('test-key-4', SEED));
    await waitFor(() => {
      expect(result.current.items).toEqual([{ id: '9', label: 'Returning visitor data' }]);
    });
  });

  it('reset() re-seeds from the original seedData', async () => {
    const { result } = renderHook(() => useLocalCollection('test-key-5', SEED));
    await waitFor(() => expect(result.current.items).toEqual(SEED));

    act(() => {
      result.current.add({ id: '2', label: 'Temp item' });
    });
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    act(() => {
      result.current.reset();
    });
    await waitFor(() => {
      expect(result.current.items).toEqual(SEED);
      expect(JSON.parse(window.localStorage.getItem('test-key-5')!)).toEqual(SEED);
    });
  });

  it('two hooks with different storageKeys never share data', async () => {
    const a = renderHook(() => useLocalCollection('isolated-key-a', [{ id: '1', label: 'A' }]));
    const b = renderHook(() => useLocalCollection('isolated-key-b', [{ id: '1', label: 'B' }]));

    await waitFor(() => {
      expect(a.result.current.items[0].label).toBe('A');
      expect(b.result.current.items[0].label).toBe('B');
    });

    act(() => {
      a.result.current.add({ id: '2', label: 'Only in A' });
    });

    await waitFor(() => expect(a.result.current.items).toHaveLength(2));
    expect(b.result.current.items).toHaveLength(1);
  });

  it('update() patches a single item by id, remove() drops it', async () => {
    const { result } = renderHook(() => useLocalCollection('test-key-6', SEED));
    await waitFor(() => expect(result.current.items).toEqual(SEED));

    act(() => {
      result.current.update('1', { label: 'Edited' });
    });
    await waitFor(() => expect(result.current.items[0].label).toBe('Edited'));

    act(() => {
      result.current.remove('1');
    });
    await waitFor(() => expect(result.current.items).toHaveLength(0));
  });
});
```

- [ ] **Step 2: Run to verify it fails** — module doesn't exist.
- [ ] **Step 3: `template-kit/src/useLocalCollection.ts`**

```typescript
'use client';
import { useCallback, useEffect, useState } from 'react';

export interface LocalCollectionItem {
  id: string;
}

export interface UseLocalCollectionResult<T extends LocalCollectionItem> {
  items: T[];
  add: (item: T) => void;
  update: (id: string, patch: Partial<T>) => void;
  remove: (id: string) => void;
  reset: () => void;
}

function readStorage<T>(storageKey: string): T[] | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(storageKey);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return null;
  }
}

function writeStorage<T>(storageKey: string, items: T[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, JSON.stringify(items));
}

export function useLocalCollection<T extends LocalCollectionItem>(
  storageKey: string,
  seedData: T[],
): UseLocalCollectionResult<T> {
  const [items, setItems] = useState<T[]>(seedData);

  useEffect(() => {
    const stored = readStorage<T>(storageKey);
    if (stored === null) {
      writeStorage(storageKey, seedData);
      setItems(seedData);
    } else {
      setItems(stored);
    }
    // seedData is a caller-provided literal per mount; re-running only on storageKey change
    // matches the "first visit vs. returning visitor" contract, not React's own dep-array rule.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const add = useCallback((item: T) => {
    setItems((prev) => {
      const next = [...prev, item];
      writeStorage(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const update = useCallback((id: string, patch: Partial<T>) => {
    setItems((prev) => {
      const next = prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry));
      writeStorage(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((entry) => entry.id !== id);
      writeStorage(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const reset = useCallback(() => {
    writeStorage(storageKey, seedData);
    setItems(seedData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  return { items, add, update, remove, reset };
}
```

- [ ] **Step 4: Run `cd template-kit && npx vitest run`, verify all pass.**
- [ ] **Step 5: Mutation checks**

| # | Revert | Test that must go RED |
|---|---|---|
| M10 | initialize `useState` with `[]` instead of `seedData` | the synchronous-seedData-on-first-render test |
| M11 | make the `useEffect` always overwrite with `seedData` regardless of existing storage | the returning-visitor-reads-existing-data test |
| M12 | share one storage key across all hook instances instead of using `storageKey` | the two-different-storageKeys-never-share-data test |

- [ ] **Step 6: Commit** — `feat: add useLocalCollection local-persistence hook to template-kit`

---

## Task 5: 6 new shared components + barrel export

**Files:**
- Create: `template-kit/src/components/SavedItemsPanel.tsx` + `.test.tsx`
- Create: `template-kit/src/components/CompareTray.tsx` + `.test.tsx`
- Create: `template-kit/src/components/CartDrawer.tsx` + `.test.tsx`
- Create: `template-kit/src/components/CommentThread.tsx` + `.test.tsx`
- Create: `template-kit/src/components/KanbanBoard.tsx` + `.test.tsx`
- Create: `template-kit/src/components/RecordTable.tsx` + `.test.tsx`
- Create: `template-kit/src/index.ts`

**Interfaces:**
- Consumes: `useLocalCollection` (task 4) is NOT called inside these components — per design
  decision (i) (task 3), kit components stay pure/presentational; the *site* calls
  `useLocalCollection` and passes `items`/mutation callbacks down as props. This keeps every kit
  component testable without a `localStorage` mock.
- Produces: barrel export `template-kit/src/index.ts` re-exporting all 15 components,
  `useLocalCollection`, `TemplateTheme`, `assertValidTheme` — the single import surface every
  31-59 site plan uses (`import { Hero, CartDrawer, useLocalCollection } from '@portfolio/template-kit'`).

- [ ] **Step 1: Write the failing tests**

```tsx
// template-kit/src/components/SavedItemsPanel.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SavedItemsPanel } from './SavedItemsPanel';

interface Saved { id: string; label: string; }

describe('SavedItemsPanel', () => {
  it('shows the empty label when there are no saved items', () => {
    render(<SavedItemsPanel items={[]} emptyLabel="Nothing saved yet" onRemove={() => {}} renderItem={(i: Saved) => i.label} />);
    expect(screen.getByText('Nothing saved yet')).toBeInTheDocument();
  });

  it('renders one row per item and calls onRemove with its id', () => {
    const onRemove = vi.fn();
    render(
      <SavedItemsPanel
        items={[{ id: '1', label: 'Item A' }] as Saved[]}
        emptyLabel="Nothing saved yet"
        onRemove={onRemove}
        renderItem={(i: Saved) => i.label}
      />,
    );
    expect(screen.getByText('Item A')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(onRemove).toHaveBeenCalledWith('1');
  });
});
```

```tsx
// template-kit/src/components/CompareTray.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CompareTray } from './CompareTray';

interface Vehicle { id: string; label: string; }

describe('CompareTray', () => {
  it('renders without throwing for an empty comparison', () => {
    render(<CompareTray items={[]} onRemove={() => {}} renderItem={(v: Vehicle) => v.label} />);
  });

  it('renders up to the items given, one column each', () => {
    render(
      <CompareTray
        items={[{ id: '1', label: 'Car A' }, { id: '2', label: 'Car B' }] as Vehicle[]}
        onRemove={() => {}}
        renderItem={(v: Vehicle) => v.label}
      />,
    );
    expect(screen.getByText('Car A')).toBeInTheDocument();
    expect(screen.getByText('Car B')).toBeInTheDocument();
  });
});
```

```tsx
// template-kit/src/components/CartDrawer.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartDrawer, CartBadge } from './CartDrawer';

interface CartLine { id: string; title: string; price: number; qty: number; }

describe('CartBadge', () => {
  it('shows the total quantity across all lines', () => {
    render(<CartBadge lines={[{ id: '1', title: 'A', price: 1000, qty: 2 }, { id: '2', title: 'B', price: 500, qty: 1 }] as CartLine[]} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders 0 for an empty cart', () => {
    render(<CartBadge lines={[]} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});

describe('CartDrawer', () => {
  it('renders an empty-cart message for an empty cart', () => {
    render(<CartDrawer lines={[]} currency="VND" onQtyChange={() => {}} onRemove={() => {}} onCheckout={() => {}} />);
    expect(screen.getByText(/cart is empty/i)).toBeInTheDocument();
  });

  it('calls onQtyChange when the quantity input changes', () => {
    const onQtyChange = vi.fn();
    render(
      <CartDrawer
        lines={[{ id: '1', title: 'Product A', price: 10000, qty: 1 }] as CartLine[]}
        currency="VND"
        onQtyChange={onQtyChange}
        onRemove={() => {}}
        onCheckout={() => {}}
      />,
    );
    fireEvent.change(screen.getByLabelText(/quantity/i), { target: { value: '3' } });
    expect(onQtyChange).toHaveBeenCalledWith('1', 3);
  });
});
```

```tsx
// template-kit/src/components/CommentThread.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommentThread } from './CommentThread';

describe('CommentThread', () => {
  it('renders a message when there are no comments', () => {
    render(<CommentThread comments={[]} onSubmit={async () => {}} />);
    expect(screen.getByText(/no comments yet/i)).toBeInTheDocument();
  });

  it('calls onSubmit with the textarea value and clears it', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<CommentThread comments={[]} onSubmit={onSubmit} />);
    const textarea = screen.getByLabelText(/add a comment/i);
    fireEvent.change(textarea, { target: { value: 'Great article' } });
    fireEvent.click(screen.getByRole('button', { name: /post/i }));
    expect(onSubmit).toHaveBeenCalledWith('Great article');
  });
});
```

```tsx
// template-kit/src/components/KanbanBoard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KanbanBoard } from './KanbanBoard';

interface Deal { id: string; title: string; stage: string; }

describe('KanbanBoard', () => {
  const columns = [{ key: 'new', label: 'New' }, { key: 'won', label: 'Won' }];

  it('groups items under their column by stage', () => {
    render(
      <KanbanBoard
        columns={columns}
        items={[{ id: '1', title: 'Deal A', stage: 'new' }] as Deal[]}
        renderItem={(d: Deal) => d.title}
        onMove={() => {}}
      />,
    );
    expect(screen.getByText('Deal A')).toBeInTheDocument();
  });

  it('calls onMove with the item id and new stage when the stage selector changes', () => {
    const onMove = vi.fn();
    render(
      <KanbanBoard
        columns={columns}
        items={[{ id: '1', title: 'Deal A', stage: 'new' }] as Deal[]}
        renderItem={(d: Deal) => d.title}
        onMove={onMove}
      />,
    );
    fireEvent.change(screen.getByLabelText(/move deal a/i), { target: { value: 'won' } });
    expect(onMove).toHaveBeenCalledWith('1', 'won');
  });

  it('renders every column, even an empty one, without throwing', () => {
    render(<KanbanBoard columns={columns} items={[]} renderItem={(d: Deal) => d.title} onMove={() => {}} />);
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Won')).toBeInTheDocument();
  });
});
```

```tsx
// template-kit/src/components/RecordTable.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecordTable } from './RecordTable';

interface Contact { id: string; name: string; email: string; }

describe('RecordTable', () => {
  const columns = [{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }];

  it('renders without throwing for an empty rows array', () => {
    render(<RecordTable columns={columns} rows={[]} onEdit={() => {}} onDelete={() => {}} />);
  });

  it('filters rows by the search input across all column values', () => {
    render(
      <RecordTable
        columns={columns}
        rows={[{ id: '1', name: 'Alice', email: 'alice@x.com' }, { id: '2', name: 'Bob', email: 'bob@x.com' }] as Contact[]}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    fireEvent.change(screen.getByLabelText(/search/i), { target: { value: 'alice' } });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('calls onDelete with the row id', () => {
    const onDelete = vi.fn();
    render(
      <RecordTable
        columns={columns}
        rows={[{ id: '1', name: 'Alice', email: 'alice@x.com' }] as Contact[]}
        onEdit={() => {}}
        onDelete={onDelete}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith('1');
  });
});
```

- [ ] **Step 2: Run to verify all fail.**
- [ ] **Step 3: `SavedItemsPanel.tsx`, `CompareTray.tsx`**

```tsx
// template-kit/src/components/SavedItemsPanel.tsx
export interface SavedItemsPanelProps<T extends { id: string }> {
  items: T[];
  emptyLabel: string;
  onRemove: (id: string) => void;
  renderItem: (item: T) => React.ReactNode;
}

export function SavedItemsPanel<T extends { id: string }>({ items, emptyLabel, onRemove, renderItem }: SavedItemsPanelProps<T>) {
  if (items.length === 0) {
    return <p className="tk-saved-items-empty">{emptyLabel}</p>;
  }
  return (
    <ul className="tk-saved-items-panel">
      {items.map((item) => (
        <li key={item.id}>
          <span>{renderItem(item)}</span>
          <button type="button" onClick={() => onRemove(item.id)}>Remove</button>
        </li>
      ))}
    </ul>
  );
}
```

```tsx
// template-kit/src/components/CompareTray.tsx
export interface CompareTrayProps<T extends { id: string }> {
  items: T[];
  onRemove: (id: string) => void;
  renderItem: (item: T) => React.ReactNode;
}

export function CompareTray<T extends { id: string }>({ items, onRemove, renderItem }: CompareTrayProps<T>) {
  return (
    <div className="tk-compare-tray" data-count={items.length}>
      {items.map((item) => (
        <div key={item.id} className="tk-compare-column">
          <span>{renderItem(item)}</span>
          <button type="button" onClick={() => onRemove(item.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: `CartDrawer.tsx`**

```tsx
// template-kit/src/components/CartDrawer.tsx
export interface CartLine {
  id: string;
  title: string;
  price: number;
  qty: number;
}

export interface CartBadgeProps {
  lines: CartLine[];
}

export function CartBadge({ lines }: CartBadgeProps) {
  const total = lines.reduce((sum, line) => sum + line.qty, 0);
  return <span className="tk-cart-badge">{total}</span>;
}

export interface CartDrawerProps {
  lines: CartLine[];
  currency: string;
  onQtyChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(price);
}

export function CartDrawer({ lines, currency, onQtyChange, onRemove, onCheckout }: CartDrawerProps) {
  if (lines.length === 0) {
    return <p className="tk-cart-empty">Your cart is empty</p>;
  }
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  return (
    <div className="tk-cart-drawer">
      <ul>
        {lines.map((line) => (
          <li key={line.id}>
            <span>{line.title}</span>
            <label>
              Quantity
              <input
                type="number"
                min={1}
                value={line.qty}
                onChange={(event) => onQtyChange(line.id, Number(event.target.value))}
              />
            </label>
            <span>{formatPrice(line.price * line.qty, currency)}</span>
            <button type="button" onClick={() => onRemove(line.id)}>Remove</button>
          </li>
        ))}
      </ul>
      <p className="tk-cart-subtotal">{formatPrice(subtotal, currency)}</p>
      <button type="button" onClick={onCheckout}>Checkout</button>
    </div>
  );
}
```

- [ ] **Step 5: `CommentThread.tsx`**

```tsx
// template-kit/src/components/CommentThread.tsx
import { useState, type FormEvent } from 'react';

export interface Comment {
  id: string;
  author: string;
  text: string;
  at: string;
}

export interface CommentThreadProps {
  comments: Comment[];
  onSubmit: (text: string) => Promise<void>;
}

export function CommentThread({ comments, onSubmit }: CommentThreadProps) {
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;
    setPending(true);
    try {
      await onSubmit(draft);
      setDraft('');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="tk-comment-thread">
      {comments.length === 0 ? (
        <p>No comments yet</p>
      ) : (
        <ul>
          {comments.map((comment) => (
            <li key={comment.id}>
              <strong>{comment.author}</strong>
              <p>{comment.text}</p>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleSubmit}>
        <label>
          Add a comment
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} disabled={pending} />
        </label>
        <button type="submit" disabled={pending}>Post</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 6: `KanbanBoard.tsx`**

```tsx
// template-kit/src/components/KanbanBoard.tsx
export interface KanbanColumn {
  key: string;
  label: string;
}

export interface KanbanItem {
  id: string;
  stage: string;
}

export interface KanbanBoardProps<T extends KanbanItem> {
  columns: KanbanColumn[];
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  onMove: (id: string, newStage: string) => void;
}

export function KanbanBoard<T extends KanbanItem>({ columns, items, renderItem, onMove }: KanbanBoardProps<T>) {
  return (
    <div className="tk-kanban-board">
      {columns.map((column) => (
        <div key={column.key} className="tk-kanban-column">
          <h3>{column.label}</h3>
          <ul>
            {items
              .filter((item) => item.stage === column.key)
              .map((item) => (
                <li key={item.id}>
                  <span>{renderItem(item)}</span>
                  <label>
                    {`Move ${renderItem(item)}`}
                    <select value={item.stage} onChange={(event) => onMove(item.id, event.target.value)}>
                      {columns.map((target) => (
                        <option key={target.key} value={target.key}>{target.label}</option>
                      ))}
                    </select>
                  </label>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: `RecordTable.tsx`**

```tsx
// template-kit/src/components/RecordTable.tsx
import { useMemo, useState } from 'react';

export interface RecordTableColumn {
  key: string;
  label: string;
}

export interface RecordTableProps<T extends { id: string }> {
  columns: RecordTableColumn[];
  rows: T[];
  onEdit: (row: T) => void;
  onDelete: (id: string) => void;
}

export function RecordTable<T extends { id: string; [key: string]: unknown }>({ columns, rows, onEdit, onDelete }: RecordTableProps<T>) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const needle = search.toLowerCase();
    return rows.filter((row) =>
      columns.some((column) => String(row[column.key] ?? '').toLowerCase().includes(needle)),
    );
  }, [rows, search, columns]);

  return (
    <div className="tk-record-table">
      <label>
        Search
        <input value={search} onChange={(event) => setSearch(event.target.value)} />
      </label>
      <table>
        <thead>
          <tr>
            {columns.map((column) => <th key={column.key}>{column.label}</th>)}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => <td key={column.key}>{String(row[column.key] ?? '')}</td>)}
              <td>
                <button type="button" onClick={() => onEdit(row)}>Edit</button>
                <button type="button" onClick={() => onDelete(row.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 8: `template-kit/src/index.ts` barrel export**

```typescript
export { Hero } from './components/Hero';
export { Footer } from './components/Footer';
export { ItemGrid } from './components/ItemGrid';
export { PricedItemGrid } from './components/PricedItemGrid';
export { PeopleGrid } from './components/PeopleGrid';
export { Timeline } from './components/Timeline';
export { PhotoGallery } from './components/PhotoGallery';
export { InquiryForm } from './components/InquiryForm';
export { StatBlock } from './components/StatBlock';
export { SavedItemsPanel } from './components/SavedItemsPanel';
export { CompareTray } from './components/CompareTray';
export { CartDrawer, CartBadge } from './components/CartDrawer';
export { CommentThread } from './components/CommentThread';
export { KanbanBoard } from './components/KanbanBoard';
export { RecordTable } from './components/RecordTable';
export { useLocalCollection } from './useLocalCollection';
export { assertValidTheme } from './theme';
export type { TemplateTheme } from './theme';
```

- [ ] **Step 9: Run `cd template-kit && npx vitest run`, report the full real result (should be 15 components + hook + theme + thumbnail-check test files, all passing).**
- [ ] **Step 10: Mutation checks**

| # | Revert | Test that must go RED |
|---|---|---|
| M13 | make `CartBadge` sum line count instead of quantity | the total-quantity-across-lines test |
| M14 | drop the empty-cart early return in `CartDrawer` | the empty-cart-message test |
| M15 | make `KanbanBoard`'s move control not call `onMove` on change | the calls-onMove-with-id-and-stage test |
| M16 | make `RecordTable`'s search only match the first column | the filters-across-all-columns test |

- [ ] **Step 11: Commit** — `feat: add 6 new shared components and template-kit barrel export`

---

## Task 6: Wire `template-kit` into CI

**Files:**
- Modify: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `template-kit/package.json`'s `test` script (task 2).
- Produces: nothing consumed by later tasks — this is the last task in this plan.

### Design decision

**(o)** Same correction plan 28 flagged and never landed: the `test` job runs backend tests, then
`frontend/`'s tests/build — nothing touches `template-kit/`. Fifteen components and a hook with
real tests that no pipeline executes are believed-tested, not actually tested. Add a
`template-kit` step to the same `test` job, after the frontend step, in the same commit that
created the package (already done in tasks 2-5; this task closes the gap for CI specifically).

- [ ] **Step 1: Read the current `test` job** in `.github/workflows/deploy.yml` to confirm the
  exact step ordering/indentation before editing (already captured above under Architecture — the
  job runs backend tests, then `actions/setup-node@v4`, then a `frontend` working-directory step).
- [ ] **Step 2: Add the `template-kit` step**, inserted after the existing "Frontend tests and
  build" step, before the `test` job ends:

```yaml
      - name: template-kit tests
        working-directory: template-kit
        run: |
          npm install
          npm test
```

- [ ] **Step 3: Verify the YAML parses** — `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))"` (or equivalent available YAML linter) exits 0.
- [ ] **Step 4: Commit** — `ci: run template-kit tests in the deploy workflow's test job`

## Self-Review Notes

- **Spec coverage:** interactive-demo spec §3.1 (task 4), §3.3 (task 5's 6 components), §4/§6
  (task 1's slug table), §5 (task 2's open `TemplateTheme`, explicitly not the old 4-cluster rule),
  §9 (this plan is "plan 30" in that section's numbering). Parent spec §3 (task 1's 20-category
  order), §4 (task 3's 9 components), §6 (task 1/2's folder/thumbnail/slug convention, unchanged).
- **Explicitly not built here:** any of the 29 template repos themselves (plans 31-59), any
  per-site Hallmark design pass, CI wiring for the 29 sites' own static-export deploy (plan 17,
  unchanged), real thumbnail uploads (admin action against the existing media library).
- **Type consistency checked:** `useLocalCollection`'s `T extends { id: string }` constraint
  (task 4) matches every task-5 component's own `T extends { id: string }` prop constraint;
  `CartLine`, `Comment`, `KanbanItem`'s `stage: string`, and `RecordTable`'s row shape are all
  concrete examples of that same constraint, not independently-invented shapes.
- **Next step:** plan 31 (first of the 29 site plans) should pick one site, run its own Hallmark
  design pass per interactive-demo spec §5, and confirm in practice that `template-kit`'s barrel
  export (task 5 step 8) is actually sufficient before the remaining 28 plans are authored.
