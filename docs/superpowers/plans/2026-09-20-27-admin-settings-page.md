# Admin Settings Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `ADMIN` a single `/admin/settings` screen to edit site title, SEO meta, social links, and contact email — per design spec section 4 ("Settings page: site title, SEO meta, social links, contact email").

**Architecture:** `SettingsController` already exists with `GET /{key}` and `PUT /{key}` (single-key CRUD, from an earlier plan). This plan adds a **list-all** endpoint so the UI can render one form with every known key populated in one round trip, instead of four separate calls. The four settings keys are a fixed, named set (`SettingKeys` constants) — `settings` is a generic key/value table, but this screen only ever manages these four rows.

**Tech Stack:** Spring Boot (Controller/Service/Repository/Converter/Dto per spec 5.1), Next.js App Router client component, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md` (section 4, section 5.1, section 6 `settings` schema).

**Depends on:** `2026-09-19-13-admin-auth-middleware.md`; `2026-09-19-14-admin-dashboard-crud.md` (shared `adminApiClient.ts` / admin layout).

**Confirmed by direct code read (2026-09-20):**
- `controller/SettingsController.java` today has only `GET /{key}` and `PUT /{key}` under `@RequestMapping("/api/admin/settings")` — **no endpoint returns the full list.**
- `config/SecurityConfig.java` line 46 already restricts `/api/admin/settings/**` to `hasRole("ADMIN")` — **EDITOR cannot touch this screen**, matching spec section 5 ("only ADMIN may manage users and settings"). No security change needed.
- `form/SettingUpsertForm.java` is `record SettingUpsertForm(@NotBlank String valueJson)` — the value is a raw JSON string per key, not a typed object. `dto/SettingDto.java` is `record SettingDto(String key, String valueJson, Instant updatedAt)`.
- `service/impl/SettingsServiceImpl.get(key)` throws `ResourceNotFoundException` for a key with no row yet — **the list endpoint must not do the same**; a fresh install has zero `settings` rows and the screen must still render with empty fields, not 404.

## Global Constraints

- Backend must run within `-Xmx350m` (spec section 7) — the list endpoint returns at most 4 rows (fixed key set), no pagination needed.
- Only `ADMIN` may read or write this screen's data (already enforced by `SecurityConfig`).
- Every admin UPDATE must write an `audit_logs` row (spec section 6) — already true for `set()` via `@Audited`; this plan adds no new write path beyond the existing per-key `PUT`.
- **Package layout follows spec section 5.1 (layered), not feature packages.**
- **Controllers never touch a Repository or a Converter.** `LayerDependencyTest` enforces this.
- Response bodies are `dto/*Dto`; entities live in `model/` with no suffix; request bodies are `form/*Form`.
- All CSS/colour/font values in the frontend consume tokens from `frontend/tokens.css` (Hallmark design, 2026-09-20) — never hard-coded hex/px values.
- No comments restating what code does; only comments explaining non-obvious "why".

---

### Task 1: Backend — `GET /api/admin/settings` (list all known keys)

**Files:**
- Create: `backend/src/main/java/com/portfolio/platform/constant/SettingKeys.java`
- Modify: `backend/src/main/java/com/portfolio/platform/service/SettingsService.java` — add `List<SettingDto> listAll()`.
- Modify: `backend/src/main/java/com/portfolio/platform/service/impl/SettingsServiceImpl.java` — implement it.
- Modify: `backend/src/main/java/com/portfolio/platform/controller/SettingsController.java` — add `@GetMapping` (root path).
- Test: `backend/src/test/java/com/portfolio/platform/service/SettingsServiceListAllTest.java`
- Test: `backend/src/test/java/com/portfolio/platform/controller/SettingsControllerListTest.java`

**Interfaces:**
- Produces: `GET /api/admin/settings` → `List<SettingDto>`, one entry per key in `SettingKeys.ALL` that has a row; **missing keys are simply absent from the list** (frontend fills the gap with an empty field, per Task 2 Step 3).

- [ ] **Step 1: Write the failing `SettingKeys` constant reference + service test**

```java
public class SettingsServiceListAllTest extends BaseTest {
    @Autowired SettingsService settingsService;
    @Autowired SettingRepository settingRepository;

    @Test
    void listAll_returnsOnlyExistingRows_noExceptionForMissingKeys() {
        Setting siteTitle = generateObject(Setting.class);
        siteTitle.setKey(SettingKeys.SITE_TITLE);
        settingRepository.save(siteTitle);
        // contact_email, seo_meta, social_links intentionally have no row yet

        List<SettingDto> result = settingsService.listAll();

        assertThat(result).extracting(SettingDto::key).containsExactly(SettingKeys.SITE_TITLE);
    }

    @Test
    void listAll_returnsEmptyList_onFreshInstall() {
        assertThat(settingsService.listAll()).isEmpty();
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn -f backend/pom.xml test -Dtest=SettingsServiceListAllTest`
Expected: FAIL — `SettingKeys` and `listAll()` do not exist.

- [ ] **Step 3: Create `SettingKeys`**

```java
package com.portfolio.platform.constant;

public final class SettingKeys {
    public static final String SITE_TITLE = "site_title";
    public static final String SEO_META = "seo_meta";
    public static final String SOCIAL_LINKS = "social_links";
    public static final String CONTACT_EMAIL = "contact_email";

    public static final List<String> ALL = List.of(SITE_TITLE, SEO_META, SOCIAL_LINKS, CONTACT_EMAIL);

    private SettingKeys() {}
}
```

- [ ] **Step 4: Implement `listAll()` in `SettingsService`/`SettingsServiceImpl`**

```java
@Transactional(readOnly = true)
@Override
public List<SettingDto> listAll() {
    return settingRepository.findAllByKeyIn(SettingKeys.ALL).stream()
        .map(settingConverter::toDto)
        .toList();
}
```

Add `List<Setting> findAllByKeyIn(List<String> keys);` to `SettingRepository` (derived query, filters to the four known keys even if the table later accumulates unrelated keys from other subsystems).

- [ ] **Step 5: Run test to verify it passes**

Run: `mvn -f backend/pom.xml test -Dtest=SettingsServiceListAllTest`
Expected: PASS

- [ ] **Step 6: Write the failing `SettingsControllerListTest`**

```java
@Test
void listSettings_requiresAdminRole() throws Exception {
    mockMvc.perform(get("/api/admin/settings").with(user("editor").roles("EDITOR")))
        .andExpect(status().isForbidden());
}

@Test
void listSettings_returnsAllExistingRows() throws Exception {
    mockMvc.perform(get("/api/admin/settings").with(user("admin").roles("ADMIN")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray());
}
```

- [ ] **Step 7: Run tests to verify they fail**

Run: `mvn -f backend/pom.xml test -Dtest=SettingsControllerListTest`
Expected: FAIL — no `@GetMapping` on the root path yet.

- [ ] **Step 8: Add the `@GetMapping` to `SettingsController`**

```java
@GetMapping
public ResponseEntity<List<SettingDto>> listAll() {
    return ResponseEntity.ok(settingsService.listAll());
}
```

- [ ] **Step 9: Run tests to verify they pass, then run the full backend suite**

Run: `mvn -f backend/pom.xml test`
Expected: PASS, no regression on the existing 126+ tests.

---

### Task 2: Frontend — `/admin/settings` form (site title, SEO meta, social links, contact email)

**Files:**
- Create: `frontend/app/admin/settings/page.tsx`
- Create: `frontend/lib/settingsApiClient.ts`
- Test: `frontend/lib/settingsApiClient.test.ts`

**Interfaces:**
- Consumes: `GET /api/admin/settings` (Task 1), `PUT /api/admin/settings/{key}` (existing).

- [ ] **Step 1: Write the failing `settingsApiClient` test**

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchSettings, saveSetting } from "./settingsApiClient";

describe("settingsApiClient", () => {
  beforeEach(() => {
    vi.stubGlobal("document", { cookie: "portfolio_access_token=abc.def.ghi" });
  });

  it("fetchSettings requests the list endpoint", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => [{ key: "site_title", valueJson: "\"Portfolio\"", updatedAt: "2026-09-20T00:00:00Z" }] })));
    const settings = await fetchSettings();
    expect((fetch as any).mock.calls[0][0]).toBe("http://localhost:8080/api/admin/settings");
    expect(settings[0].key).toBe("site_title");
  });

  it("saveSetting PUTs the key with the raw JSON value", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => 1 }));
    vi.stubGlobal("fetch", fetchMock);
    await saveSetting("contact_email", "\"hello@portfolio.com\"");
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8080/api/admin/settings/contact_email");
    expect(options.method).toBe("PUT");
    expect(JSON.parse(options.body).valueJson).toBe("\"hello@portfolio.com\"");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/settingsApiClient.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Create `settingsApiClient.ts`**

```ts
import { adminFetch } from "./adminApiClient";

export type SettingRow = { key: string; valueJson: string; updatedAt: string };

export const SETTING_KEYS = ["site_title", "seo_meta", "social_links", "contact_email"] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

export async function fetchSettings(): Promise<SettingRow[]> {
  const res = await adminFetch("/api/admin/settings");
  return res.json();
}

export async function saveSetting(key: SettingKey, valueJson: string): Promise<void> {
  await adminFetch(`/api/admin/settings/${key}`, {
    method: "PUT",
    body: JSON.stringify({ valueJson }),
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/settingsApiClient.test.ts`
Expected: PASS

- [ ] **Step 5: Build `/admin/settings/page.tsx`**

On mount: `fetchSettings()`, merge the result with `SETTING_KEYS` so every field renders even if the row doesn't exist yet (empty string default). Fields:
- **Site title** — plain text input.
- **SEO meta** — textarea (meta description).
- **Social links** — a small repeatable list (label + URL pairs) serialised to/from the `social_links` key's `valueJson`.
- **Contact email** — email input; client-side validate with a plain regex (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) before enabling Save — do not rely on `type="email"` alone since Save must stay disabled on invalid input, not just show the browser's native tooltip.

**Dirty-state save button:** track the initial fetched values in a ref; compute a per-field `isDirty` and an overall `anyDirty`; the Save button is `disabled` unless `anyDirty && !hasValidationErrors`. On save, `Promise.all` the changed keys' `saveSetting` calls only — do not re-save unchanged fields.

- [ ] **Step 6: Manually verify in a browser**

Run: `cd frontend && npm run dev`, log in as `ADMIN`, visit `/admin/settings`. Confirm: Save disabled until a field changes; invalid email keeps Save disabled with an inline error ("Email không hợp lệ. Nhập đúng định dạng, ví dụ ten@congty.com."); after save, the fields' dirty state clears.

Also confirm an `EDITOR` account gets a 403 from the backend if it somehow reaches this screen (defence in depth — the admin nav should not even link here for non-ADMIN, verify that too).

- [ ] **Step 7: Run the full frontend suite**

Run: `cd frontend && npx vitest run`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/src/main/java/com/portfolio/platform/constant/SettingKeys.java backend/src/main/java/com/portfolio/platform/service/SettingsService.java backend/src/main/java/com/portfolio/platform/service/impl/SettingsServiceImpl.java backend/src/main/java/com/portfolio/platform/controller/SettingsController.java backend/src/main/java/com/portfolio/platform/repository/SettingRepository.java backend/src/test/java/com/portfolio/platform/service/SettingsServiceListAllTest.java backend/src/test/java/com/portfolio/platform/controller/SettingsControllerListTest.java frontend/app/admin/settings frontend/lib/settingsApiClient.ts frontend/lib/settingsApiClient.test.ts
git commit -m "feat: add admin settings page (list-all endpoint + form UI)"
```

## Self-Review Notes

- **Spec coverage:** closes the "Settings page" bullet of design spec section 4.
- **Type consistency:** `SettingRow`/`SETTING_KEYS` mirror `SettingDto`/`SettingKeys` exactly; `social_links`'s internal shape (array of `{label, url}`) is a frontend-only convention layered on top of the generic `valueJson` string — document it as a comment at the `social_links` field's parse/stringify site (the one place a "why" comment is warranted: the shape isn't visible from the backend type).
- **Security:** relies entirely on the existing `hasRole("ADMIN")` matcher on `/api/admin/settings/**` — this plan adds no new security rule and must not weaken that one.
- **Nav gap this plan intentionally does not close:** the admin nav (`frontend/app/admin/layout.tsx`, from plan 14) needs a "Settings" link added — call this out if plan 14's nav isn't touched by a later plan; a hidden feature reachable only by URL is a real but separate gap from this plan's scope.
- **Next plan:** the remaining admin-screen backlog (content editor, media library, user management UI, audit log viewer) tracked as separate numbered plans (`2026-09-20-2{2,3,4,5}-admin-*.md`).
