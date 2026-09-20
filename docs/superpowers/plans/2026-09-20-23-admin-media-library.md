# Admin Media Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/admin/media` screen — a grid of uploaded images with copy-URL and delete, backed
by two new endpoints (`GET` list, `DELETE`) added to the existing upload-only `MediaController`.

**Architecture:** `GET /api/admin/media` (new, paginated) lists `MediaDto` rows; `DELETE
/api/admin/media/{id}` (new) removes both the DB row and the file on disk. Upload
(`POST`, existing, unchanged) already returns a `MediaDto` the grid can prepend optimistically.

**Tech Stack:** Next.js App Router client components, Vitest, Spring Boot (Controller → Service →
Converter → Repository, spec 5.1).

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md` (§4 media library, §6
`media` table — no `deleted_at` column, unlike `templates`).

**Depends on:** `2026-09-19-06-content-media-settings.md` (upload endpoint, `MediaStorageProperties`,
`MediaService`).

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
- **All FE colour/font/spacing values come from `frontend/tokens.css` CSS custom properties** — never a hard-coded OKLCH/hex/`font-family` in a component.

---

### Task 1: Backend — list + delete endpoints

**Files:**
- Modify: `backend/src/main/java/com/portfolio/platform/service/MediaService.java` — add `org.springframework.data.domain.Page<MediaDto> list(Pageable pageable);` and `void delete(Long id, String username);`
- Modify: `backend/src/main/java/com/portfolio/platform/service/impl/MediaServiceImpl.java`
- Modify: `backend/src/main/java/com/portfolio/platform/controller/MediaController.java`
- Test: `backend/src/test/java/com/portfolio/platform/service/MediaServiceTest.java` (extend)
- Test: `backend/src/test/java/com/portfolio/platform/controller/MediaControllerTest.java` (extend)

**Interfaces:**
- Produces: `GET /api/admin/media?page=&size=` → `200 Page<MediaDto>` (max page size 100, reusing
  the `max-page-size: 100` cap already set in `application.yml` by plan 11 task 1 — do not add a
  second config key).
- Produces: `DELETE /api/admin/media/{id}` → `204 No Content`. **Hard delete**, not soft: unlike
  `templates`, the `media` table has no `deleted_at` column (design spec §6) and nothing else
  references a media row by foreign key at this point in the schema, so a tombstone would be dead
  weight. The physical file under `MediaStorageProperties.uploadDir` is deleted in the same
  transaction boundary as the DB row (best-effort file delete after DB commit — a missing file must
  never block the DB delete from succeeding, since the file already being gone is not the caller's
  problem to see as a 500).

- [ ] **Step 1: Write the failing service test for `list`**

```java
@Test
void list_returnsPagedMediaDtos() {
    Media media = new Media();
    media.setFileName("thumb.webp");
    media.setUrl("/media/abc.webp");
    media.setMimeType("image/webp");
    media.setSizeBytes(1024);
    mediaRepository.save(media);

    Page<MediaDto> page = mediaService.list(PageRequest.of(0, 20));

    assertThat(page.getContent()).extracting(MediaDto::fileName).contains("thumb.webp");
}
```

Run: `mvn -f backend/pom.xml test -Dtest=MediaServiceTest`
Expected: FAIL — `list()` does not exist.

- [ ] **Step 2: Add `list()` to the service**

```java
// MediaService.java
Page<MediaDto> list(Pageable pageable);
```

```java
// MediaServiceImpl.java
@Override
@Transactional(readOnly = true)
public Page<MediaDto> list(Pageable pageable) {
    return mediaRepository.findAll(pageable).map(mediaConverter::toDto);
}
```

- [ ] **Step 3: Run test to verify it passes**

Run: `mvn -f backend/pom.xml test -Dtest=MediaServiceTest`
Expected: PASS

- [ ] **Step 4: Write the failing service test for `delete`**

```java
@Test
void delete_removesRowAndDoesNotThrowWhenFileAlreadyMissing() {
    Media media = new Media();
    media.setFileName("gone.webp");
    media.setUrl("/media/does-not-exist-on-disk.webp");
    media.setMimeType("image/webp");
    media.setSizeBytes(1);
    Long id = mediaRepository.save(media).getId();

    mediaService.delete(id, "admin");

    assertThat(mediaRepository.findById(id)).isEmpty();
}

