# Landing Page — Hero & About Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `HeroSection` (Hallmark Marquee Hero, typography-only) and `AboutSection` (Hallmark S2 Hanging section head + asymmetric two-column prose) on the public landing page, both content-driven by the BE `content_sections` API with an honest hard-coded fallback.

**Architecture:** Both sections are server components that fetch their `content_sections` row at render time (`fetch(..., { next: { revalidate: 60 } })` — short revalidate window, not `no-store`, since public content changes rarely and Redis already caches the BE response). No client state needed — the reveal-on-scroll animation is pure CSS driven by an `IntersectionObserver` in a tiny shared client wrapper (`RevealOnScroll`), reused by every landing section in this and the next plan.

**Tech Stack:** Next.js App Router server components, TailwindCSS + design tokens, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-20-landing-page-ui-design.md` (§4.2 Hero, §4.4 About, §5 Motion).

**Depends on:** `2026-09-20-19-landing-nav-footer.md` (tokens wired into `globals.css`, shared layout exists). **Required by:** `2026-09-20-21-landing-services-contact.md` (reuses `RevealOnScroll`).

## Global Constraints

- Backend must run within `-Xmx350m` (spec section 7 RAM budget) — no unbounded in-memory collections, use pagination on list endpoints.
- Every admin CREATE/UPDATE/DELETE must write an `audit_logs` row (spec section 6); every 5xx response must write a `system_error_logs` row (spec section 8).
- Public GET endpoints (`templates`, `content-sections`) are Redis-cached with cache-aside invalidation on write (spec section 5) — this plan only *reads* `GET /api/public/content-sections/{key}`, no backend change.
- No comments restating what code does; only comments explaining non-obvious "why".
- **Every colour and font-family in CSS must reference a token from `frontend/tokens.css`.** No hard-coded OKLCH/hex/`font-family` string.
- **No fabricated content.** If `content_sections` has no row for a key yet, fall back to the exact copy in the design spec — never an invented number, testimonial, or stat.
- Hero heading is left-biased, never centred (editorial ban on centred-everything heroes — design spec §7).

---

### Task 1: `RevealOnScroll` — shared entrance animation

**Files:**
- Create: `frontend/components/RevealOnScroll.tsx`
- Test: `frontend/components/RevealOnScroll.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `<RevealOnScroll index={0}>{children}</RevealOnScroll>` — wraps a section, adds the `reveal` class once it enters the viewport, staggered by `index` via `--i`.

- [ ] **Step 1: Write the failing test — the wrapper starts hidden and becomes visible once observed**

```tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RevealOnScroll } from "./RevealOnScroll";

class MockObserver {
  callback: IntersectionObserverCallback;
  constructor(cb: IntersectionObserverCallback) {
    this.callback = cb;
  }
  observe(target: Element) {
    this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this as any);
  }
  unobserve() {}
  disconnect() {}
}

describe("RevealOnScroll", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", MockObserver as any);
  });

  it("adds the is-visible class once the observer reports intersection", () => {
    render(
      <RevealOnScroll index={2}>
        <p>Content</p>
      </RevealOnScroll>
    );
    const wrapper = screen.getByText("Content").parentElement;
    expect(wrapper).toHaveClass("is-visible");
    expect(wrapper).toHaveStyle({ "--i": "2" } as any);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/RevealOnScroll.test.tsx`
Expected: FAIL — `RevealOnScroll.tsx` does not exist.

