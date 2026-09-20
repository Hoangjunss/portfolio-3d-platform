# Admin User Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Revised:** 2026-09-20 — rewritten before hand-off. The previous draft used
`package com.portfolio.platform.user;` (pre-spec-5.1), put mapping logic in a DTO static factory
instead of a `Converter`, let `deactivate` silently succeed on an unknown id, had no
duplicate-username check (a 500 + `system_error_logs` row waiting to happen — the fourth repeat of
that pattern), listed users unpaginated against its own RAM constraint, and let an ADMIN
permanently lock every admin out of the panel.

**Goal:** Two things.
1. Close the two carried-over findings (task 1).
2. Let an `ADMIN` create / list / deactivate `EDITOR` and `ADMIN` accounts (task 2), closing the
   backend module list from spec section 5.

**Architecture:** Layered per spec 5.1 — `form/UserCreateForm`, `dto/UserDto`,
`converter/UserConverter` + `impl`, `service/UserManagementService` + `impl`,
`controller/AdminUserController`. `SecurityConfig` already restricts `/api/admin/users/**` to
`ADMIN` (line 46) — **do not touch it**.

**Tech Stack:** Spring Security `PasswordEncoder`, Spring Data JPA, JUnit 5 + Mockito.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md`

**Depends on:** plan 02 (`User`, `UserRepository`, `Role`), plan 03 (`PasswordEncoder`, the
ADMIN-only rule), plan 04 (`@Audited`), plan 07 (`InvalidRequestException`), plan 09 (task 1 here
finishes what plan 09 left unproven).

## Global Constraints

- Backend must run within `-Xmx350m` — **no unbounded in-memory collections, use pagination on list endpoints.** `GET /api/admin/users` is exactly the endpoint that constraint names; see decision (e).
- All admin-mutating endpoints under `/api/admin/**` require a valid JWT with role `ADMIN` or `EDITOR`; only `ADMIN` may manage users and settings.
- Every admin CREATE/UPDATE/DELETE must write an `audit_logs` row; every 5xx response must write a `system_error_logs` row.
- **Nothing below 5xx may write a `system_error_logs` row.** Broken by R-01, C-01 and the malformed-body bug. Decision (c) is about not making it four.
- **Every error response is an `ApiErrorDto` JSON body.**
- Public GET endpoints are Redis-cached; public POST endpoints are rate-limited (plan 09, done).
- `analytics_events.ip_hash` stores a hash of the IP, never the raw IP.
- No comments restating what code does; only comments explaining non-obvious "why".
- **Package layout follows spec section 5.1 (layered), not feature packages.** A `service/XService.java` entry always means interface + `service/impl/XServiceImpl.java`.
- **Controllers never touch a Repository or a Converter.** `LayerDependencyTest` enforces this. **Do not widen its allow-list** unless a real import needs it — finding A-06 was that mistake, and A-06 was found only because someone diffed the test file.
- Request bodies are `form/*Form`; response bodies and inter-layer data are `dto/*Dto`. Mapping lives in `converter/`, **never** as a static factory on the DTO.
- **Constructor injection only.** No field `@Autowired`.
- Spring Boot **3.3.4** — `org.springframework.boot.test.mock.mockito.MockBean`.
- Surefire filters are **comma**-separated. `rm -f backend/target/surefire-reports/*.txt` before every mutation check.
- **Report every mutation result, including the ones that stay GREEN.** Finding R-13: the last hand-off reported one honestly and silently skipped two others.

---

## Task 1: Carried-over findings (R-14, R-08)

### Design decisions

**(a) R-14 — prove the `AFTER_COMMIT` phase.** Plan 09 moved the lead notification to
`@TransactionalEventListener(phase = AFTER_COMMIT)`, and its own mutation M1 showed that changing
it to `BEFORE_COMMIT` keeps the suite **green**. So L-01's second half is correct in code and
unproven by tests — one careless edit from silently regressing.

The discriminating test: `@MockBean NotificationService` throwing a **`RuntimeException`** (not
`MailException`, which `NotificationServiceImpl` deliberately swallows), POST a lead, then assert
the lead row **still exists**. With `AFTER_COMMIT` the transaction already committed, so it does.
With `BEFORE_COMMIT` the listener's exception rolls the transaction back and the row is gone.

Put it in `PublicLeadControllerTest`. Then **re-run plan 09's M1** (`AFTER_COMMIT` →
`BEFORE_COMMIT`) and confirm it now goes RED. If it still passes, the test does not discriminate
and the finding stays open — say so rather than claiming R-14 closed.

**(b) R-08 — cap live refresh tokens per user.** Open since plan 03b. Nothing limits how many
refresh tokens one account can hold, so a script logging in in a loop grows `refresh_tokens`
without bound — on the same 350MB box, backed by the same Postgres.

Add `auth.max-refresh-tokens-per-user` (default 5) to `JwtProperties` or a small properties class,
and in `RefreshTokenServiceImpl.issue`: after inserting, if the user's live-token count exceeds the
cap, revoke the oldest ones. **Read the existing repository first** — `RefreshTokenRepository`
already has query methods from plans 03/03b; add only what is missing rather than duplicating.

Note the interaction with V-02 (open): `revoked` currently conflates "logged out" with "rotated".
Do **not** try to fix V-02 here; just make sure the eviction uses the same revoke path so the
cleanup job keeps working.

- [ ] **Step 1: Write the failing tests** — the R-14 test above, plus a `RefreshTokenServiceTest`
  case: issue `cap + 2` tokens for one user, assert only `cap` remain live and that the survivors
  are the newest.
- [ ] **Step 2: Run to verify they fail.**
- [ ] **Step 3: Implement (a)** — no production change needed if the phase is already correct;
  this step is the test only. Say so explicitly in the commit body.
- [ ] **Step 4: Implement (b).**
- [ ] **Step 5: Full suite** — baseline **103 PASS**. Report the real number.
- [ ] **Step 6: Mutation checks**

| # | Revert | Test that must go RED |
|---|---|---|
| M1 | `AFTER_COMMIT` → `BEFORE_COMMIT` | the new lead-persistence test — **this is the whole point of (a); if it stays GREEN, R-14 is not closed** |
| M2 | drop the eviction in `issue` | the refresh-token cap test |
| M3 | evict the **newest** instead of the oldest | the "survivors are the newest" assertion |

- [ ] **Step 7: Commit** — `fix: prove the after-commit mail phase and cap live refresh tokens per user`

---

## Task 2: Admin user management

**Files:**
- Create: `backend/src/main/java/com/portfolio/platform/form/UserCreateForm.java`
- Create: `backend/src/main/java/com/portfolio/platform/dto/UserDto.java`
- Create: `backend/src/main/java/com/portfolio/platform/converter/UserConverter.java` + `converter/impl/UserConverterImpl.java`
- Create: `backend/src/main/java/com/portfolio/platform/service/UserManagementService.java` + `service/impl/UserManagementServiceImpl.java`
- Create: `backend/src/main/java/com/portfolio/platform/controller/AdminUserController.java`
- Modify: `backend/src/main/java/com/portfolio/platform/repository/UserRepository.java`
- Test: `backend/src/test/java/com/portfolio/platform/service/UserManagementServiceTest.java`
- Test: `backend/src/test/java/com/portfolio/platform/controller/AdminUserControllerTest.java`

**Interfaces:**
- Produces: `POST /api/admin/users` → `201 Created` + `UserDto`; `GET /api/admin/users` → a page of
  `UserDto`; `DELETE /api/admin/users/{id}` → deactivate, returns `204`.
- `UserDto` **never** carries `passwordHash`. A test must assert the serialised JSON has no such
  field — an assertion on the DTO's record components would not catch someone adding it later.

### Design decisions this task must follow

**(c) Duplicate username/email must be a 400, not a 500.** `users.username` and `users.email` are
both `NOT NULL UNIQUE` (V1 lines 3–4). Creating a duplicate throws
`DataIntegrityViolationException` → catch-all → **500 + a `system_error_logs` row**. That is the
same bug as R-01, C-01 and the malformed-body one, and it would be the fourth. Add
`existsByUsername` / `existsByEmail` to `UserRepository` and throw
`InvalidRequestException("Username already taken")` / `("Email already registered")`.

The race between check and insert still exists; that is acceptable here (two admins creating the
same username in the same millisecond), and the `ErrorResponse` safety net from plan 08 keeps even
that case from being silent. Do not add locking.

**(d) Bound every field to its column, and give the password a floor.** `username VARCHAR(64)`,
`email VARCHAR(255)`. Without `@Size` a long value is again a 500. The password is not stored raw
so it has no column limit, but `@NotBlank` alone lets an admin create an account with the password
`a` — use `@Size(min = 12, max = 128)`. BCrypt silently truncates beyond 72 bytes; 128 is a
deliberate upper bound so the rejection is explicit rather than a surprise.

**(e) `GET /api/admin/users` must be paginated.** The RAM budget in the global constraints names
list endpoints specifically. Take a `Pageable` and return `Page<UserDto>`; cap the page size
(`@PageableDefault(size = 20)`) so a caller cannot ask for everything with `?size=100000`.

**(f) Deactivation must not be able to lock everyone out.** Two guards, both with tests:

1. **An ADMIN may not deactivate their own account.** Compare the target id with the id resolved
   from `Authentication`, throw `InvalidRequestException("Cannot deactivate your own account")`.
2. **The last active ADMIN may not be deactivated.** Count active users with role `ADMIN`; if the
   target is the only one, refuse. Without this, one `DELETE` leaves a portfolio site with no way
   into its own admin panel and no password-reset flow anywhere in the plan list.

**(g) Unknown id must be a 404, not a silent 200.** The old draft used
`userRepository.findById(id).ifPresent(...)` — deactivating a nonexistent user returned success
and wrote an `audit_logs` row claiming an update that never happened. Throw
`ResourceNotFoundException("User", id)`, which the handler already maps to 404 without a log row.

**(h) `deactivate` must return `Long`.** `AuditAspect` fills `audit_logs.entity_id` from the
return value; a `void` method leaves it null, which is the gap C-05 recorded for content sections.
Return the id.

**(i) Deactivation should revoke that user's live refresh tokens.** Already verified: both
`UserServiceImpl.authenticate` (via `findActiveByUsername`) and `RefreshTokenServiceImpl.rotate`
(via `.filter(User::isActive)`) check the active flag, so a deactivated user is locked out within
one access-token lifetime — **do not re-add those checks**. But their refresh rows stay live, so
reactivating an account silently resurrects every old session, including one on a device the user
no longer has. Revoke them on deactivate.

**(j) Do not touch `SecurityConfig`.** `/api/admin/users/**` is already ADMIN-only. The controller
test must still prove it: one case as `EDITOR` expecting **403**, one unauthenticated expecting
**401**. A rule that exists in config but is never asserted is a rule one refactor away from
disappearing.

- [ ] **Step 1: Write the failing tests**

`UserManagementServiceTest` (Mockito):
- `create_hashesPasswordBeforeSaving` — assert `getPasswordHash()` is the encoder output and that
  the raw password never reaches the entity
- `create_withDuplicateUsername_isRejected` → `InvalidRequestException`, nothing saved
- `create_withDuplicateEmail_isRejected`
- `deactivate_setsActiveFalseAndReturnsId`
- `deactivate_withUnknownId_throwsResourceNotFound`
- `deactivate_ownAccount_isRejected`
- `deactivate_lastActiveAdmin_isRejected`
- `deactivate_revokesRefreshTokens`

`AdminUserControllerTest` (`@SpringBootTest`):
- `create_asAdmin_returns201AndUserDtoWithoutPasswordHash` — assert
  `jsonPath("$.passwordHash").doesNotExist()`
- `create_asEditor_returns403`
- `list_unauthenticated_returns401`
- `create_withShortPassword_returns400AndWritesNoErrorLog`
- `list_asAdmin_returnsPageWithDefaultSize`

- [ ] **Step 2: Run to verify they fail.**
- [ ] **Step 3: Add the repository methods** — `existsByUsername`, `existsByEmail`, and a count of
  active admins. Check what already exists before adding.
- [ ] **Step 4: Create form, DTO, converter pair.**
- [ ] **Step 5: Create the service pair and the controller.**
- [ ] **Step 6: Full suite** — report the real number.
- [ ] **Step 7: Mutation checks — run them all, report every result**

| # | Revert | Test that must go RED |
|---|---|---|
| M4 | store the raw password instead of `passwordEncoder.encode(...)` | `create_hashesPasswordBeforeSaving` |
| M5 | drop the `existsByUsername` guard | `create_withDuplicateUsername_isRejected` |
| M6 | drop the self-deactivation guard | `deactivate_ownAccount_isRejected` |
| M7 | drop the last-admin guard | `deactivate_lastActiveAdmin_isRejected` |
| M8 | `ifPresent` instead of `orElseThrow` | `deactivate_withUnknownId_throwsResourceNotFound` |
| M9 | add `passwordHash` to `UserDto` | `create_asAdmin_returns201AndUserDtoWithoutPasswordHash` — **if this stays GREEN the assertion is on the wrong thing; say so** |
| M10 | drop `@Size(min = 12)` from the password | `create_withShortPassword_returns400AndWritesNoErrorLog` |
| M11 | remove the ADMIN-only path from `SecurityConfig` | `create_asEditor_returns403` — proves (j). **Restore `SecurityConfig` afterwards.** |

- [ ] **Step 8: Commit** — `feat: add admin-only user management with lockout guards`

Commit body records decisions (c), (f), (i), and every mutation result.

## Self-Review Notes

- **Spec coverage:** closes spec section 5's user-management module and the ADMIN-only rule.
- **Closes:** R-14 (if M1 goes red), R-08.
- **Not in this plan:** password reset, password change, and role change for an existing user.
  None appear in the spec's module list; **(f) guard 2 is what keeps their absence from being a
  one-way door.** If a later plan adds password reset, guard 2 can be relaxed.
- **Carried forward:** V-02 (`revoked` conflates logout and rotation) is untouched and still open.
- **This is the last backend module plan.** Next: `2026-09-19-11-frontend-scaffold.md`.
