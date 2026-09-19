# Template CRUD Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Template CRUD module — public listing for the 3D carousel and admin
management, with Redis cache-aside and audit logging.

**Architecture:** Layered per spec 5.1. `model/Template`, `repository/TemplateRepository`,
`converter/TemplateConverter` + impl, `service/TemplateService` + `service/impl/TemplateServiceImpl`,
`controller/PublicTemplateController`, `controller/AdminTemplateController`. No Facade — both
controllers talk to one service, which spec 5.1 says is the case where a Facade must **not** be
added.

**Tech Stack:** Spring Data JPA, Spring Cache + Redis, JUnit 5 + Mockito + MockMvc.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md` — **read section 5.1
before creating any class.**

**Depends on:** `2026-09-20-04b-layered-architecture-restructure.md` (the layered layout and
`LayerDependencyTest` must exist first), `2026-09-19-04-audit-error-logging.md` (needs `@Audited`
and the `ApiErrorDto` shape), `2026-09-19-01-backend-scaffold.md` (needs the `templates` table).

---

## Revision log

**Revised 2026-09-20.** The original version of this plan was written against the old
feature-package layout and carried six defects beyond the packaging. Recorded so the diff is not
mistaken for scope creep:

1. **`TemplateDto.from(Template)`** — a static factory on the Dto that reads the entity. Dto is a
   leaf package (spec 5.1): it must not depend on `model`, and conversion is the Converter's job.
2. **`AdminTemplateController.create` took `Authentication auth` and passed `null` as
   `createdBy`.** The parameter was dead and `templates.created_by` would have been null on every
   row, for every template, forever.
3. **`incrementClickCount` did read-modify-write** (`findById` → `setClickCount(+1)` → `save`).
   Two concurrent clicks lose one. Plan 08 calls this on a public, rate-limited-but-hot endpoint.
4. **`EntityNotFoundException` would surface as 500.** Since plan 04, the catch-all handler turns
   any unhandled exception into `INTERNAL_ERROR` *and writes a `system_error_logs` row* — so
   `PUT /api/admin/templates/999` would report a server fault and pollute the error table.
5. **`PublicTemplateControllerTest` asserted only `status().isOk()`** — it passes against an empty
   list, so it proves the endpoint is reachable and nothing else. It would not catch the filter
   returning inactive or soft-deleted templates.
6. **No test proved an audit row is written.** `@Audited` sits on the service methods, but the
   only service test was a Mockito unit test, where the AOP proxy never runs. This is R-02 from
   `docs/reviews/2026-09-20-code-review-plan-04.md`: plan 05 is the first real call site of
   `@Audited` and owns proving it works.

## Global Constraints

- Backend must run within `-Xmx350m` (spec section 7 RAM budget) — no unbounded in-memory collections, use pagination on list endpoints.
- All admin-mutating endpoints (`POST`/`PUT`/`DELETE` under `/api/admin/**`) require a valid JWT with role `ADMIN` or `EDITOR`; only `ADMIN` may manage users and settings.
- Every admin CREATE/UPDATE/DELETE must write an `audit_logs` row (spec section 6); every 5xx response must write a `system_error_logs` row (spec section 8) — and nothing below 5xx may write one.
- Public GET endpoints (`templates`, `content-sections`) are Redis-cached with cache-aside invalidation on write (spec section 5).
- Public POST endpoints (`leads`, `analytics/events`, `auth/login`) are rate-limited via Bucket4j (spec section 5).
- `analytics_events.ip_hash` stores a hash of the IP, never the raw IP (spec section 6).
- Templates are static-exported Next.js sites served by Nginx on `<slug>.portfolio.com`, no per-template runtime process (spec sections 4, 7).
- No comments restating what code does; only comments explaining non-obvious "why".
- **Package layout follows spec section 5.1 (layered), not feature packages.** A
  `service/XService.java` entry in a file list always means the pair `service/XService.java`
  (interface) + `service/impl/XServiceImpl.java` (implementation).
- **Controllers never touch a Repository or a Converter.** `LayerDependencyTest` (plan 04b) fails
  the build on a violation — do not weaken that test to make a class fit.
- Request bodies are `form/*Form`, response bodies and inter-layer data are `dto/*Dto`. Entities
  live in `model/` with no suffix.
- Constructor injection everywhere. Do not switch to field `@Autowired`.
- **`V1__init_schema.sql` must not be edited.** The `templates` table already exists there.
- **No test may assert a tautology.** Task 5 mutation-checks every new test.

---

### Task 1: Model, repository, form, dto, converter

**Files:**
- Create: `backend/src/main/java/com/portfolio/platform/model/Template.java`
- Create: `backend/src/main/java/com/portfolio/platform/repository/TemplateRepository.java`
- Create: `backend/src/main/java/com/portfolio/platform/dto/TemplateDto.java`
- Create: `backend/src/main/java/com/portfolio/platform/form/TemplateUpsertForm.java`
- Create: `backend/src/main/java/com/portfolio/platform/converter/TemplateConverter.java`
- Create: `backend/src/main/java/com/portfolio/platform/converter/impl/TemplateConverterImpl.java`

- [ ] **Step 1: `model/Template`**

Map the existing `templates` table (`V1__init_schema.sql:32-49`) exactly: `id`, `name`, `slug`
(unique), `subdomain` (unique), `thumbnailMediaId`, `description` (text), `category`, `techTags`,
`displayOrder` (default 0), `active` → `is_active`, `viewCount`, `clickCount`, `createdBy`,
`createdAt` (`updatable = false`), `updatedAt`, `deletedAt`.

Add a `@PreUpdate` callback stamping `updatedAt`, matching `model/User`. The original plan set
`updatedAt` by hand in `update()` and not in `create()` — inconsistent, and it drifts the moment
a second write path appears.

Do **not** use `columnDefinition` for `description`; `@Column(columnDefinition = "text")` is fine
on H2, unlike `jsonb` — but prefer `@Lob`-free plain `String` with `length` left default and let
the migration own the type.

- [ ] **Step 2: `repository/TemplateRepository`**

```java
List<Template> findByActiveTrueAndDeletedAtIsNullOrderByDisplayOrderAsc();
List<Template> findByDeletedAtIsNullOrderByDisplayOrderAsc();

@Modifying
@Query("update Template t set t.clickCount = t.clickCount + 1 where t.id = :id")
int incrementClickCount(@Param("id") Long id);
```

The derived-query name uses `ActiveTrue`, not `IsActiveTrue` — the **field** is `active`, the
column is `is_active`. Getting this wrong fails at context startup, not compile time.

`incrementClickCount` is an atomic bulk update on purpose: the original read-modify-write loses
one of two concurrent clicks, and plan 08 drives this from a public endpoint.

- [ ] **Step 3: `form/TemplateUpsertForm` and `dto/TemplateDto`**

`TemplateUpsertForm` — the client's request shape: `@NotBlank name`, `@NotBlank slug`,
`@NotBlank subdomain`, `thumbnailMediaId`, `description`, `category`, `techTags`, `displayOrder`,
`active`.

`TemplateDto` — our response shape: `id, name, slug, subdomain, thumbnailMediaId, description,
category, techTags, displayOrder, active, viewCount, clickCount`.

`TemplateDto` holds **no** static `from(...)` factory and imports nothing from `model`. These
field names are the wire contract plan 11's frontend type and plan 14's admin page mirror — do not
rename them.

- [ ] **Step 4: `converter/TemplateConverter` + impl**

```java
TemplateDto toDto(Template template);
List<TemplateDto> toDtoList(List<Template> templates);
void applyForm(Template target, TemplateUpsertForm form);
```

Stateless. No repository, no service, no conditional business rules — a Converter that decides
anything is the violation the skill calls out. `applyForm` copies fields only; it must not touch
`createdBy`, `createdAt`, `viewCount`, `clickCount` or `deletedAt`, because those are not the
client's to set.

---

### Task 2: Service

**Files:**
- Create: `backend/src/main/java/com/portfolio/platform/service/TemplateService.java`
- Create: `backend/src/main/java/com/portfolio/platform/service/impl/TemplateServiceImpl.java`
- Create: `backend/src/main/java/com/portfolio/platform/exception/ResourceNotFoundException.java`
- Test: `backend/src/test/java/com/portfolio/platform/service/TemplateServiceTest.java`

- [ ] **Step 1: Write the failing service test**

`@ExtendWith(MockitoExtension.class)`, `@Mock TemplateRepository`, `@Mock TemplateConverter`,
`@InjectMocks TemplateServiceImpl`. Four cases:

1. `listActive_returnsOnlyActiveOrderedTemplates` — stub the repository, assert the service
   returns what the converter produced and that it called the **active + not-deleted + ordered**
   finder, not `findAll()`.
2. `incrementClickCount_issuesAtomicUpdate` — `verify(templateRepository).incrementClickCount(5L)`
   and `verifyNoMoreInteractions`. Asserting the *absence* of `findById`/`save` is the point: it
   is what stops the read-modify-write coming back.
3. `update_withUnknownId_throwsResourceNotFound` — expect `ResourceNotFoundException`, not
   `EntityNotFoundException`.
4. `softDelete_setsDeletedAtAndDeactivates` — assert both fields, since a row that is
   `deletedAt != null` but still `active` would still be filtered out today but would leak the
   moment a query forgets one of the two predicates.

- [ ] **Step 2: Run and confirm it fails**

Run: `mvn -f backend/pom.xml test -Dtest=TemplateServiceTest`
Expected: FAIL to compile — the classes do not exist.

- [ ] **Step 3: Create `exception/ResourceNotFoundException`**

Unchecked (`extends RuntimeException`), typed — not a bare `RuntimeException`, per the skill's
exception-handling criteria. Carries the entity type and id.

Add `@ExceptionHandler(ResourceNotFoundException.class)` to `GlobalExceptionHandler` returning
**404** with `ApiErrorDto("NOT_FOUND", ...)` and **no** `system_error_logs` row. Without this the
catch-all makes a missing id a 500 and writes an error row for what is a client mistake.

- [ ] **Step 4: Create the interface and impl**

```java
List<TemplateDto> listActive();
List<TemplateDto> listAllForAdmin();
Long create(TemplateUpsertForm form, Long createdBy);
Long update(Long id, TemplateUpsertForm form);
Long softDelete(Long id);
void incrementClickCount(Long id);
```

On the **impl** methods:
- `listActive` — `@Cacheable("public-templates")` + `@Transactional(readOnly = true)`
- `listAllForAdmin` — `@Transactional(readOnly = true)`, **not** cached; admins must see writes
  immediately, and the admin list includes inactive rows the public cache must never hold.
- `create` / `update` / `softDelete` — `@Audited(entityType = "Template", action = ...)` +
  `@CacheEvict(value = "public-templates", allEntries = true)` + `@Transactional`
- `incrementClickCount` — `@Transactional`, no cache evict. The counter is not in `TemplateDto`'s
  cached read path often enough to justify evicting the whole list on every click; plan 08 owns
  the decision about counter freshness and must record it.

Each of `create`/`update`/`softDelete` returns the entity id, because `AuditAspect` reads a `Long`
return value to fill `audit_logs.entity_id`. Changing the return type silently empties that column
— say so in a one-line comment on the interface.

- [ ] **Step 5: Run and confirm it passes**

---

### Task 3: Controllers

**Files:**
- Create: `backend/src/main/java/com/portfolio/platform/controller/PublicTemplateController.java`
- Create: `backend/src/main/java/com/portfolio/platform/controller/AdminTemplateController.java`

- [ ] **Step 1: `PublicTemplateController`**

`GET /api/public/templates` → `List<TemplateDto>`, delegating to `templateService.listActive()`.
One method, no logic.

- [ ] **Step 2: `AdminTemplateController`**

`GET` (list all), `POST` (create), `PUT /{id}`, `DELETE /{id}` under `/api/admin/templates`.

**`createdBy` must be resolved, not passed as null.** The controller receives `Authentication`,
whose name is the username (`JwtAuthFilter` sets it). Resolving username → id is a service
concern, so add `UserService.findIdByUsername(String)` and have `AdminTemplateController` pass
`auth.getName()` to the **service**, which resolves it. Do **not** inject `UserRepository` into
the controller — `LayerDependencyTest` fails the build on that, and it is violation V-1 from plan
04b all over again.

If that reshapes `create`'s signature to `create(TemplateUpsertForm, String username)`, take that
— it keeps the controller free of lookups.

---

### Task 4: Integration tests that actually exercise the wiring

**Files:**
- Test: `backend/src/test/java/com/portfolio/platform/controller/PublicTemplateControllerTest.java`
- Test: `backend/src/test/java/com/portfolio/platform/controller/AdminTemplateControllerTest.java`

- [ ] **Step 1: `PublicTemplateControllerTest` — assert content, not just status**

`@SpringBootTest` + `@AutoConfigureMockMvc` + `@ActiveProfiles("test")`. Seed three templates via
the repository: one active, one `active = false`, one soft-deleted (`deletedAt` set). Then
`GET /api/public/templates` and assert:

- status 200,
- the body contains **exactly one** element,
- it is the active one (check `slug`),
- the inactive and soft-deleted slugs appear nowhere in the body.

The original test asserted only `status().isOk()`, which passes against an empty list.

- [ ] **Step 2: `AdminTemplateControllerTest` — prove the audit row and the authorization**

Three cases:

1. `create_asAdmin_writesAuditLogRow` — `@WithMockUser(roles = "ADMIN")`, `POST` a valid form,
   assert 200 **and** that `audit_logs` count increased by exactly 1 with
   `entity_type = "Template"`, `action = "CREATE"`, and `entity_id` equal to the returned id.
   **This is the first proof in the project that `@Audited` does anything in production code**
   (R-02 from the plan 04 review). It must go through MockMvc, not a direct service call, or the
   AOP proxy is bypassed and the test proves nothing.
2. `create_asEditor_isAllowed` — `@WithMockUser(roles = "EDITOR")`, expect success. The
   `/api/admin/**` rule grants EDITOR; a regression here silently locks out half the users.
3. `create_unauthenticated_returns401` — no user, expect 401 and `code = UNAUTHORIZED` (the shape
   plan 04 established).

- [ ] **Step 3: Run the full suite**

```bash
export JAVA_HOME="C:/Program Files/Java/jdk-21.0.11"
mvn -f backend/pom.xml test
```
Expected: 26 (after plan 04b) + 4 service + 1 public + 3 admin = **34 PASS**.

---

### Task 5: Verify, then commit

- [ ] **Step 1: Mutation-check every new test**

| Test | Revert this | Must go red |
|---|---|---|
| `listActive_returnsOnlyActiveOrderedTemplates` | point the service at `findAll()` | yes |
| `incrementClickCount_issuesAtomicUpdate` | restore find → set → save | yes |
| `update_withUnknownId_throwsResourceNotFound` | return null instead of throwing | yes |
| `softDelete_setsDeletedAtAndDeactivates` | drop `setActive(false)` | yes |
| `PublicTemplateControllerTest` | drop the `deletedAtIsNull` predicate | yes |
| `create_asAdmin_writesAuditLogRow` | remove `@Audited` from `create` | yes |
| `create_asEditor_isAllowed` | tighten the matcher to `hasRole("ADMIN")` | yes |

Any test that stays green proves nothing — fix it before committing.

- [ ] **Step 2: Confirm no layer violation**

Run `LayerDependencyTest` explicitly. It must pass with the new controllers in place.

- [ ] **Step 3: Commit**

```bash
git add backend/src
git commit -m "feat: add Template CRUD module with layered packaging, caching and audit proof"
```

Commit body states: test count before and after, the seven mutation-check results, whether
`created_by` is populated (and how it is resolved), and any deviation from this plan.

Do **not** push.

## Self-Review Notes

- **Spec coverage:** the `template` module and `templates` table from spec sections 5–6, plus the
  Redis cache-aside pattern from section 5.
- **Cache TTL is not set here.** `@Cacheable("public-templates")` uses whatever the default cache
  manager gives it. Spec section 5 says "short TTL" but no number exists yet. Plan 06 adds the
  second cached endpoint and should own a single `CacheConfig` with an explicit TTL for both,
  rather than each plan inventing one.
- **`viewCount` is never incremented anywhere.** The column exists in the schema and in
  `TemplateDto`, but nothing writes it. Plan 08 (analytics) must either wire it or the column and
  the DTO field should be dropped — flag it there, do not quietly leave a field that always reads 0.
- **Type consistency:** `TemplateDto`'s fields are the exact shape plan 11's frontend type and
  plan 14's admin page mirror.
- **Next plan:** `2026-09-19-06-content-media-settings.md`, which still needs the same revision
  pass this plan just had — its code blocks predate spec 5.1.
