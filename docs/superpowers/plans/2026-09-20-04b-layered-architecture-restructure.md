# Layered Architecture Restructure Implementation Plan (Task 04b)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the backend from feature-packaging (`auth/`, `user/`, `audit/`, `error/`) to the
layered packaging mandated by the `coding-backend-java` skill and now written into spec 5.1, and
fix the four CRITICAL layer-dependency violations that feature-packaging was hiding. Also fixes
the 404-becomes-500 regression found reviewing plan 04.

**Architecture:** Target tree is spec section 5.1. Nothing about the runtime behaviour changes
except the three items listed under "Behaviour changes" below — everything else is a move plus a
layer insertion.

**Tech Stack:** Spring Boot 3 / Spring Security 6, Spring Data JPA, Spring AOP, JUnit 5 + MockMvc.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md` — **read section 5.1
first, it is the contract this plan implements.**

**Skill:** `coding-backend-java` — class placement table, dependency rules, Form vs Dto ownership,
naming, comment policy.

**Reviews being remediated:** `docs/reviews/2026-09-20-code-review-plan-04.md` (the 404 regression)
plus the structural findings recorded in this plan.

**Depends on:** plan 04 (commit `a95f958`), which must be in the tree before this starts.

**Progress:** task 1 DONE in commit `1d3087f` (25/25 PASS). Tasks 2-8 outstanding.

**Blocks:** plans 05–18. Every one of them writes new classes, and each additional plan landed on
the old layout makes this move bigger. **Do this before plan 05.**

## Why this is not cosmetic

Feature-packaging did not just put files in surprising folders — it hid four dependency violations
that the skill classifies as CRITICAL, because inside a single `auth/` package every one of them
looks like a local call:

| # | Violation | Where | Rule broken |
|---|---|---|---|
| V-1 | `AuthController` injects `UserRepository` and runs the password check itself | `auth/AuthController.java` | Controller → Repository; Controller contains business logic |
| V-2 | `RefreshTokenCleanupJob` injects `RefreshTokenRepository` | `auth/RefreshTokenCleanupJob.java` | Scheduler follows Controller rules — never Repository directly |
| V-3 | `GlobalExceptionHandler` injects `SystemErrorLogRepository` | `error/GlobalExceptionHandler.java` | Advice is a Controller-tier component — never Repository directly |
| V-4 | `AuditAspect` injects `AuditLogRepository` and `UserRepository` | `audit/AuditAspect.java` | Same tier rule as above |

There is also no Service interface/impl split anywhere, no Converter layer, and `LoginRequest` /
`TokenResponse` ignore the Form-vs-Dto ownership rule.

## Behaviour changes (everything else is a pure move)

1. **404 stops being 500.** `GET /api/public/nope` currently returns 500 `INTERNAL_ERROR` **and
   writes a `system_error_logs` row**, because `NoResourceFoundException` falls into the catch-all
   handler. Task 7 fixes it. Until then every crawler hitting a bad URL inflates that table.
2. **`AuthController` returns a typed body again.** Plan 04 widened `login`/`refresh` to
   `ResponseEntity<?>` to fit an error body in. With a Facade and a typed exception the controller
   returns `ResponseEntity<TokenDto>` and the advice renders the 401.
3. **One extra indirection per call.** Controller → Facade → Service → Repository. No behaviour
   difference, but stack traces get one frame deeper.

## Global Constraints

- Backend must run within `-Xmx350m` (spec section 7 RAM budget).
- All admin-mutating endpoints (`POST`/`PUT`/`DELETE` under `/api/admin/**`) require a valid JWT
  with role `ADMIN` or `EDITOR`; only `ADMIN` may manage users and settings.
- Every admin CREATE/UPDATE/DELETE must write an `audit_logs` row; every 5xx response must write a
  `system_error_logs` row — **and nothing below 5xx may write one**.
- `V1__init_schema.sql` and `V2__refresh_token_indexes.sql` must not be edited. **This plan makes
  no schema change at all** — no column, table or index moves. If a step seems to need one, stop.
- Constructor injection everywhere (spec 5.1). Do not switch to field `@Autowired`.
- Comment policy per spec 5.1: default none. **Every existing WHY comment must survive the move** —
  they encode findings from four review rounds. Moving a class is not licence to drop its comments.
- **The test suite must stay at 25 passing tests through every task.** This is a refactor: a
  dropped test is a lost regression guard, not a cleanup.

---

### Task 1: Create the package skeleton and move the leaf classes

**Why first:** leaf packages (`model`, `enums`, `dto`, `form`) have no outgoing dependencies, so
moving them cannot break a layer rule — only imports.

- [x] **Step 1: Move entities to `model/`, enum to `enums/`**

Use `git mv` for every move in this plan so history follows the file.

| From | To |
|---|---|
| `auth/RefreshToken.java` | `model/RefreshToken.java` |
| `audit/AuditLog.java` | `model/AuditLog.java` |
| `audit/SystemErrorLog.java` | `model/SystemErrorLog.java` |
| `user/User.java` | `model/User.java` |
| `user/Role.java` | `enums/Role.java` |

Entities keep **no suffix** (spec 5.1). Update the `package` line in each file and fix imports
across the tree.

- [x] **Step 2: Split the request/response records into `form/` and `dto/`**

Ownership rule decides, not the direction of travel:

| From | To | Why |
|---|---|---|
| `auth/LoginRequest.java` | `form/LoginForm.java` | request shape the client sends us |
| `auth/RefreshRequest.java` | `form/RefreshTokenForm.java` | same |
| `auth/TokenResponse.java` | `dto/TokenDto.java` | response contract we define |
| `error/ApiError.java` | `dto/ApiErrorDto.java` | same |

Rename the types as well as the files. Keep the JSON field names identical — `refreshToken`,
`accessToken`, `code`, `message`, `requestId`. **This is a wire contract**; plan 13's admin FE and
`AuthControllerTest`'s `objectMapper.readValue` both depend on it. Renaming a Java type is fine;
renaming a JSON field is not.

- [x] **Step 3: Move `RefreshTokenService.Rotation` out of the service**

It is inter-layer data, so it is a Dto: `dto/RotationDto.java`, fields unchanged
(`User user`, `String rawRefreshToken`).

- [x] **Step 4: Compile and run the suite**

```bash
export JAVA_HOME="C:/Program Files/Java/jdk-21.0.11"
mvn -f backend/pom.xml test
```
Expected: 25/25 PASS. Nothing behavioural has changed yet.

---

### Task 2: Move repositories, filter, scheduler, aspect, annotation, advice

- [ ] **Step 1: Move the remaining classes to their layer package**

| From | To |
|---|---|
| `auth/RefreshTokenRepository.java` | `repository/RefreshTokenRepository.java` |
| `audit/AuditLogRepository.java` | `repository/AuditLogRepository.java` |
| `audit/SystemErrorLogRepository.java` | `repository/SystemErrorLogRepository.java` |
| `user/UserRepository.java` | `repository/UserRepository.java` |
| `auth/JwtAuthFilter.java` | `filter/JwtAuthFilter.java` |
| `auth/RefreshTokenCleanupJob.java` | `scheduler/RefreshTokenCleanupJob.java` |
| `audit/AuditAspect.java` | `aspect/AuditAspect.java` |
| `audit/Audited.java` | `annotation/Audited.java` |
| `error/GlobalExceptionHandler.java` | `exception/GlobalExceptionHandler.java` |
| `auth/JwtProperties.java` | `config/JwtProperties.java` |
| `auth/AuthController.java` | `controller/AuthController.java` |

`config/SecurityConfig.java` already sits correctly.

- [ ] **Step 2: Delete the now-empty `auth/`, `user/`, `audit/`, `error/` packages**

If any of them still holds a file, that file was missed — go back to the table rather than
inventing a home for it.

- [ ] **Step 3: Move the test classes to mirror the new layout**

`AuthControllerTest` → `controller/`, `JwtServiceTest` → `service/`,
`RefreshTokenCleanupJobTest` → `scheduler/`, `UserRepositoryTest` → `repository/`,
`AuditAspectTest` → `aspect/`, `GlobalExceptionHandlerTest` → `exception/`.
`SecurityConfigTest` and `ErrorDispatchSecurityTest` stay in `config/`.

- [ ] **Step 4: Run the suite**

Expected: 25/25 PASS. Still no behaviour change — the four violations are now *visible* (a
Controller importing `repository.UserRepository`) but not yet fixed.

---

### Task 3: Introduce the Service interface/impl split

**Why:** spec 5.1 requires `service/*Service` + `service/impl/*ServiceImpl`. Right now
`JwtService` and `RefreshTokenService` are bare concrete classes.

- [ ] **Step 1: Extract interfaces**

| Interface (`service/`) | Impl (`service/impl/`) | Methods |
|---|---|---|
| `JwtService` | `JwtServiceImpl` | `generateAccessToken(User)`, `validateAccessToken(String)` |
| `RefreshTokenService` | `RefreshTokenServiceImpl` | `issue(Long)`, `rotate(String)`, `revoke(String)`, **`purgeExpired()`** |
| `UserService` | `UserServiceImpl` | `findActiveByUsername(String)`, `verifyPassword(User, String)`, `touchLastLoginAt(Long)` |
| `AuditLogService` | `AuditLogServiceImpl` | `record(String entityType, String action, Long entityId, Long userId, String ipAddress)` |
| `SystemErrorLogService` | `SystemErrorLogServiceImpl` | `record(...)` |

`JwtService.Claims` stays a nested record on the interface — it is the interface's own return
type, not inter-layer transfer data.

`purgeExpired()` is new: it is what lets task 4 remove the scheduler's repository dependency. Move
the `Instant.now()` cutoff decision into the service; the scheduler should not compute it.

- [ ] **Step 2: Keep the `@Transactional` boundaries exactly where they are**

`rotate()` and `revoke()` are already `@Transactional` — the annotation moves to the **impl**
method, not the interface. Read flows that only read get `@Transactional(readOnly = true)`.

Do not widen any boundary while moving it. `rotate()`'s single transaction is what makes the
is-active check and the revoke atomic (plan 03b task 2).

- [ ] **Step 3: Run the suite**

Expected: 25/25 PASS.

---

### Task 4: Fix V-2, V-3, V-4 — the three non-controller repository violations

- [ ] **Step 1: Write the failing architecture test**

Create `backend/src/test/java/com/portfolio/platform/architecture/LayerDependencyTest.java`.

No new dependency: read the source tree with `java.nio.file.Files.walk` over
`src/main/java/com/portfolio/platform`, and for each file assert its `import` lines against the
allowed set for its package. Encode exactly the table from spec 5.1:

```
controller → facade, service, dto, form, enums, exception
scheduler  → facade, service
aspect     → service, annotation
exception  → service, dto            (the @RestControllerAdvice)
facade     → service, converter, helper, util, dto, form, model, enums
service    → repository, converter, helper, util, dto, model, enums
converter  → util, helper, dto, form, model, enums
helper     → repository, model
```

Assert that **no** class in `controller`, `scheduler`, `aspect` or `exception` imports anything
from `com.portfolio.platform.repository`. That assertion fails on three files today.

This test is the point of the whole task: it is what stops plans 05–18 from quietly reintroducing
the violation. Without it, this restructure decays.

- [ ] **Step 2: Run it and confirm it fails, naming all three files**

Expected failure lists `scheduler/RefreshTokenCleanupJob`, `exception/GlobalExceptionHandler`,
`aspect/AuditAspect`. If it names fewer, the walk is not reaching every file — fix the test before
fixing the code.

- [ ] **Step 3: Rewire the three classes**

- `RefreshTokenCleanupJob` injects `RefreshTokenService`, calls `purgeExpired()`. Keep the
  `@Scheduled(cron = "0 30 3 * * *")` and keep the comment about retaining revoked-but-unexpired
  rows — that comment guards the R-04 reuse detection.
- `GlobalExceptionHandler` injects `SystemErrorLogService`. The UUID `requestId` must still be the
  same value in the response body and the persisted row.
- `AuditAspect` injects `AuditLogService` and `UserService`. The username→id lookup comment stays.

- [ ] **Step 4: Run the architecture test, then the suite**

Expected: architecture test green, 25/25 + 1 = **26 PASS**.

---

### Task 5: Fix V-1 — AuthController has business logic and a repository

**Files:**
- Create: `facade/AuthServiceFacade.java`, `facade/impl/AuthServiceFacadeImpl.java`
- Create: `converter/TokenConverter.java`, `converter/impl/TokenConverterImpl.java`
- Create: `exception/InvalidCredentialsException.java`
- Modify: `controller/AuthController.java`, `exception/GlobalExceptionHandler.java`

**Why a Facade here:** login orchestrates `UserService` (lookup, password check, stamp last login),
`JwtService` (mint access token) and `RefreshTokenService` (issue refresh token) — three services,
which is exactly the case spec 5.1 says a Facade is for. Do not add a Facade anywhere else in this
plan.

- [ ] **Step 1: Extend the architecture test**

Add the assertion that no `controller` class imports `com.portfolio.platform.repository` or
`com.portfolio.platform.converter`. Confirm it fails on `AuthController` today.

- [ ] **Step 2: Create `InvalidCredentialsException`**

A typed domain exception extending `RuntimeException` (unchecked — Spring Boot convention per the
skill's exception-handling criteria). Not a bare `RuntimeException`.

- [ ] **Step 3: Move the login flow into `AuthServiceFacadeImpl`**

```
TokenDto login(LoginForm form)          // throws InvalidCredentialsException
TokenDto refresh(RefreshTokenForm form) // throws InvalidCredentialsException
void     logout(RefreshTokenForm form)
```

The Facade **orchestrates only** — it calls services and routes results. The password comparison
itself belongs in `UserServiceImpl.verifyPassword`, not in the Facade; building `TokenDto` belongs
in `TokenConverter`. A Facade private method that transforms or computes is the exact violation
pattern the skill calls out.

Preserve both existing security properties, and keep their comments:
- login returns the **same** error for unknown-user and wrong-password (no enumeration oracle);
- logout always succeeds whether or not a row matched (no token-validity oracle) — so `logout`
  returns `void` and never throws.

- [ ] **Step 4: Reduce `AuthController` to delegation**

```java
@PostMapping("/login")
public ResponseEntity<TokenDto> login(@Valid @RequestBody LoginForm form) {
    return ResponseEntity.ok(authServiceFacade.login(form));
}
```

Three methods, no `if`, no repository, no `ResponseEntity<?>`. `logout` keeps returning 204.

- [ ] **Step 5: Handle the exception in the advice**

`@ExceptionHandler(InvalidCredentialsException.class)` → 401 with
`ApiErrorDto("INVALID_CREDENTIALS", "Invalid credentials", null)` and **no** `system_error_logs`
row. Same code and message both paths.

- [ ] **Step 6: Run the suite**

Expected: 26/26 PASS. `AuthControllerTest` should need **no assertion changes** — the wire contract
is identical. If a test needs editing to pass, the refactor changed behaviour; find out why before
editing the test.

---

### Task 6: Add the Converter layer for the audit path

- [ ] **Step 1: `converter/AuditLogConverter` + impl**

Builds an `AuditLog` from `(entityType, action, entityId, userId, ipAddress)`. Stateless, no
repository, no business decisions — a pure shape transformation, called from `AuditLogServiceImpl`.

This is small on purpose. The point is that plans 05–10, which all write audit rows, have a
converter to follow instead of inventing entity-building inline in each service.

- [ ] **Step 2: Run the suite**

Expected: 26/26 PASS.

---

### Task 7: Fix the 404-becomes-500 regression

**Why:** `ErrorDispatchSecurityTest.unmappedPublicEndpoint_returns500` documents that
`GET /api/public/nope` returns 500 `INTERNAL_ERROR` and persists a `system_error_logs` row.
Spring MVC throws `NoResourceFoundException`, which the catch-all `Exception` handler swallows.
Two consequences: a client cannot tell a typo from a server fault, and **every 404 writes a row**,
so any crawler inflates the table without bound. The global constraint says nothing below 5xx may
write one.

- [ ] **Step 1: Rewrite the test to assert the correct behaviour**

Rename `unmappedPublicEndpoint_returns500` back to `unmappedPublicEndpoint_returns404`. Assert
status 404, body `code = NOT_FOUND`, **and** that `system_error_logs` count is unchanged. The
third assertion is the one that matters — it is what stops the handler being "fixed" later by
widening the catch-all again.

- [ ] **Step 2: Run it and confirm it fails**

Expected: FAIL with 500.

- [ ] **Step 3: Add the handler**

`@ExceptionHandler(NoResourceFoundException.class)` (Spring Framework 6.1+,
`org.springframework.web.servlet.resource.NoResourceFoundException`) → 404,
`ApiErrorDto("NOT_FOUND", ...)`, no persisted row.

Check whether `NoHandlerFoundException` can also reach the advice in this configuration; add a
handler for it only if it can. Do not add a speculative handler for an exception this app cannot
produce.

- [ ] **Step 4: Run the suite**

Expected: 26/26 PASS.

---

### Task 8: Verify, then commit

- [ ] **Step 1: Full suite, three consecutive runs**

```bash
export JAVA_HOME="C:/Program Files/Java/jdk-21.0.11"
for i in 1 2 3; do mvn -f backend/pom.xml test; done
```
All three must report 26/26. Three runs because a restructure that changes bean wiring is exactly
where order-dependent test state shows up.

- [ ] **Step 2: Confirm every class landed in the right package**

```bash
find backend/src/main/java/com/portfolio/platform -name "*.java" | sort
```
Compare against spec 5.1 by hand. No file may remain under `auth/`, `user/`, `audit/` or `error/`.

- [ ] **Step 3: Confirm the moves are recorded as renames, not delete+add**

```bash
git add -A && git status --short
```
Expect `R` entries. A `D` + `??` pair means `git mv` was not used and the file's history is lost —
redo that move.

- [ ] **Step 4: Mutation-check the architecture test**

Temporarily make `AuthController` inject `UserRepository` again. `LayerDependencyTest` must go red
and name that file. Restore. An architecture test that does not fail on a real violation is worse
than none — it grants false confidence to every later plan.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: move backend to layered packages and fix four layer violations"
```

Commit body must state: the four violations fixed, the 404 fix, test count before and after, the
three-run result, the architecture-test mutation result, and any class whose placement deviated
from spec 5.1 and why.

Do **not** push. This lands on top of an unpushed plan-04 commit and both get reviewed together.

## Self-Review Notes

- **No schema change, no wire-contract change.** Java type names change; JSON field names,
  endpoint paths, and status codes do not — except the 404 fix, which is the point of task 7.
- **The architecture test is the deliverable that lasts.** The moves are one-off; the test is what
  keeps plans 05–18 honest. If time runs short, task 4 step 1 is the last thing to cut.
- **Facade appears exactly once**, for auth. Resist adding one per domain in plans 05+ — spec 5.1
  says a plain CRUD controller calls its service directly.
- **Known gap:** `LayerDependencyTest` reads `import` lines, so it cannot catch a violation written
  with a fully-qualified inline reference (`com.portfolio.platform.repository.UserRepository x =`).
  That is rare enough to accept, but it is a real hole — ArchUnit would close it if the project
  ever takes on the dependency.
- **Next plan:** `2026-09-19-05-template-crud.md`, which must be re-read against spec 5.1 before
  implementation — its file list still assumes the old layout until task 9 of this plan's
  follow-up doc pass lands.
