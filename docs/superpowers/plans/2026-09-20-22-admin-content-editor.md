# Admin Content Section Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/admin/content` screen — a non-technical, per-field editor for the four known
`content_sections` rows (`hero`, `about`, `services`, `contact`) backed by a new admin list endpoint,
instead of a raw JSON textarea.

**Architecture:** `GET /api/admin/content-sections` (new) lists every section; the FE renders one
form per `sectionKey` with fields specific to that key's known JSON shape, and `PUT
/api/admin/content-sections/{key}` (existing, unchanged) persists the edited `dataJson` string.

**Tech Stack:** Next.js App Router client components, Vitest, Spring Boot (Controller → Service →
Converter → Repository, spec 5.1).

**Spec:**
`docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md` (§4 content section editor),
`docs/superpowers/specs/2026-09-20-landing-page-ui-design.md` (§4.2/4.4/4.5/4.6 — the exact copy/
field shapes this editor must be able to change).

**Depends on:** `2026-09-19-13-admin-auth-middleware.md` (JWT cookie), `2026-09-20-19-landing-nav-footer.md`
and `2026-09-20-20-landing-hero-about.md` and `2026-09-20-21-landing-services-contact.md` (the public
page must already read `content_sections` for these four keys, or this editor has nothing real to
change).

> **Admin tree correction (2026-09-20).** An earlier draft of this plan placed the new screen at
> `frontend/app/admin/<name>/page.tsx` and edited `frontend/app/admin/layout.tsx`. Both are wrong
> against the repo:
>
> - The real tree is `frontend/app/admin/(dashboard)/{layout,page}.tsx` plus
>   `(dashboard)/leads/` and `(dashboard)/templates/`, with `frontend/app/admin/login/page.tsx`
>   as a sibling **outside** the group. New admin screens go in
>   **`frontend/app/admin/(dashboard)/<name>/page.tsx`** — placed outside the group they render
>   with no sidebar at all.
> - **`frontend/app/admin/layout.tsx` does not exist and must not be created.** It would become the
>   parent of *both* `login/` and `(dashboard)/`, so the admin sidebar — a list of links to
>   protected pages — would render on the login screen for anonymous visitors, and the dashboard
>   layout would nest inside it as a second sidebar. The nav to edit is
>   **`frontend/app/admin/(dashboard)/layout.tsx`**.

> **DOM test environment (2026-09-20).** This plan's component tests need a real DOM
> (`@testing-library/react`, and in places `fireEvent` / `IntersectionObserver`). That environment
> is **not** on by default here: `vitest.config.mjs` deliberately stays on the Node environment so
> `lib/webgl.test.ts` can keep deleting `window`/`document` to assert its SSR branch. Run
> **`2026-09-20-19b-dom-test-environment.md` first**, then start every DOM-requiring test file in
> this plan with exactly these two lines:
>
> ```
> // @vitest-environment jsdom
> import "@testing-library/jest-dom/vitest";
> ```
>
> A file missing the docblock runs in Node and fails with `document is not defined`, which reads
> like a component bug rather than a missing header. Do **not** run `npm install` yourself — plan
> 19b owns the dependency change.

## Global Constraints

- Backend must run within `-Xmx350m` (spec section 7 RAM budget) — no unbounded in-memory collections, use pagination on list endpoints.
- All admin-mutating endpoints (`POST`/`PUT`/`DELETE` under `/api/admin/**`) require a valid JWT with role `ADMIN` or `EDITOR`; only `ADMIN` may manage users and settings.
- Every admin CREATE/UPDATE/DELETE must write an `audit_logs` row (spec section 6); every 5xx response must write a `system_error_logs` row (spec section 8).
- Public GET endpoints (`templates`, `content-sections`) are Redis-cached with cache-aside invalidation on write (spec section 5).
- Public POST endpoints (`leads`, `analytics/events`, `auth/login`) are rate-limited via Bucket4j (spec section 5).
- `analytics_events.ip_hash` stores a hash of the IP, never the raw IP (spec section 6).
- Templates are static-exported Next.js sites served by Nginx on `<slug>.portfolio.com`, no per-template runtime process (spec sections 4, 7).
- No comments restating what code does; only comments explaining non-obvious "why".
- **Package layout follows spec section 5.1 (layered), not feature packages.** Read 5.1 before creating any class.
- **Controllers never touch a Repository or a Converter.** `LayerDependencyTest` enforces this and will fail the build.
- Request bodies are `form/*Form`, response bodies and inter-layer data are `dto/*Dto` (spec 5.1). Entities live in `model/` with no suffix.
- **All FE colour/font/spacing values come from `frontend/tokens.css` CSS custom properties** (written 2026-09-20 by the Hallmark design pass) — never a hard-coded OKLCH/hex/`font-family` in a component.

---

### Task 1: Backend — `GET /api/admin/content-sections` list endpoint

**Files:**
- Modify: `backend/src/main/java/com/portfolio/platform/service/ContentSectionService.java` — add `java.util.List<ContentSectionDto> listAll();`
- Modify: `backend/src/main/java/com/portfolio/platform/service/impl/ContentSectionServiceImpl.java`
- Modify: `backend/src/main/java/com/portfolio/platform/controller/ContentSectionController.java`
- Test: `backend/src/test/java/com/portfolio/platform/service/ContentSectionServiceTest.java` (extend)
- Test: `backend/src/test/java/com/portfolio/platform/controller/ContentSectionControllerTest.java` (extend)

**Interfaces:**
- Produces: `GET /api/admin/content-sections` → `200 List<ContentSectionDto>` (each: `sectionKey`, `dataJson`, `version`, `updatedAt`) — JWT `ADMIN` or `EDITOR` required, no pagination (bounded to a handful of rows by design, not a growing collection).

- [ ] **Step 1: Write the failing service test**

```java
@Test
void listAll_returnsEveryContentSectionAsDto() {
    ContentSection hero = new ContentSection();
    hero.setSectionKey("hero");
    hero.setDataJson("{\"headline\":\"See your site before you build it.\"}");
    contentSectionRepository.save(hero);

    List<ContentSectionDto> result = contentSectionService.listAll();

    assertThat(result).extracting(ContentSectionDto::sectionKey).contains("hero");
}
```

Run: `mvn -f backend/pom.xml test -Dtest=ContentSectionServiceTest`
Expected: FAIL — `listAll()` does not exist on the interface.

- [ ] **Step 2: Add `listAll()` to the service interface + impl**

```java
// ContentSectionService.java
java.util.List<ContentSectionDto> listAll();
```

```java
// ContentSectionServiceImpl.java
@Override
@Transactional(readOnly = true)
public List<ContentSectionDto> listAll() {
    return contentSectionRepository.findAll().stream()
            .map(contentSectionConverter::toDto)
            .toList();
}
```

No `@Cacheable` here — this is an admin-only, low-traffic read of a handful of rows; caching it adds
invalidation surface for no RAM/latency benefit (unlike the public `getByKey` hot path).

- [ ] **Step 3: Run test to verify it passes**

Run: `mvn -f backend/pom.xml test -Dtest=ContentSectionServiceTest`
Expected: PASS

- [ ] **Step 4: Write the failing controller test**

```java
@Test
void listAllContentSections_returns200WithArray() throws Exception {
    mockMvc.perform(get("/api/admin/content-sections")
                    .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
}

@Test
void listAllContentSections_withoutToken_returns401() throws Exception {
    mockMvc.perform(get("/api/admin/content-sections"))
            .andExpect(status().isUnauthorized());
}
```

Run: `mvn -f backend/pom.xml test -Dtest=ContentSectionControllerTest`
Expected: FAIL — 404, no such mapping.

- [ ] **Step 5: Add the controller method**

```java
@GetMapping("/api/admin/content-sections")
public ResponseEntity<List<ContentSectionDto>> listAll() {
    return ResponseEntity.ok(contentSectionService.listAll());
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `mvn -f backend/pom.xml test -Dtest=ContentSectionControllerTest`
Expected: PASS

### Task 2: Frontend — per-section editor forms

**Files:**
- Create: `frontend/app/admin/(dashboard)/content/page.tsx`
- Create: `frontend/lib/contentSectionShapes.ts` — typed shape + field labels per `sectionKey`
- Create: `frontend/components/admin/ContentSectionForm.tsx`
- Test: `frontend/components/admin/ContentSectionForm.test.tsx`
- Modify: `frontend/app/admin/(dashboard)/layout.tsx` — add "Content" nav link
- Modify: `frontend/lib/adminApiClient.ts` (plan 14) — no change needed, reused as-is

**Interfaces:**
- Consumes: `GET /api/admin/content-sections`, `PUT /api/admin/content-sections/{key}`.
- `contentSectionShapes.ts` defines, per the copy already fixed in
  `2026-09-20-landing-page-ui-design.md`:
  - `hero`: `{ headline: string }`
  - `about`: `{ heading: string; caption: string; body: string }`
  - `services`: `{ steps: { title: string; description: string }[] }` (exactly 3 steps, per §4.5)
  - `contact`: `{ heading: string; reassurance: string }`
- `dataJson` on the wire stays an opaque string; the FE `JSON.parse`/`JSON.stringify`s it against
  the shape above only at the form boundary — the backend never validates the shape (spec 5.1: it's
  a plain `dataJson` column, shape is a FE-only contract).

- [ ] **Step 1: Write the failing shape-parsing test**

```ts
import { describe, expect, it } from "vitest";
import { parseSectionData, SECTION_SHAPES } from "./contentSectionShapes";

describe("parseSectionData", () => {
  it("parses a hero dataJson string into its typed shape", () => {
    const parsed = parseSectionData("hero", '{"headline":"See your site before you build it."}');
    expect(parsed).toEqual({ headline: "See your site before you build it." });
  });

  it("falls back to the shape's default when dataJson is missing a field", () => {
    const parsed = parseSectionData("about", "{}");
    expect(parsed).toEqual(SECTION_SHAPES.about.defaults);
  });
});
```

Run: `cd frontend && npx vitest run lib/contentSectionShapes.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 2: Create `contentSectionShapes.ts`**

```ts
export type SectionKey = "hero" | "about" | "services" | "contact";

export const SECTION_SHAPES: Record<SectionKey, { defaults: Record<string, unknown> }> = {
  hero: { defaults: { headline: "See your site before you build it." } },
  about: { defaults: { heading: "Một xưởng, hai mươi bản thiết kế.", caption: "Est. cho 20 mẫu website", body: "" } },
  services: { defaults: { steps: [
    { title: "Xem trước trong 3D", description: "" },
    { title: "Chọn & tuỳ biến nội dung", description: "" },
    { title: "Ra mắt trên subdomain của bạn", description: "" },
  ] } },
  contact: { defaults: { heading: "Liên hệ", reassurance: "" } },
};

export function parseSectionData(key: SectionKey, dataJson: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(dataJson);
    return { ...SECTION_SHAPES[key].defaults, ...parsed };
  } catch {
    return SECTION_SHAPES[key].defaults;
  }
}
```

- [ ] **Step 3: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/contentSectionShapes.test.ts`
Expected: PASS

- [ ] **Step 4: Write the failing `ContentSectionForm` test**

```tsx
// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ContentSectionForm } from "./ContentSectionForm";

describe("ContentSectionForm", () => {
  it("submits the edited headline as dataJson to onSave", () => {
    const onSave = vi.fn();
    render(<ContentSectionForm sectionKey="hero" dataJson='{"headline":"Old"}' onSave={onSave} />);

    fireEvent.change(screen.getByLabelText("Headline"), { target: { value: "New headline" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    expect(onSave).toHaveBeenCalledWith("hero", JSON.stringify({ headline: "New headline" }));
  });
});
```

Run: `cd frontend && npx vitest run components/admin/ContentSectionForm.test.tsx`
Expected: FAIL — component does not exist.

- [ ] **Step 5: Create `ContentSectionForm.tsx`**

Renders one labelled text/textarea input per key in `parseSectionData(sectionKey, dataJson)`
(`services.steps` renders as a repeated 3-row title+description pair, not a free-add list — the
count is fixed at 3 per the design spec). Submit button text: `"Lưu thay đổi"` — a specific verb, not
"Save"/"Submit" (per `copy.md`). On submit, re-serializes the edited object back to a JSON string and
calls `onSave(sectionKey, json)`.

- [ ] **Step 6: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/admin/ContentSectionForm.test.tsx`
Expected: PASS

- [ ] **Step 7: Wire the page**

`app/admin/content/page.tsx`: fetches `GET /api/admin/content-sections` via `adminFetch` on mount,
renders one `<ContentSectionForm>` per section (order: hero, about, services, contact — the page
order from the landing design), `onSave` calls `adminFetch(PUT /api/admin/content-sections/{key})`
and shows a silent inline "Đã lưu." confirmation (no toast — editorial genre, quiet motion).

- [ ] **Step 8: Verify build**

Run: `cd frontend && npx vitest run && npm run build`
Expected: both PASS.

- [ ] **Step 9: Commit**

```bash
git add backend/src/main/java/com/portfolio/platform/service/ContentSectionService.java backend/src/main/java/com/portfolio/platform/service/impl/ContentSectionServiceImpl.java backend/src/main/java/com/portfolio/platform/controller/ContentSectionController.java backend/src/test frontend/app/admin/(dashboard)/content frontend/lib/contentSectionShapes.ts frontend/components/admin/ContentSectionForm.tsx frontend/components/admin/ContentSectionForm.test.tsx frontend/app/admin/(dashboard)/layout.tsx
git commit -m "feat: add admin content section editor with per-key field forms"
```

## Self-Review Notes

- **Spec coverage:** closes the "content section editor" gap called out in
  `2026-09-19-14-admin-dashboard-crud.md`'s Self-Review Notes as intentionally deferred.
- **Why per-field forms, not a JSON textarea:** the design spec's audience (§1 of the landing design
  doc) is a non-technical admin; a raw JSON textarea would let them corrupt `dataJson` and break the
  public page silently. Shape validation happens FE-side only — the backend contract stays a plain
  string per spec 5.1, so this plan adds no backend coupling to the shape.
- **Type consistency:** the four shapes in `contentSectionShapes.ts` are the single source of truth
  for what `2026-09-20-19/20/21` landing plans must read back out of `content_sections` — if those
  plans render different fields, reconcile against this file, not the other way around.