- [ ] **Step 3: Create `RevealOnScroll.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

export function RevealOnScroll({
  children,
  index = 0,
}: {
  children: React.ReactNode;
  index?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal${visible ? " is-visible" : ""}`}
      style={{ "--i": index } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Add the `reveal` CSS to `tokens.css` (append, do not touch existing token declarations)**

```css
.reveal {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity var(--dur-long) var(--ease-out), transform var(--dur-long) var(--ease-out);
  transition-delay: calc(var(--i, 0) * 60ms);
}
.reveal.is-visible {
  opacity: 1;
  transform: none;
}
@media (prefers-reduced-motion: reduce) {
  .reveal {
    transition-duration: 150ms;
    transition-delay: 0ms;
    transform: none;
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/RevealOnScroll.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/components/RevealOnScroll.tsx frontend/components/RevealOnScroll.test.tsx frontend/tokens.css
git commit -m "feat: add RevealOnScroll shared entrance animation"
```

---

### Task 2: `HeroSection` — Marquee, typography-only, CMS-driven

**Files:**
- Create: `frontend/components/HeroSection.tsx`
- Create: `frontend/lib/contentClient.ts`
- Test: `frontend/lib/contentClient.test.ts`
- Test: `frontend/components/HeroSection.test.tsx`

**Interfaces:**
- Consumes: `GET /api/public/content-sections/{key}` (existing, `ContentSectionController`).
- Produces: `getContentSection(key)` helper reused by `AboutSection` (Task 3) and `ServicesSection` (next plan).

- [ ] **Step 1: Write the failing `contentClient` test**

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { getContentSection } from "./contentClient";

describe("getContentSection", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ sectionKey: "hero", dataJson: { headline: "Custom headline" } }) }))
    );
  });

  it("returns the parsed dataJson on success", async () => {
    const data = await getContentSection<{ headline: string }>("hero");
    expect(data?.headline).toBe("Custom headline");
  });

  it("returns null when the section does not exist (404)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 404 })));
    const data = await getContentSection("hero");
    expect(data).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/contentClient.test.ts`
Expected: FAIL — `contentClient.ts` does not exist.

- [ ] **Step 3: Create `contentClient.ts`**

```ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export async function getContentSection<T>(key: string): Promise<T | null> {
  const res = await fetch(`${API_BASE}/api/public/content-sections/${key}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  const body = await res.json();
  return body.dataJson as T;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/contentClient.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing `HeroSection` test — falls back to the honest default copy when the CMS has no row**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroSection } from "./HeroSection";

vi.mock("@/lib/contentClient", () => ({ getContentSection: vi.fn(async () => null) }));

describe("HeroSection", () => {
  it("renders the fallback headline when no CMS content exists", async () => {
    render(await HeroSection());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "See your site before you build it."
    );
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/HeroSection.test.tsx`
Expected: FAIL — `HeroSection.tsx` does not exist.

- [ ] **Step 7: Create `HeroSection.tsx`**

```tsx
import { getContentSection } from "@/lib/contentClient";

const FALLBACK_HEADLINE = "See your site before you build it.";

export async function HeroSection() {
  const content = await getContentSection<{ headline?: string }>("hero");
  const headline = content?.headline || FALLBACK_HEADLINE;

  return (
    <section className="flex min-h-screen flex-col justify-end px-[clamp(1rem,4vw,1.5rem)] pb-[var(--space-3xl)]">
      <h1
        className="max-w-[16ch]"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-display)",
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          overflowWrap: "anywhere",
          color: "var(--color-ink)",
        }}
      >
        {headline}
      </h1>
      <hr style={{ borderTop: "2px solid var(--color-rule)", marginTop: "var(--space-2xl)" }} />
    </section>
  );
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/HeroSection.test.tsx`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add frontend/components/HeroSection.tsx frontend/lib/contentClient.ts frontend/lib/contentClient.test.ts frontend/components/HeroSection.test.tsx
git commit -m "feat: add HeroSection (Hallmark Marquee, CMS-driven with honest fallback)"
```

---

### Task 3: `AboutSection` — S2 Hanging + asymmetric two-column prose

**Files:**
- Create: `frontend/components/AboutSection.tsx`
- Test: `frontend/components/AboutSection.test.tsx`

**Interfaces:**
- Consumes: `getContentSection("about")` (Task 2's helper).
- Produces: `<AboutSection />`, mounted on `app/page.tsx` after the 3D carousel (plan 12).

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AboutSection } from "./AboutSection";

vi.mock("@/lib/contentClient", () => ({ getContentSection: vi.fn(async () => null) }));

describe("AboutSection", () => {
  it("renders the fallback heading and does not fabricate any metric", async () => {
    render(await AboutSection());
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Một xưởng, hai mươi bản thiết kế."
    );
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("renders the caption in the narrow left margin", async () => {
    render(await AboutSection());
    expect(screen.getByText("Est. cho 20 mẫu website")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/AboutSection.test.tsx`
Expected: FAIL — `AboutSection.tsx` does not exist.

- [ ] **Step 3: Create `AboutSection.tsx`**

```tsx
import { getContentSection } from "@/lib/contentClient";
import { RevealOnScroll } from "./RevealOnScroll";

const FALLBACK_HEADING = "Một xưởng, hai mươi bản thiết kế.";
const FALLBACK_BODY =
  "Hai mươi mẫu website được thiết kế thủ công, trưng bày chung trong một trải nghiệm 3D. " +
  "Mỗi mẫu vận hành trên cùng một hệ thống quản trị Spring Boot — không cần chỉnh sửa cơ sở dữ liệu tay.";

export async function AboutSection() {
  const content = await getContentSection<{ heading?: string; body?: string }>("about");

  return (
    <RevealOnScroll index={1}>
      <section
        id="about"
        className="grid grid-cols-1 gap-[var(--space-lg)] px-[clamp(1rem,4vw,1.5rem)] py-[var(--space-3xl)] md:grid-cols-[16ch_minmax(0,65ch)]"
      >
        <p
          className="uppercase"
          style={{ fontSize: "var(--text-xs)", letterSpacing: "0.08em", color: "var(--color-muted)" }}
        >
          Est. cho 20 mẫu website
        </p>
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-lg)",
              color: "var(--color-ink)",
              marginBottom: "var(--space-md)",
            }}
          >
            {content?.heading || FALLBACK_HEADING}
          </h2>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--color-ink)", maxWidth: "65ch" }}>
            {content?.body || FALLBACK_BODY}
          </p>
        </div>
      </section>
    </RevealOnScroll>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/AboutSection.test.tsx`
Expected: PASS

- [ ] **Step 5: Mount `HeroSection` and `AboutSection` on `app/page.tsx`, placed around the (already-planned) 3D carousel component from plan 12**

```tsx
import { HeroSection } from "@/components/HeroSection";
import { AboutSection } from "@/components/AboutSection";
// import { TemplateCarousel } from "@/components/TemplateCarousel"; // plan 12

export default async function HomePage() {
  return (
    <main>
      <HeroSection />
      {/* <TemplateCarousel /> -- wired by plan 12 */}
      <AboutSection />
    </main>
  );
}
```

- [ ] **Step 6: Run full suite + build as final self-check**

Run: `cd frontend && npx vitest run && npm run build`
Expected: all tests PASS; `next build` succeeds.

- [ ] **Step 7: Commit**

```bash
git add frontend/components/AboutSection.tsx frontend/components/AboutSection.test.tsx frontend/app/page.tsx
git commit -m "feat: add AboutSection and mount Hero/About on the landing page"
```

## Self-Review Notes

- **Spec coverage:** implements design spec §4.2 (Hero) and §4.4 (About) exactly — left-biased headline, rule divider, no invented metrics in About, caption-only left margin (not a numbered eyebrow — gate 54 respected).
- **Honest copy:** every fallback string is the literal text approved in the design spec; nothing invented in this plan.
- **Token discipline:** zero hard-coded colours/fonts.
- **Placement note:** `app/page.tsx`'s carousel import is commented out because plan 12 owns that component; whichever plan lands second must uncomment and wire it — flagged for the operator running plans out of order.
- **Next plan:** `2026-09-20-21-landing-services-contact.md`.
