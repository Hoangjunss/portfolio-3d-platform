# Admin Audit Log Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/admin/audit-log` screen — a paginated, filterable table of every admin
create/update/delete, with a detail view showing the before/after JSON diff in a readable key-value
form. **No `AuditLogController` exists yet** — this plan creates the backend list endpoint from
scratch, then the UI on top of it.

**Architecture:** `AdminAuditLogController` (new) exposes `GET /api/admin/audit-logs`, paginated,
filterable by `entityType` and `entityId` query params. `AuditLogService` reads via
`AuditLogRepository` (currently an empty `JpaRepository<AuditLog, Long>` — this plan adds the
query methods). The frontend screen filters client-side by re-fetching with new query params, and
renders `oldValueJson`/`newValueJson` as a diffed key-value list, never as a raw JSON blob (spec's
audience for this screen is a non-technical admin, not a developer).

**Tech Stack:** Spring Boot (Controller/Service/Repository/Converter/Dto per spec 5.1), Next.js App
Router client components, Vitest, JUnit + Mockito.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md` (§4 "Audit log viewer:
who changed what, when, before/after values"; §5.1 layered architecture; §6 `audit_logs` schema).

**Depends on:** `2026-09-19-04-audit-error-logging.md` (the `AuditLog` model and the `@Audited` AOP
aspect that writes rows — already in production use by plans 07/08/09/10); `2026-09-19-13-admin-auth-middleware.md`;
`2026-09-19-14-admin-dashboard-crud.md` (`adminApiClient.ts`, admin layout/nav).

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
- All admin-mutating endpoints require a valid JWT; **this endpoint is read-only but still ADMIN-only** (spec §5: audit visibility is an administrative capability, not an EDITOR one — EDITOR must get 403).
- Every admin CREATE/UPDATE/DELETE must write an `audit_logs` row (spec section 6) — already true via the existing `@Audited` aspect; this plan only reads that table, it does not change what gets written.
- No comments restating what code does; only comments explaining non-obvious "why".
- **Package layout follows spec section 5.1 (layered), not feature packages.**
- **Controllers never touch a Repository or a Converter.** `LayerDependencyTest` enforces this and will fail the build.
- Request bodies are `form/*Form` (none needed here — this is a GET-only screen), response bodies are `dto/*Dto`. Entities live in `model/` with no suffix.
- **`@Transactional(readOnly = true)` on the read flow**, never on the Controller.
- **All CSS colour/font values reference tokens from `frontend/tokens.css` — never hard-coded.**

## Known trap (STATUS.md L-03, do not repeat)

An earlier test (plan 07) fetched the "just-written" audit row via `auditLogRepository.findAll().get(size - 1)`
— relying on insertion order instead of filtering by `entityType`/`entityId`. That is fragile once the
table holds rows from multiple entity types (which it now does — templates, content, leads, users,
settings, media all write here). **Every query in this plan filters explicitly by `entityType`
(required) and optionally `entityId`.** Never rely on row order or `findAll()`.

---

### Task: Backend — `GET /api/admin/audit-logs` (paginated, filterable)

**Files:**
- Create: `backend/src/main/java/com/portfolio/platform/dto/AuditLogDto.java`
- Create: `backend/src/main/java/com/portfolio/platform/converter/AuditLogConverter.java`
- Create: `backend/src/main/java/com/portfolio/platform/converter/impl/AuditLogConverterImpl.java`
- Create: `backend/src/main/java/com/portfolio/platform/service/AuditLogService.java`
- Create: `backend/src/main/java/com/portfolio/platform/service/impl/AuditLogServiceImpl.java`
- Create: `backend/src/main/java/com/portfolio/platform/controller/AdminAuditLogController.java`
- Modify: `backend/src/main/java/com/portfolio/platform/repository/AuditLogRepository.java` — add
  `Page<AuditLog> findByEntityType(String entityType, Pageable pageable)` and
  `Page<AuditLog> findByEntityTypeAndEntityId(String entityType, Long entityId, Pageable pageable)`.
- Test: `backend/src/test/java/com/portfolio/platform/service/AuditLogServiceTest.java`
- Test: `backend/src/test/java/com/portfolio/platform/controller/AdminAuditLogControllerTest.java`

**Interfaces:**
- Produces: `GET /api/admin/audit-logs?entityType=&entityId=&page=&size=` → `Page<AuditLogDto>`.
  `entityType` is required (400 `InvalidRequestException` if missing — this screen always opens
  scoped to one entity type, e.g. "Template" or "User", never an unscoped firehose, per the RAM
  budget constraint and per the read pattern the admin actually needs: "who changed this template").
  `entityId` is optional (narrows to one specific record's full history).

- [ ] **Step 1: Write the failing service test**

```java
class AuditLogServiceTest extends BaseTest {

    @Mock AuditLogRepository auditLogRepository;
    @Mock AuditLogConverter auditLogConverter;
    @InjectMocks AuditLogServiceImpl auditLogService;

    @Test
    void list_requiresEntityType_throwsWhenBlank() {
        assertThrows(InvalidRequestException.class,
                () -> auditLogService.list("", null, PageRequest.of(0, 20)));
    }

    @Test
    void list_filtersByEntityTypeOnly_whenEntityIdNull() {
        AuditLog log = generateObject(AuditLog.class);
        Page<AuditLog> page = new PageImpl<>(List.of(log));
        when(auditLogRepository.findByEntityType(eq("Template"), any())).thenReturn(page);
        when(auditLogConverter.toDto(log)).thenReturn(generateObject(AuditLogDto.class));

        Page<AuditLogDto> result = auditLogService.list("Template", null, PageRequest.of(0, 20));

        assertEquals(1, result.getTotalElements());
        verify(auditLogRepository).findByEntityType(eq("Template"), any());
        verify(auditLogRepository, never()).findByEntityTypeAndEntityId(any(), any(), any());
    }

    @Test
    void list_filtersByEntityTypeAndEntityId_whenEntityIdProvided() {
        AuditLog log = generateObject(AuditLog.class);
        Page<AuditLog> page = new PageImpl<>(List.of(log));
        when(auditLogRepository.findByEntityTypeAndEntityId(eq("User"), eq(7L), any())).thenReturn(page);
        when(auditLogConverter.toDto(log)).thenReturn(generateObject(AuditLogDto.class));

        auditLogService.list("User", 7L, PageRequest.of(0, 20));

        verify(auditLogRepository).findByEntityTypeAndEntityId(eq("User"), eq(7L), any());
        verify(auditLogRepository, never()).findByEntityType(any(), any());
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn -f backend/pom.xml test -Dtest=AuditLogServiceTest`
Expected: FAIL — `AuditLogService`/`AuditLogServiceImpl`/`AuditLogDto`/`AuditLogConverter` do not exist.

- [ ] **Step 3: Create `AuditLogDto`**

```java
package com.portfolio.platform.dto;

import java.time.Instant;

public record AuditLogDto(
        Long id,
        Long userId,
        String action,
        String entityType,
        Long entityId,
        String oldValueJson,
        String newValueJson,
        String ipAddress,
        Instant createdAt
) {
}
```

- [ ] **Step 4: Create `AuditLogConverter` + impl**

```java
package com.portfolio.platform.converter;

import com.portfolio.platform.dto.AuditLogDto;
import com.portfolio.platform.model.AuditLog;

public interface AuditLogConverter {
    AuditLogDto toDto(AuditLog auditLog);
}
```

```java
package com.portfolio.platform.converter.impl;

import com.portfolio.platform.converter.AuditLogConverter;
import com.portfolio.platform.dto.AuditLogDto;
import com.portfolio.platform.model.AuditLog;
import org.springframework.stereotype.Component;

@Component
public class AuditLogConverterImpl implements AuditLogConverter {

    @Override
    public AuditLogDto toDto(AuditLog auditLog) {
        if (auditLog == null) {
            return null;
        }
        return new AuditLogDto(
                auditLog.getId(),
                auditLog.getUserId(),
                auditLog.getAction(),
                auditLog.getEntityType(),
                auditLog.getEntityId(),
                auditLog.getOldValueJson(),
                auditLog.getNewValueJson(),
                auditLog.getIpAddress(),
                auditLog.getCreatedAt()
        );
    }
}
```

- [ ] **Step 5: Add repository query methods**

```java
package com.portfolio.platform.repository;

import com.portfolio.platform.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findByEntityType(String entityType, Pageable pageable);

    Page<AuditLog> findByEntityTypeAndEntityId(String entityType, Long entityId, Pageable pageable);
}
```

- [ ] **Step 6: Create `AuditLogService` + impl**

```java
package com.portfolio.platform.service;

import com.portfolio.platform.dto.AuditLogDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AuditLogService {
    Page<AuditLogDto> list(String entityType, Long entityId, Pageable pageable);
}
```

```java
package com.portfolio.platform.service.impl;

import com.portfolio.platform.converter.AuditLogConverter;
import com.portfolio.platform.dto.AuditLogDto;
import com.portfolio.platform.exception.InvalidRequestException;
import com.portfolio.platform.repository.AuditLogRepository;
import com.portfolio.platform.service.AuditLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final AuditLogConverter auditLogConverter;

    public AuditLogServiceImpl(AuditLogRepository auditLogRepository, AuditLogConverter auditLogConverter) {
        this.auditLogRepository = auditLogRepository;
        this.auditLogConverter = auditLogConverter;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogDto> list(String entityType, Long entityId, Pageable pageable) {
        if (!StringUtils.hasText(entityType)) {
            throw new InvalidRequestException("entityType is required");
        }
        Page<com.portfolio.platform.model.AuditLog> page = (entityId != null)
                ? auditLogRepository.findByEntityTypeAndEntityId(entityType, entityId, pageable)
                : auditLogRepository.findByEntityType(entityType, pageable);
        return page.map(auditLogConverter::toDto);
    }
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `mvn -f backend/pom.xml test -Dtest=AuditLogServiceTest`
Expected: PASS

- [ ] **Step 8: Write the failing controller test, then create `AdminAuditLogController`**

```java
class AdminAuditLogControllerTest extends BaseControllerTest {

    @MockBean AuditLogService auditLogService;

    @Test
    @WithMockUser(roles = "ADMIN")
    void list_returns400_whenEntityTypeMissing() throws Exception {
        mockMvc.perform(get("/api/admin/audit-logs"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "EDITOR")
    void list_returns403_forEditor() throws Exception {
        mockMvc.perform(get("/api/admin/audit-logs").param("entityType", "Template"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void list_returns200_forAdmin() throws Exception {
        when(auditLogService.list(eq("Template"), isNull(), any()))
                .thenReturn(new PageImpl<>(List.of(generateObject(AuditLogDto.class))));
        mockMvc.perform(get("/api/admin/audit-logs").param("entityType", "Template"))
                .andExpect(status().isOk());
    }
}
```

```java
package com.portfolio.platform.controller;

import com.portfolio.platform.dto.AuditLogDto;
import com.portfolio.platform.service.AuditLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/audit-logs")
public class AdminAuditLogController {

    private final AuditLogService auditLogService;

    public AdminAuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AuditLogDto>> list(
            @RequestParam String entityType,
            @RequestParam(required = false) Long entityId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(auditLogService.list(entityType, entityId, pageable));
    }
}
```

Check the project's existing role-check convention before wiring `@PreAuthorize` — `AdminUserController`
enforces ADMIN-only at the `SecurityConfig` URL-matcher level for `/api/admin/users/**` rather than a
method annotation (per plan 10). **Match whichever mechanism `SecurityConfig` already uses for
ADMIN-only paths** — add `/api/admin/audit-logs/**` to that same matcher group instead of introducing
a second, inconsistent authorization mechanism. Only fall back to `@PreAuthorize` if `SecurityConfig`
has no such matcher pattern yet.

- [ ] **Step 9: Run test to verify it passes**

Run: `mvn -f backend/pom.xml test -Dtest=AdminAuditLogControllerTest`
Expected: PASS

---

### Task: Frontend — audit log viewer screen

**Files:**
- Create: `frontend/app/admin/(dashboard)/audit-log/page.tsx`
- Create: `frontend/lib/auditLogApiClient.ts`
- Test: `frontend/lib/auditLogApiClient.test.ts`
- Modify: `frontend/app/admin/(dashboard)/layout.tsx` — add an "Audit log" nav link.

**Interfaces:**
- Consumes: `GET /api/admin/audit-logs?entityType=&entityId=&page=` (this plan, Task 1).

- [ ] **Step 10: Write the failing `auditLogApiClient` test**

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { listAuditLogs } from "./auditLogApiClient";

describe("listAuditLogs", () => {
  beforeEach(() => {
    vi.stubGlobal("document", { cookie: "portfolio_access_token=abc.def.ghi" });
  });

  it("requires an entityType and includes it in the query", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ content: [], totalPages: 0 }) })));
    await listAuditLogs("Template", undefined, 0);
    const [url] = (fetch as any).mock.calls[0];
    expect(url).toContain("entityType=Template");
  });
});
```

- [ ] **Step 11: Run test to verify it fails, then create `auditLogApiClient.ts`**

```ts
import { adminFetch } from "./adminApiClient";

export type AuditLog = {
  id: number;
  userId: number | null;
  action: string;
  entityType: string;
  entityId: number | null;
  oldValueJson: string | null;
  newValueJson: string | null;
  ipAddress: string | null;
  createdAt: string;
};

export type AuditLogPage = { content: AuditLog[]; totalPages: number };

export async function listAuditLogs(entityType: string, entityId: number | undefined, page: number): Promise<AuditLogPage> {
  const params = new URLSearchParams({ entityType, page: String(page) });
  if (entityId !== undefined) params.set("entityId", String(entityId));
  const res = await adminFetch(`/api/admin/audit-logs?${params.toString()}`);
  if (!res.ok) throw new Error("Không tải được nhật ký thay đổi.");
  return res.json();
}
```

- [ ] **Step 12: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/auditLogApiClient.test.ts`
Expected: PASS

- [ ] **Step 13: Build the audit log screen with a readable diff view**

```tsx
"use client";

import { useEffect, useState } from "react";
import { listAuditLogs, type AuditLog } from "@/lib/auditLogApiClient";

const ENTITY_TYPES = ["Template", "ContentSection", "Lead", "User", "Setting", "Media"];

function diffRows(oldJson: string | null, newJson: string | null): { key: string; from: unknown; to: unknown }[] {
  const oldObj = oldJson ? JSON.parse(oldJson) : {};
  const newObj = newJson ? JSON.parse(newJson) : {};
  const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  return Array.from(keys)
    .filter((k) => JSON.stringify(oldObj[k]) !== JSON.stringify(newObj[k]))
    .map((k) => ({ key: k, from: oldObj[k], to: newObj[k] }));
}

export default function AdminAuditLogPage() {
  const [entityType, setEntityType] = useState(ENTITY_TYPES[0]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selected, setSelected] = useState<AuditLog | null>(null);

  useEffect(() => {
    listAuditLogs(entityType, undefined, page).then((data) => {
      setLogs(data.content);
      setTotalPages(data.totalPages);
    });
  }, [entityType, page]);

  return (
    <div className="flex flex-col gap-6">
      <select value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(0); }} className="border p-2 w-fit">
        {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>

      <table className="w-full text-left">
        <thead><tr><th>Người dùng</th><th>Hành động</th><th>Đối tượng</th><th>Thời gian</th></tr></thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} onClick={() => setSelected(log)} className="cursor-pointer hover:bg-[var(--color-paper-2)]">
              <td>{log.userId ?? "—"}</td>
              <td>{log.action}</td>
              <td>{log.entityType} #{log.entityId}</td>
              <td>{new Date(log.createdAt).toLocaleString("vi-VN")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex gap-2">
        <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Trước</button>
        <span>Trang {page + 1}/{Math.max(totalPages, 1)}</span>
        <button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Sau</button>
      </div>

      {selected && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-[var(--color-paper)] p-6 rounded flex flex-col gap-4 max-w-lg">
            <h2 className="text-lg">Chi tiết thay đổi #{selected.id}</h2>
            {selected.action === "CREATE" ? (
              <p>Bản ghi mới được tạo. Không có giá trị cũ để so sánh.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead><tr><th>Trường</th><th>Giá trị cũ</th><th>Giá trị mới</th></tr></thead>
                <tbody>
                  {diffRows(selected.oldValueJson, selected.newValueJson).map((row) => (
                    <tr key={row.key}>
                      <td>{row.key}</td>
                      <td className="text-red-700">{String(row.from ?? "—")}</td>
                      <td className="text-green-700">{String(row.to ?? "—")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button type="button" onClick={() => setSelected(null)} className="self-end">Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 14: Manually verify in a browser**

Run: `cd frontend && npm run dev`, log in as ADMIN, visit `/admin/audit-log`. Edit a template's name
via `/admin/templates` (once that screen supports edit — if it doesn't yet, edit directly through
`curl -X PUT /api/admin/templates/{id}`), then confirm the change appears in the audit log with a
readable `name: old → new` row, not a raw JSON string. Log in as EDITOR and confirm `/admin/audit-log`
returns 403 from the API (the nav link itself may still render — same non-security-boundary note as
plan 24).

- [ ] **Step 15: Run the full test suites**

Run: `mvn -f backend/pom.xml test` — expect 126 pre-existing tests PASS plus the new
`AuditLogServiceTest` and `AdminAuditLogControllerTest`.
Run: `cd frontend && npx vitest run` — expect all tests PASS including `auditLogApiClient.test.ts`.

- [ ] **Step 16: Commit**

```bash
git add backend/src/main/java/com/portfolio/platform/dto/AuditLogDto.java \
        backend/src/main/java/com/portfolio/platform/converter/AuditLogConverter.java \
        backend/src/main/java/com/portfolio/platform/converter/impl/AuditLogConverterImpl.java \
        backend/src/main/java/com/portfolio/platform/service/AuditLogService.java \
        backend/src/main/java/com/portfolio/platform/service/impl/AuditLogServiceImpl.java \
        backend/src/main/java/com/portfolio/platform/controller/AdminAuditLogController.java \
        backend/src/main/java/com/portfolio/platform/repository/AuditLogRepository.java \
        backend/src/test/java/com/portfolio/platform/service/AuditLogServiceTest.java \
        backend/src/test/java/com/portfolio/platform/controller/AdminAuditLogControllerTest.java \
        frontend/app/admin/(dashboard)/audit-log frontend/lib/auditLogApiClient.ts frontend/lib/auditLogApiClient.test.ts \
        frontend/app/admin/(dashboard)/layout.tsx
git commit -m "feat: add admin audit log viewer (backend list endpoint + UI with readable diff)"
```

## Self-Review Notes

- **Spec coverage:** implements spec §4's "Audit log viewer: who changed what, when, before/after
  values" — the only admin dashboard feature area that had **zero** backend surface before this plan.
- **L-03 trap avoided:** every repository query filters explicitly by `entityType`; nothing relies on
  `findAll()` or insertion order.
- **RAM budget:** `entityType` is a required filter, not an optional one — this prevents an unscoped
  `GET /api/admin/audit-logs` from ever pulling every row in the table into one page response.
- **Honest diff UI:** `CREATE` actions show "no old value" instead of a diff table with a fake "—" row
  for every field, which would misrepresent a brand-new record as having had 10 fields silently changed
  from empty.
- **Type consistency:** `AuditLog`/`AuditLogPage` TypeScript types mirror `AuditLogDto` exactly.
- **Open item carried forward, not fixed here:** `frontend/app/admin/(dashboard)/templates/page.tsx` (plan 14)
  currently has no edit action, only a read-only table — Step 14's manual verification calls this out
  explicitly via a `curl` workaround rather than silently assuming an edit UI exists.