@Test
void delete_unknownId_throwsResourceNotFound() {
    assertThatThrownBy(() -> mediaService.delete(999_999L, "admin"))
            .isInstanceOf(ResourceNotFoundException.class);
}
```

Run: `mvn -f backend/pom.xml test -Dtest=MediaServiceTest`
Expected: FAIL — `delete()` does not exist.

- [ ] **Step 5: Add `delete()` to the service**

```java
@Audited(entityType = "Media", action = "DELETE")
@Transactional
@Override
public void delete(Long id, String username) {
    Media media = mediaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Media", id));
    mediaRepository.delete(media);
    deleteFileQuietly(media.getUrl());
}

// Best-effort: a file already missing on disk must not turn a valid DB delete into a 500.
private void deleteFileQuietly(String url) {
    try {
        Path path = Path.of(mediaStorageProperties.getUploadDir()).resolve(Path.of(url).getFileName());
        Files.deleteIfExists(path);
    } catch (IOException ignored) {
    }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `mvn -f backend/pom.xml test -Dtest=MediaServiceTest`
Expected: PASS

- [ ] **Step 7: Write the failing controller tests**

```java
@Test
void listMedia_returns200WithPage() throws Exception {
    mockMvc.perform(get("/api/admin/media").header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray());
}

@Test
void deleteMedia_returns204() throws Exception {
    Long id = createMediaFixture();
    mockMvc.perform(delete("/api/admin/media/" + id).header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isNoContent());
}

@Test
void deleteMedia_unknownId_returns404() throws Exception {
    mockMvc.perform(delete("/api/admin/media/999999").header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isNotFound());
}
```

Run: `mvn -f backend/pom.xml test -Dtest=MediaControllerTest`
Expected: FAIL — no such mappings.

- [ ] **Step 8: Add the controller methods**

```java
@GetMapping
public ResponseEntity<Page<MediaDto>> list(@PageableDefault(size = 20) Pageable pageable) {
    return ResponseEntity.ok(mediaService.list(pageable));
}

@DeleteMapping("/{id}")
@ResponseStatus(HttpStatus.NO_CONTENT)
public void delete(@PathVariable Long id, Authentication auth) {
    String username = (auth != null) ? auth.getName() : null;
    mediaService.delete(id, username);
}
```

- [ ] **Step 9: Run test to verify it passes**

Run: `mvn -f backend/pom.xml test -Dtest=MediaControllerTest`
Expected: PASS

### Task 2: Frontend — media grid with copy-URL and delete

**Files:**
- Create: `frontend/app/admin/(dashboard)/media/page.tsx`
- Create: `frontend/components/admin/MediaGrid.tsx`
- Test: `frontend/components/admin/MediaGrid.test.tsx`
- Modify: `frontend/app/admin/(dashboard)/layout.tsx` — add "Media" nav link

**Interfaces:**
- Consumes: `GET /api/admin/media`, `DELETE /api/admin/media/{id}`, existing `POST /api/admin/media`
  (upload) from plan 06.
- `MediaGrid` renders items with 8 explicit interaction states on the delete action per item:
  `default` (trash icon button) → `hover`/`focus-visible` → `active` → confirm step (a second click
  within the same button, not a native `window.confirm`, per the microinteractions discipline) →
  `loading` (spinner replaces icon while the DELETE request is in flight) → `error` (inline message:
  "Không xoá được ảnh. Máy chủ từ chối yêu cầu. Thử lại." — 3-part error copy) → `success` (item
  fades out and is removed from the grid, no toast).

- [ ] **Step 1: Write the failing `MediaGrid` test — copy URL**

```tsx
// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MediaGrid } from "./MediaGrid";

describe("MediaGrid", () => {
  const items = [{ id: 1, fileName: "thumb.webp", url: "/media/abc.webp", mimeType: "image/webp", sizeBytes: 2048 }];

  it("copies the item's URL to the clipboard on click", async () => {
    const writeText = vi.fn();
    Object.assign(navigator, { clipboard: { writeText } });
    render(<MediaGrid items={items} onDelete={vi.fn()} />);

    fireEvent.click(screen.getByAltText("thumb.webp"));

    expect(writeText).toHaveBeenCalledWith("/media/abc.webp");
  });
});
```

Run: `cd frontend && npx vitest run components/admin/MediaGrid.test.tsx`
Expected: FAIL — component does not exist.

- [ ] **Step 2: Write the failing test — delete requires a second confirm click**

```tsx
it("requires a second click on the delete button to confirm", () => {
  const onDelete = vi.fn();
  render(<MediaGrid items={items} onDelete={onDelete} />);

  const deleteButton = screen.getByRole("button", { name: "Xoá ảnh" });
  fireEvent.click(deleteButton);
  expect(onDelete).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Nhấn lần nữa để xoá" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Nhấn lần nữa để xoá" }));
  expect(onDelete).toHaveBeenCalledWith(1);
});
```

Run: `cd frontend && npx vitest run components/admin/MediaGrid.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Create `MediaGrid.tsx`**

Grid of `minmax(0, 1fr)` image tracks (never bare `1fr` — mobile safety per Hallmark responsive
rules). Each tile: thumbnail `<img>` (click → `navigator.clipboard.writeText(url)`, then a small
inline "Đã sao chép" confirmation for ~1.5s), file name, size (`KB`/`MB` formatted), and the delete
button with the two-click confirm state machine described above.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run components/admin/MediaGrid.test.tsx`
Expected: PASS

- [ ] **Step 5: Wire the page**

`app/admin/media/page.tsx`: fetches `GET /api/admin/media` via `adminFetch` on mount, renders an
upload `<input type="file">` above the grid that `POST`s to `/api/admin/media` and prepends the
returned `MediaDto` on success, and passes a `handleDelete` that calls
`adminFetch(DELETE /api/admin/media/{id})` and removes the item from local state on `204`.

- [ ] **Step 6: Verify build**

Run: `cd frontend && npx vitest run && npm run build`
Expected: both PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/com/portfolio/platform/service/MediaService.java backend/src/main/java/com/portfolio/platform/service/impl/MediaServiceImpl.java backend/src/main/java/com/portfolio/platform/controller/MediaController.java backend/src/test frontend/app/admin/(dashboard)/media frontend/components/admin/MediaGrid.tsx frontend/components/admin/MediaGrid.test.tsx frontend/app/admin/(dashboard)/layout.tsx
git commit -m "feat: add admin media library list, delete, and grid UI"
```

## Self-Review Notes

- **Spec coverage:** closes the "media library" gap called out in
  `2026-09-19-14-admin-dashboard-crud.md`'s Self-Review Notes as intentionally deferred.
- **Hard delete, not soft:** documented above under Task 1 Interfaces — the schema (design spec §6)
  gives `media` no `deleted_at` column, unlike `templates`; adding one here would be scope creep this
  plan doesn't need.
- **File-delete failure never surfaces as a 500 on a valid DB delete** — a media row can legitimately
  outlive its file (manual ops cleanup, a previous failed upload) and that must not block removing the
  row.
- **Type consistency:** `MediaGrid` consumes `MediaDto` exactly as returned by
  `dto/MediaDto.java` (`id`, `fileName`, `url`, `mimeType`, `sizeBytes`) — no invented fields.
