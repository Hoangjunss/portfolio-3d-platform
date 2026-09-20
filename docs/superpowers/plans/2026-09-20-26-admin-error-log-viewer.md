# Admin Error Log Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let ADMIN/EDITOR read recent 5xx errors (`system_error_logs`) from `/admin/errors` without SSH access, per design spec section 4 ("System error log viewer: recent 5xx errors with stack trace, without needing SSH access to read log files").

**Architecture:** New read-only `AdminErrorLogController` exposes a paginated list backed by the existing `SystemErrorLogRepository` (rows are already written by the global `@RestControllerAdvice` since plan 04/04b — this plan does not touch that write path). `frontend/app/admin/(dashboard)/errors/page.tsx` lists rows in a table; clicking a row expands an inline collapsible `<pre>` block with the full stack trace (collapsed by default — stack traces are long and would otherwise dominate the screen).

**Tech Stack:** Spring Boot (Controller/Service/Repository/Converter/Dto per spec 5.1), Next.js App Router client component, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md` (section 4 feature description, section 5.1 layered architecture, section 6 `system_error_logs` schema).

**Depends on:** `2026-09-19-04-audit-error-logging.md` (writes the rows this plan reads); `2026-09-19-13-admin-auth-middleware.md` (needs `portfolio_access_token` cookie); `2026-09-19-14-admin-dashboard-crud.md` (needs `frontend/lib/adminApiClient.ts` and `frontend/app/admin/(dashboard)/layout.tsx`).

**Confirmed by direct code read (2026-09-20):** `controller/` has no `AdminErrorLogController` or `SystemErrorLogController` today — only the model (`model/SystemErrorLog.java`) and repository (`repository/SystemErrorLogRepository.java`) exist. `application.yml`'s `/api/admin/**` matcher already allows `ADMIN` and `EDITOR` (`config/SecurityConfig.java` line 47); no new security rule is needed. `P-01` in STATUS.md (malformed-body/type-mismatch not covered by the error grid) is a pre-existing note about the *write* side and is out of scope here.

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

## Global Constraints

- Backend must run within `-Xmx350m` (spec section 7 RAM budget) — no unbounded in-memory collections, use pagination on list endpoints.
- All admin-mutating endpoints (`POST`/`PUT`/`DELETE` under `/api/admin/**`) require a valid JWT with role `ADMIN` or `EDITOR`; only `ADMIN` may manage users and settings. This endpoint is read-only (`GET`), reachable by both `ADMIN` and `EDITOR`.
- Every admin CREATE/UPDATE/DELETE must write an `audit_logs` row (spec section 6) — **not applicable here**, this plan adds no write endpoint.
- Public GET endpoints (`templates`, `content-sections`) are Redis-cached with cache-aside invalidation on write (spec section 5) — **not applicable**, this endpoint is admin-only and reads fast-changing data; do not cache it.
- **Package layout follows spec section 5.1 (layered), not feature packages.** A `service/XService.java` entry always means the pair `service/XService.java` (interface) + `service/impl/XServiceImpl.java` (implementation).
- **Controllers never touch a Repository or a Converter.** `LayerDependencyTest` enforces this and will fail the build if violated (note: it is an import-scanner, not ArchUnit — blind to fully-qualified references per A-04 in STATUS.md, so don't rely on it as the only check).
- Response bodies are `dto/*Dto`; entities live in `model/` with no suffix.
- All CSS/colour/font values in the frontend consume tokens from `frontend/tokens.css` (Hallmark design, 2026-09-20) — never hard-coded hex/px values.
- No comments restating what code does; only comments explaining non-obvious "why".

---

### Task 1: Backend — `GET /api/admin/error-logs` paginated list

**Files:**
- Create: `backend/src/main/java/com/portfolio/platform/dto/SystemErrorLogDto.java`
- Create: `backend/src/main/java/com/portfolio/platform/converter/SystemErrorLogConverter.java`
- Create: `backend/src/main/java/com/portfolio/platform/converter/impl/SystemErrorLogConverterImpl.java`
- Create: `backend/src/main/java/com/portfolio/platform/service/SystemErrorLogService.java`
- Create: `backend/src/main/java/com/portfolio/platform/service/impl/SystemErrorLogServiceImpl.java`
- Create: `backend/src/main/java/com/portfolio/platform/controller/AdminErrorLogController.java`
- Modify: `backend/src/main/java/com/portfolio/platform/repository/SystemErrorLogRepository.java` — extend `JpaRepository<SystemErrorLog, Long>` with `Page<SystemErrorLog> findAllByOrderByCreatedAtDesc(Pageable pageable)`.
- Test: `backend/src/test/java/com/portfolio/platform/controller/AdminErrorLogControllerTest.java`

**Interfaces:**
- Produces: `GET /api/admin/error-logs?page=0&size=20` → `Page<SystemErrorLogDto>` (Spring's standard `PagedModel`/`Page` JSON shape, same convention as `AdminLeadController` from plan 11), sorted newest-first. `max-page-size` cap of 100 applies (same guard as `AdminLeadController`/`AdminUserController`, F-11 in STATUS.md).

- [ ] **Step 1: Write the failing `SystemErrorLogConverterTest`**

```java
class SystemErrorLogConverterTest extends BaseTest {
    private final SystemErrorLogConverter converter = new SystemErrorLogConverterImpl();

    @Test
    void toDto_mapsAllFields() {
        SystemErrorLog entity = generateObject(SystemErrorLog.class);
        SystemErrorLogDto dto = converter.toDto(entity);
        assertThat(dto.id()).isEqualTo(entity.getId());
        assertThat(dto.endpoint()).isEqualTo(entity.getEndpoint());
        assertThat(dto.httpStatus()).isEqualTo(entity.getHttpStatus());
        assertThat(dto.exceptionClass()).isEqualTo(entity.getExceptionClass());
        assertThat(dto.message()).isEqualTo(entity.getMessage());
        assertThat(dto.stacktrace()).isEqualTo(entity.getStacktrace());
        assertThat(dto.requestId()).isEqualTo(entity.getRequestId());
        assertThat(dto.createdAt()).isEqualTo(entity.getCreatedAt());
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn -f backend/pom.xml test -Dtest=SystemErrorLogConverterTest`
Expected: FAIL — `SystemErrorLogDto`/`SystemErrorLogConverter` do not exist.

- [ ] **Step 3: Create `SystemErrorLogDto`, `SystemErrorLogConverter`, `SystemErrorLogConverterImpl`**

`SystemErrorLogDto` is a record: `id, endpoint, httpStatus, exceptionClass, message, stacktrace, requestId, createdAt` — mirrors `model/SystemErrorLog.java` field-for-field (spec 5.1: response bodies are `Dto`, never the entity).

- [ ] **Step 4: Run test to verify it passes**

Run: `mvn -f backend/pom.xml test -Dtest=SystemErrorLogConverterTest`
Expected: PASS

- [ ] **Step 5: Add `findAllByOrderByCreatedAtDesc` to `SystemErrorLogRepository`**

No test required for a derived-query repository method with no business logic (same convention as plan 11's `LeadRepository.findAllByOrderByCreatedAtDesc`).

- [ ] **Step 6: Write the failing `AdminErrorLogControllerTest`**

```java
@Test
void listErrorLogs_returnsPagedNewestFirst() throws Exception {
    SystemErrorLog older = persist(generateObject(SystemErrorLog.class).setCreatedAt(Instant.now().minusSeconds(120)));
    SystemErrorLog newer = persist(generateObject(SystemErrorLog.class).setCreatedAt(Instant.now()));

    mockMvc.perform(get("/api/admin/error-logs?page=0&size=20").with(user("editor").roles("EDITOR")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[0].id").value(newer.getId()))
        .andExpect(jsonPath("$.content[1].id").value(older.getId()));
}

@Test
void listErrorLogs_rejectsPageSizeAboveCap() throws Exception {
    mockMvc.perform(get("/api/admin/error-logs?page=0&size=100000").with(user("admin").roles("ADMIN")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content.length()").value(lessThanOrEqualTo(100)));
}

@Test
void listErrorLogs_rejectsUnauthenticated() throws Exception {
    mockMvc.perform(get("/api/admin/error-logs"))
        .andExpect(status().isUnauthorized());
}
```

- [ ] **Step 7: Run tests to verify they fail**

Run: `mvn -f backend/pom.xml test -Dtest=AdminErrorLogControllerTest`
Expected: FAIL — `AdminErrorLogController` does not exist.

- [ ] **Step 8: Create `SystemErrorLogService`/`SystemErrorLogServiceImpl` and `AdminErrorLogController`**

Service method: `Page<SystemErrorLogDto> list(Pageable pageable)` — clamps `pageable.getPageSize()` to 100 (mirror `AdminLeadController`'s cap), calls `findAllByOrderByCreatedAtDesc`, maps via converter. Controller: `@RestController @RequestMapping("/api/admin/error-logs")`, single `@GetMapping` delegating to the service. **Controller must not call the repository or converter directly** — only the service (5.1 dependency rule).

- [ ] **Step 9: Run tests to verify they pass**

Run: `mvn -f backend/pom.xml test -Dtest=AdminErrorLogControllerTest`
Expected: PASS

- [ ] **Step 10: Run the full backend suite + `LayerDependencyTest`**

Run: `mvn -f backend/pom.xml test`
Expected: PASS, no regression on the existing 126 tests + the new ones.

---

### Task 2: Frontend — `/admin/errors` list + expandable stack trace

**Files:**
- Create: `frontend/app/admin/(dashboard)/errors/page.tsx`
- Create: `frontend/lib/errorLogsApiClient.ts` — one typed fetch function per resource, matching `apiClient.ts` (plan 11) and the sibling `userApiClient.ts` / `auditLogApiClient.ts` / `settingsApiClient.ts` in plans 24, 25 and 27. Step 3 creates this file unconditionally; an earlier draft phrased it as optional ("add a typed helper **if** the project's convention is...") while Step 3 and the `git add` line both required it.
- `frontend/lib/adminApiClient.ts` needs **no change** — its `adminFetch` is already generic.
- Test: `frontend/lib/errorLogsApiClient.test.ts`

**Interfaces:**
- Consumes: `GET /api/admin/error-logs` (Task 1).

- [ ] **Step 1: Write the failing `errorLogsApiClient` test**

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchErrorLogs } from "./errorLogsApiClient";

describe("fetchErrorLogs", () => {
  beforeEach(() => {
    vi.stubGlobal("document", { cookie: "portfolio_access_token=abc.def.ghi" });
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({ content: [{ id: 1, endpoint: "/api/admin/templates", httpStatus: 500, exceptionClass: "NullPointerException", message: "boom", stacktrace: "at ...", requestId: "req-1", createdAt: "2026-09-20T10:00:00Z" }] }),
    })));
  });

  it("requests the admin error-logs endpoint and returns typed rows", async () => {
    const page = await fetchErrorLogs(0, 20);
    expect((fetch as any).mock.calls[0][0]).toBe("http://localhost:8080/api/admin/error-logs?page=0&size=20");
    expect(page.content[0].exceptionClass).toBe("NullPointerException");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/errorLogsApiClient.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Create `errorLogsApiClient.ts`**

```ts
import { adminFetch } from "./adminApiClient";

export type ErrorLogRow = {
  id: number;
  endpoint: string;
  httpStatus: number;
  exceptionClass: string;
  message: string;
  stacktrace: string;
  requestId: string;
  createdAt: string;
};

export type ErrorLogPage = { content: ErrorLogRow[] };

export async function fetchErrorLogs(page: number, size: number): Promise<ErrorLogPage> {
  const res = await adminFetch(`/api/admin/error-logs?page=${page}&size=${size}`);
  return res.json();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/errorLogsApiClient.test.ts`
Expected: PASS

- [ ] **Step 5: Build `/admin/errors/page.tsx`**

Table columns: Endpoint, HTTP status (coloured by severity band using `--color-accent`/`--color-muted` tokens, never a raw hex), Exception class, Time (relative + absolute on hover). Row click toggles a `<details>`/`<summary>` block beneath the row holding `message` + a monospace `<pre>` with `stacktrace`, **collapsed by default** — do not render all stack traces expanded on load, they are long and would make the table unusable. Add "Load more" pagination (same UX pattern the leads/templates admin tables use — no new pattern invented).

- [ ] **Step 6: Manually verify in a browser**

Run: `cd frontend && npm run dev`, log in, visit `/admin/errors`. Trigger a real 5xx (e.g. hit a malformed request against an existing admin endpoint) and confirm the new row appears with a working expand/collapse.

- [ ] **Step 7: Run the full frontend suite**

Run: `cd frontend && npx vitest run`
Expected: PASS, no regression on the existing 5 tests + the new one.

- [ ] **Step 8: Commit**

```bash
git add backend/src/main/java/com/portfolio/platform/dto/SystemErrorLogDto.java backend/src/main/java/com/portfolio/platform/converter/SystemErrorLogConverter.java backend/src/main/java/com/portfolio/platform/converter/impl/SystemErrorLogConverterImpl.java backend/src/main/java/com/portfolio/platform/service/SystemErrorLogService.java backend/src/main/java/com/portfolio/platform/service/impl/SystemErrorLogServiceImpl.java backend/src/main/java/com/portfolio/platform/controller/AdminErrorLogController.java backend/src/main/java/com/portfolio/platform/repository/SystemErrorLogRepository.java backend/src/test/java/com/portfolio/platform/controller/AdminErrorLogControllerTest.java backend/src/test/java/com/portfolio/platform/converter/SystemErrorLogConverterTest.java frontend/app/admin/(dashboard)/errors frontend/lib/errorLogsApiClient.ts frontend/lib/errorLogsApiClient.test.ts
git commit -m "feat: add admin error log viewer (list endpoint + UI)"
```

## Self-Review Notes

- **Spec coverage:** closes the "System error log viewer" bullet of design spec section 4. Does not touch the write path (global exception handler from plan 04/04b already writes the rows).
- **Type consistency:** `ErrorLogRow` in the frontend mirrors `SystemErrorLogDto` field-for-field.
- **Security:** no new `SecurityConfig` rule needed — `/api/admin/**` already requires `ADMIN` or `EDITOR`; this endpoint adds no elevated write capability.
- **Next plan:** `2026-09-20-27-admin-settings-page.md`.
