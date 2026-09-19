# Audit & Error Logging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add AOP-based audit logging for admin writes and a global exception handler that gives
every error response one JSON shape — persisting only 5xx — per spec sections 6 and 8.

**Architecture:** A `com.portfolio.platform.audit` package with an `@Audited` annotation +
`AuditAspect` that any service method can opt into, plus `SystemErrorLog` and
`GlobalExceptionHandler` in `com.portfolio.platform.error` wired as a `@RestControllerAdvice`.
`SecurityConfig` gains an entry point and an access-denied handler so that 401/403 produced by the
filter chain — which never reach the advice — carry the same `ApiError` body.

**Tech Stack:** Spring AOP (AspectJ), Spring Security 6, Spring Data JPA, JUnit 5 + MockMvc.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md`

**Depends on:** `2026-09-19-01-backend-scaffold.md` (needs the `audit_logs` / `system_error_logs`
tables) and **`2026-09-20-03c-auth-review-fixes-round2.md`** — task 1 of 03c moves
`application-test.yml` to `src/test/resources`, and step 4 below edits that file.

**Closes:** F-05 (error responses do not match the spec's JSON shape).

---

## Revision log

**Revised 2026-09-20.** Four problems were found in the original version of this plan and are
fixed below. Recorded here so the diff is not mistaken for scope creep:

1. **Step 2's test was a tautology.** It did `new SampleService()`, which bypasses the Spring AOP
   proxy entirely, then asserted `count() >= 0` — a condition that holds even if `AuditAspect`
   does not exist. This is the same class of empty test that R-03 in the tasks 01–03 review
   already caught once. Replaced with a `@TestConfiguration`-supplied bean and an exact
   `before + 1` assertion.
2. **`@ExceptionHandler(Exception.class)` swallowed `AccessDeniedException`.** A
   `@RestControllerAdvice` runs inside the `DispatcherServlet`, *before*
   `ExceptionTranslationFilter` ever sees the exception. A catch-all would therefore turn every
   403 into a 500 and write a bogus `system_error_logs` row on each one.
3. **F-05 was not actually covered.** The original plan handled 5xx only. F-05 asks that
   *every* error response share the shape — including `MethodArgumentNotValidException` (400) and
   the 401s that plan 03b's default-deny chain emits. The 401 path needs a `SecurityConfig`
   change, not an advice change; the existing `HttpStatusEntryPoint(UNAUTHORIZED)` returns an
   empty body.
4. **`AuditAspect` never resolved `user_id`.** The original body had a
   `if (auth != null) { log.setUserId(null); }` block — dead code that made every audit row
   anonymous. `JwtAuthFilter` puts the **username** in the principal, so the id needs a lookup.

---

## Global Constraints

- Backend must run within `-Xmx350m` (spec section 7 RAM budget) — no unbounded in-memory
  collections, use pagination on list endpoints.
- All admin-mutating endpoints (`POST`/`PUT`/`DELETE` under `/api/admin/**`) require a valid JWT
  with role `ADMIN` or `EDITOR`; only `ADMIN` may manage users and settings.
- Every admin CREATE/UPDATE/DELETE must write an `audit_logs` row (spec section 6); every 5xx
  response must write a `system_error_logs` row (spec section 8).
- Public GET endpoints (`templates`, `content-sections`) are Redis-cached with cache-aside
  invalidation on write (spec section 5).
- Public POST endpoints (`leads`, `analytics/events`, `auth/login`) are rate-limited via Bucket4j
  (spec section 5).
- `analytics_events.ip_hash` stores a hash of the IP, never the raw IP (spec section 6).
- Templates are static-exported Next.js sites served by Nginx on `<slug>.portfolio.com`, no
  per-template runtime process (spec sections 4, 7).
- No comments restating what code does; only comments explaining non-obvious "why".
- **No test may assert a tautology.** Every test here must fail when its production change is
  reverted; task 4 verifies that explicitly.
- `V1__init_schema.sql` must not be edited. This plan needs no schema change — `audit_logs` and
  `system_error_logs` already exist there.

---

### Task 1: Audit logging via AOP

**Files:**
- Create: `backend/src/main/java/com/portfolio/platform/audit/AuditLog.java`
- Create: `backend/src/main/java/com/portfolio/platform/audit/AuditLogRepository.java`
- Create: `backend/src/main/java/com/portfolio/platform/audit/Audited.java`
- Create: `backend/src/main/java/com/portfolio/platform/audit/AuditAspect.java`
- Test: `backend/src/test/java/com/portfolio/platform/audit/AuditAspectTest.java`
- Modify: `backend/pom.xml` — add `spring-boot-starter-aop`

**Interfaces produced:** `@Audited(entityType, action)` — every mutating service method from plan
05 onward is annotated with it. The action strings are exactly `"CREATE"`, `"UPDATE"`, `"DELETE"`;
`audit_logs.action` is `VARCHAR(16)` and plans 05–10 must not invent new ones.

- [ ] **Step 1: Add the AOP starter**

```xml
<!-- add inside <dependencies> in backend/pom.xml -->
<dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-aop</artifactId></dependency>
```

- [ ] **Step 2: Write the failing aspect test**

The test must run the annotated method **through a Spring-managed bean**, so the AOP proxy is
actually in the path, and it must assert an exact delta.

```java
package com.portfolio.platform.audit;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class AuditAspectTest {

    static class SampleService {
        @Audited(entityType = "Sample", action = "CREATE")
        public Long doCreate(Long entityId) {
            return entityId;
        }
    }

    @TestConfiguration
    static class Beans {
        @Bean
        SampleService sampleService() {
            return new SampleService();
        }
    }

    @Autowired SampleService sampleService;
    @Autowired AuditLogRepository auditLogRepository;

    @Test
    void auditedMethod_writesExactlyOneAuditLog() {
        long before = auditLogRepository.count();

        sampleService.doCreate(42L);

        assertThat(auditLogRepository.count()).isEqualTo(before + 1);
        var row = auditLogRepository.findAll().get((int) before);
        assertThat(row.getEntityType()).isEqualTo("Sample");
        assertThat(row.getAction()).isEqualTo("CREATE");
        assertThat(row.getEntityId()).isEqualTo(42L);
    }
}
```

`SampleService` is deliberately **not** `@Service`-annotated and lives behind a
`@TestConfiguration` — component scanning it would leak a stub bean into every other
`@SpringBootTest` context in the suite.

- [ ] **Step 3: Run the test and confirm it fails**

Run: `mvn -f backend/pom.xml test -Dtest=AuditAspectTest`
Expected: FAIL to compile — `Audited` and `AuditLogRepository` do not exist yet.

- [ ] **Step 4: Create `AuditLog` + repository**

Entity mapped to the existing `audit_logs` table: `id`, `userId`, `action` (16), `entityType`
(64), `entityId`, `oldValueJson`, `newValueJson`, `ipAddress` (64), `createdAt` (field
initialiser, `updatable = false`) — matching `V1__init_schema.sql:85-95`.

**Do not put `columnDefinition = "jsonb"` on the two JSON columns.** Tests run on H2, where
Hibernate emits `columnDefinition` verbatim and `jsonb` is not an H2 type — the schema creation
fails and takes down every `@SpringBootTest` in the suite, not just this one. Map them as plain
`String` with `@Column(name = "old_value_json")`; Postgres accepts a text parameter into a `jsonb`
column. If step 9 shows otherwise, stop and report rather than editing `V1__init_schema.sql`.

Repository: `interface AuditLogRepository extends JpaRepository<AuditLog, Long> {}`.

- [ ] **Step 5: Create the `@Audited` annotation**

`@Target(METHOD) @Retention(RUNTIME)` with `String entityType();` and `String action();`.

- [ ] **Step 6: Create `AuditAspect`**

`@Aspect @Component`, constructor-injected with `AuditLogRepository` and `UserRepository`.

```java
@Around("@annotation(audited)")
public Object logAudit(ProceedingJoinPoint joinPoint, Audited audited) throws Throwable {
    Object result = joinPoint.proceed();
    // Only a completed call is audited: a method that threw did not change anything worth a row.
    ...
}
```

Requirements on the body:

- `entityId` comes from the return value when it is a `Long`, otherwise null.
- `ipAddress` from `RequestContextHolder`; null when there is no request bound (scheduled jobs).
- `userId` — `JwtAuthFilter` sets the principal to the **username** string, not an id. Resolve it
  with `userRepository.findByUsername(auth.getName()).map(User::getId).orElse(null)`. Leave a
  comment saying why the lookup exists, because it is the non-obvious part. Skip entirely when
  the authentication is null or anonymous.
- No `old_value_json` / `new_value_json` yet — nothing in this plan has a before/after state to
  diff. Plans 05–10 fill them; leave both null and do not invent a serialisation here.

- [ ] **Step 7: Run the test and confirm it passes**

Run: `mvn -f backend/pom.xml test -Dtest=AuditAspectTest`

---

### Task 2: One error shape for every response (F-05)

**Files:**
- Create: `backend/src/main/java/com/portfolio/platform/error/ApiError.java`
- Create: `backend/src/main/java/com/portfolio/platform/error/GlobalExceptionHandler.java`
- Create: `backend/src/main/java/com/portfolio/platform/audit/SystemErrorLog.java`
- Create: `backend/src/main/java/com/portfolio/platform/audit/SystemErrorLogRepository.java`
- Modify: `backend/src/main/java/com/portfolio/platform/config/SecurityConfig.java`
- Modify: `backend/src/main/java/com/portfolio/platform/auth/AuthController.java`
- Test: `backend/src/test/java/com/portfolio/platform/error/GlobalExceptionHandlerTest.java`

**Interfaces produced:** `ApiError(code, message, requestId)` — the body of every non-2xx response
in the system from here on.

**Why the security config is in scope:** a `@RestControllerAdvice` only sees exceptions that reach
the `DispatcherServlet`. A 401 from the filter chain is produced by `AuthenticationEntryPoint`
before the dispatcher runs, and today that is `HttpStatusEntryPoint(UNAUTHORIZED)`, which writes
an **empty body** (`SecurityConfig.java:118`). Handling 5xx alone would leave F-05 open, which is
exactly what the tasks 01–03 review flagged.

- [ ] **Step 1: Write the failing tests**

`GlobalExceptionHandlerTest` — `@SpringBootTest`, `@AutoConfigureMockMvc`, `@ActiveProfiles("test")`,
with a `@TestConfiguration`-supplied `BoomController` exposing `GET /api/test/boom` that throws
`RuntimeException`, and `GET /api/test/denied` that throws `AccessDeniedException`.

Four cases, all of which must fail before the production code exists:

| Case | Request | Expect status | Expect body | Expect `system_error_logs` |
|---|---|---|---|---|
| 5xx | `GET /api/test/boom` | 500 | `code = INTERNAL_ERROR`, non-blank `requestId` | count **+1** |
| 403 | `GET /api/test/denied` | **403**, not 500 | `code = FORBIDDEN` | count **unchanged** |
| 400 | `POST /api/auth/login` with blank username | 400 | `code = VALIDATION_FAILED` | count **unchanged** |
| 401 | `GET /api/admin/anything` with no token | 401 | `code = UNAUTHORIZED`, non-blank body | count **unchanged** |

The "count unchanged" column is the half that catches problem 2 from the revision log — without
it, a catch-all handler passes the status check on three of the four rows.

Register `BoomController` via `@TestConfiguration`, not a bare `@RestController` nested class, for
the same context-pollution reason as task 1 step 2.

- [ ] **Step 2: Run and confirm all four fail**

Run: `mvn -f backend/pom.xml test -Dtest=GlobalExceptionHandlerTest`

- [ ] **Step 3: Create `ApiError` and `SystemErrorLog`**

```java
package com.portfolio.platform.error;

public record ApiError(String code, String message, String requestId) {
}
```

`SystemErrorLog` maps the existing `system_error_logs` table (`V1__init_schema.sql:97-106`):
`endpoint` (255), `httpStatus`, `exceptionClass` (255), `message` (text), `stacktrace` (text),
`requestId` (64), `createdAt`. Plus `SystemErrorLogRepository extends JpaRepository<…>`.

`endpoint` is `VARCHAR(255)` — truncate `request.getRequestURI()` to 255 before setting it, or a
long URL turns the error handler itself into a second error.

- [ ] **Step 4: Create `GlobalExceptionHandler` with narrow handlers**

Three `@ExceptionHandler` methods, in this shape:

```java
// Rethrown, not handled: @RestControllerAdvice sits inside the DispatcherServlet, so it sees
// AccessDeniedException before ExceptionTranslationFilter does. Handling it here would turn
// every 403 into a 500 and log a bogus system_error_logs row.
@ExceptionHandler(AccessDeniedException.class)
public void handleAccessDenied(AccessDeniedException ex) throws AccessDeniedException {
    throw ex;
}

@ExceptionHandler(MethodArgumentNotValidException.class)
public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
    // 400 is the caller's fault, not a system fault — no system_error_logs row.
    ...  // code = "VALIDATION_FAILED", message lists the failing field names, requestId = null
}

@ExceptionHandler(Exception.class)
public ResponseEntity<ApiError> handleUnexpected(Exception ex, HttpServletRequest request) {
    ...  // 500, persist one system_error_logs row, code = "INTERNAL_ERROR"
}
```

The 500 handler generates a `UUID` request id, returns it in the body, and stores the same value
in the row — that pairing is the only way to tie a user-reported failure to a stack trace, so it
must be the *same* UUID in both places.

`message` on the 500 response is the fixed string `"Something went wrong"`. Never the exception
message: it can carry SQL fragments, file paths, or a username.

- [ ] **Step 5: Give 401 and 403 the same body in `SecurityConfig`**

Replace `new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)` with an entry point that writes
`ApiError("UNAUTHORIZED", "Authentication required", null)` as JSON with status 401, and add an
`accessDeniedHandler` writing `ApiError("FORBIDDEN", "Not allowed", null)` with status 403.

Both write via the injected `ObjectMapper` — do not hand-build the JSON string.

Keep `"/error"` in the `permitAll()` matcher list. Plan 03b task 1 added it deliberately
(`docs/reviews/2026-09-19-code-review-task-03b.md`, R-02): removing it makes the container's
error dispatch return 401 over the real status again, which would silently undo this task.

- [ ] **Step 6: Give `AuthController` the same shape**

`login` and `refresh` currently return `ResponseEntity.status(401).build()` — an empty body
(`AuthController.java:34, 52`). Return `ApiError("INVALID_CREDENTIALS", "…", null)` instead.

Keep both paths returning the *same* code and message. A response that distinguishes "no such
user" from "wrong password" is a user-enumeration oracle.

`logout` stays 204 with no body — that is a success response, not an error, and its
indistinguishability is deliberate.

- [ ] **Step 7: Run and confirm all four pass**

Run: `mvn -f backend/pom.xml test -Dtest=GlobalExceptionHandlerTest`

---

### Task 3: Keep the existing suite honest

- [ ] **Step 1: Run everything**

```bash
export JAVA_HOME="C:/Program Files/Java/jdk-21.0.11"
mvn -f backend/pom.xml test
```

- [ ] **Step 2: Fix the fallout, do not suppress it**

Task 2 step 6 changes response *bodies* that existing tests may assert on, and
`ErrorDispatchSecurityTest` asserts on the empty-401 behaviour that step 5 replaces. Update those
assertions to the new shape. If a test gets *weaker* as a result, that is a regression — say so in
the commit body rather than letting it pass quietly.

---

### Task 4: Verify, then commit

- [ ] **Step 1: Mutation check every new test**

Five tests were added (one in task 1, four in task 2). For each: revert the production change it
covers, confirm it goes red, restore. Specifically —

| Test | Revert this | Must go red |
|---|---|---|
| `auditedMethod_writesExactlyOneAuditLog` | remove `@Aspect` from `AuditAspect` | yes |
| 5xx case | remove the `systemErrorLogRepository.save(...)` call | yes |
| 403 case | delete the `AccessDeniedException` rethrow handler | yes |
| 400 case | delete the `MethodArgumentNotValidException` handler | yes |
| 401 case | restore `HttpStatusEntryPoint` | yes |

Any test that stays green proves nothing. Fix it before committing.

- [ ] **Step 2: Commit**

```bash
git add backend/pom.xml backend/src docs/superpowers/plans
git commit -m "feat: audit logging aspect and one error shape for every response (plan 04)"
```

Commit body states: test count before and after, the five mutation-check results, whether F-05 is
fully closed or only partly, and any deviation from this plan.

- [ ] **Step 3: Update `docs/superpowers/STATUS.md`**

Close F-05 if and only if all four error-shape cases pass. Set the next step to
`2026-09-19-05-template-crud.md`.

---

## Self-Review Notes

- **Spec coverage:** implements spec section 6's `audit_logs` / `system_error_logs` tables and
  section 8's error handling. Closes F-05.
- **Type consistency:** the `@Audited` action strings `"CREATE"` / `"UPDATE"` / `"DELETE"` are
  fixed by `audit_logs.action VARCHAR(16)`; plans 05–10 reuse them verbatim.
- **Known gap left open on purpose:** `old_value_json` / `new_value_json` stay null. Nothing in
  this plan mutates an entity with a meaningful before-state. Plan 05 is the first that does, and
  it owns the decision about how to serialise the diff.
- **Known gap not owned here:** the audit row is written in the same transaction as the business
  method, so a rollback discards the audit trail too. Correct for now (no audit row for a change
  that did not happen), but plan 10 should revisit whether failed admin attempts need their own
  record.
- **F-01 still applies.** These entities are validated against H2, never against
  `V1__init_schema.sql`. The `jsonb` note in task 1 step 4 is a symptom of that gap, not a fix
  for it.
- **Next plan:** `2026-09-19-05-template-crud.md`.
