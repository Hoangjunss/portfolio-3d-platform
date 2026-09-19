# Content / Media / Settings Modules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the content-section CMS, media upload, and settings modules so page content,
images and site config are DB-driven and admin-editable.

**Architecture:** Layered per spec 5.1 — three domains sharing the same layer packages as
`Template` (plan 05). No Facade: each controller talks to one service.

**Tech Stack:** Spring Data JPA, Spring Cache + Redis, Spring `MultipartFile`, JUnit 5 + Mockito +
MockMvc.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md` — **read section 5.1
before creating any class.**

**Depends on:** `2026-09-19-05-template-crud.md` (reuses `ResourceNotFoundException`,
`LayerDependencyTest`, the `UserService.findIdByUsername` pattern).

---

## Revision log

**Revised 2026-09-20.** The original version was written before spec 5.1 and carried nine defects
beyond packaging, two of them security holes. Listed here so the diff is not mistaken for scope
creep, and because several repeat across all three modules.

1. **Path traversal in media upload (CRITICAL).** `uploadDir.resolve(UUID + "-" +
   file.getOriginalFilename())` — the filename is attacker-controlled. A multipart filename of
   `../../../../etc/cron.d/pwn` resolves outside the upload directory: the UUID only prefixes the
   first segment, the `..` segments still traverse. That is arbitrary file write as the app user.
2. **Stored XSS via uploaded file (MAJOR).** No type allow-list, and `mimeType` is taken from
   `file.getContentType()`, which the client sets. Upload an `.html` or `.svg`, get it served back
   from `/media/`, and it executes on the portfolio's own origin.
3. **`columnDefinition = "jsonb"` on `data_json` and `value_json` (build-breaking).** Tests run on
   H2 with `ddl-auto: create-drop`, and Hibernate emits `columnDefinition` verbatim. H2 has no
   `jsonb` type, so schema creation fails and **every `@SpringBootTest` in the suite dies**, not
   just the new ones. Already documented in plan 04's revision log; it was still here.
4. **`@Cacheable` on a method returning `Optional<String>`.** `java.util.Optional` does not
   implement `Serializable`. With the Redis cache manager this fails at runtime on the first cache
   write — and never in tests, which use the default in-memory manager.
5. **The actor is `null` in all three modules** — `upsert(key, json, null)`,
   `store(file, null)`, `set(key, json, null)`. `content_sections.updated_by`,
   `media.uploaded_by` and `settings.updated_by` would be null on every row forever. Same defect
   plan 05 had for `created_by`.
6. **`MediaService.store` returns the `Media` entity and the controller returns it directly.**
   Leaks the entity shape through the API, and violates spec 5.1 (controllers return Dtos).
7. **`@Audited` on methods that do not return a `Long`.** `AuditAspect` fills
   `audit_logs.entity_id` from a `Long` return value. `store()` returns `Media` and `set()`
   returns `void`, so `entity_id` would be null for every media upload and every settings change.
8. **`@Column(name = "key")` on `Setting`.** `KEY` is a reserved word in H2. Unquoted, the
   generated test DDL fails. `V1__init_schema.sql` uses `key` and must not be edited, so the
   entity needs a quoted identifier.
9. **`upsert` is audited as `action = "UPDATE"` even when it creates the row.** The audit trail
   then cannot distinguish the first write of a section from later edits.

Two further design gaps, recorded rather than fixed here: `content_sections.version` is
incremented but nothing reads it and there is no history table, so "versioned" in the spec is not
actually implemented; and nothing in this plan serves `/media/<name>` back to clients.

## Global Constraints

- Backend must run within `-Xmx350m` (spec section 7 RAM budget) — no unbounded in-memory collections, use pagination on list endpoints.
- All admin-mutating endpoints (`POST`/`PUT`/`DELETE` under `/api/admin/**`) require a valid JWT with role `ADMIN` or `EDITOR`; only `ADMIN` may manage users and settings.
- Every admin CREATE/UPDATE/DELETE must write an `audit_logs` row; every 5xx response must write a `system_error_logs` row — and nothing below 5xx may write one.
- Public GET endpoints are Redis-cached with cache-aside invalidation on write (spec section 5).
- `analytics_events.ip_hash` stores a hash of the IP, never the raw IP (spec section 6).
- No comments restating what code does; only comments explaining non-obvious "why".
- **Package layout follows spec section 5.1 (layered).** A `service/XService.java` entry always
  means the pair `service/XService.java` + `service/impl/XServiceImpl.java`.
- **Controllers never touch a Repository or a Converter.** `LayerDependencyTest` fails the build
  on a violation — do not weaken it to make a class fit.
- Request bodies are `form/*Form`, responses and inter-layer data are `dto/*Dto`. Entities live in
  `model/` with no suffix.
- Constructor injection everywhere.
- **`V1__init_schema.sql` must not be edited.** `content_sections`, `media` and `settings` all
  already exist there.
- **Never use `columnDefinition` for a Postgres-specific type.** Map JSON columns as plain
  `String`; Postgres accepts a text parameter into `jsonb`.
- **No test may assert a tautology.** Task 6 mutation-checks every new test.

---

### Task 1: Carry-over fixes from the plan 05 review

**Why first:** both are small, both are in code plans 06–10 will copy, and both get harder to
change once three more modules imitate them.

- [ ] **Step 1: Delete the dead `create` overload (finding T-01)**

`service/TemplateService` declares both `create(TemplateUpsertForm, String username)` and
`create(TemplateUpsertForm, Long createdBy)`. Only the `String` one is called. Remove the `Long`
overload from the interface and `TemplateServiceImpl`.

Besides being dead, the pair makes `create(form, null)` fail to compile as ambiguous, with an
error message that explains nothing.

- [ ] **Step 2: Create one `CacheConfig` with an explicit TTL (finding T-04)**

`backend/src/main/java/com/portfolio/platform/config/CacheConfig.java`. Spec section 5 says public
GET responses are cached with a short TTL, but no number exists anywhere yet. Set **5 minutes**
for both `public-templates` and `content-sections`, in one place, via `RedisCacheConfiguration`.

Record the number in the code with a one-line WHY (it is a guess balancing admin edit latency
against origin load, not a measured value) so a later plan can change it deliberately.

- [ ] **Step 3: Run the suite** — expected 34/34 PASS, unchanged.

---

### Task 2: Content sections

**Files:**
- Create: `model/ContentSection.java`, `repository/ContentSectionRepository.java`,
  `dto/ContentSectionDto.java`, `form/ContentSectionUpsertForm.java`,
  `converter/ContentSectionConverter.java` + `converter/impl/ContentSectionConverterImpl.java`,
  `service/ContentSectionService.java` + `service/impl/ContentSectionServiceImpl.java`,
  `controller/ContentSectionController.java`
- Test: `service/ContentSectionServiceTest.java`, `controller/ContentSectionControllerTest.java`

- [ ] **Step 1: Write the failing service test**

Mockito. Cases:
1. `getByKey_returnsDto` — stub the repository, assert the converter's output is returned.
2. `getByKey_whenMissing_throwsResourceNotFound` — **not** an empty `Optional`. See step 4 for
   why the return type is not `Optional`.
3. `upsert_whenAbsent_createsWithVersionOne` — assert `version == 1` on the new row.
4. `upsert_whenPresent_incrementsVersion` — assert the existing row's version went from 1 to 2 and
   `sectionKey` was not overwritten.

- [ ] **Step 2: Run and confirm it fails**

- [ ] **Step 3: Model, repository, form, dto, converter**

`model/ContentSection` maps `content_sections` (`V1__init_schema.sql:51-58`): `id`, `sectionKey`
(unique), `dataJson`, `version` (default 1), `updatedBy`, `updatedAt`.

**`dataJson` is a plain `String` with no `columnDefinition`.** Add a `@PreUpdate` stamping
`updatedAt`, matching `model/User` and `model/Template`, instead of setting it by hand in the
service.

`form/ContentSectionUpsertForm` — `@NotBlank String dataJson`. `dto/ContentSectionDto` —
`sectionKey`, `dataJson`, `version`, `updatedAt`.

- [ ] **Step 4: Service — return a Dto, not `Optional`, and do not cache an `Optional`**

```java
ContentSectionDto getByKey(String sectionKey);   // throws ResourceNotFoundException
Long upsert(String sectionKey, ContentSectionUpsertForm form, String username);
```

Two deliberate choices, both worth a one-line comment:

- **`getByKey` returns the Dto and throws when absent**, rather than returning `Optional`.
  `@Cacheable` stores the return value, and `java.util.Optional` is not `Serializable` — with the
  Redis cache manager the original design fails on the first cache write, and never in tests,
  which use the in-memory manager. Throwing also gives the client the 404 shape plan 05
  established, for free.
- **`upsert` resolves `username` → id via `UserService.findIdByUsername`**, the same way
  `TemplateServiceImpl.create` does. `updated_by` must not be null.

Annotations on the impl: `getByKey` → `@Cacheable("content-sections")` +
`@Transactional(readOnly = true)`; `upsert` → `@CacheEvict(value = "content-sections", allEntries
= true)` + `@Transactional` + `@Audited`.

**`@Audited` action must reflect what happened.** `upsert` creates or updates, so a single
`action = "UPDATE"` mislabels every first write. Split into two service methods (`create` and
`update`) each with its own `@Audited`, and have `upsert` be a thin router on the controller side
— or, if that is awkward, keep one method and record in the commit body that `action` is
always `UPDATE` and why that was accepted. Do not silently leave it wrong.

`upsert` returns the entity id as a `Long` because `AuditAspect` reads a `Long` return value to
fill `audit_logs.entity_id`.

- [ ] **Step 5: Controller**

`GET /api/public/content-sections/{key}` → `ContentSectionDto`.
`PUT /api/admin/content-sections/{key}` → takes `@Valid @RequestBody ContentSectionUpsertForm` and
`Authentication`, passes `auth.getName()` to the service.

The original returned the raw JSON string as the response body, which Spring serves as
`text/plain`. Returning a Dto makes it `application/json` and gives the field a name the frontend
can bind to.

- [ ] **Step 6: Controller test**

`@SpringBootTest` + MockMvc. Assert: public GET of a seeded key returns 200 with the right
`dataJson`; public GET of an unknown key returns **404** with `code = NOT_FOUND`; admin PUT as
`@WithMockUser(roles = "EDITOR")` succeeds and writes one `audit_logs` row; admin PUT
unauthenticated returns 401.

---

### Task 3: Media upload — the security-critical one

**Files:**
- Create: `model/Media.java`, `repository/MediaRepository.java`, `dto/MediaDto.java`,
  `converter/MediaConverter.java` + impl, `service/MediaService.java` +
  `service/impl/MediaServiceImpl.java`, `controller/MediaController.java`,
  `config/MediaStorageProperties.java`
- Test: `service/MediaServiceTest.java`, `controller/MediaControllerTest.java`

- [ ] **Step 1: Write the failing security tests first**

These are the point of the task. Write them before any storage code:

1. `store_withTraversalFilename_doesNotEscapeUploadDir` — call the service with a
   `MockMultipartFile` named `../../../../tmp/pwn.png`. Assert the file actually written is inside
   the configured upload directory: resolve the real path and assert it
   `startsWith(uploadDir.toRealPath())`. Assert no file exists at the traversal target.
2. `store_withDisallowedType_isRejected` — a file named `evil.html` with content type
   `text/html`. Expect a rejection exception, and assert **no** row was saved and **no** file was
   written.
3. `store_withSpoofedContentType_usesSniffedType` — a file named `evil.svg` declaring
   `image/png`. The stored `mimeType` must not be the client's claim.
4. `store_persistsUploaderId` — assert `uploadedBy` is the resolved user id, not null.

Use `@TempDir` for the upload directory so the tests never touch a real path.

- [ ] **Step 2: Run and confirm all four fail**

- [ ] **Step 3: `config/MediaStorageProperties`**

`@ConfigurationProperties(prefix = "media")` with `uploadDir` (default `/data/media`),
`maxSizeBytes`, and `allowedContentTypes`. Put the defaults in `application.yml`; do not scatter
`@Value` strings through the service.

Allowed types: `image/png`, `image/jpeg`, `image/webp`, `image/gif`. **Not** `image/svg+xml` — SVG
is executable in a browser and this directory is served on the portfolio's own origin, so an
uploaded SVG is stored XSS. Say that in a one-line comment; it is exactly the kind of entry a
later reader would "helpfully" add back.

- [ ] **Step 4: `MediaServiceImpl.store` — the storage rules**

```java
Long store(MultipartFile file, String username);   // returns the media id
```

Rules, all of which the tests above pin:

- **The stored filename is derived only from a `UUID` and an extension chosen from the allow-list
  by detected type.** Never concatenate `file.getOriginalFilename()` into the path. Keep the
  original name in the `file_name` column, which is display data, not a path.
- After resolving the target, assert `target.normalize().startsWith(uploadDir.normalize())` and
  throw if not. Belt and braces: the UUID naming already prevents traversal, but this check is
  what a future refactor will trip over instead of silently reopening the hole.
- Reject when `file.getSize()` exceeds `maxSizeBytes`, and when the **detected** type is not in
  the allow-list. Detect from the content, not from `file.getContentType()`, which the client
  sets. `java.nio.file.Files.probeContentType` on the temp file, or read the magic bytes — pick
  one and say which in a comment.
- Return `Long` so `AuditAspect` can fill `audit_logs.entity_id`. The original returned the
  `Media` entity, which left that column null for every upload.
- Write the DB row **after** the file lands, and let the `@Transactional` boundary cover the row
  only. A failed save leaves an orphan file on disk — acceptable for now, but record it in the
  commit body as a known gap rather than leaving it undiscovered.

- [ ] **Step 5: Controller returns a Dto**

`POST /api/admin/media` → `MediaDto` (`id`, `fileName`, `url`, `mimeType`, `sizeBytes`), never the
entity. Takes `Authentication` and passes `auth.getName()`.

- [ ] **Step 6: Record who serves `/media/**`**

Nothing in this plan serves the stored files back. The `url` column says `/media/<name>` but no
controller or static-resource mapping exists. Do **not** invent one here — add a line to
`docs/superpowers/STATUS.md` noting that plan 16 (nginx) owns serving this path, and that it must
be served with `Content-Disposition: attachment` or from a separate origin if the allow-list ever
widens.

---

### Task 4: Settings

**Files:**
- Create: `model/Setting.java`, `repository/SettingRepository.java`, `dto/SettingDto.java`,
  `form/SettingUpsertForm.java`, `converter/SettingConverter.java` + impl,
  `service/SettingsService.java` + `service/impl/SettingsServiceImpl.java`,
  `controller/SettingsController.java`
- Test: `service/SettingsServiceTest.java`, `controller/SettingsControllerTest.java`

- [ ] **Step 1: Write the failing service test**

Cases: `get_returnsDto`; `get_whenMissing_throwsResourceNotFound`; `set_whenAbsent_creates`;
`set_whenPresent_updatesAndKeepsKey`; `set_persistsUpdatedBy`.

- [ ] **Step 2: Model — quote the `key` column**

`settings.key` is `key` in `V1__init_schema.sql:108` and that file must not be edited. **`KEY` is
a reserved word in H2**, so `@Column(name = "key")` generates DDL that fails at test-context
startup. Use `@Column(name = "\"key\"")` and verify the suite starts.

If the quoted form causes trouble on Postgres, stop and report rather than editing the migration
— a rename needs a `V3__` file and is a schema decision, not a mapping detail.

`valueJson` is a plain `String`, no `columnDefinition`. `@PreUpdate` stamps `updatedAt`.

- [ ] **Step 3: Service, converter, controller**

```java
SettingDto get(String key);                                   // throws ResourceNotFoundException
Long set(String key, SettingUpsertForm form, String username); // returns id, for audit entity_id
```

`set` returns `Long`, not `void` — the original returned `void`, which left
`audit_logs.entity_id` null for every settings change.

Settings are **not cached**: they change rarely but are read by admin flows that must see writes
immediately, and there is no public settings endpoint to protect.

`/api/admin/settings/**` is already `hasRole("ADMIN")` in `SecurityConfig` — EDITOR must not
reach it. Task 5 tests that.

---

### Task 5: Cross-cutting tests

- [ ] **Step 1: Authorization boundary**

`SettingsControllerTest`: `@WithMockUser(roles = "EDITOR")` on `PUT /api/admin/settings/{key}`
must return **403**, while `roles = "ADMIN"` succeeds. This is the only place in the project where
ADMIN and EDITOR differ, and nothing tests it today.

- [ ] **Step 2: Run the full suite**

```bash
export JAVA_HOME="C:/Program Files/Java/jdk-21.0.11"
mvn -f backend/pom.xml test
```

---

### Task 6: Verify, then commit

- [ ] **Step 1: Mutation-check every new test**

| Test | Revert this | Must go red |
|---|---|---|
| `store_withTraversalFilename_doesNotEscapeUploadDir` | build the path from the original filename | yes |
| `store_withDisallowedType_isRejected` | drop the allow-list check | yes |
| `store_withSpoofedContentType_usesSniffedType` | use `file.getContentType()` | yes |
| `store_persistsUploaderId` | pass `null` for the uploader | yes |
| `upsert_whenPresent_incrementsVersion` | stop incrementing `version` | yes |
| `getByKey_whenMissing_throwsResourceNotFound` | return `null` instead of throwing | yes |
| `set_persistsUpdatedBy` | pass `null` | yes |
| EDITOR-on-settings returns 403 | widen the matcher to `hasAnyRole("ADMIN","EDITOR")` | yes |

- [ ] **Step 2: Run `LayerDependencyTest` explicitly**

Three new controllers, three services, three converters. This is the first plan since the
allow-list was completed that adds classes in bulk.

- [ ] **Step 3: Commit**

Commit body states: test count before and after, the eight mutation-check results, whether the
`"key"` quoting worked on H2, the `@Audited` action decision from task 2 step 4, and the orphan-file
gap from task 3 step 4.

Do **not** push.

## Self-Review Notes

- **`content_sections.version` is incremented and never read.** There is no history table, so the
  spec's "versioned" content sections are not actually versioned — the column is a write counter.
  Either a `content_section_history` table is a future plan, or the spec should stop calling it
  versioned. Flagged, not decided here.
- **Serving `/media/**` is unowned** until plan 16. Until then an uploaded file is recorded but
  unreachable, which is fine for the admin flow and will surprise whoever writes plan 14.
- **Orphan files on rollback** are accepted for now; a periodic reconciliation job would be plan
  09-or-later scope.
- **Next plan:** `2026-09-19-07-lead-notification.md`, which needs the same revision pass — its
  code blocks still predate spec 5.1.
