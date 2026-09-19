# Auth Review Fixes Round 2 Implementation Plan (Task 03c)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the six prioritised findings from the 2026-09-20 review of commits `d06d235` /
`ac1808c`: get the test profile out of the production jar (R-05), stop login from polluting
`updated_at` (R-01), index `refresh_tokens` (R-03), make the cleanup job use bulk DML (R-02), act
on refresh-token reuse instead of only rejecting it (R-04), and lock down the deactivated-user
branch with a test (R-07).

**Architecture:** Stays inside `com.portfolio.platform.auth` and `com.portfolio.platform.user`.
No new package. `RefreshTokenRepository` grows two queries; `RefreshTokenService.rotate()` gains a
reuse-detection branch; `UserRepository` gains a bulk-update query; one file moves between source
roots; one new Flyway migration.

**Tech Stack:** Spring Boot 3 / Spring Data JPA, Flyway, Hibernate `Statistics`, JUnit 5 +
MockMvc + AssertJ.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md`

**Review being remediated:** `docs/reviews/2026-09-20-code-review-03b-self-implemented.md`

**Depends on:** `2026-09-19-03b-auth-hardening-review-fixes.md` (modifies the code that plan
produced).

**Blocks:** `2026-09-19-04-audit-error-logging.md`. Plan 15 (docker) depends on task 1 being done
before any compose file hardcodes a profile.

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
- **`V1__init_schema.sql` must not be edited.** It is already applied on any environment that ran
  it; changes go in a new `V2__` file. Task 3 is the only task that touches the schema.
- **No test may assert a tautology.** Every test added here must fail if its production change is
  reverted — task 7 verifies this explicitly, it is not a formality.

---

### Task 1: Move the test profile out of `main/resources` (R-05)

**Files:**
- Move: `backend/src/main/resources/application-test.yml` → `backend/src/test/resources/application-test.yml`

**Why:** the file currently ships inside the production jar. Starting the real backend with
`SPRING_PROFILES_ACTIVE=test` silently swaps Postgres for an in-memory H2 with
`ddl-auto: create-drop` and Flyway disabled. The app comes up green, logins appear to work, and
all data is gone at the next restart. Nothing warns.

- [ ] **Step 1: Move the file with git so history follows it**

```bash
mkdir -p backend/src/test/resources
git mv backend/src/main/resources/application-test.yml backend/src/test/resources/application-test.yml
```

- [ ] **Step 2: Confirm the test suite still resolves the profile**

Run: `export JAVA_HOME="C:/Program Files/Java/jdk-21.0.11" && mvn -f backend/pom.xml test`
Expected: still 16/16 PASS. `src/test/resources` is on the test classpath, so
`@ActiveProfiles("test")` resolves exactly as before. If anything turns red here, the move was
done wrong — do not "fix" it by putting the file back.

- [ ] **Step 3: Confirm the file is no longer in the packaged jar**

```bash
export JAVA_HOME="C:/Program Files/Java/jdk-21.0.11"
mvn -f backend/pom.xml -DskipTests package
unzip -l backend/target/*.jar | grep application-test || echo "ABSENT - correct"
```
Expected: `ABSENT - correct`.

---

### Task 2: Logging in must not move `updated_at` (R-01)

**Files:**
- Modify: `backend/src/main/java/com/portfolio/platform/user/UserRepository.java`
- Modify: `backend/src/main/java/com/portfolio/platform/auth/AuthController.java`
- Test: `backend/src/test/java/com/portfolio/platform/auth/AuthControllerTest.java` (extend)

**Why:** `login` calls `userRepository.save(user)` to stamp `lastLoginAt`; that UPDATE fires
`User`'s `@PreUpdate`, so `updated_at` tracks logins instead of profile edits. Plan 10 puts both
columns side by side in the admin UI, where they would always read the same value.

- [ ] **Step 1: Write the failing test**

In `AuthControllerTest`, add `login_doesNotChangeUpdatedAt`:

1. Create a user via the existing helper pattern, `saveAndFlush`, read its `updatedAt`.
2. `Thread.sleep(10)` — `Instant.now()` can repeat inside one clock tick, same reason as
   `UserRepositoryTest`.
3. `POST /api/auth/login` with valid credentials, expect 200.
4. Re-read the user from the repository and assert **both**:
   - `getLastLoginAt()` is not null and is after the pre-login instant, and
   - `getUpdatedAt()` is **equal to** the value captured in step 1.

The second assertion fails today. Clear the persistence context (or read in a fresh transaction)
before re-reading, otherwise the assertion may pass off a stale first-level-cache entity and
prove nothing.

- [ ] **Step 2: Run the test and confirm it fails**

Run: `mvn -f backend/pom.xml test -Dtest=AuthControllerTest#login_doesNotChangeUpdatedAt`
Expected: FAIL on the `updatedAt` assertion, with the observed value later than the captured one.

- [ ] **Step 3: Add a bulk-update query that bypasses the callback**

In `UserRepository`:

```java
@Modifying
@Transactional
@Query("update User u set u.lastLoginAt = :now where u.id = :id")
int touchLastLoginAt(@Param("id") Long id, @Param("now") Instant now);
```

JPQL bulk updates do not run JPA lifecycle callbacks — that is exactly the property wanted here,
and it is the non-obvious bit, so say so in a comment.

- [ ] **Step 4: Use it from the controller**

Replace `user.setLastLoginAt(...)` + `userRepository.save(user)` in `AuthController.login` with a
`userRepository.touchLastLoginAt(user.getId(), Instant.now())` call. Keep it **after** the
password check — only a successful login may move the column, per `ac1808c`'s reasoning.

The in-memory `user` object is now stale on `lastLoginAt`. It is used only to mint the access
token, which does not read that field, so do not add a re-read just to keep it in sync.

- [ ] **Step 5: Run the full suite**

Run: `mvn -f backend/pom.xml test`
Expected: all green, including the pre-existing `login_withValidCredentials_recordsLastLoginAt`.

---

### Task 3: Index `refresh_tokens` (R-03)

**Files:**
- Create: `backend/src/main/resources/db/migration/V2__refresh_token_indexes.sql`

**Why:** every `/api/auth/refresh` and `/api/auth/logout` looks the token up by `token_hash`, and
the column has no index — a sequential scan on a table that is only pruned once a day. There is
also no UNIQUE constraint, so nothing at the DB level stops two rows sharing a hash.

- [ ] **Step 1: Write the migration**

```sql
-- token_hash is the lookup key for every refresh and logout; UNIQUE additionally turns a hash
-- collision (or a double-issue bug) into a loud write failure instead of an ambiguous read.
CREATE UNIQUE INDEX idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);

-- Supports the nightly purge in RefreshTokenCleanupJob.
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);
```

- [ ] **Step 2: Verify the migration actually applies**

The suite runs on H2 with Flyway **disabled**, so a green suite proves nothing about this file —
this is finding F-01 and it is not solved here. Verify by hand against a real Postgres:

```bash
docker run --rm -d --name pg-v2check -e POSTGRES_PASSWORD=portfolio -e POSTGRES_USER=portfolio \
  -e POSTGRES_DB=portfolio -p 5433:5432 postgres:16
export JAVA_HOME="C:/Program Files/Java/jdk-21.0.11"
mvn -f backend/pom.xml flyway:migrate -Dflyway.url=jdbc:postgresql://localhost:5433/portfolio \
  -Dflyway.user=portfolio -Dflyway.password=portfolio
docker exec pg-v2check psql -U portfolio -d portfolio -c '\d refresh_tokens'
docker rm -f pg-v2check
```

Expected: both indexes listed. **If the Docker daemon is not available, STOP and report it** —
do not mark this task done on an unverified migration. Leave the file in place, mark the step
blocked, and note it in `STATUS.md` alongside F-01.

---

### Task 4: Cleanup job must delete in bulk (R-02)

**Files:**
- Modify: `backend/src/main/java/com/portfolio/platform/auth/RefreshTokenRepository.java`
- Modify: `backend/src/main/java/com/portfolio/platform/auth/RefreshTokenCleanupJob.java`
- Test: `backend/src/test/java/com/portfolio/platform/auth/RefreshTokenCleanupJobTest.java` (extend)

**Why:** `deleteByExpiresAtBefore` is a Spring Data *derived* delete. `@Modifying` does not make it
bulk — that annotation only affects `@Query`. Measured SQL: one `select ... where expires_at<?`
followed by one `delete from refresh_tokens where id=?` per row. Under the `-Xmx350m` budget, a
nightly job that materialises every expired token at once has no ceiling on its heap use.

- [ ] **Step 1: Write the failing test**

Extend `RefreshTokenCleanupJobTest` with `purgeExpiredTokens_usesBulkDelete`. Assert on Hibernate
statistics rather than on log output:

```java
@Autowired EntityManagerFactory entityManagerFactory;

// A bulk JPQL delete never materialises entities, so entityDeleteCount stays at 0 while rows
// still disappear. A derived deleteBy... increments it once per row.
Statistics stats = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
stats.setStatisticsEnabled(true);
stats.clear();
```

Then save three expired rows, run the job, and assert `stats.getEntityDeleteCount() == 0` **and**
that all three rows are gone. Both halves matter: the first alone would also pass if the job
deleted nothing.

Requires `spring.jpa.properties.hibernate.generate_statistics: true` in
`application-test.yml` (now at `src/test/resources` after task 1).

- [ ] **Step 2: Run the test and confirm it fails**

Run: `mvn -f backend/pom.xml test -Dtest=RefreshTokenCleanupJobTest`
Expected: FAIL — `entityDeleteCount` is 3, not 0.

- [ ] **Step 3: Replace the derived delete with a bulk query**

In `RefreshTokenRepository`, drop `deleteByExpiresAtBefore` and add:

```java
@Modifying
@Transactional
@Query("delete from RefreshToken t where t.expiresAt < :cutoff")
int deleteExpiredBefore(@Param("cutoff") Instant cutoff);
```

Update the call site in `RefreshTokenCleanupJob.purgeExpiredTokens()`. Keep the existing comment
about revoked-but-unexpired rows being retained on purpose — it explains why the predicate is
`expiresAt` and not `revoked`, and R-04 depends on that retention.

- [ ] **Step 4: Run the full suite**

Run: `mvn -f backend/pom.xml test`
Expected: all green, and `purgeExpiredTokens_deletesOnlyExpiredRows` still passes unchanged.

---

### Task 5: Act on refresh-token reuse (R-04)

**Files:**
- Modify: `backend/src/main/java/com/portfolio/platform/auth/RefreshTokenRepository.java`
- Modify: `backend/src/main/java/com/portfolio/platform/auth/RefreshTokenService.java`
- Test: `backend/src/test/java/com/portfolio/platform/auth/AuthControllerTest.java` (extend)

**Why:** `rotate()` rejects an already-revoked token with a 401 and stops there. But a revoked
token being presented at all means the token leaked — either the attacker or the legitimate client
is replaying. Today the victim gets logged out while the thief's freshly rotated token stays valid
for its full 7 days. The strongest breach signal the system ever receives is currently discarded.

- [ ] **Step 1: Write the failing test**

In `AuthControllerTest`, add `refresh_withReplayedToken_killsTheWholeFamily`:

1. Log in as a fresh user → token A.
2. Refresh with A → token B (200). A is now revoked.
3. Refresh with A again → 401 (this is the replay).
4. Refresh with **B** → expect **401**.

Step 4 returns 200 today — the thief's token survives. That is the failing assertion.

- [ ] **Step 2: Run the test and confirm it fails**

Run: `mvn -f backend/pom.xml test -Dtest=AuthControllerTest#refresh_withReplayedToken_killsTheWholeFamily`
Expected: FAIL at step 4 with 200.

- [ ] **Step 3: Add the family-revocation query**

In `RefreshTokenRepository`:

```java
Optional<RefreshToken> findByTokenHash(String tokenHash);

@Modifying
@Transactional
@Query("update RefreshToken t set t.revoked = true where t.userId = :userId and t.revoked = false")
int revokeAllForUser(@Param("userId") Long userId);
```

`findByTokenHash` (without the `revokedFalse` filter) is what lets `rotate()` tell "no such token"
apart from "known token, already spent". Keep `findByTokenHashAndRevokedFalse` — `revoke()` still
uses it.

- [ ] **Step 4: Branch on reuse in `rotate()`**

Restructure `rotate()` to look the row up with `findByTokenHash`, then:

- row absent → `Optional.empty()` (nothing to act on — an unknown string is not evidence of a
  breach, it is usually a typo or an old client).
- row present **and already revoked** → call `revokeAllForUser(row.getUserId())`, then
  `Optional.empty()`. Comment *why*: presenting a spent token means it leaked, so every live token
  for that user is now suspect.
- row present, not revoked, but expired → `Optional.empty()`, no family revocation.
- otherwise → the existing active-user check and rotation, unchanged.

Keep the whole thing inside the existing `@Transactional` boundary so the revoke-all and the
rejection cannot half-apply.

Note the deliberate cost: a user who replays their own token (a client retrying a request after a
flaky network) gets signed out of every device. That is the accepted trade for detection, and it
is the reason revoked rows are retained until expiry rather than deleted on rotation.

- [ ] **Step 5: Run the full suite**

Run: `mvn -f backend/pom.xml test`
Expected: all green. `refresh_afterLogout_returns401` must still pass — check it does not now
trigger family revocation in a way that breaks a later assertion.

---

### Task 6: Test the deactivated-user refresh branch (R-07)

**Files:**
- Test: `backend/src/test/java/com/portfolio/platform/auth/AuthControllerTest.java` (extend)

**Why:** `rotate()`'s `.filter(User::isActive)` is the only server-side account check in the entire
JWT flow. F-09 accepts a 15-minute window of validity after deactivation *because* that filter
exists. Nothing tests it — delete the filter and the suite stays green while deactivated accounts
renew their session indefinitely.

- [ ] **Step 1: Write the test**

Add `refresh_afterUserDeactivated_returns401`: log in as a fresh user, set `active = false` and
save, then refresh with the issued token and expect **401**.

- [ ] **Step 2: Prove the test has weight**

Temporarily delete `.filter(User::isActive)` from `RefreshTokenService.rotate()`, run
`mvn -f backend/pom.xml test -Dtest=AuthControllerTest`, and confirm the new test **fails**.
Restore the filter. Record the observed failure message in the commit body — a test whose weight
was never demonstrated is indistinguishable from one that has none.

---

### Task 7: Verify, then commit

- [ ] **Step 1: Full suite on the right JDK**

```bash
export JAVA_HOME="C:/Program Files/Java/jdk-21.0.11"
mvn -f backend/pom.xml test
```
Expected: all green. Record the exact test count — it should be 16 + 4 new = **20**.

- [ ] **Step 2: Mutation check on every new test**

For each of the four tests added in tasks 2, 4, 5 and 6, revert its production change, confirm
the test goes red, then restore. Four reverts, four red runs. Any test that stays green is a test
that proves nothing — fix it before committing, do not commit it with a note.

- [ ] **Step 3: Commit**

```bash
git add backend/src backend/src/test docs/superpowers/plans docs/reviews
git commit -m "fix: close round-2 auth review findings R-01/R-02/R-03/R-04/R-05/R-07"
```

Commit body must state: which findings are closed, the test count before and after, the four
mutation-check results from step 2, whether task 3 step 2 was verified against real Postgres or
left blocked on Docker, and any deviation from this plan.

- [ ] **Step 4: Update `docs/superpowers/STATUS.md`**

Move R-01..R-05 and R-07 to done, leave R-06/R-08/R-09/R-10 in the open-findings table, and set
the next step to plan 04.

## Self-Review Notes

- **Not covered here:** R-06, R-08, R-09, R-10. R-06 and R-10 are both instances of F-01 (test
  schema diverges from the migration) and are properly closed by Testcontainers, which F-01
  already schedules before plan 15 — fixing them piecemeal here would paper over F-01 rather than
  close it.
- **Task 3 is the one task this repo cannot self-verify.** Flyway is off in tests. If Docker is
  unavailable, the honest outcome is a blocked step, not a green checkbox.
- **Task 5 changes observable auth behaviour**, not just internals: a replayed token now signs the
  user out everywhere. Plan 13 (admin auth middleware) must treat a 401 from `/api/auth/refresh`
  as "go to login", never as "retry" — a retry loop would trip family revocation on every flaky
  network.
- **Next plan:** `2026-09-19-04-audit-error-logging.md`, which itself still needs the three
  revisions recorded in `STATUS.md` before it can be implemented.
