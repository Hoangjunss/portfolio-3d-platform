# Auth Hardening & Review Fixes Implementation Plan (Task 03b)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the blocking findings from the tasks 01–03 code review before any new feature plan starts: complete the refresh-token lifecycle (F-02), flip the security chain to default-deny (F-03), keep user timestamps honest (F-04, F-07), and stop `refresh_tokens` from growing without bound (F-06).

**Architecture:** Stays inside the existing `com.portfolio.platform.auth`, `com.portfolio.platform.config` and `com.portfolio.platform.user` packages. No new module. `AuthController` grows two endpoints; `RefreshTokenRepository` grows the queries needed to revoke and purge; `SecurityConfig` swaps its catch-all rule; `User` gains a JPA lifecycle callback.

**Tech Stack:** Spring Boot 3 / Spring Security 6, Spring Data JPA, Spring `@Scheduled`, JUnit 5 + MockMvc + AssertJ.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md`

**Review being remediated:** `docs/reviews/2026-09-19-code-review-tasks-01-03.md`

**Depends on:** `2026-09-19-03-jwt-auth.md` (modifies the code that plan produced).

**Blocks:** `2026-09-19-04-audit-error-logging.md` and everything after it. Plan 13 (admin auth middleware) consumes the refresh flow built here.

## Global Constraints

- Backend must run within `-Xmx350m` (spec section 7 RAM budget) — no unbounded in-memory collections, use pagination on list endpoints.
- All admin-mutating endpoints (`POST`/`PUT`/`DELETE` under `/api/admin/**`) require a valid JWT with role `ADMIN` or `EDITOR`; only `ADMIN` may manage users and settings.
- Every admin CREATE/UPDATE/DELETE must write an `audit_logs` row (spec section 6); every 5xx response must write a `system_error_logs` row (spec section 8).
- Public GET endpoints (`templates`, `content-sections`) are Redis-cached with cache-aside invalidation on write (spec section 5).
- Public POST endpoints (`leads`, `analytics/events`, `auth/login`) are rate-limited via Bucket4j (spec section 5).
- `analytics_events.ip_hash` stores a hash of the IP, never the raw IP (spec section 6).
- Templates are static-exported Next.js sites served by Nginx on `<slug>.portfolio.com`, no per-template runtime process (spec sections 4, 7).
- No comments restating what code does; only comments explaining non-obvious "why".
- **This task must not change `V1__init_schema.sql`.** No schema change is needed for any fix below.

---

### Task 1: Default-deny security chain (F-03)

**Files:**
- Modify: `backend/src/main/java/com/portfolio/platform/config/SecurityConfig.java`
- Test: `backend/src/test/java/com/portfolio/platform/config/SecurityConfigTest.java` (create)

**Why:** the chain currently ends in `.anyRequest().permitAll()`. Only paths matching `/api/admin/**` are protected. Plans 05–10 add many controllers; one placed outside that prefix becomes publicly writable with nothing to signal it.

- [x] **Step 1: Write the failing test**

`SecurityConfigTest` — `@SpringBootTest`, `@AutoConfigureMockMvc`, `@ActiveProfiles("test")`. Assert that an unauthenticated `GET /api/some-unmapped-path` returns **401**, not 200/404. Under `permitAll()` the request reaches the dispatcher and returns 404, so this test fails today.

- [x] **Step 2: Run the test and confirm it fails**

Run: `mvn -f backend/pom.xml test -Dtest=SecurityConfigTest`
Expected: FAIL — gets 404 instead of 401.

- [x] **Step 3: Flip the catch-all**

In `SecurityConfig.filterChain`, replace `.anyRequest().permitAll()` with `.anyRequest().authenticated()`.

Keep the existing explicit matchers and their current order — `/api/auth/**`, `/api/public/**`, `/api/analytics/events` stay `permitAll()`; `/api/admin/users/**` and `/api/admin/settings/**` stay `hasRole("ADMIN")`; `/api/admin/**` stays `hasAnyRole("ADMIN", "EDITOR")`.

Add to the `permitAll()` matcher list only what genuinely must be anonymous: `/actuator/health`. Do **not** open `/actuator/**` wholesale.

- [x] **Step 4: Run the full suite**

Run: `mvn -f backend/pom.xml test`
Expected: PASS. If `AuthControllerTest` breaks, the cause is a real one — a test was relying on the open default. Fix the matcher list explicitly rather than reverting this step.

**Acceptance:** an endpoint added under a brand-new prefix with no matcher entry is closed by default.

---

### Task 2: Complete the refresh-token lifecycle (F-02, F-06, F-07)

**Files:**
- Modify: `backend/src/main/java/com/portfolio/platform/auth/AuthController.java`
- Modify: `backend/src/main/java/com/portfolio/platform/auth/RefreshTokenRepository.java`
- Modify: `backend/src/main/java/com/portfolio/platform/auth/JwtProperties.java`
- Modify: `backend/src/main/resources/application.yml`
- Create: `backend/src/main/java/com/portfolio/platform/auth/RefreshRequest.java`
- Create: `backend/src/main/java/com/portfolio/platform/auth/RefreshTokenService.java`
- Create: `backend/src/main/java/com/portfolio/platform/auth/RefreshTokenCleanupJob.java`
- Modify: `backend/src/main/java/com/portfolio/platform/PortfolioPlatformApplication.java` (add `@EnableScheduling`)
- Test: `backend/src/test/java/com/portfolio/platform/auth/AuthControllerTest.java` (extend)

**Why:** login mints a refresh token and hands it to the client, but there is no endpoint that accepts it back. The access token dies after 15 minutes and the user is forced to log in again. `findByTokenHashAndRevokedFalse` and `JwtProperties.refreshSecret` are both written-but-unused.

**Interfaces:**
- Produces: `POST /api/auth/refresh` and `POST /api/auth/logout` — plan 13's frontend auth middleware calls both.

- [x] **Step 1: Settle the `refreshSecret` question first**

`JwtProperties.refreshSecret` is declared and never used. Pick one answer and apply it consistently — do not leave it dangling a second time:

- **Chosen approach:** refresh tokens stay opaque random strings hashed into `refresh_tokens` (what login already does). They are not JWTs, so a signing secret is meaningless for them.
- Therefore **remove `refreshSecret` from `JwtProperties`** and remove the `jwt.refresh-secret` key from `application.yml`.
- Keep `jwt.refresh-ttl-days`; it is genuinely used.

- [x] **Step 2: Extract token handling out of the controller**

Move `generateRawToken()` and `sha256()` from `AuthController` into a new `RefreshTokenService`. The controller should not own crypto helpers, and `/refresh` + `/logout` both need them.

While moving `sha256()`, fix **F-07**: `value.getBytes()` must become `value.getBytes(StandardCharsets.UTF_8)`. Platform-default charset is a latent bug even though the current Base64URL input is pure ASCII.

`RefreshTokenService` responsibilities:
- `issue(userId)` → generates a raw token, stores its hash with `expiresAt = now + refreshTtlDays`, returns the **raw** token.
- `rotate(rawToken)` → validates and returns the owning user id, or empty; see Step 5 for the rules.
- `revoke(rawToken)` → marks the matching row revoked; silent no-op if nothing matches.

- [x] **Step 3: Write the failing tests**

Extend `AuthControllerTest` with four cases:

1. `login`, then `POST /api/auth/refresh` with the returned refresh token → 200, body carries a **new** `accessToken` and a **new** `refreshToken` different from the one sent.
2. Replaying the **same** refresh token a second time after a successful refresh → 401 (it was rotated and revoked).
3. `POST /api/auth/refresh` with a garbage token string → 401.
4. `login`, then `POST /api/auth/logout` with the refresh token, then `/refresh` with it → 401.

Run: `mvn -f backend/pom.xml test -Dtest=AuthControllerTest`
Expected: FAIL — the endpoints do not exist (404).

- [x] **Step 4: Add the repository queries**

`RefreshTokenRepository` needs:
- `findByTokenHashAndRevokedFalse(String tokenHash)` — already present, now actually called.
- a delete-by-expiry method for the cleanup job, e.g. `deleteByExpiresAtBefore(Instant cutoff)`. Spring Data requires `@Modifying` + `@Transactional` on derived delete methods.

- [x] **Step 5: Implement `POST /api/auth/refresh`**

Request body: `RefreshRequest(String refreshToken)`, field `@NotBlank`.

Rules, in order:
1. Hash the incoming raw token, look it up with `findByTokenHashAndRevokedFalse`. Missing → 401.
2. Row `expiresAt` is in the past → 401.
3. Load the user by `userId`. Missing, or `isActive() == false` → 401. **This is the one place a deactivated user actually loses access** — it is the only server-side user check in the whole JWT flow (see F-09), so do not skip it.
4. **Rotate:** mark the presented row `revoked = true`, issue a brand-new refresh token row, mint a new access token.
5. Return `TokenResponse(newAccessToken, newRawRefreshToken)`.

Rotation-on-use is deliberate: a stolen refresh token is usable at most once, and the legitimate client's next refresh failing is the detection signal.

- [x] **Step 6: Implement `POST /api/auth/logout`**

Same `RefreshRequest` body. Revoke the matching row. Return **204** whether or not a row matched — an endpoint that distinguishes the two cases is a token-validity oracle.

- [x] **Step 7: Implement the cleanup job (F-06)**

`RefreshTokenCleanupJob` — a `@Component` whose `@Scheduled(cron = "0 30 3 * * *")` method deletes rows whose `expiresAt` is before `now()`. Revoked-but-unexpired rows stay until they expire; they are what makes Step 5's replay check work.

Add `@EnableScheduling` to `PortfolioPlatformApplication`.

Keep the schedule from firing during tests: put the component behind `@Profile("!test")` and test the delete logic by calling the method directly.

- [x] **Step 8: Run the tests**

Run: `mvn -f backend/pom.xml test`
Expected: PASS, all four cases from Step 3 green.

**Acceptance:** a client can hold a session past 15 minutes without re-entering a password, and can end it deliberately.

---

### Task 3: Honest user timestamps (F-04)

**Files:**
- Modify: `backend/src/main/java/com/portfolio/platform/user/User.java`
- Modify: `backend/src/main/java/com/portfolio/platform/auth/AuthController.java`
- Test: `backend/src/test/java/com/portfolio/platform/user/UserRepositoryTest.java` (extend)
- Test: `backend/src/test/java/com/portfolio/platform/auth/AuthControllerTest.java` (extend)

**Why:** `updated_at` is assigned once at field initialisation and never moves, so it permanently reads as the creation time. `last_login_at` exists in the schema and in spec section 6 but nothing ever writes it. Plan 10 (user management) surfaces both columns in the admin UI and would display falsehoods.

- [x] **Step 1: Write the failing tests**

- In `UserRepositoryTest`: save a user, capture `updatedAt`, modify a field, `saveAndFlush`, re-read → `updatedAt` must be strictly later than the captured value. Fails today.
- In `AuthControllerTest`: after a successful login, re-read the user → `lastLoginAt` is non-null. Fails today.

- [x] **Step 2: Add the JPA lifecycle callback**

In `User`, add an `@PreUpdate` method that sets `updatedAt = Instant.now()`. Prefer this over `@EntityListeners(AuditingEntityListener.class)` — auditing would additionally require `@EnableJpaAuditing`, and `createdAt` is already correct as a field initialiser.

Leave `createdAt` as `updatable = false`.

- [x] **Step 3: Set `lastLoginAt` on successful login**

In `AuthController.login`, after the password check passes and before minting tokens, set `lastLoginAt = Instant.now()` and save the user.

On success only. A failed attempt must not move it, or the column becomes useless for spotting account misuse.

- [x] **Step 4: Run the tests**

Run: `mvn -f backend/pom.xml test`
Expected: PASS.

---

### Task 4: Commit

- [x] **Step 1: Confirm the full suite is green**

Run: `mvn -f backend/pom.xml test`
Expected: every test PASSES, including the 6 pre-existing ones.

- [x] **Step 2: Commit and push**

```
git add backend docs/superpowers/plans/2026-09-19-03b-auth-hardening-review-fixes.md
git commit -m "fix: complete refresh token lifecycle, default-deny security, user timestamps"
git push origin master
```

Record in the commit message any deviation from this plan and why, as commits `6cd2521` and `d73d13a` did.

---

## Explicitly out of scope

| Finding | Why not here |
|---|---|
| **F-01** (Flyway migration and entities never cross-checked) | Needs Testcontainers plus a Docker daemon; this machine has neither. Stays open and **must** be closed before plan 15 (Docker) ships. |
| **F-05** (error responses are not the spec's JSON shape) | `ApiError` is created by plan 04. When plan 04 lands, its `@RestControllerAdvice` must also cover `MethodArgumentNotValidException` (400) and the 401s this plan emits — not only 5xx. Recorded here so plan 04 does not forget. |
| **F-08** (`TIMESTAMP` vs `Instant` timezone skew) | Touches every table in `V1__init_schema.sql` and needs a decision: `TIMESTAMPTZ` everywhere, or drop `DEFAULT now()` and make the app the only writer. Worth settling before the first real deploy, but it is a schema-wide change, not an auth fix. |
| **F-09** (JWT stays valid up to 15 min after deactivation) | Inherent to stateless JWT and accepted by the spec. Task 2 Step 5 narrows it: a deactivated user cannot refresh. Plan 10 must document that deactivation is not instant. |

## Self-Review Notes

- **Scope discipline:** this plan only touches code that already exists. It introduces no new domain concepts, so it cannot conflict with plans 05–18.
- **Ordering matters:** Task 1 goes first. Doing it after Task 2 would mean writing the new auth endpoints against an open-by-default chain and never learning whether the matchers are right.
- **Removing `refreshSecret` is a deliberate narrowing**, not an oversight — recorded in Task 2 Step 1 so a future reader does not "restore" it.
- **Rotation-on-use has a real cost:** two clients sharing one refresh token will fight, and the loser gets 401. Acceptable for a single-admin portfolio backend; revisit if multi-device admin sessions become a requirement.
- **Next plan:** `2026-09-19-04-audit-error-logging.md`.
